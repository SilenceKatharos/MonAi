"""
Main simulation loop — refactored in v4 to support the automatic
demand bonus P(t, task).

Major difference with v3:
- v3: each task is created, validated, and removed WITHIN THE SAME TICK.
- v4: normal tasks live in a persistent MEMPOOL and may take several
  ticks to reach `n_validators_per_task` acceptors. Each refusal
  increments `n_refus` and `P_refus`. Each tick past `T_attente`
  increments `P_temps`. The effective bonus at validation time is
  `min(P_max, max(P_refus, P_temps))`.

Honeypots are still injected "per validator slot" (cf. v3) since they
have an independent reference verdict and do not need the mempool. A
honeypot intercepting a slot does NOT contribute to the underlying
normal task's acceptors.

cf. formalisation/01-formules-mathematiques.md §C.0 (v0.5) and §F
    formalisation/05-bilan-v0-5.md §E (empirical targets)
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Set, Tuple

import numpy as np

from .agents import Agent, create_initial_population
from .config import Config
from .economy import (
    EmissionState,
    reward_for_validation_with_acc,
    reward_for_validation_with_demand,
)
from .honeypots import (
    HoneypotPool, Task, generate_synthetic_honeypot,
    phi_for_agent, synth_ratio_for_agent,
)
from .metrics import MetricsCollector
from .reputation import (
    update_beta_binomial,
    update_R_components_post_validation,
    update_R_acc, aggregate_R,
)


# ─────────────────────────────────────────────────────────────────
# PendingTask class — normal task in the mempool, v4 model
# ─────────────────────────────────────────────────────────────────

@dataclass
class PendingTask:
    """Normal task awaiting validation (mempool v4)."""
    task_id: int
    theta_t: float
    c_true: bool
    birth_tick: int
    # Demand bonus
    P_refus: float = 1.0
    n_refus: int = 0
    # Acceptors gathered so far: (Agent, f_hat_pre, R_acc_pre, vote, success)
    acceptors: List[Tuple[Agent, float, float, bool, bool]] = field(default_factory=list)
    # Agents already selected on this task (to prevent re-selection)
    previously_selected_ids: Set[int] = field(default_factory=set)
    # Final state: "pending", "validated", "impraticable"
    state: str = "pending"
    # Filled at validation time
    consensus: Optional[bool] = None
    d_t: Optional[float] = None
    P_at_validation: float = 1.0  # captured at validation time

    def P_temps(self, current_tick: int, cfg: Config) -> float:
        """P trajectory based on waiting time, capped at P_max."""
        delta_t = current_tick - self.birth_tick - cfg.T_attente
        if delta_t <= 0:
            return 1.0
        return min(cfg.P_max, (1.0 + cfg.delta_temps) ** delta_t)

    def current_P(self, current_tick: int, cfg: Config) -> float:
        """Effective bonus: max of the two trajectories, capped."""
        return min(cfg.P_max, max(self.P_refus, self.P_temps(current_tick, cfg)))


# ─────────────────────────────────────────────────────────────────
# Helpers (consensus, entropy, selection)
# ─────────────────────────────────────────────────────────────────

def consensus_of(votes: List[bool]) -> Optional[bool]:
    """Simple majority; None on a perfect tie."""
    if not votes:
        return None
    n_true = sum(votes)
    n_total = len(votes)
    if 2 * n_true == n_total:
        return None
    return n_true > n_total / 2


def shannon_entropy_normalized(p: float) -> float:
    """Normalized binary entropy (base 2)."""
    if p <= 0.0 or p >= 1.0:
        return 0.0
    return float(-(p * np.log2(p) + (1.0 - p) * np.log2(1.0 - p)))


def select_validators_from_pool(eligible: List[Agent], n_take: int,
                                 cfg: Config, rng) -> List[Agent]:
    """
    Probabilistic selection weighted by max(R, R_min_floor), with a
    quota for newcomers. Differs from select_validators v3 in that it
    takes an already-filtered POOL (not the full list of agents).
    """
    if not eligible or n_take <= 0:
        return []
    n_take = min(n_take, len(eligible))

    n_quota_new = max(1, int(round(n_take * cfg.quota_new)))

    new_agents = [a for a in eligible if a.is_new]
    estab_agents = [a for a in eligible if not a.is_new]

    selected: List[Agent] = []

    if new_agents:
        n_take_new = min(n_quota_new, len(new_agents), n_take)
        idxs = rng.choice(len(new_agents), size=n_take_new, replace=False)
        selected.extend(new_agents[i] for i in idxs)

    pool = estab_agents if estab_agents else [a for a in eligible if a not in selected]
    n_take_pool = n_take - len(selected)
    if pool and n_take_pool > 0:
        weights = np.array([
            max(aggregate_R(a, cfg), cfg.R_min_floor) for a in pool
        ])
        weights = weights / weights.sum()
        n_take_pool = min(n_take_pool, len(pool))
        idxs = rng.choice(len(pool), size=n_take_pool, replace=False, p=weights)
        selected.extend(pool[i] for i in idxs)

    return selected


def make_normal_task(rng, cfg: Config, next_id: int, current_tick: int) -> PendingTask:
    """Generate a fresh normal task for the mempool."""
    theta_t = float(rng.beta(cfg.beta_a_difficulty, cfg.beta_b_difficulty))
    c_true = bool(rng.uniform() < 0.5)
    return PendingTask(
        task_id=next_id,
        theta_t=theta_t,
        c_true=c_true,
        birth_tick=current_tick,
    )


# ─────────────────────────────────────────────────────────────────
# Main loop
# ─────────────────────────────────────────────────────────────────

def run_simulation(cfg: Config, scenario_name: str = "custom",
                   verbose: bool = True, save_figures: bool = True) -> str:
    """
    Run the v4 simulation with mempool and demand bonus.
    Returns the path of the results folder.
    """
    rng = np.random.default_rng(cfg.seed)

    agents: List[Agent] = create_initial_population(cfg)
    emission = EmissionState(cfg)
    pool = HoneypotPool(cfg)
    metrics = MetricsCollector(cfg)

    mempool: List[PendingTask] = []      # normal tasks awaiting validation
    completed_tasks: List[PendingTask] = []  # validated, awaiting replay pool
    next_task_id = 0

    # v4 statistics
    n_cap_activations_total = 0
    n_impraticables_total = 0
    P_at_validation_sum = 0.0
    P_at_validation_count = 0
    n_tasks_passing_through_mempool = 0  # tasks that survived > 1 tick

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    results_dir = os.path.join(base, "simulateur", "results", scenario_name, timestamp)

    if verbose:
        print(f"[simulator v4] Starting scenario={scenario_name}, "
              f"n_ticks={cfg.n_ticks}, n_agents={len(agents)}, "
              f"bonus_active={cfg.use_demand_premium}")

    for t in range(cfg.n_ticks):
        # ─── 1. Generate normal tasks ────────────────────────────────
        n_new_tasks = int(rng.poisson(cfg.lambda_tasks_per_tick))
        for _ in range(n_new_tasks):
            mempool.append(make_normal_task(rng, cfg, next_task_id, t))
            next_task_id += 1

        n_honeypots_emitted = 0
        n_validations_this_tick = 0
        n_normal_tasks_processed_this_tick = 0

        # ─── 2. Process the mempool ─────────────────────────────────
        # Iterate over a copy: we may remove tasks
        for task in list(mempool):
            if task.state != "pending":
                continue

            # How many acceptors still need to be recruited?
            n_needed = cfg.n_validators_per_task - len(task.acceptors)
            if n_needed <= 0:
                continue

            # Filter eligible agents
            eligible = [a for a in agents if a.id not in task.previously_selected_ids]
            if not eligible:
                continue

            # Select the candidates
            candidates = select_validators_from_pool(eligible, n_needed, cfg, rng)

            for v in candidates:
                task.previously_selected_ids.add(v.id)

                # Honeypot interception (per-slot)
                phi_eff = phi_for_agent(v.n_validations, cfg)
                if rng.uniform() < phi_eff:
                    # Validator receives a honeypot instead — immediate vote
                    synth_ratio = synth_ratio_for_agent(v.n_validations, cfg)
                    if rng.uniform() < synth_ratio:
                        h = generate_synthetic_honeypot(rng, cfg, next_task_id, t)
                    else:
                        h = pool.sample_replay(rng, next_task_id, t)
                        if h is None:
                            h = generate_synthetic_honeypot(rng, cfg, next_task_id, t)
                    next_task_id += 1
                    n_honeypots_emitted += 1

                    # Process honeypot independently
                    accepted_hp = v.should_accept(h.theta_t)
                    R_acc_pre_hp = v.R_acc
                    update_R_acc(v, accepted_hp, cfg)
                    if accepted_hp:
                        vote_hp = v.vote(h.theta_t, h.c_true, rng)
                        c_ref_hp = h.c_ref
                        success_hp = (vote_hp == c_ref_hp)
                        f_hat_pre_hp = v.f_hat
                        update_beta_binomial(v, success_hp, cfg.w_h, cfg)

                        # Honeypot reward: P=1 (fresh, no mempool)
                        if cfg.use_demand_premium:
                            reward_hp, _cap = reward_for_validation_with_demand(
                                f_hat_pre_hp, h.theta_t, R_acc_pre_hp,
                                1.0, emission.R, cfg)
                        else:
                            reward_hp = reward_for_validation_with_acc(
                                f_hat_pre_hp, h.theta_t, R_acc_pre_hp,
                                emission.R, cfg)
                        actual_hp = emission.emit(reward_hp)
                        v.cum_reward += actual_hp
                        v.last_active_tick = t
                        update_R_components_post_validation(v, success_hp, h.theta_t, cfg)
                        v.age_eff += 1.0
                        n_validations_this_tick += 1
                    # Honeypot interception: does not contribute to the pending task
                    continue

                # The validator processes the normal task from the mempool
                accepted = v.should_accept(task.theta_t)
                R_acc_pre = v.R_acc
                update_R_acc(v, accepted, cfg)

                if not accepted:
                    # Refusal: bonus increases, counter increments
                    task.n_refus += 1
                    task.P_refus = min(cfg.P_max,
                                      task.P_refus * (1.0 + cfg.delta_refus))
                    if task.n_refus >= cfg.N_max_refus:
                        task.state = "impraticable"
                        n_impraticables_total += 1
                        break
                    continue

                # Acceptance: immediate vote and f̂ update
                vote = v.vote(task.theta_t, task.c_true, rng)
                c_ref = task.c_true
                success = (vote == c_ref)
                f_hat_pre = v.f_hat
                update_beta_binomial(v, success, 1.0, cfg)

                task.acceptors.append((v, f_hat_pre, R_acc_pre, vote, success))

                # If we now have enough acceptors → validation
                if len(task.acceptors) >= cfg.n_validators_per_task:
                    # Compute the bonus at validation time
                    P_current = task.current_P(t, cfg)
                    task.P_at_validation = P_current
                    P_at_validation_sum += P_current
                    P_at_validation_count += 1

                    # Consensus + measured difficulty
                    votes = [a[3] for a in task.acceptors]
                    task.consensus = consensus_of(votes)
                    p_hat = sum(votes) / len(votes)
                    task.d_t = shannon_entropy_normalized(p_hat)

                    # Reward for each acceptor (uniform P at validation)
                    for (val, f_hat_p, R_acc_p, vote_outcome, success_outcome) in task.acceptors:
                        d_eff = task.theta_t  # we use theta_t as a proxy for d
                        if cfg.use_demand_premium:
                            reward, cap_activated = reward_for_validation_with_demand(
                                f_hat_p, d_eff, R_acc_p, P_current,
                                emission.R, cfg)
                            if cap_activated:
                                n_cap_activations_total += 1
                        else:
                            reward = reward_for_validation_with_acc(
                                f_hat_p, d_eff, R_acc_p, emission.R, cfg)

                        actual = emission.emit(reward)
                        val.cum_reward += actual
                        val.last_active_tick = t
                        update_R_components_post_validation(val, success_outcome, d_eff, cfg)
                        val.age_eff += 1.0
                        n_validations_this_tick += 1

                    n_normal_tasks_processed_this_tick += 1
                    task.state = "validated"
                    if (t - task.birth_tick) > 0:
                        n_tasks_passing_through_mempool += 1
                    break  # task validated, move on to the next one

        # ─── 3. Remove validated/impractical tasks from the mempool ──
        new_mempool = []
        for task in mempool:
            if task.state == "validated":
                completed_tasks.append(task)
            elif task.state == "impraticable":
                pass  # discard
            else:
                new_mempool.append(task)
        mempool = new_mempool

        # ─── 4. Replay pool: anchor validated tasks once old enough
        still_completed: List[PendingTask] = []
        for task in completed_tasks:
            if (t - task.birth_tick) >= cfg.T_stable:
                # Convert PendingTask to Task for the replay pool
                task_obj = Task(
                    id=task.task_id, tick_created=task.birth_tick,
                    theta_t=task.theta_t, c_true=task.c_true,
                    is_honeypot=False, c_ref=None,
                    d_t=task.d_t, consensus=task.consensus,
                )
                pool.maybe_add(task_obj, t)
            else:
                still_completed.append(task)
        completed_tasks = still_completed

        # ─── 5. Metrics ───────────────────────────────────────────────
        if t % cfg.metrics_every == 0:
            emission.snapshot()
            metrics.snapshot_tick(
                tick=t, agents=agents, R_remaining=emission.R,
                total_emitted=emission.total_emitted,
                n_tasks=n_normal_tasks_processed_this_tick,
                n_honeypots=n_honeypots_emitted,
                n_validations=n_validations_this_tick,
            )

        if verbose and t > 0 and t % max(1, cfg.n_ticks // 10) == 0:
            P_avg = (P_at_validation_sum / P_at_validation_count
                     if P_at_validation_count > 0 else 1.0)
            print(f"  tick {t}/{cfg.n_ticks}, R_rem={emission.R:.3e}, "
                  f"mempool={len(mempool)}, P_avg={P_avg:.4f}, "
                  f"cap_act={n_cap_activations_total}, "
                  f"impractical={n_impraticables_total}")

    # ─── Final save ───────────────────────────────────────────────
    metrics.save(results_dir, agents, save_figures=save_figures)

    # v4-specific metrics → separate file
    import json
    v4_stats = {
        "P_moyen_a_validation": (P_at_validation_sum / P_at_validation_count
                                   if P_at_validation_count > 0 else 1.0),
        "n_validations_normales": P_at_validation_count,
        "n_cap_activations_total": n_cap_activations_total,
        "frac_cap_activations": (n_cap_activations_total /
                                  max(1, P_at_validation_count * cfg.n_validators_per_task)),
        "n_impraticables_total": n_impraticables_total,
        "frac_impraticables": (n_impraticables_total /
                                max(1, P_at_validation_count + n_impraticables_total)),
        "n_tasks_passing_through_mempool": n_tasks_passing_through_mempool,
        "frac_tasks_mempool_persistent": (n_tasks_passing_through_mempool /
                                           max(1, P_at_validation_count)),
        "use_demand_premium": cfg.use_demand_premium,
        "P_max": cfg.P_max,
        "delta_refus": cfg.delta_refus,
        "T_attente": cfg.T_attente,
        "delta_temps": cfg.delta_temps,
        "cap_primes": cfg.cap_primes,
        "N_max_refus": cfg.N_max_refus,
    }
    with open(os.path.join(results_dir, "v4_stats.json"), "w") as f:
        json.dump(v4_stats, f, indent=2)

    if verbose:
        print(f"[simulator v4] Results saved to {results_dir}")
        print(f"  P_avg_at_validation = {v4_stats['P_moyen_a_validation']:.4f}")
        print(f"  Frac. tasks persisting in mempool: {v4_stats['frac_tasks_mempool_persistent']:.2%}")
        print(f"  Frac. cap_primes activated: {v4_stats['frac_cap_activations']:.4f}")
        print(f"  Frac. impractical: {v4_stats['frac_impraticables']:.4%}")
    return results_dir
