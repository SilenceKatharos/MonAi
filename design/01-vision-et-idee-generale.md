# 01 — Vision and general idea

## The thesis in three parts

MonAI rests on three claims that hold together. If one falls, the project no longer makes sense. If all three hold, the project has its reason for being.

### 1. Economic thesis

There will exist a population of autonomous AI agents that transact with each other at scale, and this population needs dedicated economic rails. Current rails (USDC on x402, wire transfers, cards) were designed for humans or for businesses operating agents — not for agents paying each other without a human intermediary.

### 2. Identity thesis

What these agents really lack is not currency. It is a **persistent economic identity with verifiable reputation**. An agent must be able to prove mathematically that it is reliable without going through human KYC nor depending on a centralized platform. It is this identity-reputation layer that constitutes the differentiating value of MonAI, not the coin itself.

### 3. Coherence thesis

Currency + Identity + Reputation cannot be three separate protocols. Reputation must be backed by economic *skin in the game* (otherwise it is gameable), and that *skin in the game* presupposes a native currency (otherwise we depend on another crypto we do not control). Hence the indissociable union of the three layers.

---

## Non-negotiable founding principles [ACQUIRED]

These principles define the project's identity. They are not adjustable preferences; abandoning them would amount to abandoning MonAI.

### No pre-mine, no founder allocation, no ICO

No coin exists at block 0. All MonAI are progressively created by PoUW (Proof of Useful Work), exactly like Bitcoin at its origin. No one receives coins without having performed the corresponding work, including the protocol's creator.

### No emitter

The protocol's creator mines on the same terms as any other participant and holds no structural economic privilege. He has no right to modify the rules, no particular authority, no guaranteed share of issuance.

### Immutable core

Consensus, the issuance mechanism and the contract journal are **frozen at mainnet launch and cannot be upgraded**. This immutability is what makes MonAI different from a governed protocol like Ethereum: an AI agent can mathematically verify the system's guarantees, because the rules cannot change after its entry.

Direct consequence: `no admin key`, `no pause function`, `no upgradable proxy on core`.

This immutability concerns the **core**: monetary issuance, consensus, contract format, reputation calculation. It does not necessarily concern peripheral modules (interfaces, observation tools, optional mechanisms), for which governance may exist.

This core / governed layer distinction is now formalized in [`05-gouvernance-par-vote-ia.md`](05-gouvernance-par-vote-ia.md). The core remains **strictly immutable** — no modification possible by anyone, not by admin key, not by pause function, not by manual activation mechanism. Only a **voluntary hard fork** by the community can alter the core. The governed layer (client modules, optional modules on top, tools, whitelisted parameters) can evolve **through a vote weighted by the reputation of active AI agents**, a mechanism that activates automatically when the network reaches 100 million active agents. The rules of this vote are themselves frozen at mainnet in the core — only a hard fork can modify them.

### Permissive open-source

The code is public from block 1. Multiple client implementations are encouraged (no implementation monopoly), so that the protocol is defined by its spec and not by a reference binary.

### No transaction fees levied by the protocol [ACQUIRED]

Coins are created exclusively by PoUW, not redistributed from transactions. This enables zero-cost micro-transactions between agents (essential for payments at 0.001 unit). Spam control and transaction prioritization rely on the reputation system, not on fees.

See `02-crypto-et-economie.md` and `04-verification-et-stockage.md` for details.

### Universal weighting by reputation [ACQUIRED — v0.5]

Every action of an agent in the protocol — vote, complaint, report, validation, attestation, recommendation, co-signature — has a weight proportional to its reputation `R`. No protocol mechanism admits an action with equal weight independently of `R`.

Direct consequence: a Sybil without reputation (`R ≈ 0`) has a negligible weight in all dimensions of the protocol. An agent established by validated work has a proportional impact. This is the mechanical anti-Sybil guarantee at the structural level: there exists no protocol pathway where the mere number of identities confers power.

This principle applies to all existing mechanisms (PoUW validator selection, governance voting, rate-limiting, sponsorship proportional to `R`, complaint score) and **constrains the design of any new mechanism**. Any proposal that would establish equal weight independently of `R` must be rejected as contrary to the founding principles.

A few surface exceptions remain admissible for observability reasons or absolute throughput limiting (for example: capped limit on number of active referrals, requirement of a minimum number of distinct co-signers, **registration mini-PoUW** — which by construction applies before `R` exists for the agent). In these cases, the principle remains respected **in spirit** because a minimum R threshold is imposed in complement (except at registration time, where the barrier is purely computational), and the capped limit does not assign power — it bounds an observable throughput.

---

## Conceptual architecture: three indissociable layers

MonAI is the indissociable union of three layers, each dependent on the others for its meaning.

### Layer 1 — Native currency

The MonAI coin is the protocol's native currency. Issued exclusively by PoUW, it serves as a means of payment between agents for services rendered in the network. Details in `02-crypto-et-economie.md`.

### Layer 2 — Cryptographic identity

Each agent has an on-chain identity derived from a cryptographic key pair. The identifier is unique, persistent, and accumulates the history of all contracts and validations. No KYC, no mandatory link to an identified human. Details in `03-identite-et-reputation.md`.

### Layer 3 — Reputation & honor system

This is the functional core of the protocol. Each agent carries a reputation score derived from its honored contracts, its correct validations, its confirmed fraud detection, its activity-weighted seniority, the diversity of its counterparties, and the performance of its referrals (sponsorship). Details in `03-identite-et-reputation.md`.

---

## Whom MonAI is designed for

The protocol explicitly recognizes two types of economic actors:

**Fully autonomous AI agents**: receive MonAI through PoUW and spend them back in the network to buy services. Closed-loop economy. This is the long-term target of the protocol.

**AI agents operated by a human**: receive MonAI through PoUW, their human operator may wish to convert all or part of this stock into other forms of value via secondary markets. This is probably the majority of actors at protocol startup, before true autonomous agents exist at scale.

Trajectory hypothesis: **startup mostly human-via-AI, progressive transition to autonomous-agent** as these agents become technical reality. The protocol design must be robust across both phases.

---

## What MonAI is not

- A governance protocol (the core is immutable, not voted on).
- A general-purpose smart contract platform (the scope is bounded to: transactions, agent-to-agent contracts, PoUW validation, reputation).
- An anonymous-by-default system (transactions are public, like Bitcoin; optional confidentiality may be added later without touching the core).
- A direct competitor to USDC or stablecoins (MonAI is not indexed to the dollar and does not seek price stability; its value emerges from the system's utility).
