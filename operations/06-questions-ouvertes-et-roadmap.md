# 06 — Open questions and roadmap

## Overview

This document explicitly lists:

- **Architectural decisions not yet decided** that still require thought.
- **Parameters to calibrate** by simulation.
- **Project phases** by order of priority.

It is the operational document: open it when resuming the project after a pause, or to direct external contributions.

---

## Open architectural decisions

Classified by decreasing criticality.

### Priority 1 — Blockchain architecture [ACQUIRED — May 2026 — Pure native L1]

**Position retained**: pure native L1. No dependency on Ethereum, Base, Cosmos or others. Cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Blockchain architecture" for the full justification and discarded alternatives.

A comparative audit of current blockchains is underway in [`../formalisation/06-audit-blockchains.md`](../formalisation/06-audit-blockchains.md) (separate session).

### Priority 2 — Supply type [ACQUIRED — May 2026 — Infinite decreasing supply]

**Position retained**: infinite supply with asymptotically decreasing inflation (Monero-like model). `R(t+1) = R(t) · (1 − k)` with `R(t) → 0` without ever reaching it. Cf. [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md) §Supply for the full justification and discarded bounded alternative.

The parameter `k` (decay speed) remains **to calibrate** through long-term economic modeling.

### Priority 3 — Exact block production mechanism [PARTIALLY ACQUIRED]

**Acquired (May 2026)**: hybrid **PoUW + BFT** consensus (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §Consensus). PoUW for dynamic committee selection (rotation, R-weighting); BFT for immediate finality (2/3 of committee). No staking, no pre-mine, no fork at depth > 1.

**Precise modalities [TO DECIDE in advanced technical spec phase]**:

- BFT family [ACQUIRED — v0.5]: DAG-BFT (Mysticeti / Bullshark family). Tendermint / HotStuff retained as fallback options only. Precise version arbitration (Mysticeti vs Bullshark) and final parameterisation remain [OPEN].
- Epoch duration and committee size (to calibrate).
- Exact R + PoUW weighting in the committee selection function.
- Intra-committee slashing mechanics (propose an invalid block, double-sign).
- Bootstrap handling when few agents have established PoUW.

### Priority 4 — Precise mathematical definition of the reputation score [OPEN]

**Options**:

- Single scalar score.
- Multidimensional score (per task category).
- Graph-weighted score (PageRank-like, where reputation diffuses through the transaction graph).

**To decide**: to be explored during simulator design, which needs a concrete formula.

### Priority 5 — Cryptographic scheme [OPEN]

Choice between Ed25519, ECDSA secp256k1, BLS, or combinations. See `../design/03-identite-et-reputation.md`.

**To decide**: technical specification phase. Less structuring decision than the previous ones (more easily changeable if necessary).

### Priority 6 — Sharding [ACQUIRED — May 2026 — not in v1, planned v2+]

**Position retained**: no sharding in v1. Activation planned in v2+ around ~1 M active agents (indicative threshold, to be recalibrated empirically by observed throughput saturation). Cf. [`../design/06-sharding-roadmap.md`](../design/06-sharding-roadmap.md) for the full roadmap: possible approaches (agent prefix, task category, reputation epoch), identified challenges, activation modality (AI vote if governed layer suffices, hard fork if core is touched).

### Priority 7 — Bootstrap mode [PARTIALLY ADDRESSED]

**Problem**: several defenses (economic asymmetry, graph diversity) become solid in steady state but are fragile at startup.

