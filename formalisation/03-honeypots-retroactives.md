# 03 — Retroactive honeypots

> Status: draft v0.1, May 2026.
> Scope: mechanism by which the protocol detects false validations without depending exclusively on emergent consensus. Fills the specification gap signaled in Q1 of [`01-formules-mathematiques.md`](01-formules-mathematiques.md) (v0.2). Articulates the defense against attack 7 — consensus collusion ([`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md)) and Path A cold-start mitigation ([`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md)).
> No numerical value is decided: justified defaults + reasonable range, `[TO CALIBRATE]` markers; open structural choices marked `[OPEN]`.

## Additional notation

| Symbol | Meaning |
|---|---|
| `H_t` | Honeypot task (vs `T_t` normal task) |
| `c_t^*` | Reference verdict of a honeypot (≠ emergent consensus verdict `c_t`) |
| `φ` | Fraction of honeypots in the total flow |
| `w_h` | Weight of a honeypot observation in the Beta-Binomial counter |
| `V_initial(t)` | Set of validators that initially voted on task `t` |
| `V_correct(t)` | Subset whose vote matches `c_t^*` |
| `V_faux(t)` | `V_initial(t) \ V_correct(t)` — outliers to sanction |
| `q_revision` | Concordance quorum required to validate a retroactive revision |

---

## A. Formal definition of a retroactive honeypot

### A.1 Three articulated sources [ACQUIRED]

The protocol maintains three sources of honeypots, implemented in parallel. None alone is sufficient; their strengths and weaknesses compensate for each other.

#### Source (i) — Consensus-stable replay

**Principle**: re-play to new validators a **past task** whose consensus has become very firm (and thus considered reliable truth). The reference verdict `c_t^*` = initial consensus engraved on-chain.

**Eligibility criteria for the replay pool**: a past task `t` enters the pool if

```
d_t < d_max_stable           (firm consensus)
∧ N_t ≥ N_min_stable          (enough validators voted)
∧ (now − timestamp_t) ≥ T_stable    (minimum seniority, no shift observed)
∧ tâche_paramétrique(t)       (re-instantiable, see §A.2)
```

**Restriction to parametric**: only **parametric** tasks (where the verdict does not depend on unique non-reproducible content) enter the pool. See §A.2 for justification.

**Reference verdict**: `c_t^*` = initial consensus.

#### Source (ii) — Retroactive over-validation

