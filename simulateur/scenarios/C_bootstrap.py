"""
Scenario C — "Fragile bootstrap"

Mix: 20 agents at startup (10 honest, 5 mediocre, 5 sybils).
Duration: 1500 ticks.

Expected check:
- At startup the replay pool (i) is empty; honeypots come only from
  source (iii) synthetic.
- Sybils are still detected (the w_h effect on synthetic honeypots
  is sufficient).
- Honest agents are not suffocated by validator scarcity.
- The replay pool (i) builds up progressively (visible in the
  `pool_replay` metrics of the progress log).

Lower task volume to stay realistic (few agents available to
validate).
"""

from ..config import Config
from ..simulation import run_simulation


def make_config() -> Config:
    cfg = Config()
    cfg.n_ticks = 1500
    cfg.seed = 7
    cfg.n_honest = 10
    cfg.n_mediocre = 5
    cfg.n_cherry_picker = 0
    cfg.n_sybil = 5
    cfg.n_random_biased = 0
    # Adapt throughput to the small network size
    cfg.lambda_tasks_per_tick = 5.0
    cfg.n_validators_per_task = 5
    return cfg


def main() -> None:
    cfg = make_config()
    run_simulation(cfg, scenario_name="C_bootstrap")


if __name__ == "__main__":
    main()
