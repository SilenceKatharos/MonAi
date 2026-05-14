"""
Economic layer: PoUW issuance and multiplier M(f, d).

Implements:
- M(f, d) sigmoid by default, as retained in formalisation/01 §C.1.
- Effective reward = M(f̂_pre, d_t) · k · R(t).
- Decrement of the remaining-to-mine R(t) at each issuance.
"""

import numpy as np

from .config import Config


def M_sigmoid(f: float, d: float, cfg: Config) -> float:
    """
    Reward multiplier (sliding-threshold sigmoid form).

    M(f, d) = σ(k · (f − f₀(d))) · (1 + γ · d)
    with f₀(d) = f₀_max − δ · d.
    """
    f0 = cfg.f0_max - cfg.delta_seuil * d
    G = 1.0 / (1.0 + np.exp(-cfg.k_sigmoid * (f - f0)))
    return float(G * (1.0 + cfg.gamma_d * d))


def reward_for_validation(f_hat_pre: float, d_t: float, R_remaining: float,
                          cfg: Config) -> float:
    """
    Reward for a v0.3 validation (without R_acc) = M(f̂_pre, d) · k · R(t).
    Kept for ablation and backward compatibility.
    """
    M = M_sigmoid(f_hat_pre, d_t, cfg)
    return M * cfg.k_emission * R_remaining


def reward_for_validation_with_acc(f_hat_pre: float, d_t: float, R_acc_pre: float,
                                    R_remaining: float, cfg: Config) -> float:
    """
    Reward for a v0.4 validation (R_acc as direct multiplier, Avenue P2):

        reward = M(f̂_pre, d) · R_acc_pre · k · R(t)

    R_acc_pre is the agent's EWMA acceptance rate BEFORE the update
    associated with the current task (symmetric with f̂_pre).

    Cf. formalisation/01-formules-mathematiques.md §C.0.
    """
    M = M_sigmoid(f_hat_pre, d_t, cfg)
    return M * R_acc_pre * cfg.k_emission * R_remaining


def G_sigmoid(f: float, d: float, cfg: Config) -> float:
    """Reliability sigmoid G(f, d) without the difficulty bonus."""
    import numpy as np
    f0 = cfg.f0_max - cfg.delta_seuil * d
    return float(1.0 / (1.0 + np.exp(-cfg.k_sigmoid * (f - f0))))


def reward_for_validation_with_demand(f_hat_pre: float, d_t: float,
                                       R_acc_pre: float, P_taux: float,
                                       R_remaining: float, cfg: Config) -> float:
    """
    Reward for a v0.5 / simulator v4 validation (active demand bonus):

        reward = G(f, d) · R_acc · min(cap_primes, (1 + γ·d) · P) · k · R(t)

    where:
        G(f, d) = σ(k_sig · (f − f0_max + δ·d)) — pure reliability sigmoid
        (1 + γ·d) — objective difficulty bonus
        P_taux ∈ [1, P_max] — dynamic demand bonus (cf. formalisation §F)
        cap_primes — joint cap on both bonuses

    Cf. formalisation/01-formules-mathematiques.md §C.0 v0.5.

    Also returns a flag indicating whether the joint cap was activated
    (useful for metrics).
    """
    G = G_sigmoid(f_hat_pre, d_t, cfg)
    prime_difficulte = 1.0 + cfg.gamma_d * d_t
    prime_combinee_raw = prime_difficulte * P_taux
    prime_combinee = min(cfg.cap_primes, prime_combinee_raw)
    reward = G * R_acc_pre * prime_combinee * cfg.k_emission * R_remaining
    cap_activated = prime_combinee_raw > cfg.cap_primes
    return reward, cap_activated


class EmissionState:
    """Maintains the remaining-to-mine R(t) and its history."""

    def __init__(self, cfg: Config) -> None:
        self.R = cfg.R_initial
        self.history: list = []   # list of R(t) per tick
        self.total_emitted: float = 0.0

    def emit(self, amount: float) -> float:
        """
        Issues at most `amount` MonAI, decrementing R.
        Returns the amount actually issued (may be less if R is exhausted).
        """
        actual = min(amount, self.R)
        self.R -= actual
        self.total_emitted += actual
        return actual

    def snapshot(self) -> None:
        self.history.append(self.R)
