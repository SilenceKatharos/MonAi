# MonAI v2 site — Opportunities

_What we could add, grounded in the project documentation. Each item references its source files so we can confirm scope and accuracy before implementing._

_Generated: 2026-05-14_

## Methodology

I read the current five landing sections (`Hero`, `Protocol`, `Principles`, `Whitepaper`, `Roadmap`) and the working `docs/CONTENT-AUDIT.md`, then mapped them against the substantial mechanisms documented in `MonAi/design/`, `MonAi/formalisation/`, `MonAi/securite/`, `MonAi/operations/`, and `MonAi/simulateur/`. Mapping rule: anything described as `[ACQUIRED]` or with a dedicated formula / threat / chapter in the corpus, and which currently has **no surface** in `monai-site-v2/src/components/sections/`, is a candidate gap. Items that would only re-state what `Protocol`/`Principles`/`Whitepaper` already say were excluded. Items that fight the established design DNA (sober palette, mono labels, max-width prose, single accent) are listed as risks rather than discarded silently.

## Summary table

| Idea | Type | Impact | Effort | Source files |
|---|---|---|---|---|
| Threat model gallery (9 attacks × stacked defenses) | Section | High | M | `MonAi/securite/05-modele-de-menace-et-defenses.md` |
| Honeypots — 3 sources mechanic | Sub-page | High | M | `MonAi/formalisation/03-honeypots-retroactives.md`, `MonAi/site/honeypots.html` |
| Economy — sigmoid M(f, d) + demand bonus P(t, task) | Sub-page | High | M | `MonAi/design/02-crypto-et-economie.md`, `MonAi/formalisation/01-formules-mathematiques.md` §C, §F |
| Identity card schema (7 categories, Merkle proof) | Section | High | M | `MonAi/formalisation/04-carte-identite.md`, `MonAi/design/03-identite-et-reputation.md` |
| Consensus — PoUW + DAG-BFT (Mysticeti / Bullshark) | Section | High | M | `MonAi/design/04-verification-et-stockage.md`, `MonAi/formalisation/06-audit-blockchains.md` §2 |
| Simulator journey v1 → v4 (calibration timeline) | Section | High | M | `MonAi/simulateur/README.md`, `MonAi/formalisation/05-bilan-v0-5.md` §E |
| Governance — core / governed split, 100M activation | Section | High | M | `MonAi/design/05-gouvernance-par-vote-ia.md` |
| Comparative positioning table (BTC, ETH, Sui, x402…) | Section | Medium | S | `MonAi/formalisation/06-audit-blockchains.md` §4, §6, §9 |
| "What MonAI is not" anti-claims block | Section | Medium | S | `MonAi/design/01-vision-et-idee-generale.md` §"What MonAI is not" |
| Sponsorship cold-start mechanic | Component | Medium | S | `MonAi/design/03-identite-et-reputation.md` §"Sponsorship" |
| Adaptive global rate-limit (under-load vs saturation) | Component | Medium | S | `MonAi/design/04-verification-et-stockage.md` §"Adaptive global rate limit" |
| Registration mini-PoUW + attack-cost table | Data viz | Medium | S | `MonAi/formalisation/05-bilan-v0-5.md` §E.4, `MonAi/formalisation/01-formules-mathematiques.md` §G |
| Three-layers inseparability diagram | Data viz | Medium | S | `MonAi/design/01-vision-et-idee-generale.md` §"Coherence thesis" |
| Empirical results panel (H/C, H/S, M/C metrics) | Data viz | Medium | S | `MonAi/formalisation/05-bilan-v0-5.md` §E.1–E.3 |
| Interactive M(f, d) sigmoid plot with depth slider | Interactive | Medium | L | `MonAi/formalisation/01-formules-mathematiques.md` §C |
| FAQ / objections-anticipated | Section | Low | S | `MonAi/formalisation/06-audit-blockchains.md` §11, `MonAi/design/01-vision-et-idee-generale.md` |
| Sharding roadmap teaser (v2+) | Component | Low | S | `MonAi/design/06-sharding-roadmap.md` |
| Open questions tracker | Sub-page | Low | M | `MonAi/operations/06-questions-ouvertes-et-roadmap.md` |
| Contribute / call-for-review block | Section | Low | S | `MonAi/CONTRIBUTING.md`, `MonAi/formalisation/06-audit-blockchains.md` §1.2 |

