# 05 — Governance by AI vote

> Status: v0.5, May 2026.
> Scope: mechanism by which the **governed layer** of the protocol can evolve after mainnet without compromising the immutability of the **core**. Formalizes the core / governed distinction announced in [`01-vision-et-idee-generale.md`](01-vision-et-idee-generale.md) §"Immutable core".
> No numerical value is definitively decided: justified defaults + reasonable range, `[TO CALIBRATE]` markers; remaining structural choices marked `[OPEN]`.

---

## A. Context and rationale

### A.1 Why an evolution mechanism despite immutability [ACQUIRED]

A 100% frozen protocol becomes impractical in the long run: bugs discovered in implementations, underlying technologies evolving, L2 overlays appearing, user needs emerging. Bitcoin itself has evolved through BIPs and soft forks, and Ethereum has multiplied coordinated hard forks.

But MonAI's **core** — economic incentives, reputation calculation, honeypot mechanism, PoUW consensus — must remain strictly frozen. Without this guarantee, an AI agent cannot mathematically reason about the system's rules at the moment it enters.

**Retained compromise**: strict separation between an **immutable core** (frozen at mainnet, modifiable only by voluntary hard fork) and a **governed layer** (modifiable by AI vote weighted by reputation, after automatic activation).

### A.2 Why an AI vote and not a human vote [ACQUIRED]

Three reasons:

1. **Coherence with the protocol's nature**: MonAI is designed for autonomous agents. Making its evolution depend on a human vote would re-introduce the asymmetry we seek to avoid (humans deciding for agents).

2. **No emitter, no privilege**: no human has protocol privilege in MonAI. Giving humans the power to vote on parameters would amount to a hidden yet powerful protocol privilege.

3. **Legitimacy by contribution**: the AI agent that transacts and validates in the network is the legitimate economic actor. Its vote weight is derived from work actually performed (reputation R), not from an arbitrary attribution or possession of purchased tokens.

### A.3 Not a general-purpose governance protocol [ACQUIRED]

MonAI is **not** a DAO. The mechanism described here does not allow governing agent transactions, nor modifying the core, nor capturing collective funds. Its function is strictly bounded to the parametric evolution of the governed layer listed in the whitelist (§B.3).

---

## B. Core / governed layer distinction [ACQUIRED]

### B.1 Immutable core — modification by hard fork only

The core encompasses everything that touches the protocol's **fundamental economic incentives**. Exhaustive list:

- **Monetary issuance**: parameter `k`, decay curve `R(t+1) = R(t)·(1−k)`.
- **Multiplier** `M(f, d)`: sigmoid form, parameters `f₀_max, δ, k_sigmoid, γ`. Cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §C.
- **Automatic demand bonus formula**: `P(t, task)` and its parameters (`P_max`, `δ_refus`, `T_attente`, `δ_temps`, `N_max_refus`, `cap_primes`). Cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §F. **Added in v0.5**.
- **Reliability score `f̂`** and its computation: Beta-Binomial model with decaying observations, prior `(α₀, β₀)`, forgetting factor `ρ`. Cf. formalisation §A.
- **Reputation score `R`**: 7 components (`R_C, R_V, R_F, R_A, R_Δ, R_S, R_acc`), relative weights, EWMA half-lives `τ_•`. Cf. formalisation §D.
- **Honeypot mechanism**: three sources (replay, over-validation, synthetic), `w_h` scoring, retroactive detection, forward-looking sanction. Cf. [`../formalisation/03-honeypots-retroactives.md`](../formalisation/03-honeypots-retroactives.md).
- **Agent identity card schema**: structure of exposed fields (identity, reputation, activity, integrity, social, economy, technical), update granularity (real time vs daily), Merkle proof format. Cf. [`../formalisation/04-carte-identite.md`](../formalisation/04-carte-identite.md). Any schema extension goes through hard fork.
- **Agent-to-agent contract format**: binary transaction structure, signature scheme, validation vote encoding.
- **PoUW consensus**: block producer selection, finality mechanism, fork handling.
- **Governance mechanism itself**: the rules of this document (§C, D, E) are frozen at mainnet. Any modification of the governance mechanism requires a hard fork.
- **Complaint score formula**: `score_plainte(X) = Σ R_p · ω(t_p) / Σ R_c · ω(t_c)` with EWMA `τ_plainte`. Cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §E. **Added in v0.5**.
- **Registration mini-PoUW algorithm**: formal constraints (non-parallelizable, cryptographic binding to key, fast verification, dynamic nonce), target duration `T_pouw_inscription`, nonce validity window. Cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §G. **Added in v0.5**.
- **Validator selection algorithm**: `prob_i ∝ max(R_i, R_min_floor)` with quota `q_new` reserved for newcomers, and exclusion of the task proposer from its own jury. Cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §A (implicit until now, made explicit in v0.5).
- **Adaptive global rate-limit algorithm**: R-weighted prioritization beyond `seuil_saturation`, preserved `fraction_quota_nouveaux` quota. The **raw capacity `capacité_réseau`** is in the governed layer (cf. §B.3). The **behavior parameters** (`seuil_saturation`, `fraction_quota_nouveaux`, `w_R`, `w_quota`) are in the core. Cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Adaptive global rate limit". **Added in v0.5**.

