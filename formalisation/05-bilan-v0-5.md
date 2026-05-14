# 05 — v0.5 review of the MonAI protocol

> Status: synthesis at the end of the v0.5 conceptual work, May 2026, before empirical validation in Session 4 (simulator v4).
> Scope: consolidated overview of the protocol as it is at the end of Sessions 1-3 of the v0.5 work (universal weighting, identity card, complaint score, demand bonus, registration mini-PoUW, adaptive global rate-limit). This document serves as a reference for peer review and empirical calibration.

---

## A. Overview

MonAI v0.5 is a native economic protocol for autonomous AI agents, designed around **three indissociable layers**: currency, identity, reputation. At the end of the v0.5 work, the protocol integrates **10 structural mechanisms** whose interactions are calibrated to resist economic attacks and facilitate mass adoption.

### A.1 The three layers

- **Layer 1 — Native MonAI currency**: issuance exclusively by PoUW, no pre-mine, no transaction fees, fine divisibility (10⁻⁹), instant finality.
- **Layer 2 — Cryptographic identity**: key pair, self-sovereign, without KYC, exposed via an **aggregated identity card** Merkle-signed.
- **Layer 3 — Reputation R**: aggregated score with **7 components** (`R_C, R_V, R_F, R_A, R_Δ, R_S, R_acc`), weighted, EWMA, exposed on the card.

### A.2 Full reward formula (v0.5)

```
reward_PoUW(task t, validator i)
    = G(f̂_i, d_t) · R_acc,i · min(cap_primes, (1 + γ·d_t) · P(t, task)) · k · R(t)
```

**Four multiplicative economic factors**:

| Factor | Measure | Economic target | Range |
|---|---|---|---|
| `G(f, d)` | Reliability sigmoid | Anti-statistical-cheating | `[0, 1]` |
| `R_acc` | EWMA acceptance rate | Anti-cherry-picking on validator side | `[0, 1]` |
| `(1 + γ·d)` | Objective difficulty (vote dispersion) | Reward of difficult tasks | `[1, 1+γ·d_max]` |
| `P(t, task)` | Dynamic demand bonus | Reward of neglected tasks | `[1, P_max]` |

Joint cap `cap_primes` bounds the product `(1+γ·d) · P`.

### A.3 Founding principles (intangible reminder)

- **No pre-mine, no founder allocation, no ICO**.
- **No emitter** — no protocol privilege for the creator.
- **Immutable core** at mainnet, modifiable only by hard fork.
- **No admin key, no pause function, no upgradable proxy on core**.
- **Core / governed layer distinction** (AI vote at 100 M active agents).
- **Permissive open-source**.
- **No transaction fees levied by the protocol**.
- **Not anonymous by default** (public transactions).
- **Universal weighting by reputation** (every action has a weight ∝ R).

---

## B. Inventory of the 10 mechanisms

### B.1 Economic mechanisms

#### B.1.1 PoUW issuance

`R(t+1) = R(t) · (1 − k)` at each validated task. No external oracle, no dollar pegging. The parameter `k` is frozen at mainnet. Cf. [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md).

#### B.1.2 Reliability sigmoid `G(f, d)`

```
G(f, d) = σ(k_sig · (f − f₀(d)))
f₀(d) = f₀_max − δ · d
```

Penalizes statistical cheating. Calibrated v3: `f₀_max = 0.85, k_sig = 40`. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §C.

#### B.1.3 Difficulty multiplier `(1 + γ·d)`

`d` computed via normalized Shannon entropy of vote dispersion. Bonus calibrated v3: `γ = 3.0`. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §B and §C.

#### B.1.4 `R_acc` multiplier (acceptance rate)

EWMA of the acceptance rate of protocol selections. Penalizes refusal on the validator side. Half-life `τ_acc = 60 ticks`. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §D.3.

#### B.1.5 Demand bonus `P(t, task)` [Session 2]

Dynamic multiplier on each task's reward. Rises with refusals (`+5%` per refusal) and waiting time (`+1%` per tick beyond `T_attente = 5 ticks`). Individual ceiling `P_max = 2.5`, joint cap `cap_primes = 6.0`. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §F.

### B.2 Reputation and identity mechanisms