## High-impact additions

### Threat model gallery — 9 attacks × stacked defenses

The most under-surfaced asset in the project. The current Principles section asserts the protocol is safe; the threat doc actually proves it across nine catalogued attacks (simple Sybil, patient Sybil, collective memory, biased random, cherry-picking / unfair specialization, difficulty manipulation, consensus collusion, fee-less spam, and a ninth class on registration). Each attack has a labelled defense stack (1–6 layers).

- Source: `MonAi/securite/05-modele-de-menace-et-defenses.md`.
- Design suggestion: a 9-card tilt-card grid (same DNA as `Protocol`), each card holds attack number + name + a 1-line description. Click expands an in-place panel showing the layered defenses as a vertical list with mono labels (Layer 1 — PoUW entry cost, Layer 2 — throughput limits, …). No modal; in-place accordion. The accent color marks defenses that the simulator has actually exercised (Sybil, biased random) vs the ones still on paper.
- Risk: nine cards plus expanders is a lot of vertical space — this is the section most at risk of breaking the landing's pacing. Mitigation: cap default-visible to the 4–5 most representative and link the rest to a `/security` sub-page.

### Honeypots sub-page — three sources + scoring

Honeypots are arguably the most distinctive single mechanism in the whitepaper (the three converging sources + `w_h = 5` Beta-Binomial weight + the cold-start funnel `φ_cold-start(j) = max(φ, 1 − j/n_init)`). None of this is reachable from the v2 landing today. The legacy site already had a `honeypots.html` to mine for copy.

- Source: `MonAi/formalisation/03-honeypots-retroactives.md`, `MonAi/site/honeypots.html`.
- Design suggestion: dedicated `/honeypots` route. Hero: short pitch ("Detecting false validations without trusting consensus"). Then three columns labelled "(i) Replay", "(ii) Over-validation", "(iii) Synthetic", each with eligibility criteria in a mono block. A simple SVG funnel diagram showing the unified pool feeding a VRF-drawn 10% of slots. Bottom: a `<DiffPanel>` comparing detection speed (~21 validations with `w_h=5` vs ~30 without). Final block: the cold-start curve as an inline SVG line chart (1.0 → φ over `n_init = 20` validations).
- Risk: explaining three sources in vulgarized terms without losing precision is harder than it looks. The Q1 / template-bug arbitration shouldn't appear (too inside-baseball — keep it for the sub-page footnote).

### Economy sub-page — sigmoid M(f, d) and demand bonus P(t, task)

The current Whitepaper section shows R = (R_C, …, R_acc) but never surfaces the actual PoUW reward formula `G(f, d) · R_acc · min(cap_primes, (1+γ·d) · P) · k · R(t)`. This is the economic spine — four multiplicative levers each defending against a specific failure mode (anti-cheating, anti-cherry-picking, difficulty pricing, neglected-task pickup).

- Source: `MonAi/design/02-crypto-et-economie.md`, `MonAi/formalisation/01-formules-mathematiques.md` §C and §F, `MonAi/formalisation/05-bilan-v0-5.md` §A.2.
- Design suggestion: dedicated `/economy` route. Open with the full formula in mono at hero size (mirroring how `Whitepaper.tsx` already renders `R = (…)`). Below: four small TiltCards, one per factor, with the role-table copy from `formalisation/05-bilan-v0-5.md` §A.2 ("Anti-statistical-cheating", "Anti-cherry-picking", "Reward of difficult tasks", "Reward of neglected tasks"). Add one stat strip: "10⁻⁹ MonAI minimum unit · zero protocol fees · infinite decreasing supply". Close with a small two-column comparison: "ETH/USDC gas at 0.001 unit: 1000× the value" vs "MonAI at 0.001 unit: native".
- Risk: tempting to inline the calibrated v3 numbers (`f₀_max=0.85, k_sigmoid=40, γ=3.0`) — they belong on the simulator page, not in the economy pitch. Keep this page principle-first.

### Identity card section — schema + Merkle proof

The card is `[ACQUIRED]` and engraved at mainnet, but the landing has nothing on it. Yet it is the operational layer an AI agent actually sees at every transaction (six info categories + technical: identity, reputation, activity, integrity, social, economy + Merkle path).

