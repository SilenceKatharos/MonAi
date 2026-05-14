# MonAI — Content Audit
_Working document for rebuilding the public landing page (monai-site-v2)._

_Generated: 2026-05-14_

## Pitch principal

> "A cryptocurrency, an identity, a reputation — designed as a single inseparable protocol for AI agents that transact between themselves without a human in the loop."

Subordinate framing (also from `index.html`): MonAI proposes to be the native economic infrastructure for billions of autonomous AI agents that will need to pay, sign contracts, and trust each other without a human intermediary — a use case the current rails (bank cards, USDC over x402, wire transfers) were not designed for.

## Principes fondateurs

Non-negotiable principles repeated across `index.html`, `economie.html`, `gouvernance.html`, `identite-reputation.html`, `securite.html`:

- **No pre-mine, no founder allocation, no ICO** — every coin is created gradually through work, including for the protocol creator.
- **No emitter / no protocol privilege** — the creator mines on the same terms as any other participant.
- **Immutable core** — consensus, monetary issuance, reward formula, reputation computation, honeypot mechanism and the governance mechanism itself are frozen at mainnet.
- **No admin key, no pause function, no upgradable proxy on core** — modification of the core only by voluntary hard fork of the community.
- **Core / governed-layer distinction** — only an explicit whitelist of parameters in the governed layer is votable, the whitelist itself is meta-immutable.
- **Permissive open-source** — public code from block 1, multiple implementations encouraged, anticipated MIT license.
- **No transaction fees levied by the protocol** — anti-spam goes through reputation + registration mini-PoUW + adaptive global rate-limit, not through fees.
- **Not anonymous by default** — public transactions like Bitcoin; optional confidentiality may come later.
- **Universal weighting by reputation R** — every agent action (vote, complaint, validator selection, rate-limit quota, co-signature, prioritization) has a weight proportional to R; Sybils with R ≈ 0 carry negligible weight everywhere.
- **AI vote governance auto-activates only at 100 M active agents** — before that threshold, no modification by anyone; after, only whitelisted parameters, with 80% R-weighted adoption threshold and mandatory vote bound to transacting.
- **Inseparability of the three layers** — currency, identity, reputation cannot be decoupled; reputation needs economic skin in the game, skin in the game needs a native currency, currency needs reputation to distinguish good from bad agents.

## Concepts techniques majeurs

### Hybrid PoUW + DAG-BFT consensus (Mysticeti / Bullshark family)

A two-stage consensus where Proof-of-Useful-Work dynamically selects the validator committee (rotation, weighted by reputation R) and a modern DAG-BFT layer finalizes blocks as soon as ≥ 2/3 of the committee agrees. Target throughput v1: 10,000-50,000 tx/s with sub-second finality, achievable without sharding (sharding deferred to v2+). This is the structural decision that lets MonAI be a pure native L1 without depending on Ethereum/Base.

### Retroactive honeypots (3 sources)

The mechanism that detects false validations without depending on the emergent consensus, answering the "what if the majority lies?" problem. Three converging sources feed a unified pool of which ~10% of the task flow is drawn deterministically via a VRF: (i) replay of consensus-stable past tasks, (ii) probabilistic retroactive over-validation on existing tasks, (iii) synthetic tasks with verdict known by construction (ECDSA, SHA-256, format conformance). Each honeypot observation weighs `w_h = 5` in the Beta-Binomial reliability counter, accelerating cheater detection (~21 validations vs ~30 without).

### 7-component reputation R

Aggregated weighted sum: `R_C` honored contracts (0.33), `R_V` correct validations = the operational reliability f̂ (0.24), `R_F` fraud detection (0.10), `R_A` age × activity (0.10), `R_Δ` graph diversity (0.10), `R_S` sponsorship outcomes (0.10), `R_acc` acceptance rate (0.05). Each component is an EWMA with its own half-life so R decays under inactivity. R is the universal weighting carrier — it gates validator selection, vote weight, rate-limit priority, sponsorship caps, complaint weighting.