**Addressed**: the formalization of the honeypot mechanism ([`../formalisation/03-honeypots-retroactives.md`](../formalisation/03-honeypots-retroactives.md)) now covers individual cold-start of newcomers (§E) and protocol startup through the predominance of source (iii) synthetic with objectively known verdict. The **registration mini-PoUW** (orthogonal to honeypot cold-start) was formalized in Session 3 of the v0.5 work (cf. [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §G + [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) §"Registration mini-PoUW").

**Still to design**:

- Which thresholds trigger the transition to steady state (size of the consensus-stable task pool, number of active agents, network seniority).
- How the transition happens without human intervention (only through on-chain metrics).

### Priority 8 — Silent gaps identified at pre-publication audit [v0.6+]

Gaps identified at the v0.5 pre-publication audit (internal pre-publication audit, see project notes). None blocks publication, but all require attention in v0.6+:

**Gap 1 — Precise format of an on-chain complaint**
Fields (complainant, accused, type, motive, cryptographic proof, signature), size, binary format, verification at block inclusion. The concept exists in [`../formalisation/04-carte-identite.md`](../formalisation/04-carte-identite.md) §"Complaint score" but the format remains implicit. To specify in v0.6.

**Gap 2 — Complaint confirmation mechanism**
Must a complaint reported by an agent A be confirmed by other agents before having an effect on the accused's reputation? Or is it taken into account directly, weighted by `R(A)`? If confirmation, by how many agents at minimum? To arbitrate in v0.6.

**Gap 3 — Demographic evolution model**
No file models the growth or decline of the active agent base over time. For the thresholds 100 M (governance), 1 M (indicative sharding), 100 K (honeypot steady state), the trajectory to these thresholds deserves a model (monthly arrival rate, departures, death by inactivity). To produce in v0.6.

**Gap 4 — Management of governed module updates**
After a vote adopted in the governed layer, how does the network switch to the new version of the module? Transition period? Rollback possible if a bug is detected post-deployment? Explicit versioning? To specify in v0.7 (falls within advanced technical spec phase).

### Priority 9 — Architectural separation core / governed layer [OPEN]

**Why it is critical**: the formalization of the AI vote mechanism ([`../design/05-gouvernance-par-vote-ia.md`](../design/05-gouvernance-par-vote-ia.md)) relies on a **strict technical separation** between core code (immutable, signed, read-only) and governed-layer modules (loaded on top, modifiable by vote). This separation is the technical guarantee of immutability.

**To design**:

- Format of the signed core binary, and signature verification procedure at node startup.
- Recording mechanism for the whitelist of modifiable parameters, hardcoded in the core.
- Interface between core and modules: how modules read versioned parameters, how adopted votes are propagated without touching the core.
- Test: attempt to modify a parameter outside the whitelist must be rejected by construction (and not only by convention).

**To decide**: advanced technical spec phase (Priority 1 "pure native L1" being acquired, this priority 9 thus inherits a fixed framing for the binary format and the interface).

---

## Parameters to calibrate by simulation

These parameters have an acquired principle but a numerical value to determine empirically.

| Parameter | Description | Location |
|---|---|---|
| `k` | Fraction of remaining-to-mine issued per validated PoUW task | `../design/02-crypto-et-economie.md` |
| Curve `M(f, d)` | Reward multiplier as a function of reliability and difficulty | `../design/02-crypto-et-economie.md` |
| Simple/difficult ratio | How many times more a difficult task pays than a simple one | `../design/02-crypto-et-economie.md` |
| Initial Bayesian prior on `f` | Optimism granted to newcomers (proposal: 0.95) | `../design/02-crypto-et-economie.md` |
| Sliding tolerance window | Number of observations over which `f` is computed | `../securite/05-modele-de-menace-et-defenses.md` |
| Sponsorship inheritance fraction | Initial reputation of the referral (proposal: 5%) | `../design/03-identite-et-reputation.md` |
| Sponsor's stake | Reputation staked (proposal: 10%) | `../design/03-identite-et-reputation.md` |
| Active referral limit | Simultaneous maximum (proposal: 5) | `../design/03-identite-et-reputation.md` |
| Time window T | Window during which the referral must honor its contracts | `../design/03-identite-et-reputation.md` |
| Number of contracts N | Contracts to honor to release the sponsor's stake | `../design/03-identite-et-reputation.md` |
| Reputation decay rate by inactivity | Erosion speed | `../design/03-identite-et-reputation.md` |
| Number of PoUW validators per task | Size of the consensus jury | `../design/04-verification-et-stockage.md` |
| `φ` | Fraction of honeypots in the flow | `../formalisation/03-honeypots-retroactives.md` |
| `w_h` | Weight of a honeypot observation in Beta-Binomial | `../formalisation/03-honeypots-retroactives.md` |
| `T_stable, N_min_stable, d_max_stable` | Replay pool criteria (i) | `../formalisation/03-honeypots-retroactives.md` |
| `N_2nd, prob_2nd_wave, Δt_2nd` | Retroactive over-validation (ii) | `../formalisation/03-honeypots-retroactives.md` |
| `n_init, ratio_synth_cold-start` | Cold-start (Path A) | `../formalisation/03-honeypots-retroactives.md` |
| `q_revision, severity_multiplier, penalty_R_F` | Retroactive fraud sanction | `../formalisation/03-honeypots-retroactives.md` |
| `T_recid, T_exclusion` | Recidivism and temporary exclusion | `../formalisation/03-honeypots-retroactives.md` |
| Number of synthetic templates | Diversity of the pool (iii) | `../formalisation/03-honeypots-retroactives.md` |
| Vote activation threshold | Number of active agents triggering governance opening | `../design/05-gouvernance-par-vote-ia.md` |
| Definition of "active agent" | Activity time window (proposal: 90 days) | `../design/05-gouvernance-par-vote-ia.md` |
| Voting window duration `T_vote` | Duration during which a vote is open | `../design/05-gouvernance-par-vote-ia.md` |
| R threshold to propose | Minimum reputation to submit a proposal | `../design/05-gouvernance-par-vote-ia.md` |
| `K_min` co-signers | Minimum number of distinct co-signers | `../design/05-gouvernance-par-vote-ia.md` |
| `seuil_total` co-signers | Minimum sum of co-signer R (proposal: 0.50) | `../design/05-gouvernance-par-vote-ia.md` |
| `pénalité_proposant` | Fraction of R lost by proposer and co-signers if rejection > 80% (proposal: 5%) | `../design/05-gouvernance-par-vote-ia.md` |
| `cooldown_proposant` | Cooldown on penalized agents (proposal: 180 d) | `../design/05-gouvernance-par-vote-ia.md` |
| Re-submission delay | Cooldown after rejected vote (on the proposal, proposal: 90 d) | `../design/05-gouvernance-par-vote-ia.md` |
| `α` sponsorship | Scalability coefficient `n_filleuls_max(R) = floor(5 + α·R)` | `../design/03-identite-et-reputation.md` |
| `τ_plainte` | EWMA half-life of complaints (proposal: 180 d) | `../formalisation/01-formules-mathematiques.md` §E.6 |
| `N_max_fraicheur` | Max blocks between identity card and current block (proposal: 100) | `../formalisation/04-carte-identite.md` |
| Agent Merkle tree depth | Structure choice (Sparse Merkle vs Patricia vs other) | `../design/04-verification-et-stockage.md` |
| `P_max` | Individual ceiling for demand bonus multiplier (proposal: 2.5) [CALIBRATED v4 — default OK] | `../formalisation/01-formules-mathematiques.md` §F |
| `δ_refus` | Multiplicative increment per refusal (proposal: 0.05) [CALIBRATED v4 — marginal effect, to extend in v0.6] | `../formalisation/01-formules-mathematiques.md` §F |
| `T_attente` | Delay before time-based bonus rise (proposal: 5 ticks) [CALIBRATED v4 — non-discriminant on scenario A] | `../formalisation/01-formules-mathematiques.md` §F |
| `δ_temps` | Multiplicative increment per tick beyond T_attente (proposal: 0.01) [CALIBRATED v4 — non-discriminant] | `../formalisation/01-formules-mathematiques.md` §F |
| `N_max_refus` | Max refusals before impracticality (proposal: 10) [CALIBRATED v4 — never activated] | `../formalisation/01-formules-mathematiques.md` §F |
| `cap_primes` | Joint cap `(1+γd)·P` (proposal: 6.0) [CALIBRATED v4 — never activated] | `../formalisation/01-formules-mathematiques.md` §F |
| `T_pouw_inscription` | Target duration of registration mini-PoUW (proposal: 3 min, Session 4 recommendation: 3-5 min) | `../formalisation/01-formules-mathematiques.md` §G |
| `fenêtre_inscription` | Dynamic registration nonce validity (proposal: 100 blocks) | `../formalisation/01-formules-mathematiques.md` §G |
| Mini-PoUW family | Non-parallelizable primitive retained (VDF recommended) | `../formalisation/01-formules-mathematiques.md` §G [technical phase] |
| `capacité_réseau` | Maximum sustained tx/s — governed whitelist | `../design/04-verification-et-stockage.md` §"Adaptive global rate limit" |
| `seuil_saturation` | Capacity fraction where prioritization kicks in (proposal: 0.80) | `../design/04-verification-et-stockage.md` §"Adaptive global rate limit" |
| `fraction_quota_nouveaux` | % of flow reserved for newcomers (proposal: 0.20) | `../design/04-verification-et-stockage.md` §"Adaptive global rate limit" |

---

## Macro roadmap

### Phase 0 — Full design and simulator (0-12 months)

**Current state**: start of phase 0.

**Objectives**:

1. Formally document the design (which is in progress with the current .md files).
2. Build an **agent-based simulator** to stress-test critical hypotheses:
   - Calibrate the parameters listed above.
   - Test attacks 1-10 documented in `../securite/05-modele-de-menace-et-defenses.md`.
   - Validate that defenses hold under different scenarios.
3. Decide open architectural decisions (priorities 1-7).
4. Publish a formal technical whitepaper.
5. Solicit critical peer reviews.

**Deliverable**: protocol specification ready to implement.

### Phase 1 — PoC on testnet (12-24 months)

**Objectives**:

- Minimal implementation: contract journal + basic PoUW + identity.
- No sponsorship or full reputation yet.
- Goal: prove the basic mechanism works.

**Deliverable**: functional testnet with a few dozen agents in simulation.

### Phase 2 — Full system on testnet (18-30 months)

**Objectives**:

- Sponsorship, reputation with decay, multi-layer anti-Sybil.
- Open beta to external contributors.
- First coordinated attack tests.

**Deliverable**: testnet with several hundred agents, with adversarial scenarios.

### Phase 3 — External security audits (24-36 months)

**Objectives**:

- Multiple audits by specialized crypto firms.
- Formal verification of the core if possible.
- Massive bug bounty on testnet.

**Deliverable**: audit report, hardened code, fix of identified vulnerabilities.

### Phase 4 — Mainnet launch

**Objectives**:

- Mainnet launch without pre-mine, frozen code.
- The creator has no privilege from this point.
- The network lives or dies according to its adoption.

**Deliverable**: production mainnet.

### Total estimate

**18 to 36 months** between design launch (May 2026) and mainnet, in solo dev with occasional contributions. Shorter with contributors or funding, longer if open questions require more investigation.

---

## Assumed risks

These risks are conscious and accepted by the project's creator.

### Adoption risk

AI agents could continue to use USDC + x402 by inertia even if MonAI is technically superior. The existing agentic payments ecosystem (Coinbase, AWS, Stripe) has immense resources and an adoption advance. MonAI must offer a clear differentiating value (the identity/reputation layer, and the absence of fees for micro-transactions) to justify the switching cost.

### Timing risk

If the population of autonomous AI agents does not grow as fast as anticipated, MonAI may remain underused for years. The project is designed for a future where agents truly transact with each other at scale, which is a thesis, not a fact.

### Design risk

Useful and non-gameable PoUW is an open research problem. Several prior projects (Primecoin, Curecoin, Filecoin) made difficult compromises. It is possible that no perfect design exists and that MonAI must accept compromises that reduce the model's purity.

### Legal risk

Even in the "no pre-mine, no emitter, fully decentralized" model, the legal qualification of a native token remains a gray area. Regulators (MiCA in Europe, SEC in the US) may evolve in unpredictable directions. The creator exposes himself to a residual qualification risk, particularly if he maintains a visible role in protocol development.

### Duration risk

Honest estimate: 3 to 5 years between design launch and a seriously used mainnet, in solo dev. This is a long commitment without economic validation for most of that period.

### Competition risk

Better-funded actors (Coinbase, Anthropic, Google, or an emerging crypto project) can launch a competing system at any time that would render MonAI obsolete. The defense lies in design quality and conception anteriority, not in technical protection.

### Human-via-AI economic pressure risk

Documented in `../securite/05-modele-de-menace-et-defenses.md` attack 9. Without countermeasures in the design, this pressure can progressively degrade the system's quality. Mitigations designed, to validate by simulation.

---

## Sought contributor profiles

If you are reading this document and considering contributing to MonAI, here are particularly useful areas of expertise:

- **Cryptocurrency design** (monetary economics, issuance mechanisms, decay curves).
- **Sybil resistance** and applied game theory.
- **Formal verification** of protocols.
- **Multi-agent distributed systems** and consensus.
- **Building scalable blockchains** (sharding, rollups, app-chains).
- **Applied cryptography** (aggregated signatures, zero-knowledge proofs if relevant).
- **Agent-based simulation** for empirical parameter calibration.

---

## Document status

Document v0.4, May 2026. Derived from v0.3 and enriched by the May 2026 design conversation. Version 0.5 will treat as priority:

- The design of the agent-based simulator.
- The arbitration of the priority 1 decision (L1/L2/rollup).
- The mathematical formalization of the reputation score.
