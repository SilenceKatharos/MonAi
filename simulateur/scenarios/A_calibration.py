"""
Scenario A — "Reference calibration"

Default mix:
- 100 honest
- 20 mediocre
- 5 cherry-pickers
- 10 sybils
- 5 biased random

Duration: 2000 ticks (cf. Q2 arbitration in the plan).

Expected check: the hierarchy of cumulative rewards is
honest > mediocre > cherry-picker > sybil ≈ biased random (≈ 0).
"""

from ..config import Config
from ..simulation import run_simulation


def make_config() -> Config:
    cfg = Config()
    cfg.n_ticks = 2000
    cfg.seed = 42
    # Default mix already consistent with the spec
    cfg.n_honest = 100
    cfg.n_mediocre = 20
    cfg.n_cherry_picker = 5
    cfg.n_sybil = 10
    cfg.n_random_biased = 5
    return cfg


def main() -> None:
    cfg = make_config()
    run_simulation(cfg, scenario_name="A_calibration")


if __name__ == "__main__":
    main()
