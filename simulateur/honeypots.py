"""
Retroactive honeypot mechanism — sources (i) and (iii) in v1.

Source (i) Replay: a circular pool of past tasks whose consensus has
become very firm (d_t < d_max_stable, age >= T_stable). For each
replay honeypot, a task is drawn from the pool; the reference verdict
c_t^* = initial consensus.

Source (iii) Synthetic: on-the-fly generation of a task whose verdict
is computed by construction. In simulation, a Bernoulli(0.5) is drawn
as the "truth" of the synthetic template.

Source (ii) Over-validation: not implemented in v1 (cf. user spec).
"""

from collections import deque
from dataclasses import dataclass, field
from typing import Optional

from .config import Config


@dataclass
class Task:
    """Represents a task submitted to the network for validation."""
    id: int
    tick_created: int
    theta_t: float            # latent difficulty (hidden truth)
    c_true: bool              # task truth (simulator view)
    is_honeypot: bool = False
    honeypot_source: Optional[str] = None  # "replay" or "synth" if honeypot
    # Reference verdict for honeypots (= c_true in simulator)
    c_ref: Optional[bool] = None
    # Fields filled in after validation
    d_t: Optional[float] = None       # difficulty measured by dispersion
    consensus: Optional[bool] = None  # majority of votes


class HoneypotPool:
    """Circular pool of consensus-stable tasks eligible for replay."""

    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self.pool: deque = deque(maxlen=cfg.pool_replay_size)

    def maybe_add(self, task: Task, current_tick: int) -> None:
        """
        Adds a normal task to the pool if it satisfies the criteria:
        d_t < d_max_stable and age >= T_stable.
        """
        if task.is_honeypot:
            return
        if task.d_t is None or task.consensus is None:
            return
        if task.d_t > self.cfg.d_max_stable:
            return
        if (current_tick - task.tick_created) < self.cfg.T_stable:
            # task still too young to be certified consensus-stable
            return
        self.pool.append(task)

    def sample_replay(self, rng, next_id: int, current_tick: int) -> Optional[Task]:
        """
        Draws a task from the pool as a replay honeypot. The new task
        keeps the same θ_t and the same verdict (c_true), with a new ID.
        Returns None if the pool is empty.
        """
        if not self.pool:
            return None
        idx = rng.integers(0, len(self.pool))
        # deque does not support efficient direct indexing; convert
        original = list(self.pool)[idx]
        return Task(
            id=next_id,
            tick_created=current_tick,
            theta_t=original.theta_t,
            c_true=original.c_true,
            is_honeypot=True,
            honeypot_source="replay",
            c_ref=original.consensus,
        )


def generate_synthetic_honeypot(rng, cfg: Config, next_id: int, current_tick: int) -> Task:
    """
    Generates a fresh synthetic honeypot (source iii).
    In simulation, θ_t is drawn like a normal task and the reference
    verdict is random (the protocol would "compute" the truth).
    """
    theta_t = float(rng.beta(cfg.beta_a_difficulty, cfg.beta_b_difficulty))
    c_ref = bool(rng.uniform() < 0.5)
    return Task(
        id=next_id,
        tick_created=current_tick,
        theta_t=theta_t,
        c_true=c_ref,
        is_honeypot=True,
        honeypot_source="synth",
        c_ref=c_ref,
    )


def phi_for_agent(n_validations_so_far: int, cfg: Config) -> float:
    """
    Fraction of honeypots received by an agent at its j-th validation.
    `φ_cold-start(j) = max(φ_normal, 1 − j / n_init)`.
    """
    return max(cfg.phi_normal, 1.0 - n_validations_so_far / cfg.n_init)


def synth_ratio_for_agent(n_validations_so_far: int, cfg: Config) -> float:
    """Fraction of honeypots that are synthetic (vs replay)."""
    if n_validations_so_far < cfg.n_init:
        return cfg.ratio_synth_cold
    return cfg.ratio_synth_normal
