# 01 — Mathematical formalization

> Status: draft v0.2, May 2026.
> Scope: formulas for reliability score `f`, emergent difficulty `d`, reward multiplier `M(f, d)`, and reputation score `R`. Elements described qualitatively in [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) and [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md) are made explicit here.
> No numerical value is definitively decided: justified defaults + reasonable range, `[TO CALIBRATE]` markers.

## Notation

| Symbol | Meaning |
|---|---|
| `i` | Agent index |
| `t` | Task index / logical time |
| `v_{i,t} ∈ {0, 1}` | Vote of agent `i` on task `t` (binary case; generalizable to `{0..K-1}`) |
| `c_t ∈ {0, 1}` | Consensus verdict of task `t` (retroactively defined) |
| `s_{i,t} = 1[v_{i,t} = c_t]` | Correct validation of agent `i` on task `t` |
| `n_i` | Total number of validations performed by agent `i` |
| `s_i = Σ_t s_{i,t}` | Number of correct validations |
| `f_i ∈ [0, 1]` | Reliability score of agent `i` (latent variable, estimated by `f̂_i`) |
| `d_t ∈ [0, 1]` | Emergent difficulty of task `t` |
| `M(f, d)` | Reward multiplier |
| `k` | Fraction of remaining-to-mine issued per validated task (protocol parameter, see [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md)) |
| `R(t)` | Remaining-to-mine at time `t` |
| `R_i` | Aggregated reputation score of agent `i` |

---

## A. Reliability score `f`

### A.1 Beta-Binomial model with decaying observations (operational estimator) [ACQUIRED, parameters TO CALIBRATE]

**Retained choice**: a single operational estimator `f̂_i(t)` is used everywhere in the protocol — to modulate PoUW reward via `M(f, d)` and to feed the "correct validations" component `R_V` of the reputation score. It is a Beta-Binomial with **exponentially decaying pseudo-counts** (cf. arbitration on Q1 in the previous version): this reflects both an agent's present reliability and erosion by inactivity.

#### Construction

At each time step `t`, we update the pseudo-counts `α_i(t), β_i(t)` as follows:

```
Without observation at t:
  α_i(t+1) = α₀ + ρ · (α_i(t) − α₀)
  β_i(t+1) = β₀ + ρ · (β_i(t) − β₀)

With observation s_{i,t} ∈ {0,1} at t:
  α_i(t+1) = α₀ + ρ · (α_i(t) − α₀) + s_{i,t}
  β_i(t+1) = β₀ + ρ · (β_i(t) − β₀) + (1 − s_{i,t})
```

with `ρ ∈ (0, 1)` the **forgetting factor** per time step, and `α₀, β₀` the prior parameters.

Initial conditions: `α_i(0) = α₀, β_i(0) = β₀`.

The point estimator is the instantaneous posterior mean:

```
f̂_i(t) = α_i(t) / (α_i(t) + β_i(t))
```

**Instantaneous variance** (for a CI):

```
Var(f_i | data, t) = α_i(t) · β_i(t) / [(α_i(t) + β_i(t))² · (α_i(t) + β_i(t) + 1)]
```

#### Default prior choice: `Beta(α₀=19, β₀=1)`

Justification:

- **Prior mean `α₀/(α₀+β₀) = 0.95`**, in line with the proposal of [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md) ("optimistic Bayesian prior").
- **Effective prior size `α₀+β₀ = 20`**: about 20 observations are needed for data to weigh as much as the prior. Trade-off:
  - If `α₀+β₀` is too large (e.g. 200) → a fraudster keeps `f̂` high for a long time. Initial farming too profitable.
  - If `α₀+β₀` is too small (e.g. 2) → a new validator's reliability fluctuates wildly with its first 5 observations. Unfairly penalizes statistical noise.
- **Reasonable range**: `α₀+β₀ ∈ [10, 50]`, with prior mean `∈ [0.85, 0.97]`. **[TO CALIBRATE]**

#### Forgetting factor `ρ` choice

Linked to the effective half-life `t_½ = log(2) / log(1/ρ)` (in time steps). An observation made `h` steps before counts as `ρ^h` of a current observation.

Default proposal: **half-life `t_½ = 60` validations**, i.e. `ρ = 2^(-1/60) ≈ 0.9885`. Reasonable range: `t_½ ∈ [20, 200]` validations. **[TO CALIBRATE]**

#### Properties

- **Change detection**: if the agent suddenly switches from rate `p₁` to `p₂`, `f̂_i` converges toward `p₂` in `O(t_½)` time steps.
- **Intrinsic decay by inactivity**: an inactive agent sees its count mass converge toward `(α₀, β₀)`, so `f̂_i → 0.95` (the prior). This is desirable behavior: an agent that does not validate does not deserve an extreme `f̂` in either direction.
- **Coherence with the target described** in [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md): inactivity decay is carried by the same formula as the update, without ad-hoc term.

#### Vulnerability: initial farming window

With `α₀=19, β₀=1`, a new agent starts at `f̂=0.95` during its first ~20 validations, regardless of its actual behavior. A malicious Sybil can therefore capture `M(0.95, d) · k · R(t)` during this window without having proven its reliability.

**Planned mitigation**: dedicated honeypots over the first `n_init` validations of a new agent, where the correct verdict is objectively known by the protocol. See [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) §"Path A — PoUW from zero" → "Planned mitigation: cold-start dedicated honeypots".

### A.2 `f̂` global, not conditioned by difficulty `d` (deliberate choice)

An alternative formalization would have estimated `f̂(d)` as a function of difficulty (e.g. `f̂_easy, f̂_hard` separately, or a Bayesian logistic regression on `d`). **We retain the global option** — a single `f̂_i(t)` independent of `d` — for three reasons:

1. **Structural anti-cherry-picking**: if `f̂` were conditioned by `d`, a cherry-picker could optimize `f̂_easy ≈ 1` without penalty on `f̂_hard` (which it never computes). With a global `f̂`, refusing difficult tasks brings nothing: its global reliability remains what it will have on its easy tasks. Difficulty discrimination is done **on the reward side** via `M(f, d)`, not on the measurement side.
2. **Statistical simplicity and data budget**: conditioning `f̂` by `d` requires stratifying observations by `d` bins, which reduces the number of effective observations per bin and slows convergence. At steady state, `f̂_global` converges in `O(t_½)` steps, segmented `f̂(d)` in several times more.
3. **`d`-dependent modulation moved to `M`**: increased tolerance to errors on difficult tasks is carried by the sliding threshold `f₀(d) = f₀_max − δ·d` of the multiplier (see §C). This construction is more readable and more calibratable than two correlated estimators.