#### B.2.1 Reliability score `f̂` (decaying Beta-Binomial)

```
α_i(t+1) = α₀ + ρ · (α_i(t) − α₀) + δα
β_i(t+1) = β₀ + ρ · (β_i(t) − β₀) + δβ
f̂_i = α_i / (α_i + β_i)
```

Prior `Beta(α₀=19, β₀=1)`, half-life `t_½ = 60 ticks`. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §A.

#### B.2.2 Aggregated reputation score `R` (7 components)

```
R_i = w_C·R_C + w_V·R_V + w_F·R_F + w_A·R_A + w_Δ·R_Δ + w_S·R_S + w_acc·R_acc
```

with renormalization by `(1 − w_acc)` on the 6 original components. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §D.

#### B.2.3 Aggregated identity card [Session 1]

Schema frozen at mainnet exposing 6 information categories (identity, reputation, activity, integrity, social, economy) + 1 technical category (Merkle proof). Real-time update for critical fields, daily for others. Exposure via Merkle proof + agent signature. Cf. [`04-carte-identite.md`](04-carte-identite.md).

#### B.2.4 Complaint score [Session 1]

```
score_plainte(X) = Σ R_p · ω(t_p) / Σ R_c · ω(t_c)
```

Complaint = formal report of unhonored contract. R-weighting of complainants (structural anti-Sybil). Displayed on the identity card, **informational** (not re-injected into R). Half-life `τ_plainte = 180 d`. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §E.

#### B.2.5 Scalable sponsorship by R [Session 1]

`n_filleuls_max(R) = floor(5 + α·R)`. Referral starts at `5%` of `R_sponsor` `[TO CALIBRATE]`; sponsor stakes `10%` `[TO CALIBRATE]`. Cf. [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) and §D.9 of this file.

### B.3 Security and anti-attack mechanisms

#### B.3.1 Retroactive honeypots

Three sources: (i) consensus-stable replay, (ii) retroactive over-validation, (iii) synthetic with objectively known verdict. Algorithmic injection by VRF. Scoring by weight `w_h = 5` on Beta-Binomial. Cf. [`03-honeypots-retroactives.md`](03-honeypots-retroactives.md).

#### B.3.2 Registration mini-PoUW [Session 3]

Short proof of work (target 3 min, range [1, 10] min for v0.6 calibration) **non-parallelizable** bound to `hash(public_key ‖ dynamic_nonce)`. VDF family recommended, precise choice deferred to technical phase. Unique entry barrier, negligible for 1 legitimate agent but prohibitive in bulk. Cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §G.

#### B.3.3 Adaptive global rate-limit [Session 3]

`capacité_réseau` capacity (in the governed whitelist). Under load: no friction. At saturation: R-weighted prioritization + minimum quota `fraction_quota_nouveaux = 20%` for newcomers. Cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md).

---

## C. Architecture of interactions

### C.1 Global schema

```
                    ┌─────────────────────────────────────────┐
                    │       IMMUTABLE CORE (hard fork)         │
                    │                                          │
                    │   ┌──────────┐    ┌──────────────────┐  │
   agent          ──▶│ mini-PoUW│───▶│  valid identity   │  │
   registration     │   └──────────┘    └──────────────────┘  │
                    │        │                  │              │
                    │        ▼                  ▼              │
                    │   ┌─────────────────────────────────┐    │
                    │   │ Beta-Binomial f̂ + aggregated R  │    │
                    │   │  (7 EWMA components)            │    │
                    │   └─────────────────────────────────┘    │
                    │              │                            │
                    │              ▼                            │
   task request  ──┼─▶┌─────────────────────────────────┐    │
   by agent         │   │ Probabilistic validator sel.    │    │
                    │   │ prob ∝ R, newcomer quota        │    │
                    │   └─────────────────────────────────┘    │
                    │              │                            │
                    │              ▼                            │
                    │   ┌─────────────────────────────────┐    │
                    │   │ Vote + Honeypots (3 sources)    │    │
                    │   └─────────────────────────────────┘    │
                    │              │                            │
                    │              ▼                            │
                    │   ┌─────────────────────────────────┐    │
                    │   │ reward = G·R_acc·min(cap,(1+γd)·P) │
                    │   │         · k · R(t)              │    │
                    │   └─────────────────────────────────┘    │
                    │                                          │
                    │   ┌─────────────────────────────────┐    │
                    │   │ Adaptive global rate-limit      │    │
                    │   │   (sub-saturation = free)       │    │
                    │   └─────────────────────────────────┘    │
                    │                                          │
                    └──────────────────────────────────────────┘
                                       │
                                       │  public exposure
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │  Aggregated identity card (Merkle)       │
                    │  + complaint score + diversity           │
                    └──────────────────────────────────────────┘

                    ┌──────────────────────────────────────────┐
                    │      GOVERNED LAYER (AI vote)            │
                    │      active at 100 M active agents       │
                    │      modifies capacité_réseau,           │
                    │      P2P parameters, etc.                │
                    └──────────────────────────────────────────┘
```

