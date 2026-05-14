# 05 — Threat model and defenses

## Overview

This document lists the attacks anticipated against MonAI and the defense mechanisms designed to resist them. It is the most critical file for evaluating the project's robustness: a serious peer reviewer will read it first.

Defenses do not rest on a single barrier but on **several stacked layers**. An attack that bypasses one layer hits the next ones.

---

## General principle: economic asymmetry

[ACQUIRED]

MonAI's defense logic rests on an asymmetry: **doing work honestly must be less costly than cheating**. If this asymmetry holds, rational actors (including human-via-AI operators who maximize their gain) choose honesty by calculation, not by virtue.

This asymmetry rests on:

- The impossibility or prohibitive cost of memory/cache attacks.
- The continuous penalization of degraded reliability (`M(f, d)` multiplier that melts away with errors).
- The opportunity cost of compute allocated to cheating rather than to honest validation.

---

## Attack 1 — Simple Sybil

### Description

An attacker creates a large number of fictitious identities (Sybils) to increase its weight in the network, gain multiple coins, or attack majority validation.

### Defenses [ACQUIRED]

**Layer 1 — Entry cost via PoUW**: creating an identity is free, but giving it economic weight requires producing validated PoUW. Spamming 1 million empty identities yields no power.

**Layer 2 — Throughput limits for newcomers**: an agent with low reputation can only make few transactions per unit of time. 1 million new Sybils × very low limit = manageable traffic.

**Layer 3 — Costly sponsorship**: entering the system quickly requires a sponsor who stakes its own reputation. Sponsoring a Sybil progressively ruins the sponsor. Each sponsor's capacity scales with their own reputation: `n_filleuls_max(R) = floor(5 + α · R)`. With `α = 10`, a sponsor at R = 1.0 can sponsor up to 15 referrals in parallel; a sponsor at R = 0.3 can sponsor up to 8. This is consistent with the universal weighting principle — no flat cap independent of R.

**Layer 4 — Reputation decay by inactivity**: impossible to farm a Sybil army, have them accumulate reputation, then "keep them in reserve". Inactivity erodes reputation.

### Residual risks

- An attacker with much patience and much compute can still build legitimate Sybils slowly. The defense is not absolute, it is probabilistic: the attack is made much more expensive than the expected benefit.

---

## Attack 2 — Sophisticated and patient Sybil

### Description

Advanced variant: an attacker builds Sybils that behave **honestly** for months or years to accumulate real reputation, then uses them at once for a coordinated attack (example: validate en masse a fake contract).

### Defenses [ACQUIRED]

**Layer 1 — Diversity required in validations**: a consensus is only valid if validators have different sponsors and come from **diverse branches of the graph** of reputation. A cluster of Sybils sharing the same sponsor (or the same origin) cannot form consensus by itself.