**Assumed consequence**: an agent that only did easy tasks with `f̂ = 0.95` is treated the same way as an agent that did difficult tasks with `f̂ = 0.95`. The reward difference is carried by the mean `d` they encounter and by the `(1+γ·d)` bonus. Calibration must ensure that this mean effectively degrades the cherry-picker (cf. note added in [`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) §"Attack 5").

### A.3 `f̂_all-time`: auditable archive, off operational path

A Beta-Binomial **all-time** estimator (naive conjugate aggregation without forgetting):

```
f̂_all-time,i = (α₀ + s_i) / (α₀ + β₀ + n_i)
```

is **computable on demand** from on-chain history, and constitutes an **auditable archive** of an agent's cumulative performance over its entire career. It is **not an input of the operational protocol** (which only uses `f̂` from §A.1) — it serves only for ex-post audits, analysis tools, or production of public dashboards.

This separation has two virtues:

- The operational estimator `f̂` reflects **present** reliability (anti-patient-Sybil, anti-undetected-behavior-change).
- The archive estimator `f̂_all-time` reflects **cumulative** reliability (useful for transparency and human judgments).

No calibration is necessary for `f̂_all-time`: it is deterministic from history.

---

## B. Emergent difficulty `d`

### B.1 Definition from votes [ACQUIRED, formula TO ARBITRATE]

The difficulty `d_t ∈ [0, 1]` of a task is defined **a posteriori** from the dispersion of votes of validators selected on this task. No actor declares the difficulty; it **emerges** from data.

Let `N_t` be the number of validators that voted on task `t`. For binary votes `v_{i,t} ∈ {0,1}`:

```
ŝ_t = (1/N_t) · Σ_i v_{i,t}    (empirical proportion of "1" votes)
```

#### Bayesian smoothing (cold-start on d)

When `N_t` is small (3 to 5 validators), `ŝ_t` is very noisy. We smooth by a symmetric Dirichlet prior `Dir(γ, γ)` (or Beta(γ, γ)):

```
p̂_t = (γ + Σ_i v_{i,t}) / (2γ + N_t)
```

**Default**: `γ = 1` (uniform prior, Laplace smoothing). Range: `γ ∈ [0.5, 2]`. **[TO CALIBRATE]**

### B.2 Retained formula: normalized Shannon entropy

```
d_t = H(p̂_t) / log K
```

with `H(p̂) = −Σ_k p̂_k · log p̂_k` and `K` the number of possible verdicts (2 for the binary case).

For `K = 2`:

```
d_t = (−p̂_t · log₂ p̂_t − (1−p̂_t) · log₂(1−p̂_t))
```

Range: `d_t ∈ [0, 1]`. `d_t = 0` ↔ perfect consensus. `d_t = 1` ↔ uniform.

Justification:
- **Direct generalization to `K > 2` verdicts** ("compliant / partial / non-compliant").
- **Differentiable everywhere on `(0, 1)^K`**.
- **Clean theoretical link** with information theory (information gain provided by resolving the task).

Two alternatives (`1 − |2p̂ − 1|`, `4·p̂·(1−p̂)`) are monotonic with respect to entropy for `K = 2`; for binary votes, their choice only affects the exact form of `M(f, d)` at fixed threshold and slope, not the task difficulty ordering. See notebook [`02-exploration.ipynb`](02-exploration.ipynb) §6 (annex) for a visual comparison.

### B.3 Retroactive reward

`d_t` being defined ex-post, the effective reward `M(f̂, d_t) · R_acc · k · R(t)` (cf. §C.0 for the full v0.4 formula) can only be computed **after vote aggregation** on task `t`. Retained choice: **retroactive reward** — the validator receives its compensation in MonAI once the task is closed and `d_t` is computed.

Consequences:
- Issuance latency: a validator cannot count on immediate compensation, there is a delay (on the order of task closing time).
- No need for a predictive difficulty model `d̂_t` (option that would have required a task classification system not in the current design).
- Consistency with the general PoUW mechanism: reward is conditional on validation, not on submission.

---

## C. Multiplier `M(f, d)` — default sigmoid

### C.0 Full PoUW reward formula [v0.5]

```
reward_PoUW(task t, validator i)
    = G(f̂_i, d_t) · R_acc,i · min(cap_primes, (1 + γ·d_t) · P(t, task)) · k · R(t)
```

where:

- `G(f̂_i, d_t) = σ(k_sig · (f̂ − f₀(d)))`: **reliability sigmoid** (cf. §C.1), ∈ `[0, 1]`. Reliability penalty (anti-statistical-cheating).
- `R_acc,i ∈ [0, 1]`: **EWMA acceptance rate** of the validator (cf. §D.3). Validator-side refusal penalty (individual anti-cherry-picking). **Added in v0.4**.
- `(1 + γ·d_t)`: **objective difficulty bonus** (cf. §C.1). Rewards taking on difficult tasks, measured ex-post by vote dispersion. ∈ `[1, 1 + γ·d_max]` (typically `[1, 4]` with `γ = 3, d_max = 1`).
- `P(t, task) ∈ [1.0, P_max]`: **automatic demand bonus** (cf. §F). Rewards picking up neglected tasks, measured by refusal + waiting time. **Added in v0.5**.
- `cap_primes`: **joint cap of both bonuses** (difficulty × demand). Default `6.0`. **[TO CALIBRATE, range `[4, 10]`]**. Explicit bound to avoid extreme issuance spikes: even though `(1 + γ·d) · P` can theoretically reach `4 · 2.5 = 10`, the effective cumulative is capped at `6.0`.
- `k · R(t)`: base issuance, fraction of remaining-to-mine (cf. [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md)).

**Four multiplicative economic factors**. The total effective multiplier `reward / (k·R(t))` is bounded by `1 · 1 · cap_primes = cap_primes = 6.0` by default.

> **Notation note**: relative to v0.4, the formula `M(f, d) = G(f, d) · (1 + γ·d)` is now **broken out** in the reward formula to make the joint cap explicit. `G(f, d)` is the pure sigmoid; the difficulty bonus `(1 + γ·d)` is pulled out to be combined with `P` under the cap. Equivalent convention for computation; new notation for cap readability.

#### Historical justification of the `R_acc` multiplier addition [from v3 grid calibration]

v0.3 introduced `R_acc` only as a **component of aggregated R** (with `w_acc ≤ 0.30`). The v2 grid search (cf. [`../simulateur/notebooks/calibration_A_v2.ipynb`](../simulateur/notebooks/calibration_A_v2.ipynb)) empirically demonstrated that this effect is **too diluted**: the R difference between cherry-picker (R_acc≈0.61) and honest (R_acc=1.0) is only ~0.10 absolute, which creates only ~13% difference in selection probability. Insufficient to flip the gain hierarchy.

Theoretical computation in §6 of the v2 notebook shows that the cherry-picker's **effective participation** would need to be divided by ~3 vs honest for the M/C ratio to exceed 1. The most direct way to reach this target: **directly multiply the unit compensation** by `R_acc`.

Effect of `R_acc` as multiplier, at stationary regime:
- Honest: reward × 1.00 → 100% reward.
- Cherry-picker: reward × 0.61 → 61% reward per accepted validation.
- Mediocre: reward × 1.00 → 100%.
- Naive Sybil: reward × 1.00, but `M(f̂≈0.55, d) ≈ 0` → always produces ≈ 0.

The effect is **immediate and readable**: refusing a task reduces the compensation of all future validations proportionally to the average refusal rate.

#### Consequence on `w_acc` in aggregated R [v0.4]

`R_acc` remains in the aggregated score `R` (§D) with a **symbolic** weight `w_acc = 0.05` (vs 0.20 in v0.3). Justification: the main economic penalty is carried by the reward multiplier; keeping `w_acc` non-zero remains useful for rate-limiting and mempool priority (an agent that refuses much also sees its global reputation slightly drop, hence less transactional budget), but it is a secondary effect.

No double penalty: the R drop from `w_acc·R_acc` is on the order of 0.02 absolute for the cherry-picker (vs 0.10 in v0.3), thus negligible vs dividing unit compensation by 0.61.

#### Justification of the `P(t, task)` addition [from v3 grid calibration]

The v3 grid search (cf. [`../simulateur/notebooks/calibration_A_v3.ipynb`](../simulateur/notebooks/calibration_A_v3.ipynb)) demonstrated that `G(f, d) · (1 + γ·d) · R_acc` alone **does not allow** reaching the `H/C > 5` target. Maximum observed `~3.09`. Diagnosis: the cherry-picker only pays its `R_acc ≈ 0.61` penalty on the easy tasks it takes, but the tasks it refuses are picked up by other validators at the same price — its refusal has no systemic consequence on the compensation of refused tasks.

The **automatic demand bonus** `P(t, task)` introduces a direct economic signal: when a cherry-picker refuses a task, it becomes mechanically more profitable for the next validator. Consequence:

- Honest validators capture a bonus on tasks refused by cherry-pickers.
- The honest/cherry-picker gain differential widens.
- Average issuance is slightly higher at stationary regime (`P_mean ≈ 1 + ε`, anticipation `ε ∈ [0.05, 0.15]`).

Full details and formulas: see §F.

#### Articulation of the four multipliers

| Factor | Measure | Economic target | Range |
|---|---|---|---|
| `G(f, d)` | Reliability sigmoid (modulated by objective difficulty) | Anti-statistical-cheating (anti-biased-random, anti-fraud) | `[0, 1]` |
| `R_acc` | EWMA acceptance rate of validator | Anti-cherry-picking on **validator** side | `[0, 1]` |
| `(1 + γ·d)` | Objective difficulty (vote dispersion) | Rewards taking on difficult tasks | `[1, 1 + γ·d_max]` |
| `P(t, task)` | Refusal + waiting time on the task | Rewards picking up neglected tasks on **task** side | `[1, P_max]` |

The joint cap `min(cap_primes, (1 + γ·d) · P)` bounds the cumulative of the two bonuses to avoid extreme issuance spikes.

`(1 + γ·d)` and `P` act on two different signals: the objective difficulty of the task (measured ex-post) vs the rarity of validators willing to take it (measured by refusal + time). A task that is difficult **and** neglected legitimately accumulates both bonuses — this is exactly what is desired — but the cumulative is bounded for economic stability.

### Structural constraints

- `M(f, d) ∈ [0, M_max]` bounded.
- `∂M/∂f ≥ 0` everywhere.
- `∂M/∂d ≥ 0` at fixed `f`.
- **Increased tolerance to errors on difficult tasks**: for `f < 0.95`, `M(f, d=0.9) − M(f, d=0.1)` clearly positive.
- At `f = 1`, `M = M_max(d)`; at `f → 0`, `M → 0` (with a threshold below which `M ≈ 0`).

We factorize

```
M(f, d) = G(f, d) · (1 + γ · d)
```

with `G(f, d) ∈ [0, 1]` the reliability penalty (modulated by `d`) and `(1 + γ · d)` the pure difficulty bonus. **Default `γ = 1`** (maximally difficult task pays 2× trivial task at identical reliability). Range: `γ ∈ [0.5, 3]`. **[TO CALIBRATE]**

> Note: the `(1+γ·d)` bonus makes each difficult task more profitable per unit, but does not constrain the task **flow**. Defense against cherry-picking additionally requires a **minimum difficult/easy payment ratio** at the system level (cf. note added in [`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) §"Attack 5"). `γ` and the ratio are to calibrate together.

