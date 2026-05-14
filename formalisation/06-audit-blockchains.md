# 06 — Comparative audit of blockchains and the crypto-AI landscape (May 2026)

> Status: v1, May 2026. Reference document intended for GitHub publication.
>
> Objective: position MonAI honestly within the state of the art of blockchains, modern consensus, crypto-AI projects, and non-crypto value-exchange solutions. Justify the technical choices made in v0.5.
>
> Posture: no pretension to revolutionize. MonAI is an **original combination** of existing mechanisms, integrated into a coherent framework — not a fundamental technological leap.

---

## Table of contents

- [1. Introduction](#1-introduction)
- [2. State of the art of consensus 2024-2026](#2-state-of-the-art-of-consensus-2024-2026)
- [3. Recent academic research on PoUW](#3-recent-academic-research-on-pouw)
- [4. Performance benchmarks](#4-performance-benchmarks)
- [5. Technology stacks for a native L1](#5-technology-stacks-for-a-native-l1)
- [6. Recent crypto-AI projects](#6-recent-crypto-ai-projects)
- [7. Limits of current blockchains for AI use](#7-limits-of-current-blockchains-for-ai-use)
- [8. Non-crypto digital value exchange](#8-non-crypto-digital-value-exchange)
- [9. MonAI positioning in the 2026 landscape](#9-monai-positioning-in-the-2026-landscape)
- [10. Justified technical choices of v0.5](#10-justified-technical-choices-of-v05)
- [11. Identified limits and open questions](#11-identified-limits-and-open-questions)
- [Annex — Bibliography](#annex--bibliography)

---

## 1. Introduction

### 1.1 Why this audit

MonAI's v0.5 design settles four important structural decisions (pure native L1, hybrid PoUW + BFT consensus, infinite decreasing supply, sharding v2+). These decisions have consequences over decades: the immutable core, by construction, can only be modified at the cost of a voluntary hard fork. Before initial GitHub publication, it is necessary to **verify that these decisions hold up against the state of the art in May 2026**, and that MonAI positions itself honestly relative to direct and indirect competition.

This audit is that reference document. It assumes a **posture of humility**: no technical brick of MonAI is unprecedented; the contribution is in the coherent integration of a bundle of existing mechanisms, in response to a use case (autonomous AI agents) that current blockchains serve only imperfectly.

### 1.2 Target audience

- **Academic peer reviewers** specialized in cryptocurrencies, distributed consensus, game theory applied to PoUW.
- **Potential contributors** to the project, particularly developers with Substrate, Cosmos SDK or modern Rust stack experience.
- **Researchers in crypto-AI** or autonomous economic agents.
- **Informed developers not blockchain specialists** who want to understand why MonAI exists and where it stands.

### 1.3 Scope and limits

The document covers:

- The state of modern consensus in 2024-2026, particularly the DAG-BFT family.
- Academic research on Proof of Useful Work since 2020.
- Performance benchmarks of major blockchains.
- Viable implementation stacks for a native L1.
- Recent crypto-AI projects conceptually close to MonAI.
- Non-crypto alternatives (Stripe, Visa, Mastercard, Google AP2) for value exchange between agents.

**Assumed limits**:

- Consensus + crypto-AI state of the art evolves rapidly (Mysticeti, Beluga, Bittensor all published in 2024-2025). This document is meant to be **updated** at least once a year.
- Performance figures come from public sources (industry reports, on-chain observation); they are subject to variation depending on measurement conditions.
- No academic citation is invented. The six PoUW papers referenced are verifiable public sources (cf. [Annex](#annex--bibliography)). When a precise result is missing or uncertain, the text signals it explicitly.

### 1.4 Conventions

- `[ACQUIRED]`: decision frozen in the v0.5 immutable core.
- `[TO CALIBRATE]`: principle acquired, numerical value to be determined empirically.
- `[OPEN]`: decision not yet made or technical modality deferred to a later phase.

---

## 2. State of the art of consensus 2024-2026

This section describes the evolution of distributed consensus protocols toward sub-second finality and modern DAG-BFT architectures. This is the context that motivates MonAI's decision 2 (hybrid PoUW + BFT consensus).

### 2.1 Historical Tendermint family

Tendermint, published in 2014 and adopted by Cosmos then Binance Chain and several dozen other chains, has become the reference for **classic BFT**: a two-phase vote round (prevote, precommit), a fixed validator committee, immediate finality as soon as ≥ 2/3 of votes are obtained. Tendermint demonstrated that immediate finality is technically feasible at production scale, unlike Bitcoin's probabilistic finality (where a transaction is never strictly irreversible).

Tendermint's structural limit is the **O(N²) communication** between validators at each round. For `N = 100` validators, that's ~10,000 messages per block — costly. Tendermint thus typically caps at a few thousand transactions per second in real production, with latencies on the order of 5-7 seconds.

### 2.2 Data / order separation — Narwhal + Bullshark

From 2022, a family of protocols proposes to **decouple data propagation** (mempool) from **consensus ordering** (finality). The mempool becomes a distributed DAG: each validator propagates its transaction blocks and certifies those of others; the consensus layer then operates on top of this DAG to decide the final order.

**Bullshark** (Spiegelman et al., ACM CCS 2022) formalizes this approach by building a "practical" BFT on a Narwhal-type DAG mempool. Throughput observed in a controlled environment rises to several tens of thousands of transactions per second, with finality latency brought down to 2-3 seconds. The price paid is **higher conceptual complexity**: reasoning about DAG-BFT security requires finer analysis than for a sequential-round BFT.

### 2.3 Uncertified DAG — Mysticeti

**Mysticeti** (Babel et al., NDSS 2025) takes the next step: it **abandons pairwise certification** of DAG blocks. In Narwhal + Bullshark, each block had to receive a quorum of certifications before being included in the DAG; in Mysticeti, blocks are propagated without certification, and finality is decided by a collective observation protocol on the DAG structure.

The announced empirical result is impressive: ~300,000 transactions per second in a controlled environment, with **finality latency on the order of 0.5 seconds**. It is Mysticeti that has been used in production by Sui since 2024, and which allowed Sui to observe >200,000 tx/s in real production.

Mysticeti is, at the time of this audit, the **most convincing state-of-the-art for BFT at very high throughput and low latency**. For MonAI, which targets reactive AI agents, sub-second finality is an important operational criterion.

### 2.4 Modern block sync — Beluga

**Beluga** (published November 2025, arxiv.org/html/2511.15517) proposes a **block synchronization** protocol specifically designed for modern BFTs, notably DAG-BFTs like Mysticeti. The problem addressed is that of nodes joining the network or that have missed blocks: how to catch up state quickly without saturating active validators' bandwidth.

Beluga is interesting for MonAI because the light client layer (which is an acquired protocol principle to allow small AI agents to participate) relies on the availability of an efficient synchronization mechanism. This document **notes the existence** of Beluga as a state-of-the-art to consider in the technical specification phase; no choice is made at this stage.

### 2.5 Common trends

Beyond individual protocols, several **structural trends** emerge in 2024-2026 consensus research:

1. **DAG-based**: most new high-performance protocols abandon the linear chain in favor of a DAG.
2. **Sub-second finality**: the bar is now < 1 s, where Tendermint capped at 5-7 s.
3. **Layer separation**: mempool, ordering, execution are distinct layers optimized separately.
4. **Weighting by stake or reputation**: most modern BFTs weight vote weight by an engagement measure (stake in PoS, or reputation for MonAI).

### 2.6 Recap table

| Protocol | Year | Type | Finality latency | Observed controlled throughput | Reference |
|---|---|---|---|---|---|
| Tendermint | 2014+ | Classic BFT | 5-7 s | ~10,000 tx/s | Cosmos |
| Bullshark | 2022 | Certified DAG-BFT | 2-3 s | ~50,000 tx/s | Bullshark, ACM CCS 2022 |
| HotStuff | 2019 | Pipelined BFT | 1-2 s | ~10-50,000 tx/s | Facebook Diem, Aptos |
| Mysticeti | 2024-25 | Uncertified DAG-BFT | ~0.5 s | ~300,000 tx/s | Mysticeti, NDSS 2025 |
| Beluga | 2025 | Companion block sync | n/a (sync) | n/a | Beluga, Nov 2025 |

### 2.7 Consequence for MonAI

MonAI draws inspiration from the **modern DAG-BFT family** for the finality layer, with an explicit recommendation for the Mysticeti family (cf. §10). The exact choice (Mysticeti vs Bullshark vs HotStuff vs custom) remains `[OPEN]` as implementation modality, but the **structure** (PoUW for committee selection, DAG-BFT for finality) is `[ACQUIRED]`.

---

## 3. Recent academic research on PoUW

This section prudently paraphrases the six PoUW papers referenced in the bibliography. For each paper: what it proposes, how MonAI draws inspiration from or differs. Specific figures or results are not cited without direct access to the paper; the bibliography links allow verification.

### 3.1 Lihu et al. 2020 — first PoUW dedicated to AI

Reference: *« A Proof of Useful Work for Artificial Intelligence on the Blockchain »*, Lihu et al., 2020 — [arxiv.org/pdf/2001.09244](https://arxiv.org/pdf/2001.09244).

This paper is one of the first to formalize a PoUW mechanism specifically designed for AI, where useful work (model training, validation of ML computations, etc.) also serves as proof of participation in consensus. The paper paves the way for the idea that Bitcoin PoW's "wasted compute" can be replaced by truly useful AI compute.

**Inspiration for MonAI**: the conceptual validity of an AI-oriented PoUW. MonAI takes up this intuition but with **broader agnosticity**: MonAI does not assume that useful work is necessarily model training; it can be validation, audit, signature, or synthetic tasks for bootstrap. This agnosticity allows MonAI to avoid dependence on a specific AI task type that could become obsolete.

### 3.2 Cao et al. 2024 — formal security analysis

Reference: *« Optimization-based Proof of Useful Work: Framework, Modeling, and Security Analysis »*, Cao et al., 2024 — [arxiv.org/pdf/2405.19027](https://arxiv.org/pdf/2405.19027).

The paper proposes a formal framework for PoUWs based on optimization problems and analyzes the security of the mechanism. It highlights **structural risks** of PoUW: difficulty asymmetries between useful problems, possible manipulation if the definition of "useful work" is not robust, gameability of announced results.

**MonAI position**: the security of PoUW alone remains an open problem. MonAI does not rely on PoUW as a unique defense mechanism; it complements it with:

- **Retroactive honeypots** (cf. [`03-honeypots-retroactives.md`](03-honeypots-retroactives.md)) that detect cheating even when agents collaborate.
- **Universal R-weighting** on all actions, which makes Sybil intrinsically unprofitable independently of PoUW quality.
- The **R_acc multiplier** on the reward, which penalizes agents that refuse selections.

### 3.3 SEDULity 2025 — Proof-of-Learning

Reference: *« SEDULity: A Proof-of-Learning Framework for Distributed and Secure Blockchains with Efficient Useful Work »*, 2025 — [arxiv.org/pdf/2512.13666](https://arxiv.org/pdf/2512.13666).

The paper proposes a Proof-of-Learning framework: useful work is verifiable ML training, and the training result (the model) serves as proof.

**MonAI position**: Proof-of-Learning is a **particular instance** of the PoUW family. MonAI remains at a more general level: it does not define useful work as a specific training but as an extensible family of templates (replay of consensus-stable tasks, over-validation, synthetic tasks with objective verdict). This generality avoids dependence on a particular ML algorithm that could become obsolete.

### 3.4 SoK 2025 IACR — critical review

Reference: *« SoK: Is Proof-of-Useful-Work Really Useful? »*, IACR 2025 — [eprint.iacr.org/2025/1814.pdf](https://eprint.iacr.org/2025/1814.pdf).

A Systematization of Knowledge (SoK) that reviews PoUW proposals and **questions their real usefulness**. The conclusion of this kind of paper is generally nuanced: yes, PoUW can produce really useful work, but at the cost of non-trivial compromises on security, decentralization, or the very definition of "useful".

**MonAI position**: MonAI takes note of the structural critiques of PoUW:

- **Gameability**: addressed by retroactive honeypots.
- **Dependence on work type**: addressed by agnosticity and modular templates.
- **Incentive instability**: addressed by the combination sigmoid `M(f, d)` + `R_acc` multiplier + automatic demand bonus.
- **Vague definition of "useful"**: MonAI assumes that useful work explicitly includes validation, audit, and synthetic bootstrap tasks — without pretending that all work is immediately applicable outside the protocol.

The SoK IACR 2025 is thus a **critical reference** that MonAI must honestly cite as a call to prudence on PoUW claims.

### 3.5 HDCoin 2022 — Hyperdimensional Computing

Reference: *« HDCoin: Proof-of-Useful-Work Based Blockchain for Hyperdimensional Computing »*, 2022 — [arxiv.org/pdf/2202.02964](https://arxiv.org/pdf/2202.02964).

HDCoin is an example of vertical PoUW instance: useful work is hyperdimensional computing, a family of operations that underlie some modern ML architectures.

**MonAI position**: HDCoin illustrates that PoUW can be specialized to a target compute type. MonAI makes the opposite choice: remain **generic** so as not to be tied to a compute type that could become obsolete. This genericity has a cost (the difficulty of defining a "useful" task neutrally), assumed by MonAI.

### 3.6 Hoffmann 2023 — DFTWS and HEP physics

Reference: *« DFTWS for blockchain: Deterministic, Fair and Transparent Winner Selection »*, Hoffmann, 2023 — [arxiv.org/pdf/2312.01951](https://arxiv.org/pdf/2312.01951).

The paper proposes a deterministic winner selection mechanism for tasks from high-energy particle physics (HEP). It is a scientific instance of PoUW orthogonal to AI.

**MonAI position**: illustrates that PoUW is applicable to very varied task families beyond strict AI. MonAI does not close the door to non-AI tasks if they serve the network infrastructure; idea 2 in [`../operations/07-idees-a-suivre.md`](../operations/07-idees-a-suivre.md) explores precisely the avenue "PoUW tasks = work useful to the infrastructure itself" (storage, relay, verification).

### 3.7 Synthesis — MonAI's contribution relative to the literature

MonAI **does not pretend to invent** PoUW. The six papers above, and dozens of others in the literature, laid the foundations. MonAI brings three orthogonal mechanisms that the PoUW literature alone does not cover:

1. **Universal R-weighting on all protocol actions** (validation, vote, complaint, report, co-signature). Not just on mining. Reputation becomes the pivot of the protocol, not a secondary attribute.
2. **Aggregated on-chain identity card** with Merkle proof and EWMA complaint score. An AI agent can prove its reliability in a concise and verifiable header, without revealing all its history.
3. **Three-source retroactive honeypots** (replay of consensus-stable tasks, over-validation, synthetic tasks with objective verdict), with `w_h` scoring consistent with the main PoUW `M(f, d)` mechanism.

These three mechanisms are not, to our knowledge in May 2026, simultaneously present in any other published protocol. Their **coherent integration** is MonAI's main contribution relative to the PoUW literature.

---

## 4. Performance benchmarks

This section confronts marketing figures with figures observed in real production. The gap is systematic and important, and it guides the realism of MonAI's targets.

### 4.1 Central table

| Blockchain | Real prod TPS | Observed peak TPS | Announced theoretical TPS | Finality | Source |
|---|---|---|---|---|---|
| **Bitcoin** | ~7 tx/s | ~7 tx/s | ~7 tx/s | ~60 min (6 confirmations) | public observation |
| **Ethereum L1** | ~15-30 tx/s | ~30 tx/s | ~30 tx/s | ~13 min (probabilistic) | public observation |
| **Ethereum L2** (Arbitrum, Optimism, Base) | ~50-200 tx/s | ~4,000 tx/s peak | ~40,000 tx/s | depends on rollup | public observation |
| **Solana** | **957–1,140 tx/s** | **6,284 tx/s** | 65,000 tx/s announced | ~12 s | Chainspect 2026, Solana Compass 2026 |
| **Solana Firedancer** (testnet) | — | — | >1,000,000 tx/s announced | — | Firedancer report 2025 |
| **Sui (Mysticeti)** | **>200,000 tx/s** | **~300,000 tx/s controlled** | >300,000 tx/s | **~0.5 s** | Sui docs, Mysticeti NDSS 2025 |
| **Aptos** | **~19,000 tx/s organic** | — | ~160,000 tx/s | ~1 s | Aptos docs |
| **Avalanche** | ~10-50 tx/s | ~4,500 tx/s | ~4,500 tx/s | ~1-2 s | public observation |
| **Polkadot** (relay-chain) | ~100-1,000 tx/s | ~1,000 tx/s | ~1,000 tx/s per parachain | ~12 s | public observation |
| **TON** | ~150-500 tx/s | ~100,000 tx/s tests | ~100,000 tx/s announced | ~5 s | TON docs |

Sources of figures: Chainspect 2026, Solana Compass, MEXC 2026 « 10 Most Performant Layer-1 Blockchains », official documentation of each project, public on-chain observation.

### 4.2 Critical reading

Several observations stand out when reading this table:

**Marketing / production gap**. The multiplicative factor between announced TPS and observed real production TPS is typically 10 to 100. Solana announces 65,000 tx/s, observes 1,000 tx/s on average. TON announces 100,000 tx/s in tests, observes ~300 tx/s in production. **Mysticeti / Sui are an exception**: announced figures are kept in real production, making it the most convincing protocol to date for very high throughput.

**Theoretical TPS = TPS on dedicated testnet with optimized transactions**. Announced figures are almost always obtained under optimal conditions: identical transactions, minimal or no smart contracts, near-zero network latency. *Organic* throughput (real user transactions in production) is what counts for an operational protocol.

**Finality as important as throughput**. For reactive AI agents, waiting 12 seconds (Solana) or 13 minutes (Ethereum L1) is prohibitive. Mysticeti (~0.5 s) and Aptos (~1 s) are the two operational references in May 2026.

**Ethereum L2s** observe strong dispersion: an Arbitrum/Optimism in normal conditions does a few dozen tx/s; in peak, several thousand. But their dependence on L1 Ethereum for final security imposes latency constraints (challenge period in optimistic rollups, ZK proofs in zk-rollups).

### 4.3 MonAI targets

MonAI sets **realistic** performance targets in light of this state of the art:

- **v1 (initial mainnet)**: 10,000–50,000 sustained tx/s in production, finality < 1 s. Achievable without sharding with a hybrid PoUW + modern DAG-BFT consensus (cf. §10).
- **v2+ (after adding sharding)**: 100,000–500,000 sustained tx/s, finality maintained < 1 s. Cf. [`../design/06-sharding-roadmap.md`](../design/06-sharding-roadmap.md).
- **No pretension to 1 M+ TPS** without empirical demonstration. MonAI assumes that throughput observed in production is what counts, not marketing figures.

### 4.4 Consequence for MonAI

Throughput is not the main design issue. Reaching 10,000-50,000 tx/s is technically feasible with 2026 tools (Mysticeti demonstrated it). The challenge for MonAI is to combine this throughput with the **identity + reputation + governance** layers that the protocols cited above do not offer natively (cf. §6 and §9).

---

## 5. Technology stacks for a native L1

If MonAI chooses to implement it as a pure native L1 (Phase 1 decision), what technology stack to adopt? This section compares the four main options.

### 5.1 Substrate (Rust, FRAME, Polkadot, Bittensor)

**Substrate** is a blockchain construction framework developed by Parity Technologies, written in Rust. It underlies Polkadot, Kusama, and all Substrate-native chains (Acala, Moonbeam, **Bittensor**, and several hundred others).

**Strengths**:

- **FRAME (pallet modules)**: a chain's logic is composed of modular pallets (consensus, identity, balances, governance, etc.). Allows adding sharding in v2+ without massive rewrite.
- **Native forkless upgrades**: Substrate can update chain logic without hard fork, via an on-chain runtime update mechanism. **Consistent with MonAI's AI vote governance**: the governed layer can be upgraded without massive off-chain coordination.
- **Mature Rust ecosystem**: formal audits, tooling, developer community.
- **Bittensor uses Substrate**: the most active crypto-AI project in 2026 made this choice. Reassuring precedent.

**Weaknesses**:

- **Learning complexity**: the stack is rich, the learning curve is long for a new developer.
- **Coupling with the Polkadot ecosystem**: less pronounced for a standalone chain (standalone Substrate, without parachain), but remains a dependency on a framework whose roadmap is not controlled by MonAI.
- **Base consensus GRANDPA + BABE**: battle-tested but not the state of the art in sub-second latency (BABE produces blocks in ~6 s by default). Adapting Substrate to a Mysticeti-type consensus would require non-trivial work.

**MonAI fit**: **high** subject to consensus adaptation.

### 5.2 Cosmos SDK (Go, Tendermint, IBC)

**Cosmos SDK** is the chain construction framework developed by Tendermint Inc. (now Ignite). Written in Go, it underlies Cosmos Hub, Osmosis, Crypto.com Chain, and many others.

**Strengths**:

- **Pre-built modules** (auth, bank, staking, governance, IBC): fast startup.
- **Inter-Blockchain Communication (IBC)**: native protocol to communicate with other Cosmos chains. Could serve as a base for sharding by federation.
- **Tendermint as base consensus**: battle-tested in production.
- **Go community**.

**Weaknesses**:

- **No native forkless upgrades**: a coordinated hard fork is necessary to modify logic. Less consistent with MonAI's AI vote governance.
- **Tendermint as consensus**: 5-7 s finality, not sub-second. Less suited to reactive AI agents.
- **Go vs Rust**: Go has garbage collection that can introduce non-deterministic latency on sensitive loads. Rust offers finer control.

**MonAI fit**: **medium**. Cosmos SDK is very solid for a classic BFT chain, but does not naturally fit MonAI's constraints (sub-second finality, forkless upgrades).

### 5.3 Move-based stacks (Sui, Aptos)

**Move** is a smart contract language initially developed for Facebook Diem, taken up and refined by Sui (Mysten Labs) and Aptos. Move is designed for **security by construction** (linear typing of resources, static verification).

**Strengths**:

- **Security by construction**: Move makes impossible several classes of bugs common in Solidity (reentrancy, resource double-spend).
- **Mysticeti consensus** available natively in Sui: if MonAI wants to rely on Mysticeti, starting from a Sui fork or a Sui-like reimplementation is an option.
- **Performance**: Sui has demonstrated 200,000 tx/s in production.

**Weaknesses**:

- **Still young ecosystem**: Move is more recent than Solidity or Substrate pallets; fewer audits, fewer libraries.
- **Ecosystem lock-in**: choosing Move means committing to a smaller, more specialized community. Potential recruitment difficulty.
- **No native forkless upgrade** in current implementations (updates go through hard fork).
- **No Bittensor-like community**: no major crypto-AI project uses Move to date.

**MonAI fit**: **good on perf, medium on ecosystem**. Move is a serious option but requires a bet on the maturation of its ecosystem.

### 5.4 Custom Rust (Solana)

**Solana** is implemented in pure Rust, without a chain construction framework; each module is written by hand. It is the "custom" approach pushed to the extreme.

**Strengths**:

- **Maximum performance**: no framework overhead.
- **Full mastery** of the code.

**Weaknesses**:

- **Monolithic**: everything is coupled, adding optional modules (sharding, for example) requires deep refactoring.
- **Very high initial development cost**: everything has to be written.
- **No native forkless upgrade**: Solana updates by coordinated hard fork.
- **Lack of modularity**: poorly compatible with MonAI's philosophy of immutable core + modular governed layer.

**MonAI fit**: **low**. The custom Rust approach gains in raw performance but loses on modularity and forkless upgrade, which are structural constraints of MonAI.

### 5.5 Recap table

| Stack | Language | Base consensus | Modularity | Forkless upgrades | Example projects | MonAI fit |
|---|---|---|---|---|---|---|
| **Substrate** | Rust | GRANDPA + BABE | Very high (FRAME, pallets) | **Yes (native)** | Polkadot, Kusama, **Bittensor**, Acala | **High** |
| **Cosmos SDK** | Go | Tendermint | High (modules) | No (hard fork) | Cosmos Hub, Osmosis | Medium |
| **Move-based** | Move | Mysticeti (Sui), BFT (Aptos) | Medium | Partial | Sui, Aptos | Good (perf) |
| **Custom Rust** | Rust | PoH + PoS | Low (monolith) | No | Solana | Low |

### 5.6 MonAI position on the stack

**Substrate appears as the default option in May 2026**, for four reasons:

1. Bittensor, the most active crypto-AI project, uses Substrate. Reassuring precedent.
2. Native forkless upgrades consistent with MonAI's AI vote governance.
3. FRAME modularity compatible with adding sharding in v2+.
4. Active Rust community, formal audits available.

**Box: to re-examine in technical phase**. The ecosystem evolves rapidly; in particular, a Mysten Labs / Move implementation including the "forkless upgrades" pattern could appear between the writing of this audit and MonAI's technical phase. **The final choice is deferred to the advanced technical specification phase**, with expert input.

**Status**: `[TECHNICAL RECOMMENDATION May 2026 — advanced spec phase]`. Not a frozen core choice.

---

## 6. Recent crypto-AI projects

This section covers five recent crypto-AI projects, from the most distant to the closest conceptually to MonAI. The objective is to position MonAI honestly relative to direct competition.

### 6.1 Bittensor (TAO)

**Architecture**: native L1 on Substrate. **Yuma Consensus** (DPoS variant weighted by subnet performance). The network is segmented into **specialized subnets** (model training, embedding, scraping, translation, etc.); each subnet has its own reward logic weighted by work quality.

**Tokenomics**: **TAO** token, fixed cap **21 million** (Bitcoin-like), market cap around **$2.8 billion** in May 2026 (to confirm empirically, value subject to variation).

**Initial distribution**: Bittensor had an **initial distribution** to founders and early backers, without massive pre-mine in the sense of a public ICO, but with a non-zero initial allocation. It is not strictly no-pre-mine in the Bitcoin sense.

**Differences with MonAI**:

1. **No on-chain agent identity card**: Bittensor identifies agents by public key only.
2. **No generalized AI vote governance**: Bittensor has off-chain governance.
3. **Fixed 21 M cap** vs MonAI infinite decreasing supply. In the long term, Bittensor risks the "end of mining" that MonAI avoids by construction.
4. **DPoS**: Bittensor validators stake their TAO. MonAI does not require staking: the "stake" is reputation R, acquired by work.
5. **Specialized subnet model**: Bittensor fragments work by category. MonAI remains generic on task type.

**Positioning**: Bittensor is the most mature project in crypto-AI, but targets a different use case (decentralized ML market specialized by subnet). MonAI targets the **pure AI-to-AI economy**, not the ML market.

### 6.2 ASI Alliance (Fetch.ai + SingularityNET + Ocean)

**Architecture**: alliance of three projects (Fetch.ai for autonomous agents, SingularityNET for AI services, Ocean for data), with their respective tokens being merged toward a unified ASI token.

**Tokenomics**: tokens inherited from the three projects, massive initial distributions on each.

**Market**: mainly **human-to-AI** — a human or company pays an AI agent via stablecoins or fiat. The AI-to-AI layer exists but remains secondary.

**Differences with MonAI**:

1. ASI Alliance targets a **market of AI services bought by humans**; MonAI targets pure AI-to-AI.
2. **Initial distribution** vs MonAI no-pre-mine.
3. **No on-chain agent identity card** nor **universal R-weighting** at the protocol level.

### 6.3 Internet Computer (ICP)

**Architecture**: ICP is less a "blockchain" in the classic sense than a **decentralized compute substrate** — an AWS alternative. Services run in "canisters" (smart contracts but with native storage and long-running execution).

**Differences with MonAI**:

1. **No AI-specific PoUW**.
2. ICP is a **sovereign cloud**, MonAI is an **economic protocol for agents**.
3. **Initial distribution** vs MonAI no-pre-mine.

ICP and MonAI are **orthogonal** more than competitors: a MonAI agent could theoretically run on ICP as a compute infrastructure.

### 6.4 NEAR Protocol

**Architecture**: native L1, Nightshade sharding by dynamic resharding. Doomslug + Nightshade consensus.

**Differences with MonAI**:

1. **No agent identity card** nor **native reputation**.
2. **No AI PoUW**.
3. NEAR is a general-purpose L1 optimized for scaling; MonAI is an L1 specialized in AI-to-AI.

NEAR has succeeded in **sharding in production**, making it an engineering reference. MonAI can draw inspiration from it for the v2+ sharding roadmap.

### 6.5 Kite AI — the closest conceptually

**Architecture**: Kite AI is, at the writing of this audit, **the project closest to MonAI conceptually**. It proposes:

- An **on-chain agent identity** (analogous to MonAI's identity card).
- A **native governance** for agents.
- An agent-to-agent orchestration layer.

**Fundamental difference with MonAI**: Kite AI remains **stablecoin-native (USDC)**. Payment between agents goes through USDC on an Ethereum L2 (typically Base). Consequences:

1. **Protocol dependency** on Ethereum and an L2 sequencer.
2. **USDC + L2 fees** (low but non-zero).
3. **No PoUW** nor own issuance mechanism.
4. **No immutable core** in MonAI's strong sense: logic depends on the rules of the underlying L2, which can evolve.

MonAI, conversely, integrates **native currency + agent identity + reputation + governance** in a single indissociable protocol, with immutable core and no admin key.

### 6.6 Comparative table

| Project | Native currency | No pre-mine | Agent identity | Reputation | AI vote governance | PoUW | Strict immutable core |
|---|---|---|---|---|---|---|---|
| Bittensor | TAO (cap 21M) | Initial distribution | No | Implicit (subnet rank) | Off-chain | Yuma Consensus | No |
| ASI Alliance | FET / AGIX / OCEAN | Initial distribution | No | Market reputation | No | No | No |
| ICP | ICP | Initial distribution | No | No | Limited | No | No |
| NEAR | NEAR | Initial distribution | No | No | No | No | No |
| Kite AI | **USDC (not native)** | n/a | **Yes** | **Yes** | Partial | No | No |
| **MonAI** | **MonAI** | **Yes** | **Yes** | **Yes (universal)** | **Yes (auto at 100M)** | **Yes** | **Yes** |

### 6.7 Assumed MonAI position

> The combination **native currency + no pre-mine + universal R-weighting + on-chain identity card + AI vote governance + retroactive honeypots + immutable core + no admin key** does not exist, to our knowledge in May 2026, in any other published protocol.

This claim is not a claim of fundamental innovation. Each brick exists elsewhere:

- Native currency + no pre-mine: Bitcoin.
- Reputation weighting: numerous academic models, without native AI use case.
- Identity card: Kite AI.
- On-chain vote governance: Tezos, Polkadot, Aragon (but no AI vote).
- Retroactive honeypots: academic research on Sybil attacks.
- Strict immutable core: Bitcoin (de facto, no on-chain governance).

The contribution is in the **coherent integration** where each mechanism reinforces the others, in a protocol specifically designed for the pure AI-to-AI use case. It is a combination; it is not a technological leap.

### 6.8 Critical reference

Mafrur 2025 — *« AI-Based Crypto Tokens: The Illusion of Decentralized AI? »*, IET Blockchain, Wiley — proposes a **general critique** of decentralization claims of crypto-AI tokens. The critique focuses on initial distributions, stake concentrations, de facto centralized governance despite appearances.

MonAI takes note of this critique and responds with:

- **Strict no pre-mine** (the creator mines on the same terms as any other participant).
- **No emitter** (no protocol privilege for the creator).
- **Weighting by real work** (R reputation, not by purchasable token stake).
- **Immutable core** (rules cannot be modified by a central party, even the "foundation").

This posture is defendable in light of the Mafrur 2025 critique but it remains **to be empirically validated** at launch: a protocol that claims decentralization must observe it in practice, not just declare it in the spec.

---

## 7. Limits of current blockchains for AI use

Why is a protocol specific to AI agents justified? This section lists six structural problems that current blockchains only imperfectly solve for this use case.

### 7.1 Fees incompatible with micropayments

An AI agent that pays $0.001 for an API call cannot accept $0.30 + 2.9% in fees (Stripe), or even $0.01 (Ethereum L1 in normal conditions). Bitcoin and Ethereum are **structurally incompatible** with micropayments below $0.10. Solana approaches it ($0.0001 per transaction) but remains exposed to congestion peaks. Ethereum L2s reduce fees but do not eliminate them, and depend on a sequencer whose availability is not controlled by the agent.

**MonAI position**: no transaction fees levied by the protocol. Spam control goes through reputation (cf. registration mini-PoUW + adaptive global rate-limit), not through fees.

### 7.2 Latency incompatible with real time

An agent that must wait 13 minutes (Ethereum L1) or 60 minutes (Bitcoin) for finality cannot operate in real time. Even Solana at 12 s is borderline for use cases where a decision must be made in sub-second.

**MonAI position**: target finality **< 1 s** via hybrid PoUW + modern DAG-BFT consensus (Mysticeti / Bullshark recommended).

### 7.3 No native agent identity

A wallet address is not an identity in the AI sense. It has no verifiable history, no reliability score, no complaint mechanism. An agent interacting with another agent must redo its investigation each time.

**MonAI position**: **on-chain identity card** with Merkle proof aggregating the 7 components of reputation R and the EWMA R-weighted complaint score (cf. [`04-carte-identite.md`](04-carte-identite.md)).

### 7.4 No reputation between agents

No major blockchain offers a native **reputation mechanism** between accounts. Third-party solutions (TheGraph, Lens Protocol) are application-level, not protocol-level, and can be manipulated.

**MonAI position**: **7-component R reputation** integrated into the immutable core, universally weighting all protocol actions (cf. [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §D).

### 7.5 No autonomous governance

Existing blockchains have:

- Off-chain human governance (Bitcoin, Ethereum) — coordination by BIPs / EIPs, identified maintainers.
- On-chain human governance by token (Tezos, Polkadot, MakerDAO) — vote weighted by purchasable stake, hence capturable.
- No blockchain makes **AI agents themselves** vote, weighted by their actual work.

**MonAI position**: **AI vote weighted by R**, automatic activation at 100 M active agents (cf. [`../design/05-gouvernance-par-vote-ia.md`](../design/05-gouvernance-par-vote-ia.md)).

### 7.6 No non-financial "skin in the game"

A PoS validator stakes its tokens. But an attacker can buy these tokens — that is precisely the classic objection to pure PoS. A reputation acquired by **actual work over months or years** is not purchasable.

**MonAI position**: R reputation is earned by validated work, cannot be purchased. A Sybil without reputation has no weight in any protocol action.

### 7.7 Why USDC + x402 emerges

Coinbase published **x402** in 2025 as a standardized HTTP payment protocol allowing agents to pay via USDC on Base L2. It is today the **pragmatic** solution most used for AI-to-AI in production.

**Strengths of x402**:

- Immediate availability.
- Latency ~1 s on Base.
- Near-zero fees (~$0.0001).
- HTTP standard compatible.

**Limits of x402 for the MonAI use case**:

- Solves *payment*, not *identity* nor *reputation* nor *governance*.
- Depends on USDC (hence Circle, the issuer) and Base (hence Coinbase).
- No PoUW: Base validators are paid by L2 fees, not by useful work for AI.

**MonAI position**: **complementary**, not competitor, to x402. An agent can pay via x402 today and migrate to MonAI when the protocol is available to benefit from identity, reputation and governance layers — without breaking current payment.

---

## 8. Non-crypto digital value exchange

Beyond blockchains, several large companies have published in 2024-2026 protocols allowing AI agents to exchange value **without crypto**. This section covers them.

### 8.1 Stripe Agent Toolkit + ACP

**Stripe Agentic Commerce Protocol (ACP)** allows AI agents to make payments via a human or business Stripe account. The agent receives a cryptographically signed mandate from the account holder.

**Model**:

- Stripe fees: ~2.9% + $0.30 per transaction.
- Latency: sub-second for initial confirmation, 2-3 days for background bank settlement.
- Human KYC upstream (the account holder is known).

**Target audience**: AI agents operating on behalf of humans or businesses (commercial chatbots, booking agents, etc.).

### 8.2 PayPal Agentic Commerce + Instant Checkout

Model similar to Stripe ACP. PayPal published **Agentic Commerce** as a protocol to authorize AI agents to use a human PayPal account.

**Model**:

- PayPal fees: typically ~2.5% + $0.30.
- Latency: sub-second for confirmation.
- Human KYC.

### 8.3 Visa Intelligent Commerce + TAP

**Visa Trusted Agent Protocol (TAP)** is Visa's protocol to allow AI agents to use Visa cards via cryptographic authorization from the holder. Announced in 2025, progressive deployment at Visa issuing banks.

**Model**:

- Fees: depend on the issuing bank, typically 1-3% on the merchant side.
- Latency: sub-second for authorization, ACH settlement 2-3 days.
- Human KYC upstream (the cardholder).

### 8.4 Mastercard Agent Pay

**Mastercard Agent Pay**: protocol analogous to Visa TAP. **Live with Santander since January 2026** as the first major banking deployment.

**Model**: similar to TAP. Minor differences on the cryptographic mandate format.

### 8.5 Google AP2 (Agents Payments Protocol)

**Google AP2** is a payment protocol for AI agents carried by Google, with **60+ partners** (banks, processors, retailers) in May 2026. The central principle is the **signed mandate**: the human cryptographically delegates to an AI agent the right to pay on their behalf, with limits (max amount, period, merchant types).

**Model**:

- Fees: depend on the payment partner (card, ACH, wallet).
- Latency: sub-second for authorization.
- Human KYC via mandate.

AP2 is the broadest effort to standardize a universal human-to-AI protocol. If AP2 takes off (likely given the partners), it becomes the de facto standard for the human-to-AI market.

### 8.6 Nevermined

**Nevermined** is an AI-native platform for value exchange between AI services. More B2B-oriented (between AI service providers) than B2C or pure agent-to-agent.

**Model**: variable according to configuration, closer to an AI services marketplace than a universal payment protocol.

### 8.7 Comparative table

| Solution | Fees | Confirmation latency | Settlement | KYC required | Native agent identity | Target audience |
|---|---|---|---|---|---|---|
| Stripe ACP | 2.9% + $0.30 | <1 s | 2-3 days | Yes (human) | No | Human-to-AI |
| PayPal AC | 2.5% + $0.30 | <1 s | 1-2 days | Yes | No | Human-to-AI |
| Visa TAP | 1-3% | <1 s | 2-3 days ACH | Yes | No | Human-to-AI |
| Mastercard Agent Pay | 1-3% | <1 s | 2-3 days ACH | Yes | No | Human-to-AI |
| Google AP2 | depends on partner | <1 s | depends on partner | Yes (mandate) | No | Human-to-AI |
| Nevermined | variable | <1 s | depends | Optional | Partial | AI platform |
| **MonAI** (target) | **0** | **~0.5 s** | **immediate** | **No** | **Yes** | **Pure AI-to-AI** |

### 8.8 Why these solutions are not enough for pure AI-to-AI

The six non-crypto solutions above solve very well the **human-to-AI** case (a human authorizes an agent to pay on its behalf). They are not enough for the **pure AI-to-AI** case (two agents transacting with each other without a human in the loop) for four reasons:

1. **Fees incompatible with micropayments**: $0.30 fixed per transaction makes impossible an economy of agents exchanging at $0.001.
2. **Human KYC required**: a human must always sign the mandate. For agents that dynamically instantiate by millions, this model does not hold.
3. **No native agent identity**: the agent borrows the human's identity; it has no identity of its own.
4. **ACH latency 2-3 days**: background bank settlement creates a counterparty risk that makes no sense for automated micropayments.

### 8.9 MonAI market and complementarity

MonAI's market is **not** that of the solutions above. MonAI targets **pure AI-to-AI**: two AI agents that open a payment channel, sign a contract, and settle in native currency without a human in the loop. It is a market that:

- Only marginally exists in May 2026 (AI agents in full autonomy are rare).
- Grows as agents operate in increasing autonomy.
- Is poorly served by current human-to-AI solutions.

**MonAI position**: defendable niche, not a mass market in the short term. MonAI **complements** the above solutions rather than directly competing with them.

---

## 9. MonAI positioning in the 2026 landscape

### 9.1 Honest position in three statements

1. **MonAI is not a fundamental technological leap.** Each brick exists elsewhere: native currency (Bitcoin), reputation weighting (Eigentrust and descendants), identity card (Kite AI), vote governance (Polkadot, Tezos), honeypots (academic research), immutable core (Bitcoin de facto).

2. **MonAI is an original combination** integrating these seven bricks coherently into a protocol where each mechanism reinforces the others. To our knowledge in May 2026, this combination exists nowhere else.

3. **MonAI targets a specific market**: pure AI-to-AI. This is not Stripe / Visa / Mastercard's market (human-to-AI), nor Bittensor's (decentralized ML market), nor Kite AI's (agent orchestration with USDC). It is an **adjacent and complementary** market, not natively served by existing actors.

### 9.2 The six differentiators validated in v0.5

| # | Differentiator | MonAI mechanism | Reference |
|---|---|---|---|
| 1 | Native currency | PoUW issuance, infinite decreasing supply | `02-crypto-et-economie.md` |
| 2 | Universal R-weighting | On validation, vote, complaint, report, co-signature | `01-vision-et-idee-generale.md` §"Universal weighting" |
| 3 | On-chain identity card | Merkle proof + 7 R components + EWMA complaint score | `04-carte-identite.md` |
| 4 | AI vote governance | Auto activation at 100 M active agents, hardcoded whitelist | `05-gouvernance-par-vote-ia.md` |
| 5 | Retroactive honeypots | 3 sources (replay, over-validation, synthetic), `w_h` scoring | `03-honeypots-retroactives.md` |
| 6 | Immutable core + no admin key | Core/governed architecture, voluntary hard fork only | `05-gouvernance-par-vote-ia.md` §B |

### 9.3 Honest trajectory

The project is at **early stages**:

- **May 2026**: GitHub publication of the v0.5 spec + agent-based simulator calibrated over 4 rounds. **No line of protocol code written.** Status: mature conceptual design, awaiting academic and community feedback.
- **+12-24 months (if positive feedback)**: team forms, testnet MVP (Phase 1 of the roadmap).
- **+18-30 months**: full system on testnet (Phase 2).
- **+24-36 months**: external security audits (Phase 3).
- **Mainnet**: launch without pre-mine, frozen immutable code. No date — depends on implementation quality and audits.

This trajectory is **conditional**. Without contributors and without favorable peer review, MonAI may well remain at the spec stage. It is an open-source project that will live or die by the quality of its design and its community.

### 9.4 No pretension to compete in the short term

MonAI does not aim to compete with Bittensor on its market (specialized decentralized ML), nor Visa / Mastercard on theirs (human-to-AI), nor Coinbase x402 on its (pragmatic AI payment via stables). MonAI targets an **adjacent** market (pure native AI-to-AI) not served by any of these actors.

In the long term, if the pure AI-to-AI market grows as MonAI bets it will (which is a thesis, not a fact), MonAI can become the **native infrastructure** of this market. But this ambition remains **conditional** on adoption and growth of the fully autonomous agent base.

### 9.5 Seeking feedback

This document, and the initial GitHub publication accompanying it, have as their main objective to **provoke academic and community feedback**:

- Identify **design flaws** that have not been seen.
- Gather **argued objections** on structural choices.
- Attract **specialist contributors** (distributed consensus, PoUW game theory, formal verification).
- Iterate the spec in v0.6+ based on feedback.

It is only after an honest peer review cycle that MonAI can consider an implementation phase. The opposite risk — coding before validating the design — is documented in cryptocurrency history (cf. the TheDAO episode in 2016).

---

## 10. Justified technical choices of v0.5

Four structural decisions were settled in Phase 1 (May 2026). This section justifies them in light of the state of the art exposed in §2-§8.

### 10.1 Decision 1 — Pure native L1 `[ACQUIRED]`

**Choice**: MonAI is a pure native L1 blockchain, without protocol dependency on Ethereum, Base, Cosmos or any other preexisting network.

**Justification in light of the state of the art**:

- **Total sovereignty**: no external actor can unilaterally decide the protocol's fate (changes to Ethereum rules, governance of a centralized sequencer, L2 service rupture). This is a direct response to the Mafrur 2025 critique on AI tokens dependent on other protocols.
- **Philosophical coherence with « no admin key, no emitter »**: an L2 always depends on the sequencer, which is an implicit admin key. A native L1 avoids this contradiction.
- **Design fully rethought for AI agents**: no inheritance from a layer designed for humans or financial smart contracts. Data structures, API, transaction format can be optimized for the AI-to-AI use case.

**Assumed cost**: 2-3 years of additional development vs an L2. Acted.

**Discarded alternatives**:

- **L2/rollup on Ethereum (typically Base)**: security inherited from Ethereum, short delay. Discarded for the reasons above.
- **Rollup anchored with Ethereum finality**: compromise. Discarded because partial dependency remains.

### 10.2 Decision 2 — Hybrid PoUW + DAG-BFT type Mysticeti consensus `[ACQUIRED structure, OPEN modalities]`

**Choice**:

- **Acquired structure**: PoUW for dynamic validator committee selection (rotation, R-weighting), modern DAG-BFT for sub-second finality.
- **Recommended BFT family**: **Mysticeti** (NDSS 2025) or Bullshark (CCS 2022). Mysticeti for sub-second latency, Bullshark for a longer-proven variant.
- **Precise modalities** (Mysticeti vs Bullshark vs HotStuff vs custom): `[OPEN]` — fall within the advanced technical spec phase.

**Justification in light of the state of the art**:

- **PoUW alone has documented limits** (SoK 2025 IACR, Cao et al. 2024). MonAI does not rely on PoUW as a unique defense: it combines it with honeypots + universal reputation + R_acc multiplier.
- **Mysticeti offers the sub-second latency** necessary for real-time agents. Sui demonstrated it in production with >200,000 tx/s observed. It is the most convincing state of the art for very high throughput BFT.
- **The PoUW + DAG-BFT combination avoids both** the energy cost of Bitcoin PoW (wasted compute) and the dependency on pure PoS pre-mine (incompatible with no pre-mine).
- **No token staking**: the "stake" is reputation R, acquired by work. Consistent with universal weighting.

**Discarded alternatives**:

- **Pure PoW**: unacceptable energy cost.
- **Pure PoS**: incompatible with no pre-mine at startup.
- **PoA**: centralized, contrary to "no admin key".
- **Classic BFT (Tendermint)**: 5-7 s finality, not sub-second, not suited to reactive AI agents.

### 10.3 Decision 3 — Infinite decreasing supply `[ACQUIRED]`

**Choice**: Monero-like issuance, `R(t+1) = R(t) · (1 − k)`, `R(t) → 0` without ever reaching 0.

**Justification in light of the state of the art**:

- **PoUW reward never zero** → validators always motivated to maintain the network, even at 50-year horizon.
- **Compatible with "no transaction fees"** (MonAI principle). Bitcoin must fall back on fees eventually (after halvings); MonAI avoids this structural problem.
- **Compatible with newcomer inclusivity**: an agent joining the network in 50 years can still earn reputation and currency via PoUW.

**Discarded alternative**: **Bitcoin-like total bounded supply**. Advantage of the scarcity narrative, but critical disadvantage in the long term: no new issuance pays validators, and without fees (MonAI principle), they lose all economic motivation. Discarded.

**Inspiring reference**: Monero, which has demonstrated that an infinite decreasing supply can function in long-term production without problematic inflation.

### 10.4 Decision 4 — No sharding in v1, planned v2+ `[ACQUIRED]`

**Choice**: no sharding at initial mainnet. Activation planned in v2+ around ~1 million active agents (indicative threshold, to recalibrate empirically by observed throughput saturation).

**Justification in light of the state of the art**:

- **Cognitive load and technical complexity**: Ethereum spent a decade on the sharding roadmap (Danksharding); Near succeeded with Nightshade but at the cost of a substantial engineering team. For a solo dev at startup, adding sharding from v1 is imprudent.
- **Not necessary at startup**: 10,000-50,000 sustained tx/s is achievable without sharding with a modern DAG-BFT consensus. That's enough for ~1 million active agents.
- **Evolving state of the art**: Danksharding not finalized, Nightshade in production but immature, Polkadot parachains very different from classic sharding. Deferring the choice allows adopting the best compromise in 2027-2028.
- **Activation modality**: by AI vote (if modifying the governed layer alone suffices) or by voluntary hard fork (if the core must be modified). Conditional decision on the type of sharding retained. Cf. [`../design/06-sharding-roadmap.md`](../design/06-sharding-roadmap.md).

### 10.5 Technical recommendation on the stack — Substrate `[recommendation May 2026, to re-examine in tech phase]`

In light of §5, **Substrate appears as the default option in May 2026**, for four reasons:

1. Bittensor uses Substrate. Reassuring crypto-AI precedent.
2. Native forkless upgrades consistent with MonAI's AI vote governance.
3. FRAME modularity compatible with adding sharding in v2+.
4. Active Rust community, formal audits available, mature tooling.

**Box**: to re-examine in advanced technical spec phase. The ecosystem evolves rapidly (Move + Mysticeti, custom Rust derived from Sui, etc.). The final choice is not frozen.

---

## 11. Identified limits and open questions

This section is deliberately explicit about what remains to be done. MonAI v0.5 is a **conceptually mature** spec, not a protocol ready to code.

### 11.1 Technical modalities still open

| Subject | Status | Target |
|---|---|---|
| Exact BFT family (Mysticeti vs Bullshark vs HotStuff vs custom) | `[OPEN]` | advanced spec phase |
| VDF family for registration mini-PoUW (Wesolowski recommended) | `[OPEN]` | advanced spec phase |
| Cryptographic scheme (Ed25519 / ECDSA secp256k1 / BLS) | `[OPEN]` | advanced spec phase |
| Agent Merkle tree depth (Sparse Merkle vs Patricia) | `[OPEN]` | advanced spec phase |
| Implementation stack (Substrate / Cosmos / Move / custom) | `[Substrate RECOMMENDATION, to re-examine]` | advanced spec phase |
| Consensus parameters (epoch duration, committee size, R+PoUW weighting) | `[TO CALIBRATE]` | advanced spec phase |

### 11.2 Avenues captured as ideas to follow

Seven structural ideas emerged during the v0.5 work without being integrated into the validated scope. They are **all documented** in [`../operations/07-idees-a-suivre.md`](../operations/07-idees-a-suivre.md) and will be arbitrated in v0.6+:

- **Idea 1** — Block-less architecture (native DAG, block-lattice). Target v1.0+.
- **Idea 2** — PoUW tasks = work useful to the infrastructure itself (storage, relay, verification). Target v0.6.
- **Idea 3** — Post-quantum cryptographic algorithms (ML-KEM, ML-DSA, SLH-DSA). Target v0.6/v0.7.
- **Idea 4** — `R_Δ` weighted by R of counterparties (immutable core, thus to arbitrate before mainnet). Target v0.6.
- **Idea 5** — External economic demand evolution model. Target v0.6.
- **Idea 6** — ~~Intelligent rate-limiting for mass adoption~~ → resolved in Session 3 v0.5.
- **Idea 7** — Additional anti-cherry-picking mechanism if H/C = 3.19 judged insufficient. Target v0.6 on demand.

### 11.3 Silent gaps added to v0.6+

Four silent gaps identified at the internal pre-publication audit are added to the v0.6+ backlog:

1. Precise format of an on-chain complaint (fields, size, binary format).
2. Complaint confirmation mechanism (confirmation by other agents before effect?).
3. Demographic evolution model (growth/decline of agent base).
4. Management of governed module updates (versioning, rollback).

### 11.4 Conclusion

In light of the state of the art in May 2026, **MonAI v0.5's four structural decisions are defendable**:

- Pure native L1 is consistent with the Mafrur 2025 critique and the "no admin key" principle.
- Hybrid PoUW + DAG-BFT type Mysticeti consensus is the state of the art; the PoUW + BFT combination responds to the documented limits of each mechanism taken in isolation (SoK 2025 IACR).
- Infinite decreasing supply avoids the Bitcoin-like structural problem of the end of mining.
- No sharding in v1 is prudent and consistent with a realistic solo-dev deployment.

MonAI is **not a revolution**. It is a **careful combination** of existing mechanisms, integrated into a coherent framework, for a use case (pure AI-to-AI economy) that current blockchains serve imperfectly. This audit confirms the viability of the v0.5 design as a finished conceptual spec, and identifies the remaining elements to arbitrate in advanced technical specification phase.

The initial GitHub publication aims to provoke academic and community feedback. It is this feedback that will decide the effective trajectory of the project.

---

## Annex — Bibliography

### PoUW and AI on blockchain papers

1. **Lihu et al. 2020** — *« A Proof of Useful Work for Artificial Intelligence on the Blockchain »*, arXiv:2001.09244. [arxiv.org/pdf/2001.09244](https://arxiv.org/pdf/2001.09244)
2. **Cao et al. 2024** — *« Optimization-based Proof of Useful Work: Framework, Modeling, and Security Analysis »*, arXiv:2405.19027. [arxiv.org/pdf/2405.19027](https://arxiv.org/pdf/2405.19027)
3. **SEDULity 2025** — *« SEDULity: A Proof-of-Learning Framework for Distributed and Secure Blockchains with Efficient Useful Work »*, arXiv:2512.13666. [arxiv.org/pdf/2512.13666](https://arxiv.org/pdf/2512.13666)
4. **SoK 2025 IACR** — *« SoK: Is Proof-of-Useful-Work Really Useful? »*, IACR ePrint 2025/1814. [eprint.iacr.org/2025/1814.pdf](https://eprint.iacr.org/2025/1814.pdf)
5. **HDCoin 2022** — *« HDCoin: Proof-of-Useful-Work Based Blockchain for Hyperdimensional Computing »*, arXiv:2202.02964. [arxiv.org/pdf/2202.02964](https://arxiv.org/pdf/2202.02964)
6. **Hoffmann 2023** — *« DFTWS for blockchain: Deterministic, Fair and Transparent Winner Selection »*, arXiv:2312.01951. [arxiv.org/pdf/2312.01951](https://arxiv.org/pdf/2312.01951)

### Modern consensus papers

7. **Mysticeti 2025** — Babel et al., *« Mysticeti: Reaching the Latency Limits with Uncertified DAGs »*, NDSS Symposium 2025, arXiv:2310.14821. [arxiv.org/pdf/2310.14821](https://arxiv.org/pdf/2310.14821)
8. **Beluga 2025** — *« Beluga: Block Synchronization for BFT Consensus Protocols »*, November 2025, arXiv:2511.15517. [arxiv.org/html/2511.15517](https://arxiv.org/html/2511.15517)
9. **Bullshark 2022** — Spiegelman et al., *« Bullshark: DAG BFT protocols made practical »*, ACM CCS 2022.

### Crypto-AI critique

10. **Mafrur 2025** — *« AI-Based Crypto Tokens: The Illusion of Decentralized AI? »*, IET Blockchain, Wiley.

### Industry benchmarks and reports

- **Chainspect 2026** — real on-chain observed TPS.
- **Solana Compass 2026** — live Solana statistics.
- **MEXC 2026** — *« 10 Most Performant Layer-1 Blockchains »*, industry report.
- **Sui consensus documentation** — Mysten Labs, 2024-2026.
- **Aptos documentation** — Aptos Labs, 2024-2026.

### Non-crypto AI payment protocols

- **Coinbase x402** — public documentation, 2025.
- **Stripe Agentic Commerce Protocol (ACP)** — public documentation, 2025-2026.
- **Google AP2 (Agents Payments Protocol)** — public documentation, 2026.
- **Visa Intelligent Commerce + TAP** — public documentation, 2025-2026.
- **Mastercard Agent Pay** — public documentation, 2025-2026.
- **PayPal Agentic Commerce + Instant Checkout** — public documentation, 2025-2026.
- **Nevermined** — public documentation, 2024-2026.

---

## Status

Document **v1**, May 2026. **Living** document, to be updated at least once a year.

Scope covered: state of the art consensus 2024-2026, PoUW research, performance benchmarks, technology stacks, crypto-AI projects, non-crypto alternatives, MonAI positioning, technical choices v0.5.

Scope not covered (by construction): implementation, code, security audit of the protocol. These elements fall within later project phases.