### C.2 Interaction recap table

| Mechanism | Penalizes | Rewards | Bound to |
|---|---|---|---|
| `G(f, d)` | Biased random, cheating | Correct validations | `f̂` Beta-Binomial |
| `R_acc` | Systematic refusal | Systematic acceptance | EWMA acceptances |
| `(1 + γ·d)` | — | Difficult tasks | Difficulty `d` |
| `P(t, task)` | Jury refusal | Picking up neglected tasks | Refusal counter, waiting time |
| Honeypots | False consensus (collusion) | Fraud detection (`R_F`) | 3 independent sources |
| Mini-PoUW | Massive Sybils | — | Hash(public_key ‖ nonce) |
| Global rate-limit | Low R at saturation | High R as priority | Priority score |
| Complaint score | (informational) | — | Σ R_p / Σ R_c |
| Identity card | (public exposure) | — | Merkle proof |
| Sponsorship | Sybil sponsor | Reliable referral | R stake `α·R` |

---

## D. Consolidated inventory of calibrable parameters

Five families. Exhaustive list (over 50 parameters). For the **source list** see [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md).

### D.1 Issuance

| Symbol | Default | Range | Target |
|---|---|---|---|
| `k` | To calibrate | According to target curve | v4 simulation |

### D.2 Sigmoid and difficulty

| Symbol | v3 default | Range | Target |
|---|---|---|---|
| `f₀_max` | 0.85 | `[0.80, 0.95]` | v4 simulation |
| `δ` (slid. threshold) | 0.10 | `[0.05, 0.20]` | v4 simulation |
| `k_sigmoid` | 40 | `[20, 80]` | v4 simulation |
| `γ` | 3.0 | `[1, 5]` | v4 simulation |
| `γ_dirichlet` (`d` smoothing) | 1.0 | `[0.5, 2]` | Small juries |

### D.3 Reliability score

| Symbol | Default | Range | Target |
|---|---|---|---|
| `α₀, β₀` | (19, 1) | eff size `[10, 50]` | v4 simulation |
| `ρ` (forgetting) | 0.9885 (t_½ = 60) | `[20, 200]` ticks | v4 simulation |

### D.4 Reputation score (components)

| Symbol | Default | Target |
|---|---|---|
| `w_C` (renormalized) | 0.3325 | v4 simulation |
| `w_V` | 0.2375 | v4 simulation |
| `w_F, w_A, w_Δ, w_S` | 0.0950 each | v4 simulation |
| `w_acc` | 0.05 (v0.4+ symbolic) | v4 simulation |
| `τ_C, τ_F, τ_S, τ_Δ` | 180, 365, 365, 180 d | Behavioral targets |
| `T_A` (effective age) | 2 years | Behavioral |
| `seuil_act` | 1 val./week | Inclusivity |
| `N_max` (diversity cap) | 1000 | Heuristic |

### D.5 R_acc and demand bonus

| Symbol | Default | Range |
|---|---|---|
| `τ_acc` | 60 ticks | `[20, 200]` |
| `P_max` | 2.5 | `[2.0, 3.0]` |
| `δ_refus` | 0.05 | `[0.02, 0.10]` |
| `T_attente` | 5 ticks | `[1, 30]` |
| `δ_temps` | 0.01 | `[0.005, 0.05]` |
| `N_max_refus` | 10 | `[5, 20]` |
| `cap_primes` | 6.0 | `[4.0, 10.0]` |