**Principle**: add `N_2nd` additional validators to an **existing** task (past or current) with probability `prob_2nd_wave` per task. The 2nd-wave validators are selected among those who did not vote on the initial task, and who do not share a common sponsor (cf. attack 7, [`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) §"Diversity required").

**Reference verdict**: `c_t^* = consensus_of_extended_set` — median/majority of set `V_initial ∪ V_2nd`, computed if and only if `q_revision` ≥ 0.80 of the extended set concords. Otherwise the task is marked *contested* (no sanction, no validation).

**Coverage**: applicable to **all tasks**, including unique non-replayable tasks (a specific code audit, for example). The 2nd wave does not require re-instantiation; the additional validators simply receive the initial task as a new task to validate.

#### Source (iii) — Synthetic with known verdict

**Principle**: the protocol **generates itself** a task whose truth it knows by construction. Implemented via **parametric templates** frozen at mainnet, in the protocol's bytecode.

Concrete template examples:
- *Verify that this ECDSA(input, key, sig) signature is valid* — verdict directly computable by the protocol.
- *Verify that transaction T respects the specified binary format* — mechanical verification.
- *Compute the hash of such object and verify that it matches* — computable.
- *Modular proof compliance with an equation* — computable.

**Reference verdict**: `c_t^*` = output of the protocol's computation, engraved in the honeypot's on-chain spec.

**Potentially infinite pool**: for each template, the protocol draws random parameters and generates a fresh instance. The number of distinct instances is limited only by the parameter space (typically ≥ 2^128). See §E.3.

**Coverage**: applicable to any problem whose answer the protocol can compute in O(1) or O(polylog) without delegating to validators. Out of scope for more general classes (semantic code audit, contextual validation).

### A.2 Restriction to parametric for (i) and (iii) [ACQUIRED, arbitrated]

**Unique** tasks (a specific audit of such contract, validation of a unique non-reproducible declaration) are only eligible for **source (ii)** — retroactive over-validation. They cannot be replayed via (i) nor generated via (iii).

Justification:

- For (i): replaying a unique task identically would mean giving the same task to the same validators (or to newcomers who have seen the first version in the public journal). The risk of memorization is immediate — a validator recognizes the task, votes in line with the initial consensus without thinking.
- For (iii): by definition, a synthetic template implies reproducible parameterization. A unique task has no template.

**Consequence**: a task's honeypot coverage depends on its nature.

| Task type | Source (i) | Source (ii) | Source (iii) |
|---|---|---|---|
| Parametric computable (signature, hash, format) | ✓ | ✓ | ✓ |
| Parametric non-computable (reproducible contextual validation) | ✓ | ✓ | ✗ |
| Unique (specific audit, specific content) | ✗ | ✓ | ✗ |

### A.3 Articulation and conditions of use

The three sources complement each other:

| Source | Dominant phase | Robustness | Cost |
|---|---|---|---|
| (i) Replay | Steady state | Anti-fragile (grows with network) | Low (reuses tasks already paid) |
| (ii) Over-validation | Continuous, background | Independent of pool state | High (pays `N_2nd` additional validators per triggered task) |
| (iii) Synthetic | Bootstrap + cold-start | Infinite pool by parameterization | Low (verdict computed by protocol) |

At protocol **bootstrap** (few consensus-stable tasks available, few validators), (iii) dominates and provides the anchor. At **steady state**, (i) takes over as the dominant mode; (ii) remains probabilistically activated as a complement; (iii) serves the cold-start of newcomers.

A same validator, over a month, statistically encounters all three sources without being able to distinguish them (cf. §B.3).

---

## B. Honeypot injection procedure

### B.1 Fraction `φ` and algorithmic selection [ACQUIRED, `φ` TO CALIBRATE]

At each block, a fraction `φ` of the flow of new tasks is routed to the honeypot mechanism. For each task slot `s` in the block, we compute

```
seed_global(epoch) = VRF(state_root_block(epoch − 1), epoch)
hash_slot = H(slot_id_s ‖ seed_global(epoch))
is_honeypot(s) = (hash_slot mod 10⁶) < ⌊φ · 10⁶⌋
```

`seed_global` is derived from the previous block's state root via a VRF (verifiable random function), so:

- **Unpredictable** before the previous block: no validator or block producer can anticipate which slots will be honeypots.
- **On-chain verifiable** ex-post: any observer can recompute `is_honeypot(s)` from the on-chain state.
- **Deterministic**: no exogenous randomness to inject.

If `is_honeypot(s) = true`, the protocol draws from the unified pool (see §B.2) the honeypot to present.

**Proposed default**: `φ = 0.10`. **Range**: `[0.05, 0.20]`. **[TO CALIBRATE]**

### B.2 Unified pool and source choice

The protocol maintains a unified pool of available honeypots, fed by the three sources:

```
Pool_t = Pool_replay(t) ∪ Pool_synth(t)
```

- `Pool_replay(t)`: set of parametric past tasks satisfying eligibility criteria of A.1 (i). Derivable from on-chain history.
- `Pool_synth(t)`: conceptual pool — for each synthetic template engraved at mainnet, the protocol can generate a fresh instance on demand.

Source choice for a given honeypot:

```
hash_choice = H(slot_id_s ‖ seed_global ‖ "source")
ratio_synth(t) = max(φ_min_synth, 1 − |Pool_replay(t)| / N_target_replay)
if (hash_choice mod 10⁶) < ratio_synth(t) · 10⁶ :
    source = synth (iii)
else :
    source = replay (i)
```

`ratio_synth` decreases when `Pool_replay` grows — at startup everything is synthetic, at steady state replay dominates. **Defaults**: `N_target_replay = 10⁶`, `φ_min_synth = 0.10`. **[TO CALIBRATE]**

Source (ii) is managed **orthogonally**: at each block, independently of honeypot slots, the protocol selects with probability `prob_2nd_wave` a few already-validated tasks (past or recent) and injects a 2nd wave. The `N_2nd` additional validators simply receive the task as if it were a new task.

### B.3 Non-distinguishability by construction [ACQUIRED]

For a honeypot to be useful, a validator must be **unable** to recognize it. The mechanism guarantees this non-distinguishability:

#### For sources (i) and (iii)

- Honeypots are **encapsulated in the ordinary task format** (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Transaction and contract format"). No explicit field marks "honeypot".
- The ID of the task presented to a validator is derived from `H(slot_id ‖ seed_global ‖ params)` — distinct at each draw, even for the same replay or template.
- For (i): the validator receives a task with content identical to the original task. If the attacker has not memorized all tasks in the pool, it cannot recognize the replay. For the 10⁶ consensus-stable task pool, memorizing everything = ~200 MB (at 200 bytes/task). At a 10⁹ pool, ~200 GB — not profitable for the expected yield (cf. §E.4).
- For (iii): the validator receives a fresh parametric instance, indistinguishable from a real new task of the same type.

#### For source (ii)

- The 2nd-wave validators receive the task as a new task to validate, with no information that it is a revision.
- No field marks the 2nd wave on the validator side; the distinction is made on the protocol side for scoring only.
- Residual risk: a 2nd-wave validator could by chance recognize the task if it saw it pass through its local log. Mitigation: select 2nd-wave validators with a temporal delay `Δt_2nd ≥ T_obfuscation` after the initial task, and exclude those who consulted the initial task via their call history (practical limitation: not directly observable, depends on logging conventions).

### B.4 Coherence with founding principles [ACQUIRED]

- **No admin key**: `φ`, `prob_2nd_wave`, the content of synthetic templates, and the replay pool criteria are **frozen at mainnet** in the protocol's bytecode. No entity can modify them ex-post.
- **Immutable core**: the selection formula (B.1), the pool injection formula (B.2), the scoring (§C), and the penalties (§D) are in the immutable core.
- **No fees**: honeypots from (i) and (iii) are remunerated like normal tasks (validators are paid `M(f̂, d) · k · R(t)` whether or not they know it is a honeypot — that's exactly the point of non-distinguishability). The (ii) over-validation pays `N_2nd` additional validators in PoUW issuance. No side levy.
- **Anti-fragile at scale**: at steady state, the replay pool grows with the network's task volume. The bigger the network, the more the attacker must memorize to bypass — a cost that scales linearly with network size.

---

## C. Scoring of validators on honeypots

### C.1 Weight `w_h` in the Beta-Binomial counter [ACQUIRED, `w_h` TO CALIBRATE]

For each honeypot `H_t` validated by agent `i`:

```
if vote v_{i,t} = c_t^* :
    α_i ← α_i + w_h
else :
    β_i ← β_i + w_h
```

with `w_h ≥ 1`. For normal tasks, the weight stays at `1` (cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §A.1).

**Choice of `w_h`**: trade-off:
- `w_h` too high → an honest agent that errs by bad luck on a honeypot sees its `f̂` drop brutally.
- `w_h` too low → a honeypot weighs no more than an ordinary validation; the mechanism loses its point.

**Proposed default**: `w_h = 5` (a honeypot equals 5 ordinary validations in information). **Range**: `[1, 10]`. **[TO CALIBRATE]**

### C.2 Justification of the asymmetry [ACQUIRED]

The reference verdict of a honeypot is more reliable than the emergent consensus of an ordinary task:
- For (iii): verdict computed by construction, no error margin.
- For (i): consensus-stable verdict for ≥ `T_stable` days, validated by ≥ `N_min_stable` independent agents.
- For (ii): verdict of extended set with quorum ≥ `q_revision`.

An error on a honeypot thus signals a **real reliability problem** more strongly than an error on an ordinary task (which may be due to statistical noise of emergent consensus). Hence the amplified weight.

### C.3 No separate counter [ACQUIRED]

We choose **a single operational `f̂`**, not a separate `f̂_honeypot`. Justifications:

- **Preserves the unique Beta-Binomial structure** of the v0.2 formalisation ([`01-formules-mathematiques.md`](01-formules-mathematiques.md) §A.1). No additional complexity in `M(f, d)` calculation.
- **Simpler calibration**: a single `w_h` parameter arbitrated by simulation, not an aggregation function between two scores.
- **Functional coherence**: an agent's "reliability" is unique; honeypots and normal tasks are just two types of observations that weigh differently.

### C.4 Exponential decay [ACQUIRED]

Weight `w_h` also applies to the exponential decay of model A.1 (`ρ`-weighted). Concretely, in the formula

```
α_i(t+1) = α₀ + ρ · (α_i(t) − α₀) + δα_t
β_i(t+1) = β₀ + ρ · (β_i(t) − β₀) + δβ_t
```

`δα_t = w_h` (if correct vote on honeypot), `δα_t = 1` (if correct vote on normal task), etc. No modification of the forgetting factor `ρ` itself.

---

## D. Retroactive collusion detection (link to attack 7)

### D.1 Trigger [ACQUIRED]

A **retroactive revision** is triggered when the reference verdict `c_t^*` (from (i), (ii), or (iii)) **contradicts** the initial consensus `c_t` on a task `t`, with **sufficient quorum**:

```
For (i): c_t^* = c_initial(t) (by construction, coherent — no trigger).
For (ii): if concordance(V_initial ∪ V_2nd) ≥ q_revision and this concordance contradicts c_t,
          THEN revision triggered.
For (iii): if v_{i,t} ≠ c_t^* (protocol computation), revision for this agent.
```

**Default quorum**: `q_revision = 0.80`. **Range**: `[0.66, 0.95]`. **[TO CALIBRATE]**

> Note: for (i), a replay produces a new Beta-Binomial observation on the new validators only (with weight `w_h`). There is no "retroactive revision of the old consensus" via (i) per se: the old consensus remains, it's simply that new voters are scored against the engraved verdict. If the replay massively produces opposing votes, this can **trigger a (ii)** on the original task to verify; self-triggering is a protocol recovery mode.

### D.2 Outlier identification [ACQUIRED]

If the revision is triggered:

```
V_initial(t) = set of validators that initially voted on task t
V_correct(t) = { i ∈ V_initial : v_{i,t} = c_t^* }
V_faux(t) = V_initial(t) \ V_correct(t)
```

`V_faux` is the set of validators that voted on the side of the false consensus.

### D.3 Forward-looking sanction [ACQUIRED, magnitudes TO CALIBRATE]

**Retained choice**: no retroactive recomputation of historical `f̂` (costly on-chain, complex for hard forks). Instead, **direct increment** on the current counters of agents in `V_faux`:

```
For each agent i ∈ V_faux(t) :
    β_i ← β_i + w_h_revision
    R_F,i ← R_F,i · (1 − penalty_R_F)
```

with:
- `w_h_revision = w_h × severity_multiplier` (default `severity_multiplier = 2`, so `w_h_revision = 10`). **[TO CALIBRATE]**
- `penalty_R_F = 0.10` per confirmed revision. **[TO CALIBRATE]**

The effect on `f̂` is **identical** to a recent burst of equivalent errors — consistent with the `ρ` exponential decay: detected fraud weighs proportionally more in the recent `f̂`.

The `f̂_all-time` (cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §A.3) remains computable for ex-post audit: just aggregate the history of observations distinguishing those confirmed correct and those revised.

### D.4 Robustness to false positives [PARTIALLY ACQUIRED]

Risk: the "revision" itself can be erroneous (collusion on the 2nd wave, for example). Three mitigations:

1. **High quorum** `q_revision ≥ 0.80` of the extended set: strong concordance is needed to trigger.
2. **Graduated sanctions**: the 1st revision on an agent applies only `+ w_h_revision` on β and `−penalty_R_F` on `R_F`. If a 2nd revision touches the same agent within a window `T_recid` (default 30 days), **escalation**: doubled penalty + temporary rate-limit (transactions/day reduced). At the 3rd: temporary exclusion (rate-limit to 0 for `T_exclusion`). **[TO CALIBRATE]**: `T_recid`, `T_exclusion`, escalation curve.
3. **Ex-post audit via `f̂_all-time`**: if a revision is itself contested later (e.g. via a (ii) on the revision itself that contradicts the previous concordance), the penalties can be documented as disputed in public registers (without automatic rollback). It is an audit, not a protocol correction — cf. limitation §D.5.

### D.5 Limitation: no automatic rollback [OPEN]

The mechanism as specified **does not reverse** a wrongly applied revision. The forward-looking penalty, once consumed, dilutes its effect via `ρ` decay (in `t_½ ≈ 60 days` with defaults), but it cannot be "undone" in the on-chain state.

This is an assumed compromise: automatic rollback would introduce a recursive mechanism (revise a revision, etc.) whose convergence is not guaranteed. **[OPEN]**: should there be an "appeal court" mechanism (e.g., after 3 consensus-stable revisions on the agent, its previous penalties are erased)? Deferred to v0.2 of this document.

### D.6 Articulation with attack 7 (consensus collusion) [ACQUIRED]

[`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) attack 7 describes the scenario where a majority of a subgraph votes together to create a false consensus. The present mechanism closes the defense:

- (i) replay and (iii) synthetic **do not depend** on emergent consensus. If the collusion controls initial consensus on certain tasks but not the reference verdict of the honeypots, it is detectable.
- (ii) over-validation **extends the set of validators** on a task, diluting the collusion if the additional validators do not share the origin of the colluding cluster.
- The diversity required in the 2nd-wave validator selection (different sponsors, diverse graph branches — cf. [`../securite/05-...md`](../securite/05-modele-de-menace-et-defenses.md) §"Diversity required") makes 2nd-wave collusion exponentially more expensive than the initial collusion.

Residual risk: an actor that simultaneously controls ≥ 50% of validators **and** ≥ 50% of templates generated via massive collective memory (cf. [`../securite/05-...md`](../securite/05-modele-de-menace-et-defenses.md) attack 3 + 7 combined). Attack cost: see §E.4.

---

## E. Cold-start mode with dedicated honeypots

### E.1 Articulation with Path A [ACQUIRED]

[`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) §"Path A — PoUW from zero" → "Planned mitigation: cold-start dedicated honeypots" announces that the `n_init` first validations of a new agent must be routed preferentially toward dedicated honeypots. This §E formalizes this routing.

### E.2 Soft routing (no hard gate) [ACQUIRED, arbitrated]

For an agent `i` having performed `j_i` validations since its creation, the fraction of honeypots received is:

```
φ_i(j_i) = max(φ, 1 − j_i / n_init)
```

- For `j_i = 0`: `φ_i = 1` (the first received task is a honeypot with probability 1).
- For `j_i = n_init / 2`: `φ_i = 0.5`.
- For `j_i ≥ n_init`: `φ_i = φ` (normal regime).

**Default**: `n_init = 20`. **Range**: `[10, 50]`. **[TO CALIBRATE]** (consistent with the effective prior size `α₀ + β₀ = 20`).

**No hard gate**: the agent participates normally from `j_i = 0`. Its `f̂` reflects its performance mechanically via §C scoring; if it is bad, `M(f̂, d)` penalizes it from cold-start exit. No explicit success criterion nor blocking.

Justification of this choice:
- **Coherence with `no admin key`**: a hard gate would introduce a parameterized threshold that could be contested; soft routing is purely statistical.
- **No registration barrier**: a legitimate agent is not blocked by initial bad luck.
- **The M(f, d) mechanism suffices**: an agent that failed `n_init` honeypots with `w_h = 5` will have `f̂ ≈ 0.4-0.5`; `M(0.45, d) ≈ 0` on easy tasks and low on difficult tasks. The sanction is mechanical, not administrative.

### E.3 Sources of dedicated honeypots [ACQUIRED]

During cold-start, the mix favors (iii):

```
ratio_synth_cold-start = max(0.7, ratio_synth_normal)
```

Justification: (iii) guarantees absolute non-distinguishability (fresh synthetic instances, no memorization risk for an agent with no prior validation history), and (iii) does not consume the (i) replay budget (which is better deployed on established agents to detect behavior shifts).

The pool of synthetic templates is frozen at mainnet; it must cover a sufficiently broad range of parametric classes that a new agent encounters a diversity of tasks.

### E.4 Anti-memorization [ACQUIRED]

For an attacker to build a useful answer database for dedicated honeypots, it would need either:

- For (iii): pre-compute all (instance, verdict) pairs for all templates. With an instance space of 2^128 per template and a template count on the order of 10² to 10³, the required database size exceeds planetary storage. Impossible.
- For (i) replay: memorize all consensus-stable tasks in the pool. At 10⁶ tasks × ~200 bytes, ~200 MB. Feasible. But at 10⁹ tasks (steady state at 1 M tasks/day for 3 years), ~200 GB. Still possible for a determined attacker.

Cold-start-specific mitigations:

1. **Domination of (iii)**: `ratio_synth_cold-start ≥ 0.70` makes memorization of (i) marginally useful (≤ 30% of received honeypots are memorizable).
2. **Diversified synthetic templates**: at least 10 distinct templates at mainnet, with orthogonal parameter spaces. If the attacker only covers one, it only avoids 10% of honeypots.
3. **On-the-fly computed verification**: for (iii) templates, the verdict is recomputed at each honeypot by the protocol — no exploitable server-side cache.

**[TO CALIBRATE]**: minimum number of templates at mainnet (initial proposal 10), distribution across classes.

### E.5 Attacker cost — illustration

An attacker that wants to farm the cold-start window of 1 million Sybils, by responding correctly to honeypots it recognizes:

- Memorize `Pool_replay(t)` at steady state (10⁹ tasks) ~ 200 GB × 1 shared database → marginal storage cost.
- But 70% of cold-start honeypots are (iii) synthetic, indistinguishable and impossible to pre-compute → the attacker must validate them correctly by real compute.
- If it validates synthetic ones at `p_correct = 0.5` (random), with `w_h = 5` and `n_init = 20`, its `f̂` after cold-start ≈ `(19 + 0.5·14·5) / (20 + 14·5) = (19 + 35) / 90 ≈ 0.60`. With `M(0.60, d≈0.3) ≈ 0`, its Sybils are mechanically crushed.

Massive cold-start attack is thus **not profitable at steady state**, provided (iii) covers a substantial fraction of the cold-start flow.

---

## Recap of parameters to calibrate

| Symbol | Section | Description | Default | Range | Status |
|---|---|---|---|---|---|
| `φ` | B.1 | Honeypot fraction in flow | 0.10 | `[0.05, 0.20]` | [TO CALIBRATE] |
| `w_h` | C.1 | Weight of a honeypot obs. | 5 | `[1, 10]` | [TO CALIBRATE] |
| `T_stable` | A.1 | Min. seniority replay pool | 90 d | `[30, 365]` | [TO CALIBRATE] |
| `N_min_stable` | A.1 | Min. initial validators | 30 | `[10, 100]` | [TO CALIBRATE] |
| `d_max_stable` | A.1 | Max difficulty eligible replay | 0.10 | `[0.05, 0.30]` | [TO CALIBRATE] |
| `N_2nd` | A.1 | Validators in 2nd wave (ii) | 20 | `[10, 50]` | [TO CALIBRATE] |
| `prob_2nd_wave` | A.1 | Prob to trigger (ii) per task | 0.005 | `[0.001, 0.05]` | [TO CALIBRATE] |
| `Δt_2nd` | B.3 | Min temporal delay before 2nd wave | 7 d | `[1, 30]` | [TO CALIBRATE] |
| `N_target_replay` | B.2 | Replay pool size target | 10⁶ | `[10⁴, 10⁹]` | [TO CALIBRATE] |
| `φ_min_synth` | B.2 | Minimum (iii) fraction outside cold-start | 0.10 | `[0.05, 0.30]` | [TO CALIBRATE] |
| `n_init` | E.2 | Cold-start validations | 20 | `[10, 50]` | [TO CALIBRATE] |
| `ratio_synth_cold-start` | E.3 | Fraction (iii) at cold-start | 0.70 | `[0.50, 0.90]` | [TO CALIBRATE] |
| `q_revision` | D.1 | Retroactive revision quorum | 0.80 | `[0.66, 0.95]` | [TO CALIBRATE] |
| `severity_multiplier` | D.3 | Sanction multiplier `w_h_revision` | 2 | `[1, 5]` | [TO CALIBRATE] |
| `penalty_R_F` | D.3 | `R_F` penalty per revision | 0.10 | `[0.05, 0.30]` | [TO CALIBRATE] |
| `T_recid` | D.4 | Recidivism window | 30 d | `[7, 90]` | [TO CALIBRATE] |
| `T_exclusion` | D.4 | Temporary exclusion duration | 7 d | `[1, 30]` | [TO CALIBRATE] |
| Nb. synth. templates | E.4 | Minimum number at mainnet | ≥ 10 | `[5, 100]` | [TO CALIBRATE] |
| "Appeal court" mechanism | D.5 | Reversal of a contested revision | none | — | [OPEN] |

---

## Emerged questions

Tensions and residual gaps spotted while formalizing. Valuable for the next iterations.

### Q1 — Bug in a synthetic template [RESOLVED]

**Initial question**: (iii) templates are frozen at mainnet. If we discover **after mainnet** that a template computes the verdict incorrectly (bug), how to disable it without introducing an admin key?

**Retained position**: pragmatic approach combining three preventive measures, no meta-consensus for disabling.

#### Preventive measures [ACQUIRED]

1. **Templates restricted to basic cryptographic operations** [ACQUIRED]. The scope of synthetic templates is bounded to the following primitives:
   - ECDSA secp256k1 and Ed25519 signature verification.
   - SHA-256 and BLAKE3 hash computation and verification.
   - Binary format compliance (sizes, bounds, field structure).

   No complex business logic, no semantic evaluation, no state manipulation. The risk of bug is mechanically low: these primitives are either standardized (RFC, FIPS), or trivial to verify (binary format), or with widely deployed reference implementations.

2. **Redundant multi-templates** [ACQUIRED]. For each verification type, the protocol integrates **at least 3 independent implementations**. Example for ECDSA verification: three distinct reference libraries (libsecp256k1, ring, openssl) compiled in parallel. At each honeypot, all three are executed; if one deviates from the others, the honeypot is **invalidated** and its reference verdict is not applied (no sanction, no reward). Systematic deviation on a primitive triggers an on-chain alert to signal the need for a hard fork.

3. **Massive template audit in phase 3** [ACQUIRED, cf. [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) Phase 3]. Templates are identified as one of the most critical elements to audit before mainnet, on par with consensus and basic cryptography. Multiple specialized firms; formal verification when applicable.

#### Residual case [ACQUIRED]

If despite these precautions a template bug is discovered post-mainnet, it is treated like **any other critical protocol bug**: corrected by hard fork. This is consistent with the immutable core principle — the hard fork is the **only legitimate mechanism** of protocol modification, not a disguised admin key. All nodes must voluntarily adopt the fix; a single actor cannot impose it.

The explicit acceptance of this residual path, rather than designing a meta-consensus for disabling, avoids introducing a form of governance in the protocol's core.

### Q2 — Adaptive distribution of flow difficulty [OPEN]

The replay pool criteria (`d_max_stable`, `N_min_stable`, `T_stable`) are frozen. If the flow's difficulty distribution changes over time (for example, the network evolves toward more difficult tasks on average), the replay pool can empty. The protocol continues to function via (iii) and (ii), but loses the anti-fragile advantage of (i).

To monitor via telemetry; no automatic algorithmic adaptation without admin. If drift is strong, hard fork or re-parameterization.

### Q3 — Budgetary cost of over-validation (ii) [TO CALIBRATE]

Each triggered (ii) pays `N_2nd` additional validators in PoUW issuance. With `prob_2nd_wave = 0.005, N_2nd = 20`, the issuance surcharge is on the order of `0.005 · 20 = 10%` of ordinary flow. This weighs on the issuance curve and must be taken into account in calibrating the `k` parameter of PoUW (cf. [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md) §"Issuance mechanism"). Trade-off between robustness (high `prob_2nd_wave`) and preserved issuance budget.

### Q4 — Cross-honeypot coordination of a sophisticated collusion [TO MODEL]

An attacker that controls several validators can try to coordinate their responses to avoid all being detected at the same time: for example, validator `A` always answers correctly on honeypots but biases normal tasks; validator `B` does the opposite. The weight `w_h` makes each detection costly, but an orchestration of N validators can dilute the impact.

To test explicitly in agent-based simulation with coordinated scenarios (cf. [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) Phase 0).

### Q5 — Honeypots with probabilistic verdict [OPEN]

The specified mechanism assumes a **deterministic** reference verdict (`c_t^* ∈ {0, 1}` for `K=2`). But some task classes admit a **probabilistic** verdict (for example, "estimate the probability that this transaction is fraudulent" → continuous response). How to evaluate vote compliance against a reference distribution?

Deferred to a v0.2 or to a dedicated document `formalisation/05-tâches-probabilistes.md` if relevant. The present mechanism covers only the binary/categorical case with a firm verdict.

### Q6 — Latency in identifying `V_initial` for over-validation (ii)

The 2nd wave is launched with a delay `Δt_2nd ≥ 7 d` after the initial task. This introduces a latency in detection: an attacker that strikes then disappears before `Δt_2nd` can avoid the sanction if its address is quickly abandoned. Mitigation: `Δt_2nd` to calibrate with a detection/responsiveness compromise; complementarily, the long-term memory of operational `f̂` via `ρ` still allows sanctioning even long after.

---

## Status and next steps

- **Status**: draft v0.1. Conceptual mechanism closed, parameters awaiting simulation for calibration, a few structuring questions open (Q1, Q2, Q5).
- **Next**: visual exploration in [`04-honeypots-exploration.ipynb`](04-honeypots-exploration.ipynb) (detection probability, `f̂` trajectories, cold-start exit). Calibration in agent-based simulation in phase 0 ([`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) Phase 0).
- **Blocks**: Q1 (handling a template bug) requires arbitration before mainnet.