### C.1 Retained default form: sigmoid with sliding threshold

```
G(f, d) = σ(k · (f − f₀(d)))
σ(x) = 1 / (1 + exp(−x))
f₀(d) = f₀_max − δ · d
```

Parameters (defaults retained after v3 calibration, May 2026):

| Symbol | Description | Default | Range | Status |
|---|---|---|---|---|
| `f₀_max` | Sigmoid threshold on easy tasks (`d=0`) | `0.85` | `[0.80, 0.95]` | **[CALIBRATED v3]** |
| `δ` | Threshold slide with difficulty | `0.10` | `[0.05, 0.20]` | **[TO CALIBRATE fine]** |
| `k` | Sigmoid slope | `40` | `[20, 80]` | **[CALIBRATED v3]** |
| `γ` | Difficulty bonus `(1+γd)` | `3.0` | `[0.5, 3]` | **[CALIBRATED v3]** |

#### Argument for the choice

Compared to the two other candidate functional forms in annex (quadratic exponential, power law), the sigmoid wins on three criteria that weigh more than the raw penalty inflicted on biased random:

1. **Threshold interpretability**. `f₀(d)` is the reliability above which the agent captures half of the maximum reward; this quantity has direct meaning for communicating the protocol's behavior, calibrating in simulation, and reasoning about incentives. The quadratic exponential form, which decays continuously without plateau, has no readable analog.
2. **Differentiability everywhere**. `∂G/∂f` and `∂G/∂d` are defined, bounded and smooth over the entire domain. Operational advantage for empirical calibration (gradient descent on cost functions in simulation, automatic adjustment) and sensitivity analysis. The power law, with hard cutoff, is non-differentiable at `f = f_min(d)` and gives brutal calibration behaviors around the threshold.
3. **Acceptable compromise on biased random penalty**. The §3 notebook simulation shows that the sigmoid does not crush biased random as harshly as the power law (`M(0.80, d=0.1)` ≈ 0.018 vs strict 0), but remains dominated by honest by a factor ~9. This gap is sufficient at steady state; and the sigmoid leaves marginally more air for newcomers on statistical noise, which is consistent with the inclusivity philosophy (see [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md) §"Task stratification").

If empirical calibration in phase 0 (cf. [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md)) reveals that no sigmoid parameter set simultaneously satisfies anti-attack and anti-throttling constraints, the two alternative candidates (annex C.A and C.B) are to be reconsidered.

#### Numerical properties of the default sigmoid

With defaults retained after v3 calibration (`f₀_max = 0.85`, `δ = 0.10`, `k = 40`, `γ = 3`):

- `M(0.99, 0) ≈ 0.99` (excellent, easy task).
- `M(0.99, 1) ≈ 3.96` (excellent, maximally difficult task, strong difficulty bonus).
- `M(0.80, 0) ≈ 0.12` (biased random, easy task: crushed but not totally zero).
- `M(0.80, 1) ≈ 2.0` (biased random, difficult task: increased tolerance, but `d=1` task draw is rare).
- `M(0.85, 0) = 0.5` (inflection point: half of max reward at reliability threshold, easy task).
- `M(0.95, 0) ≈ 0.98` (correct on easy task).

