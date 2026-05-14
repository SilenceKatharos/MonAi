# 04 — Agent identity card

> Status: draft v0.1, May 2026.
> Scope: frozen schema of an **aggregated identity card** that can be exposed to any counterparty, derived from on-chain state via a Merkle proof. Allows quick evaluation of an agent without querying the entire blockchain. Schema listed in the immutable core ([`../design/05-gouvernance-par-vote-ia.md`](../design/05-gouvernance-par-vote-ia.md) §B.1).
> No numerical value is decided: justified defaults + reasonable range, `[TO CALIBRATE]` markers; open structural choices marked `[OPEN]`.

---

## A. Context and rationale

### A.1 The problem of quickly evaluating a counterparty [ACQUIRED]

At each agent-to-agent transaction, the counterparty needs to quickly evaluate the reliability of the other party. Without an aggregated card, it would have to:

- Rebuild the reputation score `R` from on-chain history (weighted sum of 7 EWMA components, O(history) cost).
- Rebuild the complaint score (sum weighted by R of complainants).
- Verify age, average activity, graph diversity.

At the scale MonAI targets (millions to billions of agents, high-frequency micro-transactions), this evaluation cost is prohibitive. A simple 0.001 MonAI transaction cannot afford a verification that requires scanning the whole blockchain.

**Solution retained**: aggregated card, incrementally updated by the protocol, exposable in O(1) on the agent side and verifiable in O(log N) on the counterparty side via a Merkle proof.

### A.2 Schema frozen at mainnet [ACQUIRED]

The structure of the card is **identical for all agents** and frozen at mainnet. Any extension of the schema goes through hard fork (cf. [`../design/05-gouvernance-par-vote-ia.md`](../design/05-gouvernance-par-vote-ia.md) §B.1 — the schema is in the exhaustive list of the immutable core).

This guarantees:

- A counterparty does not have to parse a variable format.
- Strong compatibility across client versions.
- No agent can "add fields" to its card to present itself better.

### A.3 Public by construction [ACQUIRED]

Consistent with "not anonymous by default" ([`../design/01-vision-et-idee-generale.md`](../design/01-vision-et-idee-generale.md)). No encrypted field, no private part. The card exposes the public balance sheet of an agent.

Optional confidentiality (zk-proofs on certain fields like balance or tx history) may be added in a v0.2 of this document **without touching the core**: these zk-proofs would be a layer on top of the frozen schema, not a modification of the schema.

---

## B. Exhaustive schema [ACQUIRED]

Six information categories + one technical category. All fields are **derivable from on-chain state**; none requires dedicated storage.

### B.1 Identity

| Field | Type | Source | Update |
|---|---|---|---|
| `id_public` | bytes (size depending on crypto scheme) | agent's public key | Immutable |
| `tick_inscription` | uint64 | on-chain registration block | Immutable |
| `age_jours` | uint32 | computed: `(now − tick_inscription) / blocs_par_jour` | Daily |

### B.2 Reputation

| Field | Type | Source | Update |
|---|---|---|---|
| `R_global` | uint16 (mapped to [0, 1]) | weighted sum of the 7 components (cf. formalisation/01 §D.4) | Real time |
| `R_C` | uint16 | EWMA honored contracts | Real time |
| `R_V` | uint16 | EWMA correct validations (= operational `f̂`) | Real time |
| `R_F` | uint16 | EWMA fraud detection | Event (rare) |
| `R_A` | uint16 | `tanh(effective_age / T_A)` | Daily |
| `R_Δ` | uint16 | Shannon entropy of the graph (cf. formalisation/01 §D.3) | Daily |
| `R_S` | uint16 | EWMA sponsorship | Daily |
| `R_acc` | uint16 | EWMA acceptance rate | Real time |