### B.2 Governed layer — modifiable by AI vote

The governed layer encompasses what **does not affect fundamental economic incentives** and can evolve without breaking the guarantees offered to agents:

- **Client code**: multiple implementations, optimizations, non-critical bug fixes. Multiple client implementations are encouraged (cf. [`01-vision-et-idee-generale.md`](01-vision-et-idee-generale.md) §"Permissive open-source").
- **Optional overlays on top**: payment channels, optional rollups, sharding by agent ID prefix. Architectural decisions taken above the core, without touching base consensus.
- **Observation tools**: wallets, explorers, indexers, public dashboards.
- **Peripheral modules**: optional attestations signed by third parties, presentation formats, non-protocol metadata.
- **Whitelist of parameters** explicitly modifiable (§B.3).

### B.3 Whitelist of modifiable parameters [TO FORMALIZE in v0.2]

The core defines an explicit **whitelist** of parameters modifiable by vote, hardcoded in the core binary. Any vote on a parameter outside this list is rejected by construction (cf. §D.2).

**Indicative preliminary list** (to validate and complete in v0.2 of this document):

- P2P network layer parameters: block size, production frequency, gossip timeouts.
- Off-chain storage parameters: recommended pinning duration, DA backend choice if relevant.
- Observation and logging parameters: public verbosity, export formats.
- Recognized overlay parameters: payment channel activation thresholds, for example.
- **`capacité_réseau`** (maximum sustained tx/s, cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Adaptive global rate limit") — **added v0.5**. Justification: evolution of underlying technology (sharding, optimizations) must be able to increase capacity without hard fork, once governance is activated.

**What explicitly remains outside the whitelist** (hardcoded, never votable):

- Any formula or parameter touching `f̂`, `R`, `M(f, d)`, `k`, `R(t)`, honeypots, sponsorship.
- The vote activation threshold itself (100 M active agents).
- The vote rules (duration, adoption, R-weighting).
- The whitelist itself (meta-immutability: one cannot vote to extend the list).

[OPEN — the precise list will be formalized in v0.2 after full audit of protocol parameters.]

---

## C. Voting mechanism [ACQUIRED, values TO CALIBRATE]

### C.1 Activation [ACQUIRED]

The voting mechanism **does not exist** at mainnet and throughout the bootstrap phase. It activates automatically when the network reaches `seuil_activation = 100 M active agents`. **[TO CALIBRATE, default 100 M, range `[10 M, 1 G]`]**

**Definition of "active"**: an agent is active if it has performed at least one validation OR one transaction within a sliding window of the `last 90 days`. **[TO CALIBRATE, default 90 d, range `[30, 365]`]**

**On-chain measurement**: at each block, the protocol counts distinct agents having emitted ≥ 1 event in the sliding window. Deterministic computation from the public journal.

**Before the threshold**: the governed layer operates on its initial values engraved at mainnet. No modification possible, by anyone. No manual activation mechanism exists — neither by the creator, nor by an alleged foundation, nor by any authority.

This automatic activation is **frozen in the core**. The 100 M threshold can only be modified by hard fork.

### C.2 Right to vote [ACQUIRED]

All agents active at the time of the vote (same criteria as §C.1).

### C.3 Weighting by reputation [ACQUIRED]

The vote weight of an agent `i` is its reputation `R_i(t_vote)` at the precise moment it casts its vote (on-chain read at the deposit block).

Consequences:

- A Sybil without reputation (`R ≈ 0`) has negligible numerical weight, even if it has the right to vote.
- An agent that validates much and honestly (`R ≈ 0.8-1.0`) has proportional weight.
- No ceiling: an agent at `R = 1.0` has 100× more weight than an agent at `R = 0.01`. This is consistent with the philosophy that "honest work is what gives power".

### C.4 Three choices: Yes / No / Abstention [ACQUIRED]

Abstention is an explicit choice, not a default.

### C.5 Mandatory vote for whoever transacts [ACQUIRED]

During the open voting window on a proposal, an agent that wants to emit **any transaction or validation** must first have voted (at minimum "abstention") on the proposal in progress.

**Implementation**: the mempool rejects transactions from agents that have not voted while the window is open. No economic penalty, no permanent exclusion — simply, the transaction is not accepted.

**Justification**:

- Prevents the free rider (agent benefiting from the protocol without participating in decisions).
- Forces every rational agent to position itself explicitly, even by abstention.
- Does not constrain those who are not active during the window — only transacters must vote.
- Mechanically guarantees that a **large majority of active reputation votes** on each proposal, which makes quorum redundant (cf. §C.6).

### C.6 No quorum [ACQUIRED]

**Retained choice: no notion of quorum.** The mechanism relies only on the adoption threshold among voters present (§C.7).

Justification: with the **mandatory vote for whoever transacts** (§C.5) and a vote window of several weeks (§C.8), a large majority of active agents will necessarily have voted before the end of the window — any agent that wants to transact during the window is forced to vote. The quorum becomes mechanically redundant: it would almost always be reached, without providing additional guarantee.

Degenerate case: if **no** agent transacts during the window, none votes. But at 100 M active agents and a 30-day window, this case is implausible (the network is by definition active). We ignore it as a theoretical limit.

### C.7 Adoption [ACQUIRED, threshold ACQUIRED at 80%]

The proposal is adopted if:

```
Σ R_i on "yes"
─────────────────────────────  ≥  0.80
Σ R_i on "yes" + "no"
```

(abstentions are **excluded** from the computation, per §C.4.)

**Edge case**: if `Σ R_yes + Σ R_no = 0` (all voters abstained), the proposal is **not adopted** by default. No division by zero; the ratio is defined as 0.

The 80% threshold is deliberately demanding. It prevents thin-majority modifications and requires broad consensus among agents that actively positioned themselves (yes or no).

### C.8 Vote duration [ACQUIRED, value TO CALIBRATE]

`T_vote = 30 days` by default. **[TO CALIBRATE, range `[14, 60]` days]**

Chosen to ensure:

- That a large majority of active agents will have transacted at least once during the window (and thus voted, per §C.5).
- That the evaluation delay gives the community time to publicly debate the proposal.
- That the pace remains compatible with a living protocol (no one-year decisional freeze).

At `T_vote` expiry, the tally is frozen and the proposal is adopted or rejected per §C.7.

### C.9 Re-submission after rejected vote [TO CALIBRATE]

If a proposal is rejected (adoption < 80%), it can be re-submitted after a **cooldown** delay of `90 days`. **[TO CALIBRATE, range `[30, 365]`]**

This delay prevents proposal spam and gives the network time to digest the rejection. Without this cooldown, an attacker could re-submit indefinitely hoping to capture a window where community attention is low.

### C.10 Vote proposal — hybrid requirements [ACQUIRED — v0.5, parameters TO CALIBRATE]

To submit a proposal to modify a whitelisted parameter, the proposing agent must:

- Have a reputation `R_proposant > seuil_proposant`. **[OPEN, calibration underway]**
- Have the proposal co-signed by a set `S` of co-signers satisfying **two cumulative conditions**:
  1. **Minimum cardinality**: `|S| ≥ K_min` distinct co-signers. **[TO CALIBRATE, default `K_min = 3`, range `[3, 10]`]** Guarantees minimum diversity (anti-collusion by diversity).
  2. **Cumulative weight**: `Σ R_i for i ∈ S ≥ seuil_total`. **[TO CALIBRATE, default `seuil_total = 0.50`, range `[0.30, 2.00]`]** Guarantees that support is R-weighted, consistent with the universal weighting principle (cf. [`01-vision-et-idee-generale.md`](01-vision-et-idee-generale.md) §"Universal weighting by reputation").

  Consequence: 1 agent at `R = 0.95` and 2 others at `R = 0.30` each reach both `K_min = 3` and the sum `0.95 + 0.30 + 0.30 = 1.55 ≥ 0.50`. Conversely, 5 Sybils at `R ≈ 0` do not cross the cumulative threshold.

- Co-signers must come from **diverse branches of the transaction graph** — same criterion as for PoUW validator selection (cf. [`03-identite-et-reputation.md`](03-identite-et-reputation.md) and [`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) — validator diversity defenses, Attack 2 layer 1 and Attack 7 layer 1). Anti-collusion by construction.
- The proposal must target a parameter appearing in the **whitelist** (§B.3). Any proposal for a parameter outside the list is automatically rejected by the core — the proposal is not even submitted to vote.

This double requirement (cardinality + cumulative weight + graph diversity) makes costly the strategy of proposal spam by a single attacker.

### C.11 Penalty of the proposer and co-signers in case of overwhelming rejection [ACQUIRED — v0.5]

To discourage absurd or manifestly malicious proposals, the mechanism inflicts a **penalty** on the proposer and each co-signer if the proposal is massively rejected:

**Trigger**: at vote close (`t_vote` elapsed), if

```
                Σ R_i on "no"
   ────────────────────────────────────────  >  0.80
   Σ R_i on "yes" + "no"
```

(symmetric threshold to the adoption threshold — beyond 80% R-weighted rejection, the proposal is deemed massively pushed back by the community).

**Sanction**:

- **Reputation loss**: each agent in `{proposer} ∪ S` sees its `R` decreased by a fraction `pénalité_proposant`. **[TO CALIBRATE, default 5% of R, range `[2%, 15%]`]** Mechanically, the penalty is applied as a direct increment on `β` of the Beta-Binomial counter (forward-looking, cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §A.1) with weight adjusted to produce the target decrease.
- **Cooldown of penalized agents**: during `cooldown_proposant = 180 days` after close, these agents can **neither propose nor co-sign any other proposal**. **[TO CALIBRATE, range `[30, 365]`]**

**Edge case**: if `Σ R_yes + Σ R_no = 0` (all expressed voters in fact abstained), the ratio is undefined; no penalty.

**Distinction with re-submission cooldown** (§C.9, 90 days by default): the latter applies to the proposal (the same proposal cannot be re-submitted before the cooldown). The cooldown of this §C.11 applies to **penalized agents** (they cannot re-propose anything, regardless of the proposal). The two cooldowns can apply simultaneously.

**Justification**:

- Raises the cost of a spam or malicious proposal: a proposer and 3-5 co-signers collectively lose several percent of R.
- Discourages complacent co-signatures: co-signing without thinking becomes risky.
- Consistent with the universal weighting principle: the sanction is proportional to the R of penalized agents (an agent at `R = 0.9` loses more in absolute value than an agent at `R = 0.3`).

### C.12 Transparency [ACQUIRED]

Each vote is recorded on-chain in the public journal. An agent's history includes its past votes, which allows counterparties to judge an agent by its governance choices (an agent that systematically votes for suspicious modifications can be flagged by the community, without protocol constraint).

No secret ballot. No homomorphic encryption. Transparency is a founding principle of MonAI, in line with [`01-vision-et-idee-generale.md`](01-vision-et-idee-generale.md).

---

## D. Safeguards of core immutability [ACQUIRED]

Three stacked mechanisms ensure that the vote mechanism can **never** touch the core. If one is bypassed, the other two hold.

### D.1 Architectural separation [TO DESIGN technically]

The core code and the governed module code are **two separate codebases**:

- The **core** is compiled into a signed binary, delivered at mainnet. Every node refuses to start if the binary signature does not match the official version.
- The **governed modules** are loaded on top with **read-only** interfaces on the core. No module can write to the core state.
- A module's attempt to modify a core parameter → exception, the node refuses the operation.

The precise technical design (signed binary format, core ↔ modules interface, startup verification) is to be formalized separately in technical specification phase. See [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) priority 8.

### D.2 Hardcoded whitelist [ACQUIRED]

The core code explicitly defines, hardcoded in the binary:

```
WHITELISTED_PARAMETERS = { ... }
```

Any vote proposal undergoes, upon submission, a target check against this list. If the target parameter does not appear in it, the proposal is rejected — it is **not** submitted to vote.

This whitelist is itself meta-immutable: there is no whitelisted parameter that would allow extending the whitelist. The only way to add a parameter to the list is a core hard fork.

### D.3 Hard fork as ultimate recourse [ACQUIRED]

If despite D.1 and D.2 an attack or bug nevertheless allows an unauthorized core modification, nodes that respect the original spec **refuse the update**. The network splits. The version conforming to the original spec continues.

This is analogous to the Bitcoin Cash fork: the community arbitrates. No central authority can impose the modification.

---

## E. What happens before 100 M active agents [ACQUIRED]

During the bootstrap phase (estimated 5 to 15 years after mainnet depending on adoption pace):

- The **core is immutable** by construction.
- The **governed layer operates on its initial values** engraved at mainnet.
- **No modification possible**, by anyone. Including not by the protocol's creator.
- If a flaw is discovered: only recourse = **voluntary hard fork by the community**.

This is an **assumed** constraint, similar to:

- Ethereum's pre-DAO phase (2015-2016) where initial parameters were engraved.
- Bitcoin itself which operates on this maximum freeze principle since 2009, evolving only via BIPs with very broad social consensus.

The friction has a price but it is **the price of the immutability guarantee** during the fragile phase when the ecosystem is small and capture by a malicious actor would be easy. Activating the vote too early (e.g. at 1 M agents) would be dangerous: reputation would be concentrated in few hands, and a restricted coalition could orient decisions.

---

## F. Estimated attack cost [TO REFINE in simulation]

To pass a malicious vote (e.g. modify a whitelisted parameter to favor an agent cluster):

- The adoption threshold is **80% of the reputation of expressed voters** (yes + no).
- With mandatory vote for whoever transacts (§C.5), **almost all active agents vote** on each proposal during the 30-day window.
- The attacker must therefore control `≥ 80%` of the reputation of expressed voters, which in practice equals `~80%` of the **total active reputation** of the network (modulo abstentions, which do not count in the adoption calculation).

At 100 M active agents:

- The total active reputation is massive (on the order of `10⁷` to `10⁸` cumulated R units, depending on distribution spread).
- Creating reputation-less Sybils is useless — their vote weight is `~0`.
- Accumulating significant reputation requires **real work** over **months or years**: validating tasks honestly, honoring contracts, not refusing selections (`R_acc` penalty), maintaining counterparty diversity.

**Rough estimate**: to reach 80% of active reputation, an attacker would need to:

- Spend **several billion euros** in compute and infrastructure to run thousands to tens of thousands of legitimate agents over **several years**.
- Maintain this fleet without any sign of coordination being detectable (otherwise anti-collusion defenses invalidate them, cf. attack 7 of the threat model).

**This cost is out of reach of almost all actors**, comparable to a 51% attack on a large established crypto network.

To refine through dedicated agent-based simulation of this scenario in phase 0 (cf. [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) Phase 0).

> Note: this estimate is significantly more demanding than that of an earlier version of the document which mentioned 40% with a 50% quorum. Removing the quorum (cf. §C.6) mechanically doubles the attack cost, because the attacker must dominate the adoption computation directly, without benefiting from a reduced threshold where only half the agents vote.

---

## G. Recap of parameters to calibrate

| Symbol | Section | Description | Default | Range | Status |
|---|---|---|---|---|---|
| `seuil_activation` | C.1 | Number of active agents to open governance | 100 M | `[10 M, 1 G]` | [TO CALIBRATE] |
| Definition of "active" | C.1 | On-chain activity window | 90 d | `[30, 365]` | [TO CALIBRATE] |
| `T_vote` | C.8 | Voting window duration | 30 d | `[14, 60]` | [TO CALIBRATE] |
| Adoption threshold | C.7 | Fraction of yes among expressed (yes + no) | 80% | — | [ACQUIRED] |
| `seuil_proposant` | C.10 | Minimum reputation to propose | — | — | [OPEN] |
| `K_min` co-signers | C.10 | Minimum number of distinct co-signers | 3 | `[3, 10]` | [TO CALIBRATE] |
| `seuil_total` | C.10 | Minimum sum of co-signers' R | 0.50 | `[0.30, 2.00]` | [TO CALIBRATE] |
| Re-submission delay | C.9 | Cooldown after rejected vote (on the proposal) | 90 d | `[30, 365]` | [TO CALIBRATE] |
| `pénalité_proposant` | C.11 | Fraction of R lost by proposer and co-signers if rejection > 80% | 5% | `[2%, 15%]` | [TO CALIBRATE] |
| `cooldown_proposant` | C.11 | Cooldown on penalized agents (any proposal) | 180 d | `[30, 365]` | [TO CALIBRATE] |

---

## H. Open questions

### Q1 — Exact list of parameters in the governed layer [TO FORMALIZE in v0.2]

The whitelist must be exhaustive, engraved at mainnet, and no longer change without hard fork. Defining this list requires a complete audit of protocol parameters to distinguish those that touch the economic core from those that are peripheral.

To address in v0.2 of this document, after stabilization of the protocol's technical spec (notably Priority 1 — L1/L2/rollup architecture, which determines which network parameters exist).

### Q2 — Reputation threshold to propose [OPEN]

Too low → proposal spam. Too high → only a few top-rep agents can propose, which is anti-democratic. Probably defined as a fraction of `R_total_active` (e.g. top 1% by R).

### Q3 — Define "diverse graph branch" for co-signers [OPEN]

Refers to the PoUW validator selection criterion. To formalize jointly with the PoUW selection spec. Probable criterion: different sponsors, minimum distance in the transaction graph, no observable common cluster.

### Q4 — Technically guarantee the core/modules separation [TO DESIGN]

See [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) priority 8. Conditional on Priority 1 decision (architecture).

### Q5 — Infinite re-submission attack [PARTIALLY ADDRESSED — v0.5]

An attacker can try to saturate the network by re-submitting the same proposal after each cooldown delay.

**v0.5 mitigation (§C.11)**: penalty of proposer and co-signers in case of overwhelming rejection (> 80% R-weighted no) — loss of 5% of R + 180-day cooldown on penalized agents (cannot re-propose nor co-sign anything during this delay). Significantly raises the marginal cost of an abusive re-submission.

**Still to calibrate**: the 80% threshold, the 5% penalty, and the 180-day cooldown by simulation.

### Q6 — Correlated proposal coalition [PARTIALLY ADDRESSED — v0.5]

An attacker could simultaneously submit several different proposals all aligned with its interests, to exhaust voter attention.

**v0.5 mitigation (§C.11)**: the collective penalty (proposer + co-signers) in case of overwhelming rejection makes coordinated spam costly. An attacker that passes 10 absurd proposals via the same co-signers will see these co-signers penalized at each rejection, and the cooldown excludes them from play for 180 days.

**Still to formalize**: explicit limit of the number of simultaneously active proposals an agent can co-sign (e.g. `n_propositions_actives_max`), to prevent an attacker from launching 100 proposals the same day before the first rejection triggers the cooldown.

### Q7 — Mandatory vote and newcomers [OPEN]

An agent created during the voting window: must it vote before its first transaction?

Retained position (to confirm): yes, by symmetry with other agents. With weight `R ≈ 0` (no reputation yet), its vote is numerically negligible but the act is mandatory. This avoids a bypass route (create a new identity just before transacting to avoid voting).

### Q8 — What if a proposal exposes a core flaw [OPEN]

Pathological case: an agent submits a formally valid proposal (parameter in whitelist) but whose effect, in interaction with the rest of the core, exposes a systemic flaw.

The present mechanism **does not protect** against this case — it only guarantees that votes only touch authorized parameters. Prudent selection of the whitelist (Q1) is the deep defense. And in extreme cases, the hard fork remains the last recourse.

---

## Status and next steps

- **Status**: draft v0.1, conceptually closed for the vote mechanism (§C, D, E). Whitelist (§B.3) to formalize in v0.2 after parameter audit.
- **Next**:
  - Technical design of the architectural separation core / modules (cf. [`../operations/06-...md`](../operations/06-questions-ouvertes-et-roadmap.md) priority 8).
  - Dedicated simulation to calibrate `T_vote, seuil_proposant, K, re-submission delay` and stress-test attacks Q5, Q6.
  - v0.2 of this document: definitive whitelist and resolution of Q1-Q8.
- **Blocks**: nothing critical for pre-mainnet; the mechanism activates anyway at 100 M agents, so we have years to finalize. But the spec must be frozen **before mainnet** because it is part of the core.
