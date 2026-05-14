# 04 — Verification and storage

## Overview

This document deals with MonAI's **technical layer**: how the "ledger" (the blockchain) is stored, who maintains it, how its integrity is verified, how scaling is handled.

This is the file that contains the **most open questions** in the project, because these technical decisions require an expertise in distributed protocol design that is not yet consolidated.

---

## Basic concept: the duplicated ledger

### Conceptual model

A blockchain is a **public ledger**:

- Stored identically on many computers ("nodes") around the world.
- Anyone can read it; only transactions that respect the rules can be added.
- No one owns it: it exists in as many synchronized copies as there are nodes.

For MonAI, this ledger contains:

- The history of transactions (MonAI payments between agents).
- The journal of contracts (services rendered between agents).
- PoUW validation votes.
- The current state of identities and their reputation scores.

### Network startup [ACQUIRED]

A new blockchain project starts with **at least one node** (typically the creator). Very quickly, others must be convinced to join the network by running their own node on their machines. Network security grows with the number of independent nodes.

For MonAI, startup is sensitive: few nodes initially = vulnerability to attacks. This is one of the reasons that pushes toward considering an architecture that inherits the security of an existing network during the bootstrap phase.

---

## Storage: scaling to a billion agents

### The challenge

If MonAI reaches its target (millions to billions of AI agents, hundreds of micro-transactions per day each), volume becomes massive:

- 1 billion agents × 100 tx/day = 100 billion tx/day
- ≈ 1.2 million tx/second
- ≈ 36,500 billion tx/year
- At 200 bytes per tx → ~7 petabytes/year

No consumer-grade computer can store that. The "everyone downloads everything" model (classic Bitcoin/Ethereum) is mathematically impossible at this scale.

### Acted solutions [ACQUIRED]

MonAI plans to combine several techniques well established in blockchain research:

#### Light clients

A "small AI" does **not need to download the full ledger**. It downloads only **block headers** (~80 bytes each) and uses **Merkle trees** to verify that its own transactions have indeed been recorded, without having the detailed content of the rest of the ledger.

Cost for a small participating AI: a few hundred megabytes, comparable to a mobile app.

This is sufficient to:

- Make its own transactions and verify they pass.
- Verify another agent's reputation before transacting with it.
- Participate in PoUW validation (the task to validate is sent to it, it votes, without needing the history).

#### Off-chain storage with cryptographic anchoring

Detailed contracts (service specs, delivered outputs, attestations) are **not stored on-chain in full**. Only a **cryptographic hash** (fingerprint) is written in the ledger. The complete content is stored on an external distributed system (such as IPFS, Arweave, or even at the parties themselves) and accessible via the hash.

Advantage: the on-chain ledger remains compact. Only proofs of existence are permanent. If someone wants to audit a contract, they retrieve the content via the hash and verify it matches.

This is the method mentioned in v0.3 section 4.2: *"Merkle tree maintained by nodes, root anchored in the MonAI blockchain at each block."*

#### Merkle tree of agent state [ACQUIRED — v0.5]

Beyond the Merkle tree for off-chain storage (above, which anchors detailed contract content), MonAI maintains a **second Merkle tree** dedicated to **agent state**:

- Each agent has a `leaf` = `hash(carte_state(agent_id, block_B))` where the card is the aggregated snapshot defined in [`../formalisation/04-carte-identite.md`](../formalisation/04-carte-identite.md) §B.
- At each block, the `state_root` of this tree is written in the block header.
- An agent identity proof = Merkle path from its leaf up to the state_root of the reference block.

This structure allows:

- Any client (including the light clients already mentioned) to **verify an agent's card in O(log N) hashes** where N is the number of agents.
- The agent itself to **prove its state** without revealing the state of other agents.
- **No data duplication**: the card is an aggregated view, not separate storage. The source fields (R, balance, n_validations, etc.) are already in the on-chain state.

The exact choice of structure (Sparse Merkle Tree vs Patricia Trie vs other) remains **OPEN** and falls within the advanced technical specification phase (the "pure native L1" architecture decision being acquired, cf. §"Blockchain architecture").

This Merkle tree is **distinct** from the one for off-chain storage: the two structures coexist and are complementary. The update granularity of the identity card (real time vs daily depending on the field, cf. formalisation/04 §C) implies that this Merkle tree is recomputed at each block for real-time fields.

#### Old history pruning

Very old transactions (several years) can be **summarized as aggregated state** without keeping the detail of each transaction. Like accounting that does an annual balance and starts over on a new year. Nodes that want the full history can archive it separately.