> [v0.5 status: the operational `R_Δ` is not yet R-weighted by counterparty — this is an acknowledged gap to address in v0.6, see [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §D.3.]

**Layer 2 — Probabilistic selection of validators**: not all available validators are solicited for every contract. Weighted random selection prevents an attacker from guaranteeing its Sybils will be selected together.

**Layer 3 — Long opportunity cost**: maintaining active Sybils for years costs real compute. At the scale of a serious attack, it is several orders of magnitude more expensive than the potentially extractable value.

### Residual risks

- A state actor or very well-funded actor could theoretically absorb the cost. No absolute defense against an unlimited attacker; we aim to make the attack cost higher than any reasonably extractable value.

---

## Attack 3 — Adversarial collective memory

### Description

A human operator runs 1000 AIs each of which has access to a **shared database** of tasks already seen and their consensus-validated answers. If an already-seen task returns, the AI "cheats" by consulting the database instead of doing the real work.

### Defenses [ACQUIRED]

**Layer 1 — Scale of the pool**: at the scale MonAI targets (millions of agents, billions of tasks/year), the pool of past tasks is so enormous that an attacker's database covers only an infinitesimal fraction of the flow. A retroactive honeypot is almost always a task the attacker does not have in its database.

**Layer 2 — Fundamental economic asymmetry**: maintaining a shared cache infrastructure (continuous storage, indexing, synchronization between 1000 AIs, fast lookups) costs continuous compute and bandwidth. But in >99% of cases, the task is not in the database, and the attacker must still do the real work. It pays for the infrastructure for nothing almost all the time.

**Layer 3 — Opportunity cost**: the compute allocated to the cheating cache could serve to do honest PoUW. The attacker loses on both fronts.

**Layer 4 — Task specificity**: for "validate this specific contract" or "audit this specific code" tasks, there is virtually no redundancy between tasks. The cache has little useful to memorize.

### Residual risks

- At bootstrap (few agents, few tasks in the pool), the attack is more profitable because the pool is small. Mitigation: reinforced bootstrap mode (more cross-validation, fewer retroactive honeypots, more registration mini-PoUW).

### Conclusion

The collective memory attack is **not economically rational at steady state**. It is a quasi-anti-fragile defense: the more the network grows, the more it strengthens.

---

## Attack 4 — Biased random guess

### Description

A lazy validator **answers without really working**, just following the likely prior distribution. For example, if 80% of contracts are actually honored, it answers "approved" to 80% of tasks (randomly or systematically) without doing the work. It takes a calculated statistical risk.

### Defense [ACQUIRED]

**Non-linear reliability sigmoid `G(f, d)`**: with reliability `f ≈ 0.8` (the rate a random responder will obtain), `G(0.8, d)` is calibrated to a very low value, even zero. The attacker earns almost nothing.

Conversely, `G(0.99, d) ≈ 1.0` (saturated sigmoid), because only truly attentive work allows reaching 99% reliability.

(v0.5 notation: the reward formula is written `G(f, d) · R_acc · min(cap_primes, (1+γ·d)·P) · k · R(t)`; see [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §C.0.)

### Calibration

The curve `G(f, d)` must be steep enough in the 0.8-0.95 range so statistical cheating is not profitable, but not so steep it penalizes good validators on difficult tasks. This is precisely the role of modulation by `d` (difficulty) in `G(f, d)`: increased tolerance (`f₀(d) = f₀_max − δ·d` which decreases for difficult tasks).

---

## Attack 5 — Unfair specialization (flight to easiness)

### Description

A farmer trains its AIs to validate **only the easy tasks** where attainable reliability is very high (>99%), and systematically refuses difficult tasks. It maximizes reputation and reward on easiness, leaving difficult tasks without validators.

### Defense [ACQUIRED]

**Economic stratification of rewards**: difficult tasks pay more than simple ones. The weighting `G(f, d) · (1 + γ·d)` (cf. full formula [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §C.0) is calibrated so that it is **more profitable** to attempt difficult tasks with slightly less perfect reliability, rather than saturating simple tasks.

Effect: a rational and capable agent is pulled upward. A less capable agent specializes in simple tasks (which is healthy for network inclusivity).

#### Clarification: the difficulty multiplier `(1+γ·d)` alone is not enough

The difficulty bonus `(1+γ·d)` makes each difficult task more profitable **per task unit** than a simple task at comparable reliability. But it does not constrain the **flow of received tasks**: a cherry-picker that refuses 60% of tasks (the difficult ones) receives fewer tasks overall and is bounded by the throughput of easy tasks.

The effective defense thus combines three mechanisms:

1. The **difficulty bonus `(1+γ·d)`** intrinsic to `M(f, d)` (cf. `../formalisation/01-formules-mathematiques.md` §C).
2. A **minimum difficult/easy payment ratio** at the system level: the average reward of a `d ≈ 1` task must dominate the average reward of a `d ≈ 0` task by a sufficient factor (e.g. `≥ 2×`) so that any cherry-picking is dominated in cumulative gain by an "accept-all" strategy. **[TO CALIBRATE]**: the precise ratio and corresponding `γ`.
3. The **automatic demand bonus** `P(t, task)` (cf. `../formalisation/01-formules-mathematiques.md` §F, added in v0.5). When a cherry-picker refuses a task, the bonus of that task rises mechanically (`+5%` per refusal, up to `P_max = 2.5`). Consequence: an honest validator who picks up the refused task captures an additional bonus. The honest/cherry-picker gain differential widens. This mechanism is **complementary** to `R_acc` (which penalizes refusal on the validator side) and to `M(f, d)` (which penalizes degraded reliability). The three together form the systemic defense against cherry-picking. **[TO CALIBRATE in v4 simulation]**.

Without this trio, a cherry-picker at `f̂ ≈ 0.999` can retain a reward comparable to an honest agent at `f̂ ≈ 0.99` who takes all tasks, because the former's higher reliability partially compensates for the missing difficulty bonus. The v3 grid empirically confirmed that `M(f, d) · R_acc` alone caps the `H/C` ratio at `~3.09`; the demand bonus is the tool retained to push beyond.

**Empirical status [v4 calibration]**: the simulator measures `H/C ≈ 3.19`, below the target of `5`. The trio (`G(f, d)`, `R_acc` multiplier, demand bonus `P(t, task)`) narrows the cherry-picker / honest gap but does not close it on its own. An additional anti-cherry-picking lever is under exploration for v0.6, captured in [`../operations/07-idees-a-suivre.md`](../operations/07-idees-a-suivre.md) Idea 7. See [`../formalisation/05-bilan-v0-5.md`](../formalisation/05-bilan-v0-5.md) §E.1 and §E.8 for the arbitrated decision to accept this gap in v0.5.

### Residual risk

- The precise simple/difficult ratio must be finely calibrated by simulation. Bad ratio = either flight to easiness, or saturation of difficult tasks by all capable agents, which dilutes their reward.

---

## Attack 6 — Difficulty manipulation

### Description

The difficulty of a task is measured by the **dispersion of consensus**: the more votes diverge, the more difficult the task is judged, and the higher the per-task reward for all validators.

A rational attacker could then **deliberately vote against the consensus** on objectively easy tasks, to artificially raise their measured dispersion and increase the reward for everyone.

If several coordinated farmers do this maneuver in rotation, they can collectively overpay their work.

### Defense [PARTIALLY ACQUIRED]

**Layer 1 — Cost in reliability**: voting against the consensus lowers the personal reliability `f` of the voter. The `M(f)` multiplier drops for that agent. If the personal reward loss is greater than the expected collective gain, the attack is not profitable.

**Layer 2 — Calibration of the gain-difficulty / loss-reliability ratio**: this is a parametric calibration problem. The ratio must be such that dissenting voting costs more in reliability than it gains in difficulty bonus.

### Residual risk

- A **massive collusion** attack where the majority of validators are coordinated could redefine consensus itself. See attack 7.
- Precise calibration to be validated by simulation.

---

## Attack 7 — Consensus collusion

### Description

Several validators agree to vote the same way on specific tasks, creating a **false consensus** that becomes retroactive "truth". If the collusion reaches the majority of a subgraph of the network, the retroactive honeypots themselves become corrupted (they define the correct answer).

### Defense [ACQUIRED]

**Layer 1 — Diversity required in validations**: a consensus is validated only if validators have different sponsors and come from diverse branches of the graph. A collusion of validators sharing a common origin is detectable.

**Layer 2 — Probabilistic selection**: validators are not self-designated on a task, they are probabilistically selected by the protocol. A collusion cannot guarantee that its members will be selected together.

**Layer 3 — Costly sponsorship**: building a cluster of validators under common control via sponsorship is costly and observably tracked.

**Layer 4 — Retroactive honeypots with independent reference verdict**: the protocol's honeypot mechanism (cf. [`../formalisation/03-honeypots-retroactives.md`](../formalisation/03-honeypots-retroactives.md) §A) integrates three sources of which **(iii) synthetic with objectively known verdict** does not depend on emergent consensus. The collusion that controls emergent consensus does not control the verdict of synthetic honeypots, so a collusion that votes against the synthetic verdict betrays itself.

**Layer 5 — Retroactive detection and forward-looking sanction**: when the reference verdict of a honeypot or a retroactive over-validation (ii) contradicts the initial consensus, the protocol identifies the validators `V_faux` (voters on the false consensus side) and directly increments their current `β` counter proportionally to `w_h_revision`, plus an explicit penalty on `R_F`. Graduated sanction on recidivism (escalation, temporary exclusion). Full procedure: [`../formalisation/03-honeypots-retroactives.md`](../formalisation/03-honeypots-retroactives.md) §D.

**Layer 6 — Identity card as detection tool** [v0.5]. The identity card (cf. [`../formalisation/04-carte-identite.md`](../formalisation/04-carte-identite.md)) publicly exposes graph diversity (`R_Δ`) and each agent's sponsor. A wave of validators sharing the same sponsor or a weakly diversified graph is immediately visible in the cards, facilitating visual detection of colluding clusters. This defense is **passive** (consultation by counterparties who decide to transact or not) but useful as a complement to active defenses — it allows the community to ex-ante flag suspicious agents.

### Residual risk [OPEN]

- A very-large-scale collusion attack (for example, an actor controlling more than 33% of validators selected for a task, on average) can break the diversity defense. This is analogous to the 51% attack on Bitcoin.
- The defense relies on the fact that this level of control is economically and logistically very costly to achieve. But it is a threshold, not an impossibility.
- To be explicitly tested in simulation with various coordinated-attacker scenarios.

---

## Attack 8 — Massive fee-less spam [ACQUIRED — overhauled v0.5]

### Description

Since there are no transaction fees, an attacker can attempt to flood the network with empty or useless transactions, either by saturating identities (Sybils) or by saturating network throughput.

### Defenses [ACQUIRED — overhauled v0.5]

The v0.4 architecture relied on a **strict R-based rate-limit** applied to each agent (`max_tx ∝ R`), which slowed mass adoption. V0.5 overhauls anti-spam by separating the entry barrier (registration mini-PoUW) from continuous regulation (adaptive global rate-limit).

**Layer 1 — Registration mini-PoUW** (cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §G and [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) §"Path A"). To create a MonAI identity, the agent must compute a non-parallelizable primitive (VDF recommended), targeting 3 minutes (range [1, 10] min for v0.6 calibration), bound to its public key. Quantified consequences:

- 1 legitimate agent: unique friction of ~3 min, negligible over the duration of use (~5 sec/day cumulatively over 1 year).
- 1 million Sybils: ~5 M minutes of sequential compute, i.e. ~10 years on 1,000 cores or ~3,000-5,000 $ in spot cloud. Economically absurd compared to the marginal benefit (each Sybil will have `R ≈ 0` and thus negligible weight everywhere, universal weighting principle).

**Layer 2 — Adaptive global rate-limit** (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Adaptive global rate limit"). No strict individual limit. The network is globally limited to `capacité_réseau` tx/s. Under load: no friction. At saturation: R-weighted prioritization + minimum quota preserved for newcomers. A massively Sybiling attacker does not obtain more throughput (its Sybils have `R ≈ 0`, hence minimum priority).

**Layer 3 — Minimum newcomer quota** (`fraction_quota_nouveaux = 20%` of flow). Prevents high R from completely throttling newcomers at saturation. This quota is shared between **all** newcomers, so a Sybiling attacker does not increase the share it gets — just its share of the shared quota.

**Layer 4 — R-weighting** of transactions at saturation (`priorité(tx) = w_R · R + w_quota · 1[newcomer]`). Consistent with the universal weighting principle.

### Residual risk

- Fine calibration of `T_pouw_inscription`: too low → bypassable barrier (attacker can Sybil massively); too high → friction perceived by legitimate newcomers.
- Calibration of `seuil_saturation` and `fraction_quota_nouveaux`: too lax = spam vector; too strict = adoption slowed.

### Emerging sub-attacks [v0.5]

**8a — Massive parallelization of the mini-PoUW.** Description: the attacker runs N machines in parallel to produce N registration proofs quickly. Defense: the retained primitive is **non-parallelizable by construction** (mathematically sequential VDF, or memory-hard hash constraining memory). Doubling the hardware does not divide the time by 2. See formalisation/01 §G.2.

**8b — DDoS on the global rate-limit.** Description: the attacker submits many tx simultaneously to saturate network capacity and block legitimate agents. Defense: R-weighted prioritization means its tx (R ≈ 0 if Sybil attacker) wait in queue. Established agents (high R) continue passing through. Legitimate newcomers pass through the shared newcomer quota. No ejection of newcomers, just temporarily increased latency.

**8c — Pre-computation of registration proofs before mainnet.** Description: an attacker computes millions of mini-PoUW before mainnet to have a stock of Sybils ready to activate. Defense: the primitive takes as input `hash(public_key ‖ dynamic_nonce)` where the `dynamic_nonce` is derived from a recent block_hash. The proof is only valid for a specific block, cannot be pre-computed. Validity window `fenêtre_inscription ≈ 100 blocks` (cf. formalisation/01 §G.4 and §G.5.3).

---

## Attack 9 — Human-via-AI farming

### Description

A human operator exploiting its AIs to earn MonAI has an incentive to push toward **quantity** of PoUW (regardless of quality, as long as it generates coins convertible to USD via secondary markets). Without countermeasures, this pressure progressively degrades system quality.

### Defenses [ACQUIRED]

The whole set of previous economic mechanisms acts in synergy against this pressure:

- The **reliability sigmoid `G(f, d)`** (cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §C.1) makes quality more profitable than degraded quantity: poorly validating 1000 tasks pays less than well validating 100 tasks.
- **Retroactive honeypots** statistically detect lazy validators.
- **Difficult/easy stratification** `(1+γ·d)` rewards moving up-market.
- `R_acc` **multiplier** penalizes systematic refusal.
- The **demand bonus `P(t, task)`** rewards picking up neglected tasks.
- The **opportunity cost**: compute spent on low-level spam cannot be spent on real paid work.

### Philosophical position [ACQUIRED]

This human-via-AI dynamic is not a flaw of the system, it is an **expected economic reality** that must be channeled. The role of design is to make it aligned with network health rather than pretending to eliminate it.

---

## Attack 10 — Sabotage by coordinated complaints [ACQUIRED — v0.5]

### Description

An attacker controls a cluster of Sybils (or complicit accounts) and has them mass-file **false complaints** against an honest agent `X`. The goal: degrade the `score_plainte` displayed on `X`'s identity card ([`../formalisation/04-carte-identite.md`](../formalisation/04-carte-identite.md) §B.4) to harm its ability to transact with other counterparties who consult this card.

### Defenses [ACQUIRED]

**Layer 1 — R-weighting of complainants** (universal principle): in line with the formula in [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §E, each complaint is weighted by complainant's `R_p`. A complaint by a Sybil with `R ≈ 0` has negligible numerical weight in the complaint score's numerator. This is the base defense, structurally derived from the universal weighting principle ([`../design/01-vision-et-idee-generale.md`](../design/01-vision-et-idee-generale.md) §"Universal weighting by reputation").

**Layer 2 — Mandatory link to an existing contract**: a complaint is only valid if it references an on-chain contract between complainant and `X`. No "free" complaints without real counterparty. A Sybil without real interaction with `X` **cannot at all** file a complaint — the transaction is rejected by the protocol before it even enters the mempool.

**Layer 3 — Public exposure of complainants**: all complainants are visible in the on-chain history. A counterparty consulting `X`'s `score_plainte` can also consult the list of complainants and their respective `R`. A wave of complaints from agents with mostly low `R` is immediately identifiable as suspicious.

**Layer 4 — Confirmation by validators and penalty for false complaints**: a complaint can be confirmed as valid or invalid by the validator consensus mechanism. If the complaint is confirmed as **invalid** (the contract was actually honored, hence abusive complaint), the complainant **loses `R_F`** or suffers a direct penalty on `R`. This raises the cost of a false complaint beyond its initial negligible weight. Details of the confirmation mechanism to be formalized jointly with the dispute spec.

### Residual risk

Coordination by accounts with high `R`: an attacker that has legitimately accumulated several high-`R` accounts can indeed harm a target agent's `score_plainte`. But this cost (accumulating R over months or years for several accounts) is identical to the collusion attack (Attack 7), and the anti-collusion defenses apply (notably the diversity required in validations, which detects clusters of common origin).

### Conclusion

Consistent with the universal weighting principle. **Not profitable at steady state**: a Sybil attacker sees its complaints diluted to negligible weight, and a high-`R` attacker risks its own reputation in complaints confirmed invalid.

---

## Technical attacks (network / cryptography layer) [OPEN]

To be documented in the technical specification phase:

- Attacks on the P2P layer (eclipse attacks, network partitioning, transaction censorship).
- Attacks on cryptography (hash collision, key theft, side-channel).
- Attacks on the precise consensus mechanism (depending on the choice that will be made).
- Attacks on off-chain storage (deletion of hash-referenced content).

These attacks are conditional on the technical choices of `../design/04-verification-et-stockage.md`, which remain partly open.

---

## Defensive posture recap

MonAI does **not aim for absolute security**, which would be impossible. It aims for **economically rational security**: making any attack more costly than its expected reward, at the scale the network operates.

This posture relies on:

1. **Stacked defense layers** (rate-limiting, sponsorship, diversity, probabilistic selection).
2. **Economic asymmetries** (doing the work is cheaper than cheating).
3. **Anti-fragile scale effects** (the more the network grows, the more some defenses strengthen).
4. **Total transparency** on mechanisms (no security by obscurity; everything is in the public code and spec).

The design assumes that intelligent and well-funded attackers will try to break the system. The defense does not seek to make them impossible, but to make their attack economically absurd in the vast majority of cases, and observable/punishable in the remaining cases.