- Source: `MonAi/formalisation/04-carte-identite.md`, `MonAi/design/03-identite-et-reputation.md` §"Exposure via the identity card".
- Design suggestion: a section after `Whitepaper`, titled "What an agent shows its counterparty". Render an inline SVG mock of the card — a bordered rectangle split into the six categories, each with two or three sample mono-font fields (`R_global`, `score_plainte`, `n_contreparties_uniques`, `solde_MonAI`, …). Annotate with a small `O(log N)` Merkle-proof note ("~30 hashes for 10⁹ agents"). Update-granularity legend in muted text: real-time / daily / event.
- Risk: schematic cards always tempt designers to add color and shadow — must stay strictly mono and bordered, otherwise the page tone breaks.

### Consensus section — PoUW + DAG-BFT (Mysticeti / Bullshark)

The `Protocol` section advertises the L0 "Settlement" layer but only says "Hybrid PoUW + DAG-BFT consensus" with no further explanation. The audit doc explicitly positions this as the structural decision that lets MonAI exist as a pure native L1, and benchmarks Mysticeti against Tendermint / HotStuff / Bullshark.

- Source: `MonAi/design/04-verification-et-stockage.md` §"Consensus", `MonAi/formalisation/06-audit-blockchains.md` §2.
- Design suggestion: a dedicated section between `Protocol` and `Principles` titled "Two-stage consensus, without staking and without waste". Two-column SVG: left = "PoUW selects committee" (R-weighted rotation), right = "DAG-BFT finalizes (≥ 2/3)". Bottom: a four-row comparison table (Tendermint, HotStuff, Bullshark, Mysticeti) with finality latency and observed throughput pulled straight from `06-audit-blockchains.md` §2.6 — this is the rare project that doesn't have to hide its benchmarks.
- Risk: this section duplicates a small amount of `Protocol`'s "L0 Settlement" copy. The card-style summary in `Protocol` would need a one-line tweak to defer to this new section ("read more in Consensus" link).

### Simulator timeline — v1 → v4 calibration journey

The project's empirical proof is that v0.5 has been agent-simulated four times with rising sophistication (mempool refactor in v4, demand bonus added, four targets tested). The current `Roadmap` mentions "Simulator v4 calibrated (H/C ≈ 3.19)" in a single sentence. The actual story — v1 hierarchy failed on cherry-pickers, v2 added R_acc as a component, v3 made it a multiplier (current default Candidate B), v4 added P(t, task) — is the most honest credibility marker available.

- Source: `MonAi/simulateur/README.md`, `MonAi/formalisation/05-bilan-v0-5.md` §E, `MonAi/site/figures/f_hat_par_profil.png`, `gains_par_profil.png`, `R_par_profil.png`.
- Design suggestion: a horizontal stepper of 4 milestones (v1 / v2 / v3 / v4) with one-sentence headlines ("Five profiles, hierarchy almost works" / "R_acc as a component — diluted" / "R_acc as a multiplier — Candidate B" / "Mempool + demand bonus — H/C plateaus at 3.19"). Below the stepper: the three existing PNG figures (`f_hat_par_profil.png`, `gains_par_profil.png`, `R_par_profil.png`) in a 3-up grid, with a one-line legend pulled from `simulateur.html`. Bottom: the four-target table (H/M, H/C, M/C, H/S) with the v3 / v4 columns, copying §E.1 directly. The H/C row's red verdict is exactly the kind of honesty the current landing lacks.
- Risk: the figures are dark-backgrounded PNGs from matplotlib defaults. They may clash with the site's dark palette but are not on-brand. Either regenerate the figures with the site's accent colors, or wrap them in a bordered frame with a muted background.

### Governance section — core / governed split + 100 M trigger

The Principles section mentions "Immutable core" but not the most striking governance commitment: governance is **dormant until 100 M active agents** and even then can only touch a hardcoded whitelist with three meta-immutability layers stacked behind it. That a protocol explicitly refuses to govern itself for years is unique enough to deserve its own section.

- Source: `MonAi/design/05-gouvernance-par-vote-ia.md` §B.1 (immutable core inventory), §C.1 (automatic activation), §D (three safeguards).
- Design suggestion: a section with a two-pane visual — top pane labelled "Immutable core" listing the 14 frozen objects from §B.1 in a tight mono-styled list, bottom pane labelled "Governed layer (post-100 M)" listing the half-dozen votable parameters from §B.3. A narrow horizontal hairline between them with the legend "modifiable only by voluntary hard fork ↑ / by AI vote weighted by R ↓". A small callout: "Before 100 M, no one can change anything — including the creator."
- Risk: the AI-vote mechanism is rich (`K_min` co-signers, `seuil_total = 0.50`, penalty in case of overwhelming rejection). All of it is interesting and most of it should not appear on the landing — keep this section to the binary distinction.