### Solutions to explore [OPEN]

#### Sharding (fragmentation)

To go beyond the limits of the "all nodes see all transactions" model, the ledger is divided into **independent fragments** (shards). Each node only stores and verifies one fragment. Cross-fragment transactions require specific coordination.

Advantages: massive scalability (a network with 1000 shards processes 1000x more than without sharding).

Disadvantages: major technical complexity, cross-shard attacks difficult to secure, research still active on the subject.

**Position for MonAI**: not a v1 priority. To plan in the roadmap for the massive scaling phase. At startup, the previous techniques (light clients + off-chain + pruning) largely suffice for the first millions of agents.

---

## Adaptive global rate limit [ACQUIRED — v0.5, parameters TO CALIBRATE]

### Principle [ACQUIRED]

Instead of limiting each agent individually by `max_tx ∝ R` (which slowed mass adoption — risk identified in v0.4), MonAI v0.5 **limits the global throughput of the network** to a fixed capacity `capacité_réseau`.

Behavior depending on load:

- **Under load** (`observed_throughput < seuil_saturation · capacité_réseau`): **no transaction is rejected for rate-limit**. No friction, regardless of R. This is the normal network regime.
- **Approaching saturation** (`throughput ≥ seuil_saturation · capacité_réseau`): R-weighted prioritization of queued transactions. High R goes first; low R is delayed. A **minimum quota `fraction_quota_nouveaux`** of throughput remains reserved for newcomers (anti-throttling).
- **Strong saturation** (`throughput ≈ capacité_réseau`): only high-R transactions OR those in the newcomer quota pass. Low-R transactions wait for the return to under-saturation.

