"""
Grid search v4 — calibration of the demand bonus on scenario A.

3 parameters x 3 values = 27 combinations:
  δ_refus ∈ {0.03, 0.05, 0.08}
  T_attente ∈ {3, 5, 10}
  δ_temps ∈ {0.005, 0.01, 0.02}

f0_max, k_sigmoid, γ, w_acc fixed to the v3 retained values (Candidate B grid v3).
P_max = 2.5, cap_primes = 6.0, N_max_refus = 10 (fixed).

Targets:
  H/C > 5 (PRIMARY)
  H/M ∈ [3, 10]
  H/S > 100
  M/C > 1

Output: simulateur/calibration/grid_search_A_v4.csv
"""

from __future__ import annotations

import itertools
import json
import os
import time
from typing import Dict, List

import pandas as pd

from ..config import Config
from ..simulation import run_simulation


DELTA_REFUS_VALUES = [0.03, 0.05, 0.08]
T_ATTENTE_VALUES = [3, 5, 10]
DELTA_TEMPS_VALUES = [0.005, 0.01, 0.02]


def make_scenario_A_config(delta_refus: float, T_attente: int,
                            delta_temps: float) -> Config:
    cfg = Config()
    cfg.n_ticks = 2000
    cfg.seed = 42
    cfg.n_honest = 100
    cfg.n_mediocre = 20
    cfg.n_cherry_picker = 5
    cfg.n_sybil = 10
    cfg.n_random_biased = 5
    # v3 values fixed
    cfg.f0_max = 0.85
    cfg.k_sigmoid = 40.0
    cfg.gamma_d = 3.0
    cfg.w_acc = 0.05
    # v4 parameters (demand bonus)
    cfg.use_demand_premium = True
    cfg.P_max = 2.5
    cfg.cap_primes = 6.0
    cfg.N_max_refus = 10
    cfg.delta_refus = delta_refus
    cfg.T_attente = T_attente
    cfg.delta_temps = delta_temps
    cfg.metrics_every = 100
    return cfg


def per_profile_gain(results_dir: str) -> Dict[str, float]:
    df = pd.read_csv(os.path.join(results_dir, "agents_final.csv"))
    return df.groupby("profile")["cum_reward"].mean().to_dict()


def safe_ratio(num: float, denom: float) -> float:
    if denom <= 0:
        return float("inf")
    return num / denom


def main() -> None:
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out_csv = os.path.join(base, "simulateur", "calibration", "grid_search_A_v4.csv")

    rows: List[dict] = []
    combos = list(itertools.product(DELTA_REFUS_VALUES, T_ATTENTE_VALUES, DELTA_TEMPS_VALUES))
    n_total = len(combos)
    t0 = time.time()

    print(f"[grid v4] Launching {n_total} runs (demand bonus active)")

    for idx, (dr, ta, dt) in enumerate(combos, start=1):
        cfg = make_scenario_A_config(dr, ta, dt)
        scen_tag = f"grid_A_v4_dr{dr}_ta{ta}_dt{dt}"
        results_dir = run_simulation(cfg, scen_tag, verbose=False, save_figures=False)

        gains = per_profile_gain(results_dir)
        h = gains.get("honnete", 0.0)
        m = gains.get("mediocre", 0.0)
        c = gains.get("cherry_picker", 0.0)
        s = gains.get("sybil", 0.0)
        r = gains.get("random_biased", 0.0)

        with open(os.path.join(results_dir, "v4_stats.json")) as f:
            v4_stats = json.load(f)

        ratio_h_m = safe_ratio(h, m)
        ratio_h_c = safe_ratio(h, c)
        ratio_m_c = safe_ratio(m, c)
        ratio_h_s = safe_ratio(h, s)

        passes_h_m = 3.0 <= ratio_h_m <= 10.0
        passes_h_c = ratio_h_c > 5.0
        passes_m_c = ratio_m_c > 1.0
        passes_h_s = ratio_h_s > 100.0
        n_passed = sum([passes_h_m, passes_h_c, passes_m_c, passes_h_s])

        rows.append({
            "delta_refus": dr,
            "T_attente": ta,
            "delta_temps": dt,
            "gain_honnete": h,
            "gain_mediocre": m,
            "gain_cherry_picker": c,
            "gain_sybil": s,
            "gain_random_biased": r,
            "P_moyen": v4_stats["P_moyen_a_validation"],
            "frac_cap_activations": v4_stats["frac_cap_activations"],
            "frac_impraticables": v4_stats["frac_impraticables"],
            "frac_mempool_persistent": v4_stats["frac_tasks_mempool_persistent"],
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
        print(f"  [{idx:>2}/{n_total}] dr={dr} ta={ta} dt={dt} "
              f"| P_moy={v4_stats['P_moyen_a_validation']:.4f} "
              f"H/M={ratio_h_m:5.2f} H/C={ratio_h_c:5.2f} "
              f"M/C={ratio_m_c:4.2f} H/S={ratio_h_s:7.1f} "
              f"| {n_passed}/4 ✓ | ETA {eta:.0f}s")

    df = pd.DataFrame(rows)
    df.to_csv(out_csv, index=False)
    total = time.time() - t0
    print(f"\n[grid v4] Done in {total:.0f}s ({total/60:.1f} min). Results: {out_csv}")
    print(f"Combos passing 4/4 targets: {(df['n_passed'] == 4).sum()}")
    print(f"Combos H/C > 5 (PRIMARY): {(df['ratio_h_c'] > 5).sum()}")


if __name__ == "__main__":
    main()
