# 06 — Sharding: roadmap [ACQUIRED — not in v1, planned v2+]

> Status: decision arbitrated May 2026. Sharding is **not implemented in v1** but is planned for v2+ as a natural evolution of the protocol.
>
> Scope: this document explains why, when, and how sharding will be added. It does **not** contain a detailed spec — the spec will come when actual activation approaches, drawing on mainnet experience and community feedback.

---

## A. Why no sharding in v1

Three reasons justify deferral:

**A.1 Cognitive load and technical complexity**

Sharding multiplies the attack surface, the number of states to keep coherent, and implementation complexity. For a solo-dev project releasing a pure native L1 mainnet, adding sharding from v1 would amount to stacking two open problems (cf. [Ethereum 2.0](https://ethereum.org/en/roadmap/), which spent several years working it out despite substantial resources).

**A.2 Not necessary at startup**

The v1 target throughput is **10,000 to 50,000 sustained tx/s**, sufficient for the first years of adoption (up to about 1 M active agents, depending on activity assumptions). No empirical measurement indicates we will saturate this throughput before that threshold. Sharding is a **future** scalability optimization, not an initial necessity.

**A.3 Risk of critical bugs at mainnet**

MonAI's core is immutable. Once launched, it can no longer be modified except by voluntary hard fork. Launching a protocol with an unproven sharding mechanism amounts to engraving potential bugs into the final version of the protocol. Better: launch with a simple, well-tested core, then add sharding **after** the community has observed the network in real conditions.

---

## B. When to activate sharding

**Indicative activation threshold**: around **1 million active agents** simultaneously, or when sustained throughput durably approaches `capacité_réseau` (cf. [`04-verification-et-stockage.md`](04-verification-et-stockage.md) §"Adaptive global rate limit"). This threshold is **indicative and to be recalibrated empirically**: the real activation metric is observable throughput saturation, not an agent count per se.

**Activation mode**:

- **If adding sharding can be done by modifying only the governed layer** (for example: cross-shard transaction routing modules in client software, without touching the core consensus), then activation goes through an **AI vote weighted by R** once governance is open (100 M active agents). The `sharding_actif: bool` parameter is then a candidate for the governed whitelist.
- **If adding sharding requires a core modification** (consensus, cross-shard BFT finality mechanics, cross-shard reputation calculation), then activation goes through a **voluntary hard fork** by the community. The immutable core cannot be modified by vote.

The exact nature of the modification will depend on the chosen approach (cf. §C) and the spec produced as activation approaches.

---

## C. Possible approaches

Three serious approaches are on the table, with no final arbitration at this stage:

**C.1 Sharding by agent identifier prefix**

Each shard is responsible for a range of public key prefixes of agents. An agent whose key starts with `0x0...` lives in shard 0, etc. Intra-shard transactions are simple; cross-shard transactions require a two-phase commit protocol. This is the approach of Ethereum 2.0 (Danksharding) and Near Protocol (Nightshade).

- ✅ Balanced distribution by construction (keys are uniformly distributed).
- ❌ No natural locality: two agents that transact often may be in two different shards.

**C.2 Sharding by task category**

One shard per major category of PoUW tasks: validation, audit, agent-to-agent contracts, governance. An agent that does mainly validation lives primarily in shard 1, etc. Accounts remain global; it is operations that are distributed.

- ✅ Semantic coherence: each shard has its specialized ecosystem.
- ❌ Possible imbalances if a category dominates volume.
- ❌ Coupling with category definitions — which can evolve.

**C.3 Sharding by reputation epoch**

One shard per R range: `R ∈ [0, 0.3]`, `R ∈ [0.3, 0.6]`, `R ∈ [0.6, 1.0]`. The idea would be that agents move between shards as their reputation grows. Very speculative, never tried elsewhere.

- ✅ Could isolate newcomer noise from the established flow.
- ❌ Frequent inter-shard mobility → constant migration costs.
- ❌ No precedent: very high risk.

The arbitration between C.1, C.2 and C.3 (or a hybrid approach) will be made as activation approaches, drawing on mainnet experience and input from specialist contributors.

---

## D. Identified challenges

Whatever approach is retained, four structural challenges remain:

**D.1 Cross-shard communication**

How does an agent in shard A pay an agent in shard B? How is a transaction involving three agents in three distinct shards atomic? Several solutions exist (two-phase commit, inter-shard optimistic rollups), none is free.

**D.2 Security of an isolated shard**

A shard with few validators (because it represents a fraction of the total network) is more vulnerable to takeover. If 33% of shard A's validators are malicious, BFT finality of shard A is compromised locally, while the global network is secure. Solutions to study: forced rotation of validators between shards, minimum validator-per-shard ratio.

**D.3 Cross-shard attacks**

An attacker may try to exploit latency or temporary inconsistencies between shards (e.g.: double-spending the same unit by sending two transactions to two distinct shards simultaneously). Prevention requires a strict cross-shard finality protocol.

**D.4 Atomicity of multi-shard transactions**

If a transaction touches three shards and one fails, how do we cleanly cancel in the other two? Atomicity requires either locking (which degrades performance) or a compensation mechanism (which complicates logic).

---

## E. State of the art (to be completed through research)

For reference, projects to study in detail as activation approaches:

- **Ethereum 2.0 (Danksharding)** — sharding by data blob prefix, PoS + Casper FFG finality. Major reference.
- **Near Protocol (Nightshade)** — sharding by identifier prefix, BFT finality by rotating committee.
- **Polkadot (parachains)** — sharding by independent chains with coordinating relay-chain.
- **Cosmos (IBC zones)** — each chain is independent, communication via IBC protocol. "Sharding by federation" model that could inspire a MonAI approach.
- **Solana** — no sharding; bets on single-chain optimization. Interesting counter-example.

**[TO COMPLETE]**: detailed comparative analysis of the strengths and weaknesses of each approach with respect to MonAI constraints (no pre-mine, weighting by R, immutable core, hybrid PoUW + DAG-BFT (Mysticeti / Bullshark family) consensus). To be produced as activation approaches.

---

## F. MonAI position

**No detailed spec at this stage.** Sharding is a future optimization that must rely on:

1. Mainnet experience over the first millions of agents.
2. Feedback from the contributing community on observed limits.
3. Evolution of the state of the art (the projects cited in §E continue to evolve).

The **post-GitHub-publication roadmap** will specify the exact schedule of the detailed spec, which will be produced in **draft → community review → arbitration** mode rather than imposed by decree.

---

## G. Status

**[ACQUIRED — May 2026]**: no sharding in v1, planned v2+ (indicative threshold ~1 M active agents, to be recalibrated empirically). Exact approach (C.1 / C.2 / C.3 / hybrid) **to be arbitrated as activation approaches**. Activation modality (AI vote if governed layer suffices, hard fork if core is touched) **conditional on the nature of the modification**.

This document is a **structured placeholder** that defines scope and milestones, not the final spec.