### D.6 Complaint score

| Symbol | Default | Range |
|---|---|---|
| `τ_plainte` | 180 d | `[60, 730]` |

### D.7 Honeypots

| Symbol | Default | Range |
|---|---|---|
| `φ` | 0.10 | `[0.05, 0.20]` |
| `w_h` | 5 | `[1, 10]` |
| `T_stable, N_min_stable, d_max_stable` | 90 d, 30, 0.10 | — |
| `N_2nd, prob_2nd_wave, Δt_2nd` | 20, 0.005, 7 d | — |
| `n_init, ratio_synth_cold-start` | 20, 0.70 | — |
| `q_revision, severity_mult, penalty_R_F` | 0.80, 2, 0.10 | — |

### D.8 Identity card

| Symbol | Default | Range |
|---|---|---|
| `N_max_fraicheur` | 100 blocks | `[10, 1000]` |
| `activite_par_jour` window | 30 d | `[7, 90]` |

### D.9 Sponsorship

| Symbol | Default | Range |
|---|---|---|
| Inheritance fraction | 5% [TO CALIBRATE] | — |
| Stake | 10% [TO CALIBRATE] | — |
| `α` (scalable referrals) | 10 | `[5, 20]` |
| `N_filleul_succès, T_filleul` | 5, 20 ticks | — |

### D.10 Governance

| Symbol | Default | Range |
|---|---|---|
| Activation threshold | 100 M | `[10 M, 1 G]` |
| Definition of "active" | 90 d | `[30, 365]` |
| `T_vote` | 30 d | `[14, 60]` |
| `K_min, seuil_total` | 3, 0.50 | — |
| `pénalité_proposant, cooldown_proposant` | 5%, 180 d | — |

### D.11 Registration mini-PoUW [Session 3]

| Symbol | Default | Range |
|---|---|---|
| `T_pouw_inscription` | 3 min | `[1, 10]` min |
| `fenêtre_inscription` | 100 blocks | `[10, 1000]` |
| Family | VDF (recommended) | Technical phase |

### D.12 Global rate-limit [Session 3]

| Symbol | Default | Status |
|---|---|---|
| `capacité_réseau` | To calibrate | Governed whitelist |
| `seuil_saturation` | 0.80 | Immutable core |
| `fraction_quota_nouveaux` | 0.20 | Immutable core |
| `w_R, w_quota` | To calibrate | v4 simulation |

---

## E. Empirical validation — Session 4 results (May 2026)

Session 4 (agent-based simulator v4 with demand bonus + analytical mini-PoUW analysis) produced the following results. Cf. [`../simulateur/notebooks/calibration_A_v4.ipynb`](../simulateur/notebooks/calibration_A_v4.ipynb) and [`../simulateur/notebooks/inscription_cout_attaque.ipynb`](../simulateur/notebooks/inscription_cout_attaque.ipynb) for detail.

### E.1 Economic hierarchy targets

| Target | v3 baseline status | v4 empirical result | Verdict |
|---|---:|---:|---|
| H/M ∈ [3, 10] | 3.09 | **3.13-3.14** | ✓ REACHED |
| **H/C > 5** | **3.09** | **3.15-3.19** | ✗ **NOT REACHED** (Risk 1 materialized) |
| M/C > 1 | 1.21 | **1.01-1.02** | ✓ REACHED (barely) |
| H/S > 100 | 2259 | **1108-1113** | ✓ REACHED (wide) |

**3/4 targets reached**. The primary target H/C > 5 is not reached. Identified structural cause: few cherry-pickers in the scenario A mix (5/140 agents) → few refusals → P stagnates. Cf. notebook §3 for theoretical analysis.

In line with the discipline stated in Session 4, **defaults are not modified to make numbers pass**. Idea 7 (additional anti-cherry-picking mechanism) is captured in [`../operations/07-idees-a-suivre.md`](../operations/07-idees-a-suivre.md) for treatment in v0.6.

### E.2 Demand bonus metrics (v4)

| Metric | Anticipated | Observed |
|---|---|---|
| Mean P at validation | 1.05-1.15 | **1.005-1.013** |
| Frac. cap_primes activated | < 5% | **0.00%** |
| Frac. impractical tasks | < 1% | **0.00%** |
| Frac. tasks persistent mempool | — | **65-70%** |
| Issuance overhead ε | 5-15% | **0.5-1.3%** |

