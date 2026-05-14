# MonAI

> **A cryptocurrency, an identity and a reputation, designed as a single indissociable protocol for AI agents that transact with each other without a human in the loop.**

**Status: v0.5 — conceptual design, open to peer review.**
No line of protocol code. Mathematical spec formalized, agent-based simulator calibrated over 4 rounds (May 2026). License: [MIT](LICENSE).

---

## Website

The MonAI landing page is deployed at:
**https://mon-ai-kohl.vercel.app/**

It presents the founding pitch, the four problems MonAI solves (micropayments, latency, reputation portability, native identity), positioning against existing rails (x402, Stripe, Bittensor, Kite AI), the three co-designed protocol layers, the six non-negotiable principles, the seven-component reputation formula, and the v1→v4 simulator calibration verdicts. A `/security` sub-page details the ten catalogued attacks with their stacked defenses.

For deep-dive long-form content on individual topics (economy, honeypots, governance, identity, comparative audit), the canonical sources are the `.md` files in `design/` and `formalisation/`. Future Vercel sub-pages will surface these directly.

---

## Why this project exists

In the coming years, billions of autonomous AI agents will interact with each other. Current economic rails (bank cards, USDC over x402, Stripe ACP, Visa TAP, Google AP2) were designed for humans or for businesses operating agents. None is natively suited to a pure AI agent economy.

MonAI proposes a native infrastructure for this use case:

- **Pure native L1** (not an L2/rollup, no protocol dependency on Ethereum or Base).
- **Hybrid PoUW + modern DAG-BFT consensus** (Mysticeti / Bullshark family, sub-second finality).
- **Infinite decreasing supply**: perpetual PoUW reward, validators always motivated.
- **Immutable core** at mainnet, **AI vote weighted by reputation** activated automatically at 100 M active agents.
- **No transaction fees**, **no pre-mine**, **no admin key**.

MonAI is not a fundamental technological leap. It is a **careful combination** of existing mechanisms integrated into a coherent framework, for a use case that current blockchains serve imperfectly.

---

## Navigation

```
design/           conceptual spec (vision, economy, identity, blockchain,
                  governance, sharding-roadmap)
formalisation/    mathematical formalization (R, M(f,d), honeypots, identity
                  card, v0.5 review, comparative blockchain audit)
securite/         threat model and defenses (10 attacks + mitigations)
operations/       open questions, captured ideas, roadmap
simulateur/       Python agent-based, 4 calibration rounds
site-v2/          Next.js 16 landing page (live at mon-ai-kohl.vercel.app)
```

**Recommended first contact**:

1. Read the [pitch on the site](https://mon-ai-kohl.vercel.app/).
2. Open [`design/01-vision-et-idee-generale.md`](design/01-vision-et-idee-generale.md) for the long-term vision and founding principles.
3. Read [`formalisation/05-bilan-v0-5.md`](formalisation/05-bilan-v0-5.md) for progress status.
4. Read [`formalisation/06-audit-blockchains.md`](formalisation/06-audit-blockchains.md) for positioning vs competition and justified technical choices.

---

## Intangible founding principles

Abandoning them would amount to abandoning MonAI:

- **No pre-mine**: no coin exists at launch; all are created progressively by PoUW.
- **No emitter**: the creator mines on the same terms as any participant; no protocol privilege.
- **Immutable core**: consensus, issuance, reputation calculation and honeypot mechanism are frozen at mainnet. No admin key, no pause function, no upgradable proxy.
- **Universal weighting by reputation R**: every protocol action (validation, vote, complaint, co-signature) has a weight proportional to R.
- **No transaction fees** levied by the protocol. Spam control goes through reputation.
- **Not anonymous by default**: public transactions like Bitcoin. Optional confidentiality may be added later.
- **Permissive open-source**: public code from block 1, multiple implementations encouraged.

---

## How to contribute

The project is in a **conceptual design phase**. No protocol code has been written. The most useful contributions at this stage are **rigorous design critiques** and **argued proposals**, not code.

- **Open a GitHub issue** to report an inconsistency, reasoning flaw, or gap in the spec.
- **GitHub Discussions** for open conversations on design choices.
- **Structural ideas**: if you have a suggestion that would change the protocol's structure, open an issue with the `idea` label. Validated ideas are captured in [`operations/07-idees-a-suivre.md`](operations/07-idees-a-suivre.md).

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

**Particularly useful profiles at this stage**:

- Cryptocurrency design (monetary economics, issuance curves).
- Sybil resistance, game theory applied to PoUW.
- Modern distributed consensus (Tendermint, HotStuff, Mysticeti, Bullshark).
- Formal verification of protocols.
- Applied cryptography (aggregated signatures, VDF, post-quantum algorithms).
- Agent-based simulation for empirical calibration.

---

## Status of each section

Within the files, elements are marked according to their maturity level:

- **[ACQUIRED]** — decided and stable, except for deep reconsideration.
- **[TO CALIBRATE]** — principle acquired, numerical value to be determined by simulation.
- **[OPEN]** — architectural decision not yet made or implementation modality deferred to a later phase.

---

## Academic citations

The document [`formalisation/06-audit-blockchains.md`](formalisation/06-audit-blockchains.md) references in its bibliography 10 academic papers (PoUW, modern consensus, crypto-AI critique) and several industry reports. All references are verifiable and **none is invented**. If you identify an imprecise or misattributed reference, open an issue.

---

## License

[MIT](LICENSE) — copyright © 2026 Marius (SilenceKatharos).

The project is in its very early stages. If MonAI interests you, the best is to open an issue or a discussion on GitHub. The maintainer is seeking critical feedback, not agreements in principle.
