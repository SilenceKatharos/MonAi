"""
Definition of agents and their five profiles.

Profiles (cf. user spec, step 3):
- HONNETE        : p_base = 0.99, takes any task.
- MEDIOCRE       : p_base = 0.85, takes any task.
- SYBIL          : p_base = 0.50, takes any task (massive cheater).
- CHERRY_PICKER  : p_base = 0.999 but refuses θ_t > 0.3.
- RANDOM_BIASED  : always votes "approved" (= True).

`p_correct` is linearly degraded by the latent difficulty θ_t
of the task (cf. plan, Q1 choice — linear modeling):

    p_correct(θ) = 0.5 + (p_base - 0.5) · (1 - θ)

So an honest agent at θ=1 is at p=0.5 (same as random); a sybil
at p_base=0.5 stays at 0.5 everywhere; a cherry-picker at θ<0.3 stays
near-perfect.
"""

from dataclasses import dataclass, field
from typing import List, Optional

from .config import Config


# Profile constants (str for simplicity of logging and CSV)
HONNETE = "honnete"
MEDIOCRE = "mediocre"
SYBIL = "sybil"
CHERRY_PICKER = "cherry_picker"
RANDOM_BIASED = "random_biased"

ALL_PROFILES = [HONNETE, MEDIOCRE, SYBIL, CHERRY_PICKER, RANDOM_BIASED]


@dataclass
class Agent:
    """State of a single agent in the simulation."""

    id: int
    profile: str
    birth_tick: int = 0

    # Beta-Binomial with decaying observations (cf. formalisation §A.1)
    alpha: float = 0.0    # initialized to alpha0 in __post_init__
    beta: float = 0.0     # initialized to beta0

    # Reputation R components (EWMA, cf. formalisation §D.3)
    R_C: float = 0.0      # contracts honored
    R_F: float = 0.0      # fraud detection
    R_S: float = 0.0      # sponsorship
    R_Delta: float = 0.0  # diversity
    R_acc: float = 1.0    # acceptance rate EWMA (init 1.0 — not yet refused)
    age_eff: float = 0.0  # effective age for R_A
    # Counters for R_acc audit
    n_selections: int = 0   # total number of selections (accepted + refused)
    n_refusals: int = 0     # number of refusals

    # Auxiliary counters
    n_validations: int = 0          # total number of validations performed
    n_correct: int = 0              # number of votes aligned with c_t / c_t^*
    cum_reward: float = 0.0         # cumulative gain in MonAI
    last_active_tick: int = -1      # last tick at which the agent validated

    # Sponsorship
    sponsor_id: Optional[int] = None
    sponsor_n_correct_so_far: int = 0
    sponsor_active_until: int = -1  # limit tick; -1 = no active sponsorship
    sponsor_staked: float = 0.0     # sponsor's stake in R

    # Rate-limiting (initialized via external method)
    tx_used_this_tick: int = 0

    def __post_init__(self) -> None:
        # If no init was passed, neutral values
        if self.alpha == 0.0:
            self.alpha = 19.0
        if self.beta == 0.0:
            self.beta = 1.0

    # -----------------------------------------------------------------
    # Current f̂ estimator (Beta posterior mean)
    # -----------------------------------------------------------------
    @property
    def f_hat(self) -> float:
        return self.alpha / (self.alpha + self.beta)

    @property
    def is_new(self) -> bool:
        """True as long as the agent has not exceeded the cold-start window."""
        return self.n_validations < 20  # default n_init

    # -----------------------------------------------------------------
    # Decision to accept a task depending on profile
    # -----------------------------------------------------------------
    def should_accept(self, theta_t: float) -> bool:
        if self.profile == CHERRY_PICKER:
            return theta_t < 0.3
        return True

    # -----------------------------------------------------------------
    # Vote on a task, depending on the truth c_true and θ_t
    # -----------------------------------------------------------------
    def vote(self, theta_t: float, c_true: bool, rng) -> bool:
        """
        c_true : the truth of the task (from the simulator's point of view).
                 For normal tasks, c_true = latent truth.
                 For honeypots, c_true = c_t^*.
        Returns the agent's vote.
        """
        if self.profile == RANDOM_BIASED:
            return True  # always votes "approved"

        p_base = {
            HONNETE: 0.99,
            MEDIOCRE: 0.85,
            CHERRY_PICKER: 0.999,
            SYBIL: 0.50,
        }[self.profile]

        # Linear degradation of p_correct by difficulty
        p_correct = 0.5 + (p_base - 0.5) * (1.0 - theta_t)
        p_correct = max(0.5, min(1.0, p_correct))

        if rng.uniform() < p_correct:
            return c_true
        return not c_true


# ---------------------------------------------------------------------
# Initial creation of an agent population
# ---------------------------------------------------------------------

def create_initial_population(cfg: Config, current_tick: int = 0) -> List[Agent]:
    """Creates a population of agents according to the mix defined in cfg."""
    agents: List[Agent] = []
    counts = [
        (HONNETE, cfg.n_honest),
        (MEDIOCRE, cfg.n_mediocre),
        (CHERRY_PICKER, cfg.n_cherry_picker),
        (SYBIL, cfg.n_sybil),
        (RANDOM_BIASED, cfg.n_random_biased),
    ]
    next_id = 0
    for profile, n in counts:
        for _ in range(n):
            agents.append(Agent(
                id=next_id,
                profile=profile,
                birth_tick=current_tick,
                alpha=cfg.alpha0,
                beta=cfg.beta0,
            ))
            next_id += 1
    return agents
