"""
Scenario B — "Massive sybil stress"

Mix: 100 honest + 200 sybils.
Duration: 2000 ticks.

Expected check:
- Sybils are crushed by M(f, d) (f̂ drops → reward ≈ 0).
- Rate-limiting prevents their saturation (the 200 sybils do not
  suffocate the honest agents by taking up the whole new-quota;
  quota_new is bounded at 20% of the flow by default).
- Honest agents maintain their rewards and their f̂.
"""

from ..config import Config
from ..simulation import run_simulation


def make_config() -> Config:
    cfg = Config()
    cfg.n_ticks = 2000
    cfg.seed = 123
    cfg.n_honest = 100
    cfg.n_mediocre = 0
    cfg.n_cherry_picker = 0
    cfg.n_sybil = 200
    cfg.n_random_biased = 0
    # Higher task volume to stress the network
    cfg.lambda_tasks_per_tick = 80.0
    return cfg


def main() -> None:
    cfg = make_config()
    run_simulation(cfg, scenario_name="B_stress_sybil")


if __name__ == "__main__":
    main()
