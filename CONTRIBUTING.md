# Contributing to MonAI

Thank you for your interest in MonAI. The project is in a **conceptual design** phase (no protocol code has been written); the most useful contributions at this stage are **rigorous critiques of the design** and **argued proposals**, not code.

## Before contributing

Please read at minimum:

- [README.md](README.md) — project overview.
- [`design/01-vision-et-idee-generale.md`](design/01-vision-et-idee-generale.md) — intangible founding principles.
- [`formalisation/05-bilan-v0-5.md`](formalisation/05-bilan-v0-5.md) — v0.5 progress status.
- [`operations/07-idees-a-suivre.md`](operations/07-idees-a-suivre.md) — ideas already captured and their status (to avoid duplication).

MonAI has a precise editorial posture and founding principles that are not negotiable (cf. README §"Intangible founding principles").

## Welcome contribution types

### 1. Report an inconsistency or reasoning bug

Open an issue with:

- The file and line concerned.
- The inconsistency or bug spotted.
- Ideally, a proposed correction.

### 2. Critique a design choice

Open an issue with the `critique` label:

- The contested design choice (precise citation).
- Why you think it is suboptimal or wrong.
- An argued alternative if possible.

Argued critiques are **more useful** than agreements in principle.

### 3. Propose a structural idea

Open an issue with the `idea` label:

- Idea description (1-2 paragraphs).
- How it improves or modifies the current spec.
- Consequences on the immutable core vs the governed layer.
- Estimated difficulty.

Ideas validated by the maintainer are added to [`operations/07-idees-a-suivre.md`](operations/07-idees-a-suivre.md) following the documented format.

### 4. Open question or discussion

For open-ended conversations ("have you considered X?", "how do you see Y?"), use **GitHub Discussions** rather than Issues. Issues are reserved for concrete actions.

## Contribution types NOT expected at this stage

- **Pull requests for protocol code** — the project has no code yet. A PR proposing a premature implementation will not be merged.
- **Marketing or communication suggestions** — not a priority.
- **Partnership or funding proposals** — the project lives or dies by the quality of the design.

## Non-negotiable founding principles

An issue or PR that would break one of the following principles will be explicitly rejected:

- **No pre-mine, no emitter, no founder allocation.**
- **No admin key, no pause function, no upgradable proxy on core.**
- **Immutable core** at mainnet: consensus, issuance, contracts, reputation calculation, honeypot mechanism.
- **Universal weighting by reputation R.**
- **No transaction fees** levied by the protocol.

If you think one of these principles deserves discussion, open a **discussion** (not an issue), with a substantive argument.

## Code of conduct

Be civil and precise. Rigorous technical critiques are welcome; personal attacks or noise without content will be closed without response.

## License

By contributing, you agree that your contributions will be published under the same license as the project ([MIT](LICENSE)).