### Cryptographic identity card with Merkle proof

A fixed-schema, on-chain aggregated summary that an agent presents to its counterparty at every transaction (identity, reputation breakdown, activity counters, integrity / complaint score, social graph, economy). Verified in O(log N) via a Merkle proof to the reference block's `state_root` (~30 hashings for 10⁹ agents) + freshness check (< 100 blocks gap) + agent signature for anti-replay. The schema is engraved at mainnet — any extension requires a hard fork. This is what makes MonAI usable agent-to-agent without KYC.

### No-fees economy with sigmoid M(f, d) and demand bonus P(t, task)

Issuance is exclusively PoUW: each validated task mints a fraction `k · R(t)` of the remaining supply (infinite decreasing inflation, no Bitcoin-style hard cap so validators stay paid forever). The reward is shaped by four multiplicative levers: `G(f,d)` (sliding-threshold sigmoid penalizing low reliability), `R_acc` (direct multiplier penalizing cherry-pickers), `(1+γ·d)` (difficulty bonus, γ=3), and `P(t,task)` (demand bonus growing with refusals +5% and waiting time +1%/tick, capped). The complete reward: `G(f, d) · R_acc · min(cap_primes, (1+γ·d) · P) · k · R(t)`. Absence of fees makes 10⁻⁹-unit micro-payments natively viable, which standard chains cannot do.

## Ton éditorial dominant

- **Sobre** — limited palette (deep blue + fresh green accent), no emoji, no decorative animation, system sans-serif, max-width ~800 px, monochrome tables. The style.css explicitly comments "sober" as a posture.
- **Pédagogique sans condescendance** — each technical term is glossed in a parenthetical or callout (e.g. "VDF — Verifiable Delay Function"), tables compare alternatives side-by-side, formulas appear in `<pre>` blocks with each symbol unpacked underneath. Target audience explicitly stated as "someone who knows a bit of computing but not crypto/AI in detail".
- **Honnête / non promotionnel** — pages openly state limits ("MonAI is not a fundamental technological leap", "may remain at the spec stage without contributors", "H/C target reconsidered: theoretical >5, observed 3.19, arbitrated as sufficient"), benchmark tables include the unfavorable announced-vs-real-TPS gaps even for MonAI's own deliberately conservative targets, and the audit page explicitly acknowledges that each building block exists elsewhere — the contribution is integration, not invention.

## Figures et schémas existants

Files found in `/home/marius/Documents/MonAi/site/figures/`:

- `f_hat_par_profil.png`
- `gains_par_profil.png`
- `R_par_profil.png`
- `reseau.png`

Grouped by plausible reuse in the new landing page:

### Simulator

- `f_hat_par_profil.png` — reliability trajectories f̂ per profile over 2,000 ticks (scenario A); shows Sybils dropping to ~0.55 while honest stays near 0.99. Already used in `simulateur.html`.
- `gains_par_profil.png` — mean cumulative gains per agent per profile; shows Sybils/biased random crushed several orders of magnitude below honest. Already used in `simulateur.html`.
- `R_par_profil.png` — aggregated reputation score R per profile, mirroring f̂ dynamics through R_V. Already used in `simulateur.html`.

### Unclassified

- `reseau.png` — not referenced in any of the eight audited HTML pages; presumed to be a transaction-graph or network-topology visualisation. Candidate for an Identity & Reputation or Protocol section if its content matches, but classification deferred until the image is inspected.

Note: most diagrams on the legacy site are **inline SVG**, not PNG (three-layers stack, demand-bonus growth curve, sponsorship flow, identity card schema, honeypot funnel, defense-stack, governance timeline, core-vs-governed-layer split, Sybil cost asymmetry). These are reusable as raw SVG markup but are not files under `site/figures/`.