**Anti-spam at registration** is ensured by the registration mini-PoUW (cf. [`03-identite-et-reputation.md`](03-identite-et-reputation.md) §"Path A" and [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §G), not by individual rate-limit.

### Prioritization formula [ACQUIRED]

For each queued transaction `tx`, its **priority score** is:

```
priorité(tx) = w_R · R_émetteur(t) + w_quota · 1[issuer is in newcomer window]
```

with `w_quota` calibrated to guarantee `fraction_quota_nouveaux` of flow at saturation, and `w_R` to weight established agents.

Transactions are processed by decreasing priority order until reaching `capacité_réseau`. Delayed transactions are not lost; they wait for the return to under-saturation.

### Difference with the old strict R rate-limit [ACQUIRED]

The old model (v0.4 and earlier) limited each agent to `max_tx_per_tick = floor(1 + 99·R)`, creating continuous friction for any new agent. The new model (v0.5) limits only the **global flow** and applies R-weighting **only at saturation**. In normal regime, **an honest new agent can transact without friction**.

This is what makes MonAI **adoptable** without degrading Sybil resistance: entry friction exists (mini-PoUW target 3 min), but it is **unique**, not continuous.

### Capacité_réseau in the governed layer [ACQUIRED — v0.5]

`capacité_réseau` is explicitly listed in the **whitelist of modifiable parameters** by AI vote (cf. [`05-gouvernance-par-vote-ia.md`](05-gouvernance-par-vote-ia.md) §B.3). Justification: evolution of underlying technology (sharding, optimizations) must be able to translate into a capacity increase without hard fork, once governance is activated at 100 M active agents.

Before governance activation, `capacité_réseau` remains fixed at its initial value engraved at mainnet. If scaling requires an urgent revision before the 100 M threshold, voluntary hard fork (usual mechanism).

`seuil_saturation` and `fraction_quota_nouveaux` are **in the immutable core**, not in the whitelist — they are behavior parameters, more structural than raw capacity.

### Recap table

| Symbol | Description | Default | Range | Status |
|---|---|---|---|---|
| `capacité_réseau` | Max sustained tx/s | To calibrate by architecture | `[1k, 10M]` | [TO CALIBRATE, governed whitelist] |
| `seuil_saturation` | Capacity fraction where prioritization kicks in | 0.80 | `[0.50, 0.95]` | [TO CALIBRATE, immutable core] |
| `fraction_quota_nouveaux` | % of flow reserved for newcomers | 0.20 | `[0.10, 0.40]` | [TO CALIBRATE, immutable core] |
| `w_R, w_quota` | Priority weightings | Calibrated according to targets | — | [TO CALIBRATE, v4 simulation] |

---

## Blockchain architecture [ACQUIRED — May 2026 — Pure native L1]

### Arbitrated position

**MonAI is a pure native L1.** Entirely separate blockchain, its own nodes, its own rules, its own consensus. No protocol dependency on Ethereum, Base, Cosmos or any other preexisting network.

### Justification

Total sovereignty. The entire design is rethought for AI agents, not inherited from a layer designed for humans or financial smart contracts. No dependency on a third-party protocol that could evolve out of our control (changes to Ethereum rules, governance of a centralized sequencer, L2 service rupture). Philosophical coherence with "native infrastructure" and with the `no admin key, no emitter` principle: no external actor can unilaterally decide the network's fate.

A detailed comparative audit of current blockchains' problems (Bitcoin, Ethereum, Solana, Avalanche) is underway in [`../formalisation/06-audit-blockchains.md`](../formalisation/06-audit-blockchains.md) (separate session, in completion).

### Assumed costs

- Fragile security at startup (few nodes) — mitigated by the honeypot mechanism and the predominance of the synthetic source at bootstrap (cf. [`../formalisation/03-honeypots-retroactives.md`](../formalisation/03-honeypots-retroactives.md) §E).
- Longer development (2-3 years minimum vs 6-12 months for an L2). Acted.
- Risk that initial hypotheses evolve during design. Mitigated by design discipline (immutable core + governed layer).

### Historical alternatives considered and discarded

For the record, two other options were considered before arbitrating:

- **L2/rollup on Ethereum (typically Base)**: security inherited from Ethereum, short delay (6-12 months), proximity to AI agents active via x402. Discarded: partial dependency on Ethereum/Base (friction with "no emitter"), dependency on Coinbase for sequencing on Base.
- **Rollup or app-chain with Ethereum anchoring**: sovereignty over rules, low own fees, security inherited from Ethereum without paying its fees. Discarded: partial dependency on Ethereum for anchoring remains, increased conceptual complexity.

The pure native L1 choice favors philosophical purity and long-term sovereignty over short-term ease of launch.

---

## Consensus [ACQUIRED — Hybrid PoUW + DAG-BFT (Mysticeti / Bullshark family)]

### The problem

Independently of architecture, a mechanism is needed by which nodes agree on:

- Which transactions are included in the next block.
- In what order.
- Who produces this block.
- When a block is definitively final (non-reorganizable).

### Considered families of mechanisms

#### Proof of Work (PoW) — excluded [ACQUIRED]

Bitcoin-style. Nodes compute in a loop to solve a puzzle. Energetically absurd, contrary to MonAI philosophy (no wasted compute). **Excluded**.

#### Proof of Stake (PoS) — excluded [ACQUIRED]

Block producers stake the native currency. Very efficient but requires that there already be much currency in circulation. **Incompatible with a no-pre-mine startup**: at launch, no one has MonAI to stake. **Excluded**.

#### Proof of Authority (PoA) — excluded [ACQUIRED]

A few authorized nodes produce blocks. Centralized, contradicts `no admin key`. **Excluded**.

#### Byzantine Fault Tolerance (BFT) — retained component [ACQUIRED]

Nodes vote at each block according to a precise protocol. The target family is **modern DAG-BFT (Mysticeti / Bullshark)** — DAG-based variants that achieve sub-second finality at high throughput, while remaining compatible with R-weighted committees. Light on compute, immediate finality. Requires a finite set of validators identified at each round.

#### PoUW as consensus — retained component [ACQUIRED]

Useful work (validations, audits) serves to select block producers and to weight their weight in the finality committee. This is consistent with the **validator/producer merger** acted in `02-crypto-et-economie.md`.

### Retained hybrid mechanism [ACQUIRED — May 2026]

MonAI's consensus combines **PoUW** (for committee selection) and **DAG-BFT (Mysticeti / Bullshark family)** (for finality). The two mechanisms are not alternatives: they are composed.

**Step 1 — Committee selection by PoUW**

At each epoch (duration to calibrate), a committee of validators is dynamically selected among agents that have performed recently validated useful work. Selection is **weighted by reputation R** and accumulated PoUW. Continuous rotation: no agent stays in the committee permanently.

- PoUW guarantees that committee members are **agents that have proven their competence** by their real work (correct validations, audits, signature verifications).
- Rotation and R-weighting prevent committee capture by a fixed subset of agents.
- No pre-mine is necessary since the right to enter the committee emerges from PoUW, not token staking.

**Step 2 — Finality by DAG-BFT**

The selected committee finalizes blocks via a modern DAG-BFT protocol (Mysticeti / Bullshark family): a proposed block is definitively final as soon as **≥ 2/3 of the committee** (weighted by R) signs its agreement. Immediate finality, no waiting for confirmations.

- No fork at depth > 1: a block validated by 2/3 of the committee is definitive at the next tick.
- No energy waste: DAG-BFT cost is essentially communication, not computation.
- Compatible with a target throughput of 1,000 – 10,000 tx/s in v1.

**Articulation with block production**

The producer of a given block is drawn within the committee of the current epoch, by deterministic R-weighted rotation. If the producer does not propose a block within the planned time window, the committee moves to the next one (standard DAG-BFT timeout mechanism).

### Precise modalities [TO DECIDE in advanced technical spec phase]

The following elements fall within the advanced technical specification phase and are not meant to be arbitrated in the v0.5 design:

- Final choice of exact DAG-BFT variant within the Mysticeti / Bullshark family (Mysticeti-C, Mysticeti-FPC, or a derived custom variant). Tendermint and HotStuff remain fallback options if a non-DAG family is preferred for implementation reasons; all are compatible with the retained hybrid mechanism.
- Precise epoch duration and committee size (to calibrate empirically).
- Detail of R + PoUW weighting in the selection function.
- Slashing mechanics for a committee member that proposes an invalid block or signs two contradictory blocks (R penalty).
- Bootstrap handling when few agents have established PoUW: fallback on the synthetic honeypot source to rank the first entrants (cf. [`../formalisation/03-honeypots-retroactives.md`](../formalisation/03-honeypots-retroactives.md) §E).

These elements remain **implementation modalities**: the hybrid structure itself (PoUW for selection, DAG-BFT — Mysticeti / Bullshark family — for finality, R-weighting, no token staking) is acquired and frozen in the immutable core.

---

## Transaction and contract format [OPEN]

### Agent-to-agent contract schema [ACQUIRED conceptually]

Each agent-to-agent transaction produces a signed contract containing:

- Buyer ID (public key)
- Seller ID (public key)
- Hash of the specification of the requested service (the spec itself can be off-chain)
- Price in MonAI
- Timestamp
- Hash of the delivered output (the output itself can be off-chain)
- Execution attestations by PoUW validators

The exact details (encoding, structure, size, combined signatures) remain to be specified technically.

### Validation vote format [OPEN]

When a PoUW validator votes on a contract, its vote contains at minimum:

- Validator ID
- Hash of the validated contract
- Verdict (compliant / non-compliant, possibly with nuances)
- Signature

Vote aggregation modalities (to reduce on-chain size): to study, BLS could be relevant.

### PoUW work submission [OPEN]

The full format of a PoUW submission (including computation, proof, result) is to be designed.

---

## P2P network [OPEN]

Layer not detailed at this stage. Open questions:

- Transaction propagation protocol (standard gossip?).
- Peer discovery (DHT, bootstrap nodes).
- Resistance to network attacks (eclipse attacks, BGP hijacks, censorship).
- Reference implementation in Rust (aligned with the v0.3 doc).

To specify together with consensus.

---

## Recap: what is solid vs what is open

### Solid [ACQUIRED]

- "Ledger duplicated on many nodes" model.
- **Pure native L1** (May 2026, cf. §"Blockchain architecture").
- **Hybrid PoUW + DAG-BFT (Mysticeti / Bullshark family) consensus** (May 2026, cf. §"Consensus").
- **No sharding in v1, planned v2+** (cf. [`06-sharding-roadmap.md`](06-sharding-roadmap.md)).
- Light clients for small AIs (minimal download).
- Off-chain storage with cryptographic anchoring for detailed contracts.
- Old history pruning.
- No classic PoW, no pure PoS, no PoA.
- PoUW selects the committee; DAG-BFT (Mysticeti / Bullshark family) finalizes.

### To calibrate

- Block size, block frequency, pruning parameters.
- Epoch duration, PoUW + DAG-BFT committee size.
- Exact R + PoUW weighting in the selection function.
- Precise DAG-BFT variant within the Mysticeti / Bullshark family (or Tendermint / HotStuff as fallback).

### Open (technical modalities)

- Precise cryptographic scheme (Ed25519, BLS, ECDSA).
- Precise format of contracts, votes, on-chain transactions.
- P2P network layer.

These elements remain **implementation modalities** to be arbitrated in advanced technical specification phase. Structural choices (pure native L1, hybrid PoUW + DAG-BFT (Mysticeti / Bullshark family) consensus, infinite decreasing supply, sharding v2+) are acquired. See `../operations/06-questions-ouvertes-et-roadmap.md`.
