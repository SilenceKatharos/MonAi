"""
Metrics collection and saving.

At each tick (or every `metrics_every` ticks), the following statistics
are aggregated by profile:
- mean f̂, mean R, mean cumulative reward
- number of agents, number of validations, number of refused tasks

At the end, the following are saved:
- metrics_per_tick.csv: time series by profile
- agents_final.csv: final state agent by agent
- network.csv: issuance, total tx, honeypots
- figures/: 4 PNGs by default
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List

import numpy as np
import pandas as pd

from .agents import Agent, ALL_PROFILES
from .config import Config
from .reputation import aggregate_R


# Display-only mapping for plot legends. The internal Python constant
# `HONNETE = "honnete"` is kept (renaming would ripple through config.py,
# the 4 grid-search calibration scripts, and historical CSVs). Translation
# happens only at render time so figures read in English without breaking
# any code path or invalidating prior results.
PROFILE_DISPLAY: Dict[str, str] = {
    "honnete": "honest",
    "mediocre": "mediocre",
    "sybil": "sybil",
    "cherry_picker": "cherry-picker",
    "random_biased": "random-biased",
}


def _display_profile(profile: str) -> str:
    return PROFILE_DISPLAY.get(profile, profile)


@dataclass
class TickRecord:
    tick: int
    profile: str
    n_agents: int
    f_hat_mean: float
    R_mean: float
    R_acc_mean: float
    cum_reward_mean: float
    n_validations_total: int
    n_refusals_total: int


@dataclass
class NetworkTickRecord:
    tick: int
    R_remaining: float
    total_emitted: float
    n_tasks: int
    n_honeypots: int
    n_validations: int


class MetricsCollector:
    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self.tick_records: List[TickRecord] = []
        self.network_records: List[NetworkTickRecord] = []

    def snapshot_tick(self, tick: int, agents: List[Agent], R_remaining: float,
                     total_emitted: float, n_tasks: int, n_honeypots: int,
                     n_validations: int) -> None:
        # Snapshot by profile
        for profile in ALL_PROFILES:
            in_profile = [a for a in agents if a.profile == profile]
            if not in_profile:
                continue
            f_hats = np.array([a.f_hat for a in in_profile])
            Rs = np.array([aggregate_R(a, self.cfg) for a in in_profile])
            R_accs = np.array([a.R_acc for a in in_profile])
            gains = np.array([a.cum_reward for a in in_profile])
            n_vals = sum(a.n_validations for a in in_profile)
            n_refs = sum(a.n_refusals for a in in_profile)
            self.tick_records.append(TickRecord(
                tick=tick,
                profile=profile,
                n_agents=len(in_profile),
                f_hat_mean=float(f_hats.mean()),
                R_mean=float(Rs.mean()),
                R_acc_mean=float(R_accs.mean()),
                cum_reward_mean=float(gains.mean()),
                n_validations_total=int(n_vals),
                n_refusals_total=int(n_refs),
            ))
        # Network snapshot
        self.network_records.append(NetworkTickRecord(
            tick=tick, R_remaining=R_remaining, total_emitted=total_emitted,
            n_tasks=n_tasks, n_honeypots=n_honeypots, n_validations=n_validations,
        ))

    # -----------------------------------------------------------------
    # Final save
    # -----------------------------------------------------------------

    def save(self, results_dir: str, agents: List[Agent], save_figures: bool = True) -> None:
        os.makedirs(results_dir, exist_ok=True)

        df_ticks = pd.DataFrame([t.__dict__ for t in self.tick_records])
        df_ticks.to_csv(os.path.join(results_dir, "metrics_per_tick.csv"), index=False)

        df_net = pd.DataFrame([n.__dict__ for n in self.network_records])
        df_net.to_csv(os.path.join(results_dir, "network.csv"), index=False)

        df_agents = pd.DataFrame([{
            "id": a.id,
            "profile": a.profile,
            "f_hat_final": a.f_hat,
            "R_final": aggregate_R(a, self.cfg),
            "R_acc_final": a.R_acc,
            "cum_reward": a.cum_reward,
            "n_validations": a.n_validations,
            "n_correct": a.n_correct,
            "n_selections": a.n_selections,
            "n_refusals": a.n_refusals,
            "birth_tick": a.birth_tick,
        } for a in agents])
        df_agents.to_csv(os.path.join(results_dir, "agents_final.csv"), index=False)

        if save_figures:
            os.makedirs(os.path.join(results_dir, "figures"), exist_ok=True)
            self._save_default_figures(results_dir, df_ticks, df_net)

    # -----------------------------------------------------------------
    # Default figures
    # -----------------------------------------------------------------

    def _save_default_figures(self, results_dir: str, df_ticks: pd.DataFrame,
                              df_net: pd.DataFrame) -> None:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig_dir = os.path.join(results_dir, "figures")

        # 1. Mean f̂ by profile over time
        fig, ax = plt.subplots(figsize=(10, 5))
        for profile in df_ticks["profile"].unique():
            sub = df_ticks[df_ticks["profile"] == profile]
            ax.plot(sub["tick"], sub["f_hat_mean"], label=_display_profile(profile))
        ax.axhline(0.80, color="red", linestyle=":", alpha=0.5, label="M≈0 threshold")
        ax.axhline(0.95, color="black", linestyle="--", alpha=0.3, label="prior")
        ax.set_xlabel("tick")
        ax.set_ylabel("mean f̂")
        ax.set_title("Reliability trajectories by profile")
        ax.legend()
        ax.grid(alpha=0.3)
        ax.set_ylim(0.4, 1.02)
        plt.tight_layout()
        plt.savefig(os.path.join(fig_dir, "f_hat_par_profil.png"), dpi=110)
        plt.close()

        # 2. Mean R by profile
        fig, ax = plt.subplots(figsize=(10, 5))
        for profile in df_ticks["profile"].unique():
            sub = df_ticks[df_ticks["profile"] == profile]
            ax.plot(sub["tick"], sub["R_mean"], label=_display_profile(profile))
        ax.set_xlabel("tick")
        ax.set_ylabel("mean R")
        ax.set_title("Aggregated reputation by profile")
        ax.legend()
        ax.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(fig_dir, "R_par_profil.png"), dpi=110)
        plt.close()

        # 3. Cumulative reward by profile
        fig, ax = plt.subplots(figsize=(10, 5))
        for profile in df_ticks["profile"].unique():
            sub = df_ticks[df_ticks["profile"] == profile]
            ax.plot(sub["tick"], sub["cum_reward_mean"], label=_display_profile(profile))
        ax.set_xlabel("tick")
        ax.set_ylabel("mean cumulative reward (per agent)")
        ax.set_title("Cumulative rewards in MonAI issued by profile")
        ax.legend()
        ax.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(fig_dir, "gains_par_profil.png"), dpi=110)
        plt.close()

        # 4. Total R(t) and tx/tick
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        axes[0].plot(df_net["tick"], df_net["R_remaining"], color="tab:blue")
        axes[0].set_xlabel("tick")
        axes[0].set_ylabel("R(t) remaining to mine")
        axes[0].set_title("Cumulative issuance")
        axes[0].grid(alpha=0.3)

        axes[1].plot(df_net["tick"], df_net["n_tasks"], color="tab:gray", label="tasks", alpha=0.6)
        axes[1].plot(df_net["tick"], df_net["n_honeypots"], color="tab:orange", label="honeypots")
        axes[1].set_xlabel("tick")
        axes[1].set_ylabel("count per tick")
        axes[1].set_title("Network activity")
        axes[1].legend()
        axes[1].grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(fig_dir, "reseau.png"), dpi=110)
        plt.close()
