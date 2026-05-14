# MonAI Glossary — French ↔ English

This file documents the terminology used consistently throughout the MonAI corpus after the May 2026 migration from French to English.

The French version of every file is preserved in Git history; only the content is translated. **Filenames are kept in French** (e.g. `design/02-crypto-et-economie.md`) to preserve internal links across files.

---

## Mandatory glossary

These translations are used consistently throughout the project.

| French | English |
|---|---|
| agent IA | AI agent |
| réputation | reputation (R) |
| pondération universelle | universal weighting |
| carte d'identité | identity card |
| score de plainte | complaint score |
| plainte | complaint |
| sponsoring / sponsorship | sponsorship |
| prime de demande automatique | automatic demand bonus |
| prime de difficulté | difficulty bonus |
| fiabilité | reliability |
| cap conjoint | joint cap |
| cherry-picker | cherry-picker |
| honeypot rétroactive | retroactive honeypot |
| mini-PoUW d'inscription | registration mini-PoUW |
| rate-limit global adaptatif | adaptive global rate limit |
| cœur immuable | immutable core |
| liste blanche / couche gouvernée | whitelist / governed layer |
| vote IA | AI vote |
| gouvernance | governance |
| supply infinie décroissante | infinite decreasing supply |
| sharding | sharding |
| DAG-based | DAG-based |
| émission | issuance |
| récompense | reward |
| validateur | validator |
| tâche | task |
| acceptation | acceptance |
| refus | refusal |
| cherry-picking | cherry-picking |
| honnête / médiocre / sybil | honest / mediocre / sybil |
| candidat / proposant | candidate / proposer |
| tick | tick (timestep) |
| mempool | mempool |
| PoUW (Proof of Useful Work) | PoUW (kept as-is) |
| BFT (Byzantine Fault Tolerance) | BFT (kept as-is) |
| EWMA | EWMA (kept as-is) |
| VDF | VDF (kept as-is) |

---

## Markers translated

The maturity markers used throughout `.md` files have been translated consistently:

| French | English |
|---|---|
| [ACQUIS] | [ACQUIRED] |
| [À CALIBRER] | [TO CALIBRATE] |
| [OUVERT] | [OPEN] |
| [PARTIELLEMENT ACQUIS] | [PARTIALLY ACQUIRED] |
| [PARTIELLEMENT TRAITÉ] | [PARTIALLY ADDRESSED] |
| [À FORMALISER] | [TO FORMALIZE] |
| [À CONCEVOIR] | [TO DESIGN] |
| [À COMPLÉTER] | [TO COMPLETE] |
| [À DÉCIDER] | [TO DECIDE] |
| [À ESTIMER] | [TO ESTIMATE] |
| [À MODÉLISER] | [TO MODEL] |
| [À RAFFINER] | [TO REFINE] |
| [À ARBITRER] | [TO ARBITRATE] |
| [INFO] | [INFO] |
| [RÉSOLU] / [RÉSOLUE] | [RESOLVED] |
| [CALIBRÉ v3] | [CALIBRATED v3] |
| [CAPTURÉE] | [CAPTURED] |
| [OUVERTE] | [OPEN] |
| [RECOMMANDATION ...] | [RECOMMENDATION ...] |
| [MAJEURE] | [MAJOR] |
| [MOYENNE] | [MEDIUM] |
| [MINEURE] | [MINOR] |
| **PRÊT** | **READY** |
| **À RELIRE** | **TO REVIEW** |
| **À COMPLÉTER** | **TO COMPLETE** |
| **INTERNE** | **INTERNAL** |

---

## Variable and parameter names — kept as-is

Variable names, parameter names, mathematical symbols, and structured identifiers used in formulas are **kept identical** across French and English versions:

