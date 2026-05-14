"""
Reliability score f̂ and aggregated reputation score R.

f̂ : Beta-Binomial with exponentially decaying pseudo-counts
     (formalisation/01 §A.1).

R : weighted sum of 6 EWMA components (formalisation/01 §D.3).
    R_V is equal to f̂ by fusion (cf. v0.2 arbitration).

Decay ρ applied at each tick to ALL agents
(whether they validate or not) — forgetting is intrinsic to the formula.
"""

import math

from .agents import Agent
from .config import Config


# ---------------------------------------------------------------------
# Beta-Binomial update after an observation
# ---------------------------------------------------------------------

def update_beta_binomial(agent: Agent, success: bool, weight: float, cfg: Config) -> None:
    """
    First applies decay ρ since the last update, then
    increments α or β according to `success`, with weight `weight` (1 for
    a normal task, w_h for a honeypot).
    """
    # Decay on pseudo-counts (only if tick has changed)
    # Note: we apply "one-shot per observation" decay,
    # which simplifies things: we assume the agent observes at each
    # validation, so 1 tick of forgetting per observation. This is a
    # v1 simplification compared to the continuous formulation.
    agent.alpha = cfg.alpha0 + cfg.rho * (agent.alpha - cfg.alpha0)
    agent.beta = cfg.beta0 + cfg.rho * (agent.beta - cfg.beta0)

    if success:
        agent.alpha += weight
        agent.n_correct += 1
    else:
        agent.beta += weight
    agent.n_validations += 1


def decay_inactive(agent: Agent, n_ticks_idle: int, cfg: Config) -> None:
    """Decay ρ for an agent inactive over n_ticks ticks."""
    if n_ticks_idle <= 0:
        return
    rho_n = cfg.rho ** n_ticks_idle
    agent.alpha = cfg.alpha0 + rho_n * (agent.alpha - cfg.alpha0)
    agent.beta = cfg.beta0 + rho_n * (agent.beta - cfg.beta0)


# ---------------------------------------------------------------------
# EWMA update of an R component
# ---------------------------------------------------------------------

def ewma_update(current: float, x: float, dt_ticks: int, tau: float) -> float:
    """
    EWMA: R ← (1 − η)·R + η·x with η = 1 − exp(−Δt/τ).
    For Δt = 0, the event is simultaneous; we use Δt = 1 by default.
    """
    eta = 1.0 - math.exp(-max(dt_ticks, 1) / tau)
    return (1.0 - eta) * current + eta * x


def ewma_decay(current: float, dt_ticks: int, tau: float) -> float:
    """Pure decay (between two events): R ← R · exp(−Δt/τ)."""
    if dt_ticks <= 0:
        return current
    return current * math.exp(-dt_ticks / tau)


# ---------------------------------------------------------------------
# R_A component — seniority weighted by activity
# ---------------------------------------------------------------------

def R_A_compute(age_eff: float, cfg: Config) -> float:
    """tanh(age_eff / T_A), bounded in [0, 1[."""
    return math.tanh(age_eff / cfg.T_A)


# ---------------------------------------------------------------------
# Aggregated R score
# ---------------------------------------------------------------------

def aggregate_R(agent: Agent, cfg: Config) -> float:
    """
    Weighted sum of the 7 components (cf. formalisation §D.4 v0.3).

    R = (1 − w_acc) · [w_C·R_C + w_V·R_V + w_F·R_F + w_A·R_A + w_Δ·R_Δ + w_S·R_S]
        + w_acc · R_acc

    Renormalization by (1 − w_acc) on the 6 originals to preserve Σw = 1
    (cf. formalisation §D.4 — conservation of ratios among the 6 originals).
    R_V = f̂ by fusion (formalisation §D.3).
    """
    R_V = agent.f_hat
    R_A = R_A_compute(agent.age_eff, cfg)

    R_six = (cfg.w_C * agent.R_C
             + cfg.w_V * R_V
             + cfg.w_F * agent.R_F
             + cfg.w_A * R_A
             + cfg.w_Delta * agent.R_Delta
             + cfg.w_S * agent.R_S)
    R = (1.0 - cfg.w_acc) * R_six + cfg.w_acc * agent.R_acc
    return max(0.0, min(1.0, R))


def update_R_acc(agent: Agent, accepted: bool, cfg: Config) -> None:
    """
    EWMA update of R_acc at each protocol selection.
    `x_t = 1` if the agent accepted the task, `0` if refused.
    """
    x = 1.0 if accepted else 0.0
    agent.R_acc = ewma_update(agent.R_acc, x, dt_ticks=1, tau=cfg.tau_acc)
    agent.n_selections += 1
    if not accepted:
        agent.n_refusals += 1


def update_R_components_post_validation(
    agent: Agent,
    success: bool,
    d_t: float,
    cfg: Config,
) -> None:
    """
    Update of EWMA components after a validation.

    R_C : touched (by contract; in v1 simulator, we assume that a
          correct validation also produces a +1 on R_C linked to the
          underlying contract — simplification).
    R_F : not updated here (specific frauds, out of v1 scope).
    R_S : not updated here (sponsorship, handled separately).
    R_Delta : recomputed periodically, outside of this function.
    R_A : handled separately via age_eff increment.
    """
    # R_C: we take `1` if validation is correct, `0` otherwise, in EWMA
    x_C = 1.0 if success else 0.0
    agent.R_C = ewma_update(agent.R_C, x_C, dt_ticks=1, tau=cfg.tau_C)


def update_R_components_decay(agent: Agent, dt_ticks: int, cfg: Config) -> None:
    """EWMA decay of components for an inactive agent."""
    agent.R_C = ewma_decay(agent.R_C, dt_ticks, cfg.tau_C)
    agent.R_F = ewma_decay(agent.R_F, dt_ticks, cfg.tau_F)
    agent.R_S = ewma_decay(agent.R_S, dt_ticks, cfg.tau_S)
    # R_Delta handled elsewhere; R_A frozen while inactive (no freeze here in v1)