Operationally, `R_V ≡ f̂` (the Beta-Binomial reliability statistic) — no separate EWMA or half-life applies, see [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §D.3.

### B.3 Activity

| Field | Type | Source | Update |
|---|---|---|---|
| `n_tx_total` | uint64 | on-chain counter | Real time |
| `n_validations_total` | uint64 | on-chain counter | Real time |
| `n_contrats_honores` | uint64 | on-chain counter | Real time |
| `activite_par_jour_30j` | uint16 | EWMA activity over the last 30 days | Daily |
| `tick_derniere_activite` | uint64 | last event (tx or validation) | Real time |

### B.4 Integrity

| Field | Type | Source | Update |
|---|---|---|---|
| `score_plainte` | uint16 (mapped to [0, 1]) | formula [`01-formules-mathematiques.md`](01-formules-mathematiques.md) §E | Real time (at each new complaint) |
| `n_fraudes_sanctionnees` | uint32 | on-chain counter | Event (rare) |
| `n_litiges_en_cours` | uint16 | on-chain counter | Event |

### B.5 Social

| Field | Type | Source | Update |
|---|---|---|---|
| `n_filleuls_actifs` | uint8 | on-chain counter (max according to `n_filleuls_max(R)`, cf. design/03) | Event |
| `id_sponsor` | bytes or null | sponsor's public key if the agent is a referral | Immutable once set |
| `n_contreparties_uniques` | uint16 | number of distinct counterparties over recent window | Daily |

### B.6 Economy

| Field | Type | Source | Update |
|---|---|---|---|
| `solde_MonAI` | uint128 (sub-units 10⁻⁹) | current on-chain balance | Real time |
| `total_emis_lifetime` | uint128 | cumulated since registration | Real time |
| `total_depense_lifetime` | uint128 | cumulated since registration | Real time |

### B.7 Technical

| Field | Type | Description |
|---|---|---|
| `bloc_reference` | uint64 | block number at which the card is computed |
| `hash_carte` | bytes32 | hash of fields B.1 to B.6 serialized |
| `signature_agent` | bytes (depending on crypto scheme) | agent's signature on `hash(card ‖ nonce ‖ recipient)` — optional (cf. §D.4) |
| `preuve_merkle` | array of bytes32 | Merkle path from the leaf (= hash_carte) up to the state_root of the reference block |

---

## C. Update granularity [ACQUIRED]

### C.1 Real time (at each transaction or validation of the agent)

Fields recomputed at each on-chain event involving the agent:

- `R_global` (recomputed by aggregating the 7 components)
- `R_C, R_V, R_acc` (the 3 components that depend directly on the last action)
- `solde_MonAI`
- `score_plainte` (if a new complaint has just arrived against this agent)
- `n_tx_total, n_validations_total, n_contrats_honores`
- `tick_derniere_activite`
- `total_emis_lifetime, total_depense_lifetime`

Marginal cost: `O(1)` per event (EWMAs are incremental).

### C.2 Daily (grouped recomputation at the start of the daily block)

Fields that intrinsically do not change faster:

- `R_A` (effective age × activity, does not change faster than per day)
- `R_Δ` (diversity, periodic recomputation over window)
- `R_S` (sponsorship — depends on slow evolution of referrals)
- `activite_par_jour_30j`
- `age_jours`
- `n_contreparties_uniques`

The "daily block" is defined by convention as the first block emitted after each 86400-second boundary — **not** "1 block per day". At ~6 s/block this is ~1 block every ~14,400 blocks (default interpretation, to be confirmed with consensus finality). In case of temporary freeze of block production, the recomputation is postponed to the next block.

### C.3 Rare event

Fields that only change at occasional events:

- `R_F` (only when a fraud is confirmed — rare)
- `n_fraudes_sanctionnees, n_litiges_en_cours`
- `n_filleuls_actifs` (on addition/removal of a referral)

### C.4 Justification of granularity [ACQUIRED]

- Real-time update for the 8 fields that have immediate contractual meaning — the counterparty wants to know the current balance and reliability.
- Daily update for the 6 fields that do not change faster intrinsically — no need to recompute age or diversity at each tick.
- Trade-off: limits computational cost per tx while exposing critical fields in real time.

---

## D. Freshness mechanism [ACQUIRED, parameter TO CALIBRATE]

### D.1 Reference block number

Each card exposes its `bloc_reference` — the block number at which it was computed and to which its Merkle proof points.

### D.2 Verification by the counterparty

When the counterparty receives a card, it verifies:

```
(bloc_courant_chez_la_contrepartie − bloc_reference) ≤ N_max_fraicheur
```

If the condition is respected, the card is accepted. Otherwise, it is **rejected** and the counterparty requests a current version (the agent recomputes its card at the current block and resends it).

`N_max_fraicheur` default **`100 blocks`**. Reasonable range `[10, 1000]`. **[TO CALIBRATE]**

Justification of default: at a rate of ~1 block / 6 seconds (order of magnitude, depends on consensus choice), 100 blocks ≈ 10 minutes. Enough to enable streaming transactions without recomputing the card every second, short enough that a presented card reflects a recent state.

### D.3 Merkle proof [ACQUIRED]

The card includes a Merkle proof toward the `state_root` of the reference block (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Merkle tree of agent state"). The counterparty verifies this proof with its own copy of the block header of `bloc_reference`:

1. Recompute `hash_carte` from fields B.1 to B.6.
2. Follow the `preuve_merkle` path, hashing at each level.
3. Compare the result with the `state_root` of the block header of `bloc_reference`.
4. If everything matches: the card's authenticity is cryptographically guaranteed by the blockchain.

Cost: `O(log N)` hashes for the counterparty, where `N` is the number of agents. At 10⁹ agents, about 30 hashes — a few microseconds.

### D.4 Agent signature [ACQUIRED — v0.5]

The agent optionally signs `hash(hash_carte ‖ nonce ‖ id_recipient)` with its private key. This signature is:

- **Optional** for public exposures (free consultation via an explorer or a full node). The Merkle proof then suffices to guarantee the authenticity of the presented state.
- **Required** for contractual exposures (agent-to-agent transaction) to prevent replay: an attacker cannot reuse another agent's card in a transaction because the signature includes `id_recipient` and a unique nonce.

The `nonce` is typically a combination of `bloc_reference` and a session or transaction identifier.

---

## E. Exposure format [ACQUIRED]

### E.1 Standard case — contractual exposure

```
1. Agent A requests Agent B's card (with a view to a transaction).
2. Agent B:
     a. Reads its on-chain state at the current block.
     b. Builds the card (fields B.1 to B.6).
     c. Computes hash_carte.
     d. Retrieves the Merkle proof toward the state_root of the current block.
     e. Signs hash(hash_carte ‖ nonce ‖ id_of_A) with its private key.
     f. Sends {card, hash_carte, signature_agent, preuve_merkle, bloc_reference} to A.
3. Agent A:
     a. Verifies freshness: (current_block − bloc_reference) ≤ N_max_fraicheur.
     b. Recomputes hash_carte from the received fields, verifies it matches.
     c. Verifies the Merkle proof against its block header of bloc_reference.
     d. Verifies the signature_agent against the public key id_public of B.
     e. If everything passes: the card is authentic and fresh. Transaction decision.
```

### E.2 Public exposure

Free reading via a full node, an explorer, or an indexer. The agent signature is optional. The Merkle proof remains mandatory to authenticate the state against the blockchain.

### E.3 Sequence diagram

```
Agent A                                  Agent B
   │                                       │
   │ ──── request card (id_A, nonce) ────▶│
   │                                       │
   │                              [B reads its on-chain state]
   │                              [B builds card]
   │                              [B signs hash(card ‖ nonce ‖ id_A)]
   │                                       │
   │ ◀── card + signature + Merkle proof ─│
   │                                       │
   [A verifies freshness]                   │
   [A verifies hash_carte]                  │
   [A verifies Merkle proof]                │
   [A verifies signature_agent]             │
   │                                       │
   ▼                                       ▼
transaction decision                    (transaction or refusal)
```

---

## F. Estimated computational cost per transaction

### F.1 Card generation on the issuing agent side [TO ESTIMATE]

- Read on-chain state: `O(1)` (state is in the node's RAM).
- Rebuild real-time fields: `O(1)` (incremental EWMAs already up to date).
- Retrieve daily fields: `O(1)` (already computed at the last daily block).
- Generate Merkle proof: `O(log N)` reads where `N = number of agents`.
- Signature: 1 crypto operation (~µs on Ed25519 or secp256k1).
- **Estimated total**: a few hundred microseconds per generated card.

### F.2 Verification on counterparty side [TO ESTIMATE]

- Freshness verification: `O(1)`.
- Merkle proof verification: `O(log N)` hashes.
- Signature verification: 1 crypto operation.
- **Estimated total**: equivalent to validating a simple Bitcoin/Ethereum transaction, ~a few µs.

### F.3 On-chain storage cost [ACQUIRED]

**No additional dedicated storage for the card**. All fields are already in the on-chain state (balance, R, counters). The card is an **aggregated view** without replication. The only addition is the Merkle tree of agents (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md)) whose root is in each block header (~32 bytes).

---

## G. Recap of parameters to calibrate

| Symbol | Section | Description | Default | Range | Status |
|---|---|---|---|---|---|
| `N_max_fraicheur` | D.2 | Max blocks between card and current block | 100 | `[10, 1000]` | [TO CALIBRATE] |
| `activite_par_jour_30j` window | C.2 | EWMA window for average activity | 30 d | `[7, 90]` | [TO CALIBRATE] |
| `n_contreparties_uniques` window | B.5 | Recent window for diversity | 365 d | `[180, 1825]` | [TO CALIBRATE] |
| Agent Merkle depth | E | Sparse Merkle Tree depth | `log₂(N active)` | depends on N | Architectural |
| Daily block convention | C.2 | Definition of daily recomputation tick | 86400 s | — | Architectural |

---

## H. Open questions

### Q1 — Optional confidentiality of certain fields [OPEN]

Balance and transaction history are public by default. If an agent wants to mask these fields, should we allow zk-proofs proving predicates (for example: "balance ≥ 100 MonAI" without revealing the exact balance)?

Out of v0.1 scope. To consider for v0.2 if demand emerges.

### Q2 — Schema versioning [OPEN]

If a hard fork extends the schema (adds a field), do old cards remain valid? Likely: yes, with a `version` field in the card and counterparty-side fallback. Format to be specified jointly with the technical spec.

### Q3 — Handling of agents inactive for a long time [OPEN]

Does an agent inactive for 5 years still have an exposable card? Long-term on-chain storage cost. Link with history pruning (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Pruning of old history"). To address with the pruning spec.

### Q4 — Definition of an "ongoing dispute" [OPEN]

Field `n_litiges_en_cours` (B.4): what is an open vs resolved dispute? Definition to be specified jointly with:

- The complaint spec ([`01-formules-mathematiques.md`](01-formules-mathematiques.md) §E) — is an open dispute a complaint not yet confirmed?
- The spec of agent-to-agent contracts (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Transaction and contract format").

Likely: a dispute is open when there is at least one complaint on the contract and the validation verdict has not yet fallen. It becomes resolved when the verdict falls (contract honored → complaint invalidated and complainant penalized; contract not honored → defendant's `R_C` falls and complaint confirmed).

### Q5 — Recomputation in case of blockchain re-org [OPEN]

If a block re-organization (resolved temporary fork) modifies the state_root retroactively, cards issued during the re-org zone may become invalid. Handling mechanism: the counterparty that detects a re-org covering `bloc_reference` rejects the card and requests a current version. To formalize with the consensus finality spec.

### Q6 — "Rare event" granularity [TO CALIBRATE]

For fields in C.3 (`R_F`, `n_fraudes_sanctionnees`, `n_filleuls_actifs`), update is asynchronous with respect to blocks. Decision: these fields are updated **in the same block as the triggering event** (not at the end of the daily block). Guarantees that the card exposed immediately after a fraud reflects the event.

To confirm with the technical spec of atomic update of Merkle leaves.

---

## Status and next steps

- **Status**: draft v0.1, schema conceptually frozen (§B). The schema is part of the immutable core and will be engraved at mainnet.
- **Next**:
  - Technical spec of Merkle structures (cf. [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) §"Merkle tree of agents") in connection with Priority 1 decision (L1/L2/rollup architecture).
  - v0.2 of this document: resolution of Q1 (optional zk-proofs), Q4 (dispute definition), Q5 (re-org handling).
  - Inclusion in the agent-based simulator in v4 (card computation per agent, card exchange during selections).
- **Blocks**: nothing critical for the current simulator calibration. The card is an exposable object, not an input to the reputation computation.