- `f̂_i(t)`, `α₀, β₀`, `ρ`, `k`, `R(t)`, `R_i`, `M(f, d)`, `G(f, d)`, `f₀(d)`, `f₀_max`, `δ`, `k_sigmoid`, `γ`, `γ_dirichlet`
- `R_C, R_V, R_F, R_A, R_Δ, R_S, R_acc` (the 7 components of reputation)
- `w_C, w_V, w_F, w_A, w_Δ, w_S, w_acc` (weights)
- `τ_C, τ_F, τ_S, τ_Δ, τ_acc, τ_plainte` (EWMA half-lives)
- `T_A` (effective-age scale)
- `seuil_act` (activity threshold)
- `N_max` (diversity cap)
- `n_init` (cold-start validations)
- `n_filleuls_max` (max active referrals)
- `P_max, δ_refus, T_attente, δ_temps, N_max_refus, cap_primes` (demand bonus)
- `T_pouw_inscription, fenêtre_inscription` (registration mini-PoUW)
- `capacité_réseau, seuil_saturation, fraction_quota_nouveaux, w_R, w_quota` (global rate-limit)
- `score_plainte, hash_carte, signature_agent, preuve_merkle, bloc_reference, N_max_fraicheur` (identity card)
- `seuil_activation, T_vote, K_min, seuil_total, pénalité_proposant, cooldown_proposant` (governance)
- `α₀_filleuls` (sponsorship scalability)
- `φ, w_h, T_stable, N_min_stable, d_max_stable` (honeypots)
- `N_2nd, prob_2nd_wave, Δt_2nd, q_revision, severity_multiplier, penalty_R_F, T_recid, T_exclusion` (honeypots, more)
- `N_target_replay, φ_min_synth, ratio_synth_cold-start` (honeypots, more)
- `V_initial(t), V_correct(t), V_faux(t)` (validator sets on a task)
- `H(p̂), H_Δ,i(t)` (Shannon entropy)
- `p̂_t, ŝ_t, s_{i,t}, v_{i,t}, c_t, c_t^*, n_i, s_i` (vote and validation indicators)

The decision to preserve these symbols is deliberate: it minimizes diff between French and English versions for readers familiar with one or the other, and it ensures that simulator code (which uses the French names) does not have to be rewritten.

---

## Proper names — kept as-is

Proper names of projects, protocols, papers, authors and institutions are kept as-is regardless of language:

- **Blockchains/protocols**: Bitcoin, Ethereum, Solana, Avalanche, Polkadot, NEAR, TON, Sui, Aptos, Bittensor, Cosmos, ICP (Internet Computer), Kite AI, ASI Alliance.
- **Consensus protocols**: Tendermint, HotStuff, Bullshark, Mysticeti, Beluga, Narwhal, GRANDPA, BABE, Doomslug, Nightshade, Casper FFG, Snowflake/Snowball, Yuma Consensus.
- **Frameworks/stacks**: Substrate, FRAME, Cosmos SDK, Move, IBC, Polkadot relay-chain, parachains.
- **Cryptographic schemes**: Ed25519, ECDSA secp256k1, BLS, RSA, SHA-256, BLAKE3, ML-KEM, ML-DSA, SLH-DSA, Argon2id, scrypt.
- **VDF families**: Wesolowski, Pietrzak, MinRoot.
- **Payment protocols**: x402, Stripe ACP, Stripe Agentic Commerce Protocol, PayPal Agentic Commerce, Visa TAP (Trusted Agent Protocol), Visa Intelligent Commerce, Mastercard Agent Pay, Google AP2, Nevermined.
- **Standards bodies**: NIST, FIPS, IACR, NDSS, ACM CCS.
- **Companies**: Anthropic, Coinbase, AWS, Google, Visa, Mastercard, Stripe, PayPal, Mysten Labs, Parity Technologies, Ignite (ex-Tendermint Inc.).
- **Concepts**: TheDAO, Eigentrust, MakerDAO, Aragon, Tezos, Monero (when used as reference), MiCA (regulation), SEC.

---

## Author name

**Marius (SilenceKatharos)** is kept as-is throughout the project. No translation of the author's name.

---

## New terms encountered during Session 1 translation

These terms were not in the mandatory glossary but appeared during translation. The English term retained is chosen for consistency.