Transition width: `Δf ≈ 4/k = 0.10`, so `G` goes from ≈ 0.12 to ≈ 0.88 over `[f₀(d) − 0.05, f₀(d) + 0.05]`.

**Choice of `γ = 3`**: the difficulty bonus multiplies the reward by up to 4× on the most difficult tasks (`d = 1`). Calibrated v3 to strongly incentivize taking difficult tasks, in complement to the `R_acc` multiplier that penalizes refusals.

### C.2 Alternative forms — annex

The two forms below are kept in case empirical calibration invalidates the sigmoid. They are not the default.

#### C.A — Quadratic exponential

```
G(f, d) = exp(−λ(d) · (1 − f)²)
λ(d) = λ₀ · (1 − μ · d)
```

Parameters: `λ₀` ∈ `[50, 300]` (default `100`), `μ` ∈ `[0.5, 1]` (default `0.8`).

Advantages: clean statistical link with a Gaussian log-likelihood, only two parameters, smooth everywhere.
Disadvantages: no interpretable threshold, `G_b` decreases continuously without marked low plateau.

#### C.B — Power law with hard threshold

```
G(f, d) = max(0, (f − f_min(d)) / (1 − f_min(d)))^p
f_min(d) = f_min_max − δ · d
```

Parameters: `f_min_max` ∈ `[0.70, 0.85]` (default `0.80`), `δ` ∈ `[0.05, 0.20]` (default `0.10`), `p` ∈ `[1, 4]` (default `2`).

Advantages: very readable hard cutoff ("below such threshold, M = 0 strictly").
Disadvantages: not differentiable at `f_min(d)`, potentially unstable calibration behavior around the threshold.

---

## D. Reputation score `R`

### D.1 Decomposition into seven components [ACQUIRED]

Following [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) §"Sources of reputation", **extended by the `R_acc` component (cf. D.6)**:

```
R_i(t) = w_C  · R_C,i(t)
       + w_V  · R_V,i(t)
       + w_F  · R_F,i(t)
       + w_A  · R_A,i(t)
       + w_Δ  · R_Δ,i(t)
       + w_S  · R_S,i(t)
       + w_acc · R_acc,i(t)
```

with `Σ w_• = 1` and each component normalized in `[0, 1]`.

| Component | Source | Sym |
|---|---|---|
| Honored contracts | delivers in accordance with signed contracts | `R_C` |
| **Correct validations (= operational `f̂`)** | identical to `f̂_i(t)` from A.1 | `R_V` |
| Confirmed fraud detection | reporting a real fraud | `R_F` |
| Activity-weighted seniority | lasting presence + activity | `R_A` |
| Counterparty diversity | dispersion of the transaction graph | `R_Δ` |
| Referral performance | successful sponsorship | `R_S` |
| **Acceptance rate of selections** | frequency at which the agent honors protocol selections | `R_acc` |

### D.2 EWMA decay [ACQUIRED, half-lives TO CALIBRATE]

**Structural choice**: each component (except `R_V` and `R_A`, see below) is an **exponentially weighted moving average (EWMA)** with its own half-life `τ_i`. At each contributing event `e_t` to component `R_•` (with intensity `x_t ∈ [0, 1]`):

```
R_•,i(t) ← (1 − η_•) · R_•,i(t⁻) + η_• · x_t
```

where `η_• = 1 − exp(−Δt / τ_•)` and `Δt` is the interval elapsed since the last update. Between two events:

```
R_•,i(t + Δt) = R_•,i(t) · exp(−Δt / τ_•)
```

This construction simultaneously achieves:

1. **Decay by inactivity** intrinsic (no ad-hoc term).
2. **Automatic bounding in `[0, 1]`** if the `x_t ∈ [0, 1]`.
3. **Stationary convergence**: an agent that constantly validates at intensity `x̄` converges toward `R_• → x̄`.
4. **Coherence with the target described** in [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) (hyperactive `R≥0.85`, inactive 6 months `R≤0.30`).

### D.3 Explicit definition of the six components

#### `R_C` — honored contracts

At each contract signed by `i` that resolves:

```
x_t = 1 if contract honored in terms
    = 0 if contract dishonored
```

Default half-life `τ_C = 180 days`. Range `[60, 365]`. **[TO CALIBRATE]**

#### `R_V` — correct validations (= operational `f̂_i(t)`)

**Explicit fusion**: `R_V,i(t) ≡ f̂_i(t)` as defined in A.1. A single operational quantity in the protocol, serving simultaneously:

- as input to `M(f̂, d)` to modulate immediate PoUW reward;
- as "validations" component of reputation `R`.

No additional half-life or difficulty weighting at this level: difficulty weighting is already managed by `M(f, d)` during PoUW compensation. At the reputation score level, it's raw reliability (recent, exponentially decaying via `ρ` of A.1) that counts.

> Consequence for calibration: `τ_V` is no longer an independent parameter. It equals the effective half-life of `f̂` (`t_½ = 60 days` by default, i.e. `ρ ≈ 0.9885` per validation if we index time by validation). See A.1.

#### `R_F` — confirmed fraud detection

At each signaling by `i` retroactively confirmed as fraud:

```
x_t = 1
```

False alarms penalize indirectly via `R_V` (the unconfirmed "fraud" vote counts as error).

Long default half-life `τ_F = 365 days`. **[TO CALIBRATE]**

#### `R_A` — activity-weighted seniority

```
R_A,i(t) = tanh(age_eff_i(t) / T_A)
```

with `age_eff_i(t)` the agent's **effective age**: time during which the agent has been active beyond a minimum threshold:

```
age_eff_i(t + Δt) = age_eff_i(t) + Δt · 1[activity_i(t) > seuil_act]
```

`tanh` bounds in `[0, 1[`. Default `T_A = 2 years` (at `age_eff = 2 years`, `R_A ≈ 0.76`; at 6 years, `R_A ≈ 0.99`). Default threshold: 1 validation per week. **[TO CALIBRATE]**

> `R_A` has no own exponential decay: decay is carried by the condition `activity_i(t) < seuil_act` that freezes the effective age. Deliberate choice: seniority is not "forgotten" as long as the agent remains minimally active.

#### `R_Δ` — counterparty diversity

Let `H_Δ,i(t)` be the Shannon entropy of the distribution of `i`'s counterparties over its recent activity window:

```
H_Δ,i(t) = −Σ_j p_{ij}(t) · log p_{ij}(t)
```

where `p_{ij}(t)` is the fraction of `i`'s transactions performed with `j` (computed via EWMA over volumes per counterparty, half-life `τ_Δ` default `180 days`).

Normalization:

```
R_Δ,i(t) = H_Δ,i(t) / log(min(N_i(t), N_max))
```

`N_max` default `1000`. **[TO CALIBRATE]**

> **Acknowledged gap, to address in v0.6**: in line with the universal weighting principle ([`../design/01-vision-et-idee-generale.md`](../design/01-vision-et-idee-generale.md) §"Universal weighting by reputation"), `R_Δ` should ideally weight counterparties by their reputation (`p_ij` computed via tx volume × `R_j` rather than volume alone). The current formula counts each counterparty proportionally to its volume without considering its reputation, which is an exception to the principle. Modification deferred to v0.6 (full audit of R components) — the change touches the immutable core and requires coordinated recalibration.

