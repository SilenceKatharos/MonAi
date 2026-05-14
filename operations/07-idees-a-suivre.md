# 07 — Ideas to follow

> Status: registry of structural ideas and proposals raised by Marius during design, to be addressed **after** the v0.5 work is wrapped up and the simulator has empirically validated the existing mechanisms.
>
> Principle: each idea is noted with its context, motivation, and order of magnitude of impact. **None is addressed while the current work is unfinished.** This file preserves the memory of structuring intuitions without polluting the scope of active sessions.

---

## Captured ideas

### Idea 1 — Block-less architecture (refoundation)

- **Raised**: May 2026.
- **Context**: discussion on network structure (Session 3 of v0.5 work).
- **Motivation**: "AI is a revolution, everything has to be rethought for it". Blocks are an inheritance from blockchains designed for humans. An infrastructure for AI agents could use more suitable structures (DAG, block-lattice, intelligent mempool).
- **Impact**: full overhaul of [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md) and the technical architecture.
- **Difficulty**: very high — fundamental research.
- **To be addressed**: v1.0, after validation of the current v0.5.

### Idea 2 — PoUW tasks = work useful to the infrastructure

- **Raised**: May 2026.
- **Motivation**: instead of having the protocol "generate" abstract synthetic tasks, all paid tasks are concrete contributions to the infrastructure: storage of blocks/data, P2P relay, verifications, state maintenance.
- **Advantage**: self-constituting. Paid work builds the network itself.
- **Impact**: redefinition of the PoUW model ([`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §B–D).
- **To be addressed**: v0.6 after simulation.

### Idea 3 — Post-quantum cryptographic algorithms

- **Raised**: May 2026.
- **Motivation**: prepare the protocol for the arrival of quantum computers (5-15 years). NIST standards published in 2024: ML-KEM (encryption), ML-DSA (signatures), SLH-DSA (hash-based).
- **Trade-off**: larger signatures (2-4 KB), slower computation.
- **Recommended solution**: classical + post-quantum hybrid in parallel.
- **Impact**: modification of the cryptographic layer ([`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) and [`../design/04-verification-et-stockage.md`](../design/04-verification-et-stockage.md)).
- **To be addressed**: v0.6 or v0.7, dedicated session.

### Idea 4 — R_Δ weighted by R of counterparties

- **Raised**: May 2026.
- **Context**: Session 1 consistency audit, universal weighting principle.
- **Motivation**: currently `R_Δ` counts counterparties uniformly (Shannon entropy on the distribution of volumes). With weighting by R, Sybils without reputation do not add diversity to the graph.
- **Impact**: modifies the `R_Δ` calculation in [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §D.3 (immutable core).
- **To be addressed**: v0.6, to be coordinated with the simulator.

### Idea 5 — Economic demand model

- **Raised**: May 2026.
- **Motivation**: who proposes tasks to the network? Who pays for them to be validated? Today the protocol "generates" but the formalization of external demand (humans, agents) is missing.
- **Impact**: new design document or addition to [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md).
- **To be addressed**: v0.6 after simulation.

### Idea 6 — "Intelligent" rate-limiting for mass adoption

- **Raised**: May 2026.
- **Motivation**: the current reputation-based rate-limiting hinders adoption by newcomers. Avenues considered: registration mini-PoUW, adaptive global rate-limit by network volume.
- **Impact**: [`../design/02-crypto-et-economie.md`](../design/02-crypto-et-economie.md) (anti-spam) and [`../design/03-identite-et-reputation.md`](../design/03-identite-et-reputation.md) (sponsorship).
- **To be addressed**: ~~IN SESSION 3 of the v0.5 work~~ → **RESOLVED** in Session 3 (May 2026). Registration mini-PoUW + adaptive global rate-limit formalized and documented.

### Idea 7 — Additional anti-cherry-picking mechanism

- **Raised**: May 2026, v0.5 Session 4.
- **Context**: v4 grid search empirically demonstrated that the demand bonus alone is not enough to reach the H/C > 5 target on scenario A. Maximum observed: H/C = 3.19 (vs target > 5). Structural cause: few cherry-pickers in the mix (5/140), thus few refusals, thus P stagnates around 1.01.
- **Motivation**: if the H/C > 5 target is maintained, an additional mechanism is necessary. Possible avenues to explore:
  - **Additional R penalty** per refusal (beyond the R_acc effect).
  - **Minimum quota of hard tasks** an agent must accept to maintain eligibility to validate.
  - **Selection inversely weighted by n_refusals** in the history of a task (a cherry-picker who has already refused a similar task is less selected for it).
  - **More aggressive calibration** of `δ_refus` (e.g. 0.20-0.30) combined with a higher cap_primes.
- **Alternative**: reconsider the H/C > 5 target and accept H/C ≈ 3 as acceptable (honest already gains 3× more than cherry-picker, and all other targets pass).
- **Impact**: potential modification of [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) §C-§F, or revision of the target §E in [`../formalisation/05-bilan-v0-5.md`](../formalisation/05-bilan-v0-5.md).
- **Difficulty**: medium. Many options to compare empirically.
- **To be addressed**: v0.6, after Marius's decision on the H/C target.

> **Note**: idea 6 was integrated into the work in Session 3, fully addressed, and marked resolved. Idea 7 emerges from the empirical result of Session 4 (Risk 1 materialized) and remains to be arbitrated.

---

## Management rules

- Any **new structural idea** raised during a session of the current work must be **added to this list**, and **not** integrated into the current session.
- Ideas are revisited **after** empirical validation of the simulator in Session 4 of the v0.5 work.
- Once v0.5 is tested, each idea is evaluated and we decide which to address as a priority for v0.6.
- This file is **not an action backlog**: it is a registry of structured notes. The decision to act remains with Marius.

---

## Idea format

For consistency, each new captured idea follows this minimal scheme:

```
### Idea N — Short title

- **Raised**: month year (+ session if in progress).
- **Context**: where / during which discussion.
- **Motivation**: why this idea.
- **Impact**: which files / mechanisms would be affected.
- **Difficulty**: optional — low / medium / high / very high.
- **To be addressed**: target version (v0.6, v1.0, etc.) or trigger condition.
```
