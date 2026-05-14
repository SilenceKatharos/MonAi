"""
Centralized configuration for the MonAI v1 simulator.

All model parameters are gathered here. To calibrate or explore a
variant, edit this file (or override via a scenario in `scenarios/`).

Time convention: 1 tick = 1 day (default interpretation).
All half-lives and time windows are expressed in ticks.
"""

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class Config:
    # ─────────────────────────────────────────────────────────────
    # Time parameters
    # ─────────────────────────────────────────────────────────────
    n_ticks: int = 2000              # total simulation duration
    seed: int = 42                   # seed for reproducibility

    # ─────────────────────────────────────────────────────────────
    # PoUW issuance (cf. design/02-crypto-et-economie.md)
    # ─────────────────────────────────────────────────────────────
    R_initial: float = 1.0e9         # initial remaining-to-mine (abstract unit)
    k_emission: float = 1.0e-7       # fraction of R(t) issued per validated task

    # ─────────────────────────────────────────────────────────────
    # Multiplier M(f, d) — sigmoid by default
    # (cf. formalisation/01-formules-mathematiques.md §C.1)
    # ─────────────────────────────────────────────────────────────
    # Calibration v1 (May 10, 2026): f0_max = 0.90  (before systematic grid search)
    # Calibration v2 (May 10, 2026): f0_max = 0.90  (unchanged, grid v2 had no winner)
    # Calibration v3 (May 10, 2026): f0_max = 0.85  (Candidate B grid v3 — H/M=3.09, H/S=1481)
    f0_max: float = 0.85             # sigmoid threshold on easy tasks
    delta_seuil: float = 0.10        # threshold shift with d
    # Calibration v1/v2/v3: k_sigmoid = 40  (unchanged)
    k_sigmoid: float = 40.0          # sigmoid slope
    # Calibration v1 (May 10, 2026): gamma_d = 1.0
    # Calibration v2 (May 10, 2026): gamma_d = 1.0  (unchanged)
    # Calibration v3 (May 10, 2026): gamma_d = 3.0  (Candidate B grid v3 — H/C=3.01)
    gamma_d: float = 3.0             # difficulty bonus (1 + γ·d)

    # ─────────────────────────────────────────────────────────────
    # Automatic demand bonus P(t, task) — added in v0.5 / Session 2
    # Activated in simulator v4. Cf. formalisation/01-formules-mathematiques.md §F
    # ─────────────────────────────────────────────────────────────
    # Calibration v1/v2/v3: demand bonus not implemented (v3 uses reward without P)
    # Calibration v4 (May 2026): bonus activated, default values from Session 2
    use_demand_premium: bool = True  # toggle v3 (False) / v4 (True) — useful for ablation
    P_max: float = 2.5               # individual cap of the bonus
    delta_refus: float = 0.05        # multiplicative increment per refusal
    T_attente: int = 5               # delay (ticks) before time-based growth starts
    delta_temps: float = 0.01        # multiplicative increment per tick past T_attente
    cap_primes: float = 6.0          # joint cap on (1+γ·d)·P
    N_max_refus: int = 10            # max refusals before task is marked impractical

    # ─────────────────────────────────────────────────────────────
    # Beta-Binomial reliability score f̂
    # (cf. formalisation/01-formules-mathematiques.md §A.1)
    # ─────────────────────────────────────────────────────────────
    alpha0: float = 19.0             # prior α
    beta0: float = 1.0               # prior β (mean 0.95, effective sample size 20)
    rho: float = 0.9885              # forgetting factor per tick (t_½ ≈ 60 ticks)

    # ─────────────────────────────────────────────────────────────
    # Honeypots (cf. formalisation/03-honeypots-retroactives.md)
    # ─────────────────────────────────────────────────────────────
    phi_normal: float = 0.10         # fraction of honeypots under normal regime
    w_h: float = 5.0                 # weight of a honeypot observation
    n_init: int = 20                 # cold-start validations
    ratio_synth_cold: float = 0.70   # fraction (iii) in cold-start
    ratio_synth_normal: float = 0.30 # fraction (iii) under normal regime
    # Replay pool (i)
    d_max_stable: float = 0.10       # max eligible difficulty
    T_stable: int = 90               # min age in ticks
    pool_replay_size: int = 10000    # circular pool size

    # ─────────────────────────────────────────────────────────────
    # Reputation score R (cf. formalisation/01 §D)
    # ─────────────────────────────────────────────────────────────
    # Weights of the 6 ORIGINAL components (before renormalization by (1-w_acc))
    w_C: float = 0.35                # honored contracts
    w_V: float = 0.25                # correct validations (= f̂)
    w_F: float = 0.10                # fraud detection
    w_A: float = 0.10                # seniority × activity
    w_Delta: float = 0.10            # diversity
    w_S: float = 0.10                # sponsorship
    # R_acc component (EWMA acceptance rate) — added in v0.3
    # Calibration v1 (May 10, 2026): R_acc not implemented
    # Calibration v2 (May 10, 2026): w_acc = 0.20  (R_acc inside aggregated R, insufficient — see grid v2)
    # Calibration v3 (May 10, 2026): w_acc = 0.05  (R_acc as multiplier on reward, w_acc symbolic for rate-limit)
    w_acc: float = 0.05              # weight of R_acc in aggregated R (v0.4: symbolic)
    tau_acc: float = 60.0            # half-life of R_acc (ticks)
    # Half-lives of the other components
    tau_C: float = 180.0             # contracts half-life (ticks)
    tau_F: float = 365.0             # fraud half-life
    tau_S: float = 365.0             # sponsorship half-life
    T_A: float = 730.0               # effective-age scale (ticks)
    seuil_act: float = 0.14          # ~1 validation/week
    gamma_V: float = 0.5             # difficult-validation bonus in R_V

    # ─────────────────────────────────────────────────────────────
    # Validator selection
    # ─────────────────────────────────────────────────────────────
    n_validators_per_task: int = 10
    R_min_floor: float = 0.05        # weight floor for low-R agents
    quota_new: float = 0.20          # share of validators reserved for newcomers

    # ─────────────────────────────────────────────────────────────
    # Task generation
    # ─────────────────────────────────────────────────────────────
    lambda_tasks_per_tick: float = 50.0   # average Poisson rate
    beta_a_difficulty: float = 2.0   # parameters of Beta(a, b) for θ_t
    beta_b_difficulty: float = 5.0

    # ─────────────────────────────────────────────────────────────
    # Simplified sponsorship v1
    # ─────────────────────────────────────────────────────────────
    sponsor_proba: float = 0.50      # probability that a new agent has a sponsor
    sponsor_inheritance: float = 0.05  # referral starts at 5% of R_sponsor
    sponsor_stake: float = 0.10       # sponsor stakes 10%
    N_filleul_succes: int = 5        # correct validations required
    T_filleul: int = 20              # time window (ticks)
    sponsor_bonus: float = 0.10      # bonus released on success

    # ─────────────────────────────────────────────────────────────
    # Rate-limiting
    # ─────────────────────────────────────────────────────────────
    max_tx_at_R0: int = 1            # tx/tick at R = 0
    max_tx_at_R1: int = 100          # tx/tick at R = 1

    # ─────────────────────────────────────────────────────────────
    # Agent mix per profile (can be overridden by a scenario)
    # ─────────────────────────────────────────────────────────────
    n_honest: int = 100
    n_mediocre: int = 20
    n_cherry_picker: int = 5
    n_sybil: int = 10
    n_random_biased: int = 5

    # ─────────────────────────────────────────────────────────────
    # Metrics
    # ─────────────────────────────────────────────────────────────
    metrics_every: int = 1           # snapshot every N ticks (1 = every tick)

    # ─────────────────────────────────────────────────────────────
    # Profiles — baseline reliability rate
    # ─────────────────────────────────────────────────────────────
    p_base_per_profile: Dict[str, float] = field(default_factory=lambda: {
        "honnete": 0.99,
        "mediocre": 0.85,
        "cherry_picker": 0.999,
        "sybil": 0.50,
        "random_biased": 0.50,  # not used directly (vote always True)
    })


# Default instance, used when a scenario does not override
DEFAULT_CONFIG = Config()