#### `R_S` — referral performance

At each referral that `i` has sponsored that closes its sponsorship window successfully:

```
x_t = R_filleul(t) (at close)
```

(0 otherwise). Half-life `τ_S = 365 days`. **[TO CALIBRATE]**

#### `R_acc` — acceptance rate of selections [ACQUIRED, added v0.3]

Each time agent `i` is **selected by the protocol** as validator of a task (whether a normal task or a honeypot, whether it accepts or refuses):

```
x_t = 1 if the agent accepts (votes)
    = 0 if the agent refuses (does not emit a vote)
```

EWMA update per §D.2 with half-life `τ_acc`.

Default half-life `τ_acc = 60 ticks`, aligned with that of operational `f̂` (§A.1) — the temporal coherence between reliability tracking and acceptance tracking simplifies interpretation. **[TO CALIBRATE]** Range: `[20, 200]`.

##### Origin and motivation [from v1 grid calibration]

This component comes from an empirical calibration discovery (cf. `../simulateur/notebooks/calibration_A.ipynb` v1). The initial grid search on `(f0_max, k_sigmoid, γ)` found **no combination** simultaneously satisfying:
- `honest / cherry-picker ratio > 5`
- `mediocre / cherry-picker ratio > 1`

Identified structural cause: the cherry-picker (which refuses tasks at `θ > 0.3`) keeps a high `f̂` and captures a large share of rewards while avoiding the effort of difficult tasks. No choice of `(f0_max, k_sigmoid, γ)` can compensate for this structural advantage **without** breaking the anti-Sybil defense.

`R_acc` is the **structural response**: an agent that systematically refuses selections is penalized on its global reputation, which:
- Reduces its future selection probability (fewer validations → less reward).
- Reduces its transaction rate-limit.
- Aligns incentive: refusing becomes economically costly, not just neutral.

This modification is **conservative** with respect to founding principles: no admin key, the computation is purely statistical on-chain (each agent knows how many times it was selected and how many times it voted).

##### Articulation with attack 5 (cherry-picking)

`R_acc` complements the defense of [`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) §"Attack 5". The precision already added ("minimum difficult/easy payment ratio") remains relevant as complementary defense; `R_acc` acts upstream on selection rather than downstream on compensation.

##### Residual vulnerability: naive Sybil

A Sybil that accepts all selections will have `R_acc ≈ 1.0`, so R artificially boosted. **This is harmless** because `R_V = f̂` remains very low for the Sybil (≈ 0.55), and the `R_V` component (weight `w_V = 0.25`) dominates in the aggregated R computation. Verified empirically in scenario B of the simulator.

### D.4 Default weightings `w_•` [TO CALIBRATE]

With the addition of `R_acc`, we **renormalize the six existing weights** by `(1 − w_acc)` to maintain `Σ w_• = 1`. This renormalization preserves the ratios between the six original components — no change in relative balance.

| Component | Original weight | Effective weight v0.4 (`w_acc=0.05`) |
|---|---:|---:|
| `w_C` (honored contracts) | 0.35 | 0.3325 |
| `w_V` (correct validations = `f̂`) | 0.25 | 0.2375 |
| `w_F` (fraud detection) | 0.10 | 0.0950 |
| `w_A` (seniority×activity) | 0.10 | 0.0950 |
| `w_Δ` (diversity) | 0.10 | 0.0950 |
| `w_S` (sponsorship) | 0.10 | 0.0950 |
| `w_acc` (acceptance) | — | **0.05** |

**`w_acc` default: 0.05** (symbolic role for rate-limiting since v0.4). Proposed range: `[0.02, 0.10]`. **[TO CALIBRATE]**

> **Historical evolution of `w_acc`**:
> - v0.2 — `R_acc` absent.
> - v0.3 — `w_acc = 0.20` (R_acc in aggregated R). Insufficient — see v2 grid.
> - v0.4 (current) — symbolic `w_acc = 0.05`. The main penalty is carried by the direct multiplier in `reward_PoUW` (cf. §C.0).

`R_C` weighted the highest in line with [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) ("main weight"). Reasonable range for `w_C` (before renormalization): `[0.30, 0.50]`.

### D.5 Expected behavior target (calibration verification)

- Hyperactive (≥ 5 validations/day, weekly contracts) at stationary regime: `R ≥ 0.85`.
- Moderately active (1 validation/day, monthly contracts): `R ∈ [0.50, 0.75]`.
- Inactive for 6 months (started from `R = 0.9`): `R ≤ 0.30`.

---

## E. Complaint score [ACQUIRED — v0.5]

### E.1 Definition of a complaint [ACQUIRED]

A **complaint** is the formal report by an agent `p` (complainant) that an agent `X` has not honored a contract linking them. Characteristics:

- A complaint is **attached to an existing on-chain contract** (referenced by its hash). No free notation mechanism — every complaint references a precise contract that can be audited.
- An agent cannot complain about a contract to which it was not a party. This eliminates the avenue "complaint from a Sybil against an unknown agent".
- A single complaint per `(complainant, contract)` pair. Successive complaints by the same complainant on the same contract count once.

### E.2 Score formula [ACQUIRED]

For an agent `X` at time `t`:

```
                Σ_p R_p(t_p) · ω(t − t_p)
score_plainte(X, t) = ─────────────────────────────────────
                Σ_c R_c(t_c) · ω(t − t_c)
```

where:

- `R_p(t_p)` = complainant `p`'s reputation at the time `t_p` of complaint submission.
- `R_c(t_c)` = reputation of a counterparty `c` of `X` at the time `t_c` of the transaction that linked them.
- `ω(Δt) = exp(−Δt / τ_plainte)`: EWMA decay, half-life `τ_plainte`.
- The numerator sum is over the set of valid complaints against `X`.
- The denominator sum is over the set of distinct counterparties of `X` (complainants included or not, doesn't matter).

### E.3 Interpretation [ACQUIRED]

- `score_plainte = 0` → no complaint, or all complaints have decayed to 0 by EWMA.
- `score_plainte = 1` → all weighted counterparties of `X` have filed a complaint.
- Displayed as **percentage** on the identity card ([`04-carte-identite.md`](04-carte-identite.md) §B.4).

**Informational character** [ACQUIRED]: the complaint score is **not** directly reinjected into aggregated `R`. The drop in `R_C` for unhonored contract already manages the economic penalty by the main mechanism (cf. §D.3). The complaint score serves as **public information** that counterparties consult to decide whether to transact with `X`.

### E.4 Anti-manipulation by Sybils [ACQUIRED]

In line with the universal weighting principle (cf. [`../design/01-vision-et-idee-generale.md`](../design/01-vision-et-idee-generale.md)):

- A complaint from a Sybil with `R ≈ 0` has negligible numerical weight in the numerator.
- A Sybil cannot file a complaint without having transacted with `X` (filter §E.1).
- The attack cost by coordinated complaints is treated in [`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) **Attack 10**.

### E.5 Link with `R_C` and `R_F` [ACQUIRED]