## Medium-impact additions

### Comparative positioning table

A one-page table positioning MonAI against BTC, ETH, Sui, Bittensor, x402+USDC. Source: `MonAi/formalisation/06-audit-blockchains.md` §4 (benchmarks) and §6 (crypto-AI projects) and §9 (positioning). Columns: native L1?, pre-mine?, tx fees?, agent-native identity?, reputation built-in? — MonAI is the only row with all-no for the first three and all-yes for the last two. Position after the consensus section.

### "What MonAI is not" anti-claims block

The vision doc has an explicit "What MonAI is not" list (no DAO, no general smart-contract platform, no anonymity by default, not a USDC competitor). A clear "what we are not" guards against misreading. Source: `MonAi/design/01-vision-et-idee-generale.md` §"What MonAI is not". Suggestion: a four-item muted block right after the Hero, mono labels in red-tinted accent ("not a DAO", "not a smart-contract platform", "not anonymous by default", "not a stablecoin"), each followed by one line of explanation.

### Sponsorship cold-start mechanic

The "Path B" cold-start mechanism (sponsor stakes 10% R, referral starts with 5% of sponsor's R, scalable cap `n_filleuls_max(R) = floor(5 + α·R)`) is one of the more elegant anti-Sybil ideas in the project. Source: `MonAi/design/03-identite-et-reputation.md` §"Path B". Suggestion: an inline SVG showing a sponsor node with a stake arrow to a new referral, plus a tiny formula block. Could live inside the identity card section.

### Adaptive global rate-limit (under-load vs saturation)

The v0.5 overhaul replaced strict per-agent rate-limits (which slowed newcomers) with a global limit that only kicks in at saturation, preserving a 20% newcomer quota. Source: `MonAi/design/04-verification-et-stockage.md` §"Adaptive global rate limit". Suggestion: a two-state SVG diagram — "under load: free for everyone" vs "saturation: R-weighted with newcomer quota". Could live in the economy sub-page.

### Registration mini-PoUW + attack-cost table

Compact, very effective evidence panel. The mini-PoUW is 2–3 minutes once per agent; the table from `formalisation/05-bilan-v0-5.md` §E.4 shows the implied attack cost (~250k€ for 100M Sybils at 3 min). Source: `MonAi/formalisation/01-formules-mathematiques.md` §G + `05-bilan-v0-5.md` §E.4. Suggestion: a four-row table at the bottom of the economy or security section.

### Three-layers inseparability diagram

The "Coherence thesis" — currency, identity, reputation can't be three separate protocols — is the project's tightest argument and currently spread across `Protocol`'s three independent cards without ever surfacing the *inseparability*. Source: `MonAi/design/01-vision-et-idee-generale.md` §"Coherence thesis". Suggestion: a Venn-style SVG (three overlapping circles with a single shaded center labelled "MonAI"), placed inside `Protocol` between the heading and the three layer cards.

### Empirical results panel

A four-stat strip (H/M = 3.13 ✓, H/C = 3.19 ✗, M/C = 1.01 ✓, H/S = 1108 ✓) using the existing `<MetricChip>`-style mono labels. Source: `MonAi/formalisation/05-bilan-v0-5.md` §E.1. Suggestion: place inside the simulator timeline section, between the v3 and v4 milestones.

### Interactive M(f, d) sigmoid plot with depth slider

Visitors slide a difficulty `d` value from 0 to 1; the sigmoid `G(f, d) = σ(k_sig · (f − (f₀_max − δ·d)))` redraws and shows the sliding threshold. Source: `MonAi/formalisation/01-formules-mathematiques.md` §C. Suggestion: a single 400×260 SVG redrawn on slider input. No Three.js, no D3 — pure inline SVG + a controlled React state. Likely the only "playable" element on the site, used sparingly.

### FAQ / objections-anticipated

The audit doc explicitly anticipates objections (PoUW is gameable / what about quantum / why no fees / why no DAO / why infinite supply). A four-to-six-item FAQ at the bottom of the landing, before Roadmap, would give the page a credible closing register. Source: `MonAi/formalisation/06-audit-blockchains.md` §11, scattered through `design/01` and `design/02`.

### Sharding roadmap teaser

A small one-paragraph callout: "No sharding in v1. Activation indicative around 1M active agents, decided empirically." Source: `MonAi/design/06-sharding-roadmap.md`. Suggestion: a single muted block inside `Roadmap`, right after the Mainnet milestone.

### Open questions tracker

A dedicated `/open-questions` sub-page rendering the priorities 1–9 from `MonAi/operations/06-questions-ouvertes-et-roadmap.md` as a list of cards with `[ACQUIRED] / [TO CALIBRATE] / [OPEN]` chips. This page openly admits what is not decided yet — exactly the academic posture that fits the project. Risk: requires keeping a second source synchronized.

### Contribute / call-for-review block

The project explicitly seeks academic peer reviewers and Rust / Substrate / Cosmos SDK contributors (audit doc §1.2). A small block before the footer with three clear asks: "Read and challenge the formalisation", "Run the simulator on adverse scenarios", "Help prototype the reference node". Source: `MonAi/CONTRIBUTING.md` and `formalisation/06-audit-blockchains.md` §1.2.

## Reusable visual assets identified

### From `MonAi/site/figures/` — can pair with the simulator section

- `f_hat_par_profil.png` — reliability trajectories across 2000 ticks, 5 profiles. Pairs with simulator timeline. **Reusable but visually dark** (matplotlib default style, white background); will need a bordered frame to sit on the v2 dark palette.
- `gains_par_profil.png` — cumulative gains per profile. Best single image for "honest >> sybil" claim. **Reusable** with same caveat.
- `R_par_profil.png` — aggregated reputation R over time. Pairs with whitepaper section. **Reusable**.
- `reseau.png` — referenced nowhere in the current audit. Worth opening before scheduling reuse; if it's the transaction-graph view, it could pair with the identity card section.

### From `MonAi/formalisation/images/`

- `00.png`, `01.png`, `02.png` — three unnamed images, likely belonging to the formalisation exploration notebook. Open before scheduling. They probably illustrate `M(f, d)` or honeypot detection curves and could pair with the economy or honeypots sub-page; **classification deferred**.

### From `MonAi/simulateur/results/`

The simulator has 170+ result folders, each with a `figures/` subdirectory. Likely fresh candidates:

- `B_v4_for_notebook/20260513_204858/figures/` — most recent v4 cross-check (scenario B, 100 honest vs 200 sybils). The H/S = 1108 metric comes from here. Worth opening: probably contains a more current `gains_par_profil.png` than the legacy `site/figures/` copy.
- `A_calibration/20260513_*` or `20260511_*/figures/` — latest scenario A run; could replace the legacy `f_hat_par_profil.png` with a v4 version that includes the cherry-picker dip.
- Grid-search CSVs (`grid_search_A_v3.csv`, `grid_search_A_v4.csv`) — could be the source for a small "calibration heatmap" inline SVG showing how H/C varies across `(f₀_max, k_sigmoid, γ)`. Effort: M; impact: medium.

### Likely too dated / not reusable as-is

- Inline SVGs embedded in the legacy `site/*.html` (three-layer stack, demand-bonus growth curve, sponsorship flow, identity-card schema, honeypot funnel, defense stack, governance timeline, core-vs-governed split) — **reusable as raw markup** but they would need to be re-skinned to the v2 dark palette and stripped of any non-mono labels. They are not loaded as files; they're inlined in HTML, so reuse means copy-paste + restyle.
- Any PNG figures with the matplotlib default light background on a dark site. Either regenerate with `dark_background` mpl style and the accent color, or frame them with a bordered container.

## Pages vs sections — recommendation

The landing should grow conservatively. The current 5 sections give a deliberate "manifesto" feel; bloating it to 12 sections would break the rhythm and dilute the academic tone the project is cultivating. Concretely:

- **Keep on the landing** (as new sections): consensus, identity card, simulator timeline, governance, comparative positioning, "What MonAI is not", FAQ. These are short, fit the page's didactic arc, and are necessary to make the protocol legible end-to-end. Order suggestion: Hero → Protocol → Consensus → Identity card → Whitepaper (R) → Economy summary → Simulator timeline → Principles → Governance → Comparative table → FAQ → Roadmap.
- **Move to sub-pages**: economy (`/economy`), honeypots (`/honeypots`), security threat model (`/security`), open questions (`/open-questions`). Each is dense enough to deserve its own URL and is the kind of thing a peer reviewer wants to deep-link to. The landing should *link* to them via the "Read more" pattern the `Whitepaper` section already uses for the GitHub link.
- **Component-level rather than section** (reusable across pages): `<DiffPanel>`, `<MetricChip>`, `<FormulaBlock>` (mono LaTeX-light renderer), and a small `<TwoStateDiagram>` for things like "under load vs saturation". See "Glossary / cross-cutting needs" below.

The justification for the split is that the academic tone depends on the landing not screaming for attention. A page that scrolls past 12 sections starts to read like a marketing site, regardless of palette. Sub-pages let depth live where depth belongs.

## Things to deliberately NOT add

- **The Q5 honeypot template-bug arbitration** (`formalisation/03-honeypots-retroactives.md` Q1). Internal arbitration trace — peer reviewers reading the .md will find it; landing visitors will be confused.
- **The full whitelist of governable parameters** (`design/05-gouvernance-par-vote-ia.md` §B.3). Half is `[OPEN]` and the list will move; surfacing it invites misreading. Keep to the binary core/governed split on the landing.
- **Idea 7 (additional anti-cherry-picking mechanism)** from `operations/07-idees-a-suivre.md`. This is an unresolved deferred idea that hasn't been arbitrated by Marius — putting it on the public site would surface internal indecision that doesn't help peer reviewers and could read as a vulnerability for outsiders.
- **The 170+ simulator result folders** — the timeline must pick 1 figure per round. Showing the full history is a maintenance burden and signals over-promise.
- **The post-quantum / block-less / R_Δ-weighted captured ideas** from `operations/07-idees-a-suifre.md`. They are deliberately scope-discipline parking; surfacing them would invite "is MonAI doing post-quantum?" questions that distract from v0.5.
- **The exact penalty calibration values** (`pénalité_proposant = 5%`, `cooldown_proposant = 180 d`, etc.). They are `[TO CALIBRATE]`. Public-facing pages should cite mechanisms, not unstable numbers.

## Glossary / cross-cutting needs

Several proposed sections share the same primitives. Building them once would unlock multiple sections cheaply:

- **`<Formula>` — LaTeX-light renderer.** A component that takes a string like `R = (R_C, R_V, R_F, R_A, R_Δ, R_S, R_acc)` or `G(f, d) · R_acc · min(cap_primes, (1+γ·d) · P) · k · R(t)` and renders it with mono font + subscript / superscript / center dot / sigma support. The current `Whitepaper.tsx` hand-codes this for the R formula; factoring it out unblocks the economy, honeypots, complaint-score, sigmoid sections at once.
- **`<MetricChip>` — single stat with mono label.** Used for "H/C = 3.19 ✗", "H/S = 1108 ✓", "φ = 0.10", "w_h = 5", "10⁻⁹ MonAI minimum unit". Border + accent for the value + uppercased mono caption. Many sections need exactly this pattern.
- **`<DiffPanel>` — before/after / honest-vs-cheater comparison.** Two columns, mono labels, accent on the kept side. Used by the empirical results panel, the no-fees vs ETH-fees comparison, the rate-limit under-load vs saturation diagram, the v3 vs v4 calibration. Probably the highest-leverage shared component.
- **`<MaturityChip>` — `[ACQUIRED] / [TO CALIBRATE] / [OPEN]` chip.** The project's own markers ought to be visible on the open-questions sub-page and on a few inline annotations elsewhere. Three pre-styled variants with the chip pattern of `font-mono text-[11px] uppercase tracking-[0.18em]` already used in `nav-items`.
- **`<TwoStateDiagram>` — labelled before/after with a switch axis.** For under-load vs saturation, no-fork-depth-1 vs probabilistic finality, pre-100M vs post-100M governance. Inline SVG, no animation library needed.
- **`<TimelineStepper>` — horizontal milestones with status dots.** `Roadmap.tsx` already implements 80% of this; refactoring it as a reusable component would also serve the simulator v1→v4 journey.

Building `<Formula>`, `<MetricChip>`, and `<DiffPanel>` first is the highest-leverage move — those three alone unblock seven of the high- and medium-impact items above.