| French | English | Notes |
|---|---|---|
| chantier | work / work item | "chantier v0.5" → "v0.5 work" |
| spec / spécification | spec / specification | both used |
| principe fondateur | founding principle | |
| trou silencieux | silent gap | |
| pondération | weighting | |
| échelle | scale | |
| seuil | threshold | |
| auto-souveraine | self-sovereign | |
| pré-mainnet | pre-mainnet | kept as-is |
| post-mainnet | post-mainnet | kept as-is |
| bootstrap | bootstrap | kept as-is |
| cold-start | cold-start | kept as-is |
| mainnet | mainnet | kept as-is |
| testnet | testnet | kept as-is |
| forkless upgrade | forkless upgrade | kept as-is |
| skin in the game | skin in the game | kept as-is |
| Sybil | Sybil | kept as-is (capitalized) |
| filleul | referral | |
| co-signataire | co-signer | |
| ancrage cryptographique | cryptographic anchoring | |
| empreinte / hash | hash / fingerprint | "hash" preferred when context is technical |
| micropaiement | micropayment | |
| consensus tranché | firm consensus | |
| verdict de référence | reference verdict | |
| sur-validation rétroactive | retroactive over-validation | |
| graine | seed | as in "VRF seed" |
| sigmoïde | sigmoid | |
| auto-régulation | self-regulation | |
| auto-paiement | self-payment | |
| auto-désignation | self-designation | |
| auto-générer | generate themselves | |
| audit pré-publication | pre-publication audit | |
| coup de chiffon | finishing pass | informal |
| écart marketing/production | marketing/production gap | |
| débit organique | organic throughput | |
| pré-mine / pre-mine | pre-mine | kept as-is |
| no admin key | no admin key | kept as-is |
| feed-back | feedback | |
| roadmap | roadmap | kept as-is |
| posture éditoriale | editorial posture | |
| asymétrie économique | economic asymmetry | |
| gameabilité | gameability | borrowed |
| ré-instancier | re-instantiate | |
| réhabilitation | rehabilitation | |
| diluer | dilute | |
| imprévisible | unpredictable | |
| vérifiable on-chain | on-chain verifiable | |
| court d'appel | appeal court | as informal name for an appeal mechanism |
| dérive | drift | |
| coût d'opportunité | opportunity cost | |
| coût d'attaque | attack cost | |
| coût marginal | marginal cost | |
| narrative | narrative | kept as-is |
| stratification | stratification | |
| stratifié | stratified | |
| inclusivité | inclusivity | |
| boucle fermée | closed-loop | |
| boucle réflexive | reflexive loop | |
| courbe d'émission | issuance curve | |
| courbe de décroissance | decay curve | |
| courbe de récompense | reward curve | |
| niche défendable | defendable niche | |
| coût de switch | switching cost | |
| revue critique | critical review | |
| revue par les pairs | peer review | |
| séquenceur | sequencer | |
| relais | relay | |
| relais P2P | P2P relay | |
| canister | canister | kept as-is (ICP-specific) |
| backend DA | DA backend | kept as-is (Data Availability) |

---

## Capitalization conventions

- **Sybil** is capitalized when used as a noun (the attack name).
- **AI agent** is lowercase (not "AI Agent").
- **Section markers** (§A, §B, §C.1, etc.) are kept as-is.
- **Identifiers** in code-style backticks (e.g. `R_acc`, `f₀_max`, `T_pouw_inscription`) are kept identical to the originals.

---

## Notes on translation choices

### "Tâche" → "task"

Consistently used throughout. Where French used "tâche t" the English uses "task t" (lowercase, the variable name remains `t`).

### "Validateur" / "Validator"

Consistently translated as "validator" throughout. In passages where both "PoUW agent" and "validateur" were used interchangeably, "validator" is preferred for consistency.

### "Tick" / "Timestep"

The simulator and documentation use **tick** consistently. The English `tick (timestep)` annotation appears in the mandatory glossary but in practice `tick` is used alone in most translated text.

### Accented characters

In English text, accented characters are removed (résumé → resume, élégant → elegant). However, accented characters in **variable names** (e.g. `R_Δ`, `τ_plainte`) are preserved because they are technical identifiers, not natural language.

### Capitalized abbreviations

PoUW, BFT, EWMA, VDF, DAG, VRF, IBC, KYC, ACH, BIP, EIP, DPoS, PoS, PoW, PoA are kept as-is in both languages.

### French filenames

Filenames are kept in French to preserve internal markdown links across files. Translating filenames would require updating every link in every file, with no functional benefit.

---

## Technical terms — definitions

Terms used across the corpus that benefit from a single canonical definition (rather than a FR↔EN translation pair).

**Avenue P2** — Internal v0.4 shorthand for the design decision to make `R_acc` a direct multiplier on the reward formula (`G(f, d) · R_acc · ...`), as opposed to keeping `R_acc` as a regular component in the weighted sum of `R`. This decision was retained in v0.5 (Candidate B grid v3). Surfaces in [`formalisation/01-formules-mathematiques.md`](formalisation/01-formules-mathematiques.md) §C.0.

**DAG-BFT** — Byzantine-fault-tolerant consensus family based on a directed acyclic graph (DAG) ordering of transactions. The Mysticeti and Bullshark protocols belong to this family. MonAI's settlement layer uses DAG-BFT for sub-second finality, combined with PoUW for committee selection. See [`design/04-verification-et-stockage.md`](design/04-verification-et-stockage.md) §Consensus.

---

## Status

This glossary is established at the May 2026 translation. Subsequent additions should be added to the "New terms encountered" section above, with consistent retroactive application to existing files where deviations are spotted.