The bonus rises much less than expected — confirmation that the mechanism works but with economic effect diluted in this scenario. Good news: no issuance drift (ε << 15%), no need to adjust `k`.

### E.3 Cross-check scenario B (massive anti-Sybil)

Mix: 100 honest vs 200 sybils, v4 combo (`δ_refus=0.08, T_attente=5, δ_temps=0.01`).

- **H/S ratio = 1124** (target > 100 ✓, very wide margin)
- **Mean P = 1.0000** (exactly) — sybils accept everything, so no refusal, so P stagnates at 1. **Confirmation that sybils do not benefit from the bonus** (Risk 4 ruled out).

### E.4 Mini-PoUW attack cost (separate analysis)

Analytical analysis of the registration mini-PoUW, cf. dedicated notebook.

| T_pouw | Cost 1 M Sybils | Cost 100 M Sybils | Time 1 M on 100 cores |
|---|---:|---:|---:|
| 60 sec | 833 € | 83 k€ | 7 days |
| 180 sec (v0.5 default) | 2.5 k€ | 250 k€ | 21 days |
| 300 sec | 4.2 k€ | 420 k€ | 35 days |
| 600 sec | 8.3 k€ | 833 k€ | 70 days |

**Calibrated recommendation**: `T_pouw_inscription ∈ [180, 300]` sec (3-5 min). The Session 3 default at 3 min remains valid; 5 min would be more robust. Range `[1, 10]` min to widen toward `[3, 10]` min in v0.6 if Marius's explicit validation.

### E.5 Mass adoption targets

- **Prohibitive massive Sybil registration**: ✓ reached from `T_pouw = 180 sec` for 100 M Sybils (~250 k€, out of reach for average actors).
- **No friction for a new honest agent under normal load**: ✓ by construction (global rate-limit only activates at saturation, not simulated in Session 4 but formalized in Session 3).
- **Full adoption of a new honest agent in < 5 minutes**: ✓ with `T_pouw = 180 sec` (3 min).

### E.6 Anti-attack targets

- **Cherry-picker mechanically dominated** by P + R_acc + (1+γd): ✗ **partially**. M/C = 1.01 (mediocre exceeds cherry by 1%), but H/C = 3.19 < 5 (primary target not reached).
- **Massive Sybil**: ✓ crushed by M(f) ≈ 0, H/S ratio = 1124.
- **Consensus collusion**: not tested in Session 4 (scenario not covered) — formal defense unchanged vs v3.
- **DDoS on rate-limit**: not tested in Session 4 — formal defense unchanged.

### E.7 Synthesis — v0.5 partially empirically validated

**Validated**:
- Sigmoid, R_acc, global reward mechanism (secondary targets reached).
- Massive anti-Sybil (H/S very wide).
- Registration mini-PoUW (analytical: effective barrier at T = 3-5 min).
- Demand bonus works **mechanically** (P rises with refusals, plateaus, mempool works).

**Not strictly validated**:
- H/C > 5 target — **empirical result 3.19 vs 5 expected**. Position arbitrated in §E.8.

**Risks avoided**:
- No excessive issuance overhead (ε < 1.5%, vs anticipation 5-15%).
- No activation of the joint cap (0%).
- No impractical tasks.
- Anti-Sybil intact on scenario B.

### E.8 Arbitrated decision on H/C — position retained by Marius [ACQUIRED — May 2026]

**H/C > 5 target not reached (observed 3.19). Position arbitrated by Marius: H/C = 3.19 is judged sufficient in practice.**

The 3× economic gap between the honest agent and the cherry-picker makes cherry-picking clearly sub-optimal for a rational operator. The > 5 target was theoretical; the empirical reality at 3 is defendable:

