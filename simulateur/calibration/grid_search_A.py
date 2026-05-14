"""
Targeted grid search on scenario A.

3 parameters x 3 values = 27 combinations:
  f0_max ∈ {0.85, 0.88, 0.90}
  k_sigmoid ∈ {25, 40, 60}
  γ (difficulty bonus) ∈ {1.0, 2.0, 3.0}

For each combination, runs the standard scenario A (2000 ticks)
and computes:
  - mean cum_reward per profile
  - 4 target ratios: H/M, H/C, M/C, H/S

Output: simulateur/calibration/grid_search_A.csv
"""

from __future__ import annotations

import itertools
import os
import sys
import time
from typing import Dict, List

import pandas as pd

from ..config import Config
from ..simulation import run_simulation


F0_MAX_VALUES = [0.85, 0.88, 0.90]
K_SIGMOID_VALUES = [25.0, 40.0, 60.0]
GAMMA_VALUES = [1.0, 2.0, 3.0]


def make_scenario_A_config(f0_max: float, k_sigmoid: float, gamma: float) -> Config:
    cfg = Config()
    cfg.n_ticks = 2000
    cfg.seed = 42
    cfg.n_honest = 100
    cfg.n_mediocre = 20
    cfg.n_cherry_picker = 5
    cfg.n_sybil = 10
    cfg.n_random_biased = 5
    cfg.f0_max = f0_max
    cfg.k_sigmoid = k_sigmoid
    cfg.gamma_d = gamma
    cfg.metrics_every = 50  # less frequent snapshots to save time
    return cfg


def per_profile_gain(results_dir: str) -> Dict[str, float]:
    """Reads agents_final.csv and returns {profile: cum_reward.mean()}."""
    df = pd.read_csv(os.path.join(results_dir, "agents_final.csv"))
    return df.groupby("profile")["cum_reward"].mean().to_dict()


def safe_ratio(num: float, denom: float) -> float:
    if denom <= 0:
        return float("inf")
    return num / denom


def main() -> None:
    # base = .../MonAi (repo root), simulateur/ is right below
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out_csv = os.path.join(base, "simulateur", "calibration", "grid_search_A.csv")

    rows: List[dict] = []
    combos = list(itertools.product(F0_MAX_VALUES, K_SIGMOID_VALUES, GAMMA_VALUES))
    n_total = len(combos)
    t0 = time.time()

    print(f"[grid] Launching {n_total} runs (no figures)...")

    for idx, (f0_max, k_sig, gamma) in enumerate(combos, start=1):
        cfg = make_scenario_A_config(f0_max, k_sig, gamma)
        scen_tag = f"grid_A_f{f0_max}_k{int(k_sig)}_g{gamma}"
        results_dir = run_simulation(cfg, scenario_name=scen_tag,
                                      verbose=False, save_figures=False)

        gains = per_profile_gain(results_dir)
        h = gains.get("honnete", 0.0)
        m = gains.get("mediocre", 0.0)
        c = gains.get("cherry_picker", 0.0)
        s = gains.get("sybil", 0.0)
        r = gains.get("random_biased", 0.0)

        ratio_h_m = safe_ratio(h, m)
        ratio_h_c = safe_ratio(h, c)
        ratio_m_c = safe_ratio(m, c)
        ratio_h_s = safe_ratio(h, s)

        # Targets: ratio_h_m ∈ [3, 10], ratio_h_c > 5 (ideal > 10),
        #          ratio_m_c > 1, ratio_h_s > 100.
        passes_h_m = 3.0 <= ratio_h_m <= 10.0
        passes_h_c = ratio_h_c > 5.0
        passes_m_c = ratio_m_c > 1.0
        passes_h_s = ratio_h_s > 100.0
        n_passed = sum([passes_h_m, passes_h_c, passes_m_c, passes_h_s])

        rows.append({
            "f0_max": f0_max,
            "k_sigmoid": k_sig,
            "gamma": gamma,
            "gain_honnete": h,
            "gain_mediocre": m,
            "gain_cherry_picker": c,
            "gain_sybil": s,
            "gain_random_biased": r,
            "ratio_h_m": ratio_h_m,
            "ratio_h_c": ratio_h_c,
            "ratio_m_c": ratio_m_c,
            "ratio_h_s": ratio_h_s,
            "passes_h_m": passes_h_m,
            "passes_h_c": passes_h_c,
            "passes_m_c": passes_m_c,
            "passes_h_s": passes_h_s,
            "n_passed": n_passed,
            "results_dir": os.path.relpath(results_dir, base),
        })

        elapsed = time.time() - t0
        eta = elapsed / idx * (n_total - idx)
        print(f"  [{idx:>2}/{n_total}] f0={f0_max} k={int(k_sig)} γ={gamma} "
              f"| H/M={ratio_h_m:6.2f} H/C={ratio_h_c:6.2f} "
              f"M/C={ratio_m_c:5.2f} H/S={ratio_h_s:7.1f} "
              f"| {n_passed}/4 targets passed | ETA {eta:.0f}s")

    df = pd.DataFrame(rows)
    df.to_csv(out_csv, index=False)
    total = time.time() - t0
    print(f"\n[grid] Done in {total:.0f}s. Results in {out_csv}")


if __name__ == "__main__":
    main()