- **With `R_C`**: if the underlying contract of the complaint is confirmed as unhonored (validator consensus), `X`'s `R_C` drops automatically (mechanism independent of complaint filing). The complaint filing has no direct effect on `R_C`; it is the confirmation of non-honor that does it. So two agents can fail to complain while a contract is unhonored, and `R_C` will drop anyway by other mechanisms (validator consensus monitoring execution).
- **With `R_F`**: if the complaint is confirmed as valid (the contract effectively was not honored), the complainant gains `R_F`. If the complaint is confirmed as invalid (the contract was effectively honored, abusive complaint), the complainant **loses** `R_F` (or takes a direct penalty on `R`). Details of the confirmation mechanism to formalize jointly with the dispute spec (out of v0.5 session 1 scope).

### E.6 Half-life `τ_plainte` [TO CALIBRATE]

Default half-life `τ_plainte = 180 days`. Reasonable range `[60, 730]`. **[TO CALIBRATE]**

Justification of default: long enough for a recent complaint to remain visible for several months (counterparties have time to take it into account), short enough that an agent can "rehabilitate" its score by avoiding bad behavior for about a year.

### E.7 Edge cases [ACQUIRED]

- `Σ R_c · ω = 0` (agent with no counterparties in recent window): undefined score, exposed as `n/a` on the card. No division by zero.
- Complainant whose own `R_p` drops after filing: the complaint keeps its initial weighting `R_p(t_p)`. The reputation at the moment of filing is frozen. This prevents a complainant that gets penalized later from seeing its historical complaints retroactively discredited.
- Complainant that "disappears" (long inactivity, `R` decaying to 0): its complaint decays normally via `ω(Δt)` but the weighting `R_p(t_p)` remains frozen at the value of filing.

---

## F. Automatic demand bonus [ACQUIRED — v0.5]

### F.1 Principle [ACQUIRED]

Each PoUW task published in the mempool carries a **demand bonus** `P(t, task) ∈ [1.0, P_max]` that rises with time if the task is not validated. This bonus multiplies the compensation of the validator that finally accepts the task, in line with the §C.0 formula:

```
reward = G(f, d) · R_acc · min(cap_primes, (1 + γ·d) · P(t, task)) · k · R(t)
```

**Initialization**: `P(t_publication, task) = 1.0`. A task taken immediately by a validator carries no bonus — it is the base value.

**Individual ceiling**: `P_max = 2.5` by default. **[TO CALIBRATE, range `[2.0, 3.0]`]** Guarantees that a task never pays more than `2.5 ×` the base via this mechanism.

**Joint cap** (with `(1 + γ·d)`): `cap_primes = 6.0` by default. **[TO CALIBRATE, range `[4.0, 10.0]`]** Explicit bound to avoid extreme issuance spikes: even though `(1 + γ·d) · P` could theoretically reach `4 · 2.5 = 10`, the effective cumulative is capped at `6.0`.

### F.2 Rise mechanics by refusal [ACQUIRED]

If a protocol-selected validator **refuses** the task (explicit cherry-picking), the bonus rises:

```
P_new = min(P_max, P_old · (1 + δ_refus))
```

With `δ_refus = 0.05` by default. **[TO CALIBRATE, range `[0.02, 0.10]`]** Each refusal increases the bonus by 5%.

At successive refusals, the trajectory is `P_refus(n_refus) = (1 + δ_refus)^(n_refus)`, capped at `P_max`. With defaults, `P_max` is reached after `⌈log(2.5) / log(1.05)⌉ = 19` successive refusals.

### F.3 Rise mechanics by waiting time [ACQUIRED]

If a task remains in the mempool without being validated beyond a delay `T_attente`, the bonus rises at each additional tick:

```
At each tick beyond T_attente:
    P_new = min(P_max, P_old · (1 + δ_temps))
```

With `T_attente = 5 ticks` by default **[TO CALIBRATE, range `[1, 30]`]** and `δ_temps = 0.01` per tick beyond **[TO CALIBRATE, range `[0.005, 0.05]`]**.

At elapsed time `Δt = t − (t_publication + T_attente)` (with `Δt ≥ 0`), the trajectory is `P_temps(Δt) = (1 + δ_temps)^Δt` (compound multiplicative), capped at `P_max`. With defaults, `P_max` is reached after `⌈log(2.5) / log(1.01)⌉ = 92` ticks beyond `T_attente`.

### F.4 Composition of both mechanics [ACQUIRED]

To avoid double accumulation (pathological case where a task would be both refused and remained long in waiting), the effective bonus is the **max** of the two hypothetical trajectories:

```
P(t, task) = min(P_max, max(P_refus(n_refus), P_temps(Δt)))
```

where:
- `n_refus` = number of refusals accumulated on the task up to `t`.
- `Δt = max(0, t − (t_publication + T_attente))`.

This is the value observed by the validator at the moment it accepts the task. Once the task is accepted, `P` is frozen for reward computation.

### F.5 Joint cap with difficulty bonus [ACQUIRED]

The cumulative `(1 + γ·d) · P` can theoretically reach `4 · 2.5 = 10` (with `γ = 3, d_max = 1, P_max = 2.5`). To bound issuance, we explicitly cap:

```
effective_bonus_multiplier = min(cap_primes, (1 + γ·d) · P)
```

with `cap_primes = 6.0` by default. **[TO CALIBRATE, range `[4.0, 10.0]`]**

Practical consequence:

- Average task (`d ≈ 0.3, γ = 3`) without bonus: `(1 + 0.9) · 1 = 1.9` → no cap.
- Difficult task taken immediately (`d = 1, γ = 3`): `4 · 1 = 4` → no cap.
- Difficult task refused 5 times (`d = 1, γ = 3, P = 1.05^5 = 1.28`): `4 · 1.28 = 5.12` → no cap.
- Maximum task refused 10 times (`d = 1, γ = 3, P = 1.05^10 = 1.63`): `4 · 1.63 = 6.52` → **capped at 6.0**.
- Maximum task at P ceiling (`d = 1, γ = 3, P = 2.5`): `4 · 2.5 = 10` → **capped at 6.0**.

The cap only activates for extreme cumulatives. To calibrate to balance incentive vs issuance mastery.

### F.6 Anti-manipulation safeguards [ACQUIRED]

#### F.6.1 The proposer cannot be validator of its own task

An agent that publishes a task in the mempool cannot be selected as validator of this task. Probabilistic selection weighted by `R` excludes the proposer by construction. Avoids self-payment with maximum bonus.

#### F.6.2 Refusals counted only on legitimate selections

Only refusals from **protocol-selected** validators count in `n_refus`. No "fake refusal" possible by an agent self-designating. The validator selection being probabilistic and R-weighted, an attacker cannot guarantee artificially raising `P` without cost (the `R_acc` of the refuser drops at each refusal, cf. §D.3, so the refusal cost is real for the attacker too).

#### F.6.3 Limit `N_max_refus` — impractical task

If `n_refus` reaches `N_max_refus = 10` by default **[TO CALIBRATE, range `[5, 20]`]**, the task is marked **impractical**:

- Removed from mempool.
- Notification sent to issuer.
- Accumulated bonus lost (no validator accepted, no one paid).

Prevents a squatter from raising `P_max` then taking its own task via an accomplice (already blocked by §F.6.1, but double safety).

### F.7 Issuance cost and self-regulation [TO CALIBRATE in v4 simulation]

The mechanism increases the average issuance per validated task. At stationary regime:

```
P_mean ≈ 1 + ε
```

where `ε` reflects refusal frequency and average waiting time. **Anticipation**: `ε ∈ [0.05, 0.15]` depending on the profile mix — to confirm in v4 simulation.

#### Consequence on the issuance curve

The overhead `ε · k · R(t)` per task slightly shifts the issuance trajectory toward a larger total supply at horizon. To preserve the target `S_∞`, the parameter `k` may have to be adjusted downward by a factor `1/(1 + ε)`.

**v0.5 note**: no `k` modification in this session. The joint calibration `(k, P_max, δ_refus, δ_temps, cap_primes)` is to be done in v4 simulation then arbitrated.

### F.8 Edge cases [ACQUIRED]

- **Task accepted immediately**: `P = 1.0`. No bonus. Nominal case.
- **Task refused several times then accepted**: `P` reflects refusals. The accepting validator captures the accumulated bonus. This is the desired behavior (risk-taking reward).
- **Task reaches `N_max_refus` before `P_max`**: task marked impractical, bonus lost. Issuer can re-submit after adjustment.
- **Task reaches `P_max` before `N_max_refus`**: bonus capped, the task remains in the mempool waiting for a validator. If `N_max_refus` is subsequently reached, the task becomes impractical.
- **Task accepted then validator defaults** (does not submit its vote): to formalize jointly with contract spec. Expected behavior: selection of a new validator, bonus continues to rise per §F.2-F.3.

### F.9 Articulation with `R_acc` (§D.3) [ACQUIRED]

The refusal that raises `P` is the **same refusal** that lowers the `R_acc` of the refusing validator. Both mechanisms are coordinated but distinct:

- `R_acc` acts on the **validator side** (multiplier on its own future rewards).
- `P` acts on the **task side** (multiplier on the refused task's reward for the next validator).
- No double-counting: the two signals carry different information ("this agent refuses often" vs "this task is neglected").

### F.10 Recap of §F parameters

| Symbol | Description | Default | Range | Status |
|---|---|---|---|---|
| `P_max` | Individual ceiling of bonus multiplier | 2.5 | `[2.0, 3.0]` | [TO CALIBRATE] |
| `δ_refus` | Multiplicative increment per refusal | 0.05 | `[0.02, 0.10]` | [TO CALIBRATE] |
| `T_attente` | Delay before time bonus kicks in (ticks) | 5 | `[1, 30]` | [TO CALIBRATE] |
| `δ_temps` | Multiplicative increment per tick beyond `T_attente` | 0.01 | `[0.005, 0.05]` | [TO CALIBRATE] |
| `N_max_refus` | Max refusals before impracticality | 10 | `[5, 20]` | [TO CALIBRATE] |
| `cap_primes` | Joint cap `(1+γd)·P` | 6.0 | `[4.0, 10.0]` | [TO CALIBRATE] |

---

## G. Registration mini-PoUW [ACQUIRED — v0.5, parameters TO CALIBRATE]

### G.1 Principle [ACQUIRED]

To create a MonAI identity, the agent must provide a **short and non-parallelizable proof of work** cryptographically bound to its public key. This proof is:

- **Computable in a few minutes** on standard compute (negligible for a legitimate agent).
- **Non-parallelizable** by construction (an attacker wanting to create 1 M Sybils must spend ~1 M × `T_pouw_inscription` of compute, even with a massive cluster).
- **Verifiable in O(1)** or `O(log T)` by other nodes (compact proof).
- **Bound to the public key**: no reuse possible between identities.

This construction replaces the strict individual rate-limit (`max_tx ∝ R`) that slowed newcomers. The mini-PoUW acts as a **computational entry barrier**, after which the agent can transact without friction under normal load (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Adaptive global rate limit").

### G.2 Formal constraints of the primitive [ACQUIRED]

The MonAI spec **does not impose a precise cryptographic family** but defines the constraints the primitive must satisfy. The exact choice is deferred to the **technical specification phase** (cf. [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) priorities 1 and 5).

Let `Mini_PoUW(x, T)` be the retained primitive, with:

```
input  : x = hash(agent_public_key ‖ dynamic_nonce)
output : y = Mini_PoUW(x, T)  +  proof π
duration  : T = T_pouw_inscription  (target 3 min on standard compute, range [1, 10] min for v0.6 calibration)
```

#### Constraints (all mandatory)

1. **Non-parallelizable**: `Mini_PoUW(x, T)` must take an incompressible minimum time `T`, even with a massive cluster. Doubling the hardware does not divide the time by 2.
2. **Cryptographic binding to public key**: `x` must include `hash(agent_public_key)`. A proof computed for key `A` cannot be reused for key `B`.
3. **Dynamic temporal binding**: `x` must include a `dynamic_nonce` derived from a recent block_hash. Prevents pre-computation before mainnet or before registration.
4. **Fast verification**: the verification `Verify(x, y, π)` must execute in `O(1)` or `O(log T)`, negligible for a full node or light client.
5. **No trusted setup** *preferred* (but acceptable if necessary according to the retained family).

#### Candidate families (to arbitrate in technical phase)

| Family | Non-parallelizable | Setup | Maturity |
|---|---|---|---|
| **Wesolowski VDF (2018)** | ✓ (sequential by construction) | No trusted setup | Well studied, existing libraries |
| **Pietrzak VDF (RSA squaring)** | ✓ | Trusted setup or class groups | Simple, but setup required |
| **MinRoot (recent succinct VDF)** | ✓ | No trusted setup | Still experimental |
| **Memory-hard hash (Argon2id, scrypt)** | partial (parallelizable against memory) | None | Mature but less anti-parallel |

**Recommended choice in phase 1**: VDF family (Wesolowski by default if no setup constraint). To confirm with Priority 1 decision (architecture).

### G.3 Proof format [ACQUIRED conceptually, technical OPEN]

```
registration_proof = {
    public_key : bytes,
    dynamic_nonce : bytes32 (= hash(reference_block)),
    reference_block : uint64,
    y : bytes (primitive output),
    π : bytes (short validity proof),
}
```

Anyone with a client can verify `Verify(hash(public_key ‖ dynamic_nonce), y, π) → bool` and accept or refuse registration in O(1) or O(log T).

### G.4 Dynamic nonce validity window [ACQUIRED, TO CALIBRATE]

The `reference_block` of the nonce must be recent — otherwise an attacker could pre-compute VDFs before mainnet to have a stock of Sybils ready to activate.

```
registration_valid ⟺ (current_block − reference_block) ≤ fenêtre_inscription
```

with `fenêtre_inscription = 100 blocks` by default. **[TO CALIBRATE, range `[10, 1000]`]**.

At ~6 seconds/block, 100 blocks ≈ 10 minutes. Sufficient for a legitimate agent to compute its proof calmly, too short for an attacker to pre-compute in bulk.

### G.5 Anti-circumvention safeguards [ACQUIRED]

#### G.5.1 No reuse between identities
The proof is bound to `hash(public_key)`. An attacker cannot reuse an existing identity's proof to create a new one.

#### G.5.2 Specialized hardware
An attacker could build an ASIC to accelerate computation. Mitigation: choice of a primitive whose minimum latency is bounded by physics (memory latency for memory-hard hash, sequential latency for VDF). To arbitrate in technical phase.

#### G.5.3 Mass registration via cloud
An attacker that pays cloud to do millions of registrations in parallel? Directly computable cost:
- 1 M registrations × 3 min × cost_cloud/min ≈ 1 M × 3 × $0.001 ≈ $3,000 (rough estimate).
- In practice, this amounts to 5,000 hours × CPU = 50,000 vCPU-min, i.e. about ~$5,000 on AWS Spot.

This is financially feasible by a state or very well-funded actor, but out of reach for an average attacker. And the cost is marginal for each new identity (no scale effect favoring the attacker). To compare to the marginal benefit of a new identity with R ≈ 0 — near zero due to universal R-weighting.

**Conclusion**: the barrier is sufficient to discourage massive Sybil while remaining accessible to a legitimate agent.

### G.6 Recap of §G

| Symbol | Description | Default | Range | Status |
|---|---|---|---|---|
| `T_pouw_inscription` | Mini-PoUW target duration | 3 min | `[1, 10]` min | [TO CALIBRATE] |
| `fenêtre_inscription` | Validity of `dynamic_nonce` (blocks) | 100 | `[10, 1000]` | [TO CALIBRATE] |
| Primitive family | Type of non-parallelizable computation | VDF (recommended) | — | [OPEN, technical phase] |

---

## Recap of parameters to calibrate

| Symbol | Section | Description | Default | Range | Method |
|---|---|---|---|---|---|
| `α₀, β₀` | A.1 | Beta-Binomial prior on `f` | `(19, 1)` | effective size `[10, 50]`, mean `[0.85, 0.97]` | Simulation: test initial farming |
| `ρ` (or `t_½`) | A.1 | Forgetting factor of `f̂` | `t_½ = 60 val.` | `t_½ ∈ [20, 200]` | Simulation: shift detection |
| `n_init` | A.1 | Cold-start dedicated honeypots | 20 | `[10, 50]` | See `../design/03-identite-et-reputation.md` |
| `γ_dirichlet` | B.1 | Cold-start smoothing of `p̂_t` | 1 | `[0.5, 2]` | Small jury analysis |
| `f₀_max` | C.1 | Sigmoid threshold easy tasks | 0.85 | `[0.80, 0.95]` | Simulation biased random (current calibration v4: 0.85) |
| `δ` | C.1 | Threshold slide with `d` | 0.10 | `[0.05, 0.20]` | Simulation difficult tasks |
| `k_sigmoid` | C.1 | Sigmoid slope | 40 | `[20, 80]` | Transition simulation (current calibration v4: 40) |
| `γ` (γ_d) | C | Difficulty bonus `(1+γ·d)` | 3.0 | `[0.5, 5.0]` | Simulation, joint with cherry-picking ratio in `../securite/05-...md` (current calibration v4: 3.0) |
| `τ_C` | D.3 | Contracts half-life | 180 d | `[60, 365]` | Behavioral target |
| `τ_F` | D.3 | Fraud half-life | 365 d | `[180, 730]` | Behavioral target |
| `T_A` | D.3 | Effective age scale | 2 years | `[1, 5]` | Behavioral target |
| `τ_S` | D.3 | Sponsorship half-life | 365 d | `[180, 730]` | Behavioral target |
| `τ_Δ` | D.3 | Diversity half-life | 180 d | `[60, 365]` | Behavioral target |
| `τ_acc` | D.3 | Acceptance half-life | 60 ticks | `[20, 200]` | Behavioral target |
| `seuil_act` | D.3 | Minimum activity threshold | 1 val./week | `[1/month, 1/day]` | Inclusivity target |
| `N_max` | D.3 | Diversity cap | 1000 | `[100, 10000]` | Heuristic |
| `w_C, w_V, w_F, w_A, w_Δ, w_S` | D.4 | Weights of 6 original components (before renormalization by `(1−w_acc)`) | (0.35, 0.25, 0.10, 0.10, 0.10, 0.10) | `w_C ∈ [0.30, 0.50]` | Simulation |
| `w_acc` | D.4 | Weight of acceptance component (R_acc as multiplier) | 0.05 | `[0.02, 0.10]` | Grid simulation v2/v3 (current calibration v4: 0.05) |
| `τ_plainte` | E.6 | EWMA half-life of complaints | 180 d | `[60, 730]` | Simulation, behavioral target |
| `P_max` | F.1 | Individual ceiling of demand bonus | 2.5 | `[2.0, 3.0]` | v4 simulation |
| `δ_refus` | F.2 | Multiplicative increment per refusal | 0.05 | `[0.02, 0.10]` | v4 simulation |
| `T_attente` | F.3 | Delay before time-based rise (ticks) | 5 | `[1, 30]` | v4 simulation |
| `δ_temps` | F.3 | Multiplicative increment per tick post-T_attente | 0.01 | `[0.005, 0.05]` | v4 simulation |
| `N_max_refus` | F.6.3 | Max refusals before impracticality | 10 | `[5, 20]` | v4 simulation |
| `cap_primes` | F.5 | Joint cap `(1+γd)·P` | 6.0 | `[4.0, 10.0]` | v4 simulation |
| `T_pouw_inscription` | G.2 | Mini-PoUW target duration | 3 min | `[1, 10]` min | v4 simulation + crypto benchmarks |
| `fenêtre_inscription` | G.4 | Dynamic nonce validity (blocks) | 100 | `[10, 1000]` | v4 simulation |
| Mini-PoUW family | G.2 | Type of non-parallelizable primitive | VDF (recommended) | — | Technical phase |

---

## Emerged questions and spec gaps

The arbitrations made in this v0.2 and the honeypots formalization ([`03-honeypots-retroactives.md`](03-honeypots-retroactives.md)) resolve the initial structuring questions. There remains one question deferred to v1+ and a few open questions within the honeypots document itself (cf. [`03-honeypots-retroactives.md`](03-honeypots-retroactives.md) §"Emerged questions").

### Q1 — Correlation between R components [TO RECONSIDER IN v1+]

`R_C, R_V, R_F` are strongly correlated in practice (an honest agent honors its contracts AND validates correctly). The current weighted sum is therefore partially redundant. A more correct formalization (implicit PCA, adaptive weighting that decays when components saturate) is conceivable, but it is not a v0 priority. To note for v1+.

---

## Status and next steps

- **Status**: mathematical draft v0.2. Sigmoid retained by default, `R_V = f̂` merged, global `f̂` not conditioned by `d`. Retroactive honeypot mechanism formalized separately in [`03-honeypots-retroactives.md`](03-honeypots-retroactives.md). No definitive value; everything remains calibratable.