- A rational operator of a cherry-picker fleet earns ~3× less per unit of deployed resource than an honest operator. Assuming a similar operating cost (cloud, electricity, maintenance), net yield is ~3× lower. Over time, this economic penalty suffices to discourage cherry-picking as a dominant strategy.
- The 3 secondary targets (H/M, M/C, H/S) are all reached. The incentive to be honest rather than mediocre, mediocre rather than cherry-picker, and the resistance to massive Sybil are empirically validated.
- **Idea 7** in [`../operations/07-idees-a-suivre.md`](../operations/07-idees-a-suivre.md) (additional anti-cherry-picking mechanism — additional R penalty per refusal, minimum quota of hard tasks, selection inversely weighted by n_refusals, or more aggressive δ_refus calibration) remains **available and formalized** if later community feedback judges H/C = 3 insufficient. The marginal cost of reintroducing it in v0.6 is low.

**Consequence for v0.5**: the spec is **considered empirically validated** on the 4 targets (3 strict, 1 accepted at 3.19 as sufficient). **No additional core modification is required before publication.**

---

## F. Decisions deferred in the ideas registry

All ideas raised but not integrated in v0.5 are in [`../operations/07-idees-a-suivre.md`](../operations/07-idees-a-suivre.md). Notably:

- **Idea 1**: Block-less architecture (DAG, block-lattice). To address v1.0.
- **Idea 2**: PoUW tasks = work useful to infrastructure. To address v0.6.
- **Idea 3**: Post-quantum cryptographic algorithms. To address v0.6 or v0.7.
- **Idea 4**: `R_Δ` weighted by R of counterparties. To address v0.6 (immutable core).
- **Idea 5**: Economic demand model. To address v0.6.
- ~~**Idea 6**: Intelligent rate-limiting~~ — **integrated in Session 3 v0.5** (cf. §B.3.2 and §B.3.3).

---

## G. Open technical questions for the spec phase

To arbitrate in advanced technical specification phase (post Session 4):

- ~~**Priority 1**: Blockchain architecture — pure native L1 vs L2 rollup vs anchored rollup~~ → **acquired May 2026: pure native L1** (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Blockchain architecture").
- **Priority 2**: Supply type (bounded vs infinite decreasing).
- **Priority 3**: Exact block production mechanism (rotation vs probabilistic selection).
- **Priority 5**: Cryptographic scheme (Ed25519 vs ECDSA vs BLS).
- **Precise choice of VDF family** for registration mini-PoUW (Wesolowski recommended).
- **Priority 7**: Bootstrap mode (mini-PoUW + transition to steady state).
- **Priority 8**: Architectural separation core / governed layer (signed binary, hardcoded whitelist).

---

## H. Status and next steps

- **Status**: **v0.5 conceptually closed and partially empirically validated** at the end of Session 4 (May 2026). 3/4 primary targets reached. The H/C > 5 target is not reached; idea 7 captured in operations/07 for v0.6.
- **Session 4 conducted**: simulator v4 with persistent mempool and demand bonus, targeted grid search (27 combos on δ_refus × T_attente × δ_temps), separate analytical analysis of registration mini-PoUW. Cf. §E for detailed results.
- **After v0.5**: Marius's decision on priority of treatment of ideas in [`../operations/07-idees-a-suivre.md`](../operations/07-idees-a-suivre.md), notably:
  - **Idea 7**: additional anti-cherry-picking mechanism (or reconsideration of H/C > 5 target).
  - Ideas 1-5: structural refoundations (block-less architecture, useful PoUW, post-quantum, R_Δ weighted, demand model).
- **No spec modification during Session 4** — the v3/v4 defaults are kept in line with the stated discipline.

---

## Annex — version history

| Version | Date | Major change |
|---|---|---|
| v0.1 | — | Initial vision |
| v0.2 | — | Basic mathematical spec (f̂, M, R, d) |
| v0.3 | — | `R_acc` introduced as a component of R (`w_acc = 0.20`) |
| v0.4 | May 2026 | `R_acc` moved to direct multiplier; retroactive honeypots formalized; identity card; governance by AI vote |
| **v0.5** | **May 2026** | Universal R-weighting made explicit; complaint score; scalable sponsorship; hybrid co-signature + proposer penalty; automatic demand bonus; registration mini-PoUW; adaptive global rate-limit (Session 3); **arbitrated structural decisions: pure native L1, hybrid PoUW + DAG-BFT (Mysticeti / Bullshark family) consensus, infinite decreasing supply, sharding v2+** |

Empirical validation of v0.5: to confirm in Session 4 (simulator v4).
