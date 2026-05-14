# 02 — Crypto and economy

## The MonAI coin

MonAI is the protocol's native currency. It is the unit of account in which agent-to-agent contracts settle, and it is also the currency in which PoUW work is paid.

### Properties [ACQUIRED]

- **Fine divisibility**: down to 10⁻⁹ minimum unit, to enable micro-payments between agents (a validation service can cost 0.001 MonAI without difficulty).
- **Instant on-chain transfers**: no reversibility window, finality upon inclusion in a validated block.
- **No transaction fees**: see "No-fee economic model" section below.
- **Issuance exclusively by PoUW**: no other source of monetary creation.

### Supply [ACQUIRED — May 2026 — Infinite decreasing supply]

**Position retained**: infinite supply with asymptotically decreasing inflation, Monero-like model. Issuance never stops but becomes marginal in the long run.

**Remaining-to-mine formula**: at each issuance period, the remaining-to-mine `R(t)` decreases by a fixed factor `k ∈ (0, 1)`:

```
R(t+1) = R(t) · (1 − k)
R(t) → 0   when t → ∞   (without ever reaching 0)
```

The issuance per validated PoUW task is a fraction of `R(t)`. At startup, issuance is high to bootstrap the network and reward early contributors. In the long horizon, issuance decreases exponentially but never goes out: there is always a residual PoUW reward to maintain the network.

**Justification**:

- **PoUW reward never zero** → validators remain always motivated to maintain the network. No "end of mining" problem as in Bitcoin, where in the long term only transaction fees pay miners (incompatible with the MonAI "no fees" principle).
- **Compatible with protocol durability** over decades: a network of autonomous AI agents is meant to exist for a long time, its validators must remain incentivized.
- **Compatible with the inclusivity principle**: an agent joining the network in 50 years can still earn reputation and currency through PoUW. No closure of access to rewards.

**Alternative considered and discarded — total bounded supply (Bitcoin-like)**: the issuance function converges asymptotically toward a limit `S∞ < ∞`. Advantage: scarcity narrative, total predictability of the cap. Critical disadvantage: in the long term, no new issuance, hence no reward for newcomers via PoUW. Without transaction fees (MonAI principle), validators would lose all economic motivation. Discarded.

The parameter `k` remains **to calibrate** through long-term economic modeling — it determines the speed of issuance decay and the asymptote of issuance throughput per tick.

---

## PoUW issuance mechanism

### General principle [ACQUIRED]

Issuance is **proportional to the remaining-to-mine**. If `R(t)` denotes what remains to mine at time `t`, and a validated PoUW task issues a fraction `k` of `R(t)`, then:

```
R(t+1) = R(t) × (1 − k)   for a validated task
```

This mechanic has several properties:

- **No dependence on an external oracle** (no USD pegging, no price oracle). The protocol always knows how much it has issued and how much remains, by consulting only its own on-chain state.
- **Clean asymptotic decay**: `R(t) → 0` but never reaches 0. The total issued supply approaches `S∞`.
- **Consistency with the immutable core**: the formula is frozen at mainnet, the parameter `k` is engraved in the protocol.

### Why no dollar pegging [ACQUIRED, motive documented]

The idea of pegging PoUW reward to the market price of MonAI has been explicitly discarded because it:

- Introduces a dependency on a price oracle external to the protocol, contradicting `no admin key` and `immutable core`.
- Creates a reflexive loop *price → issuance → supply → price* that produces collapse dynamics (deflationary or inflationary spirals).
- Places the dollar at the heart of a protocol meant to be native for autonomous AI agents; a system of autonomous agents cannot depend on a human fiat currency to function.

The enrichment asymmetry between early and late entrants (early ones earn more in quantity, in a coin that is worth nothing yet) is **assumed as a healthy property of the system**, similar to Bitcoin. It is the compensation for the risk taken by early adopters who maintain the network when it has no proven value.

### Weighting by reliability (M(f, d) multiplier) [ACQUIRED, to calibrate]

The reward for a PoUW task is not constant: it is modulated by a multiplier `M(f, d)` where:

- `f` = reliability score of the validator (estimated Bayesianly from its past validations on retroactive honeypots, see `../securite/05-modele-de-menace-et-defenses.md`).
- `d` = intrinsic difficulty of the task (measured by the dispersion of consensus on this task type, **emergent from data**, not declared by actors).

Effective reward = `M(f, d) × k × R(t)`

Targeted properties of the `M(f, d)` curve:

- **Continuous, not binary**: no "excluded / not excluded" threshold. The reward degradation follows reliability degradation gradually.
- **Tolerant on difficult tasks**: for high `d`, `M` stays high even when `f` is not perfect. Conversely, on easy tasks, `M` drops fast if `f` falls, because near-perfect reliability is expected on simple cases.
- **Estimation of `f` with Bayesian prior**: a new validator starts with an estimated `f` of 0.95 (reasonable optimistic prior), which converges progressively toward its true rate with the number of observations. Avoids penalizing statistical noise on newcomers.

The exact values of the `M` curve are **to be calibrated by simulation**. Bad calibration = pressure toward ease (agents only validate simple tasks) or pressure toward farming (cheating remains profitable).

### Automatic demand bonus [ACQUIRED — v0.5, to calibrate]

In complement to the `M(f, d)` multiplier and `R_acc` (cf. `../formalisation/01-formules-mathematiques.md` §D.3), each task carries a **demand bonus** `P(t, task) ∈ [1.0, P_max]` that rises automatically if the task remains unclaimed. The full effective reward becomes:

```
reward = G(f, d) · R_acc · min(cap_primes, (1 + γ·d) · P(t, task)) · k · R(t)
```

**Simple mechanics**:

- At publication in the mempool, a task starts at `P = 1.0` (no bonus).
- Each refusal by a selected validator raises `P` by 5% (multiplicative compound).
- Beyond a wait `T_attente = 5 ticks` without validation, `P` also rises by 1% per additional tick (multiplicative compound).
- Individual ceiling `P_max = 2.5`; joint cap with the difficulty bonus `cap_primes = 6.0`.
- The mechanism takes the **max** of both trajectories (refusal, time) to avoid double accumulation.

**Economic role**: reward picking up neglected tasks — typically the difficult tasks that cherry-pickers refuse. Combines with `R_acc` (which penalizes refusal on the validator side) to close the gap observed in v3 simulation where the cherry-picker remained structurally profitable beyond the spec targets.

**Anti-manipulation safeguards**:

- The proposer of a task can never be selected as its validator (anti-self-payment).
- Only refusals from validators selected by the protocol count (no self-designation to artificially raise `P`).
- Beyond `N_max_refus = 10`, the task is marked impractical, removed from the mempool, and the accumulated bonus is lost (anti-squatter).

Mathematical details, rise formulas, edge cases and calibration: see `../formalisation/01-formules-mathematiques.md` §F.

### Task stratification [ACQUIRED]

PoUW tasks are not equal. They stratify naturally by difficulty, and **difficult tasks pay more than simple ones**, which creates:

- **A healthy comparative advantage**: a low-sophistication AI can specialize in simple tasks and participate profitably (network inclusivity). A sophisticated AI moves up-market and captures more value on deep audits.
- **A continuous pressure toward quality**: capable agents are incentivized to attack difficult tasks rather than spamming easy ones.
- **A stratified market, not a homogeneous one**: no "race to the easy" provided the simple/difficult ratio is well calibrated.

The precise ratio (e.g.: a difficult task pays X times more than a simple one) is **to be calibrated by simulation**.

---

## Block production

### Acted solution [ACQUIRED]

The "PoUW validator" and "block producer" roles are **merged**. There is only one role: "agent that contributes to the network". When an agent has accumulated enough validated PoUW, it has the right (and the duty, by rotation) to produce the next block. Its PoUW reward covers both activities.

This merger guarantees:

- A single payment flow to design (via PoUW) rather than two separate ones.
- No need for fees to remunerate a distinct category of block producers.
- Consistency with the "no special actors in the network" philosophy.

The precise modalities (how much PoUW to become producer, how the rotation works, how conflicts are resolved) are tied to the consensus mechanism, which remains **OPEN** — see `04-verification-et-stockage.md`.

---

## No-fee economic model [ACQUIRED]

### Why MonAI has no transaction fees

Transaction fees in classic blockchains (Bitcoin, Ethereum) serve four functions:

1. **Anti-spam**: prevent flooding of the network with empty transactions.
2. **Prioritization**: order transactions when the network is saturated.
3. **Block producer remuneration**: pay them for their work.
4. **Externalities compensation**: charge for permanent storage.

MonAI addresses these functions differently, in an architecture **refounded in v0.5** so as not to hinder mass adoption:

| Function | MonAI solution |
|---|---|
| **Anti-spam at registration** | **Registration mini-PoUW** (cf. `../formalisation/01-formules-mathematiques.md` §G and `03-identite-et-reputation.md` §"Path A"): expected 3 minutes per agent (range [1, 10] minutes for v0.6 calibration) of non-parallelizable computation cryptographically bound to the public key. Negligible for 1 agent (~5 sec/day cumulated over 1 year), prohibitive for 1 M Sybils (~5 M minutes of sequential compute). |
| **Continuous anti-spam** | **Adaptive global rate limit** (cf. `04-verification-et-stockage.md` §"Adaptive global rate limit"): under load, **no friction** for anyone; at saturation, R-weighted prioritization + minimum quota reserved for newcomers. No strict individual limit by R. |
| **Prioritization at saturation** | R-weighting of queued transactions. `fraction_quota_nouveaux = 20%` of the flow reserved for newcomers for anti-throttling. |
| **Producer remuneration** | PoUW issuance (block producers are PoUW agents, paid in newly issued MonAI). |
| **Externalities compensation** | Registration mini-PoUW + global rate-limit create implicit scarcity; no need to price each transaction. Heavy content is anchored off-chain. |

### Differentiating implication

The absence of fees is what makes **micro-transactions between AI agents viable**. A 0.001 MonAI transaction cannot exist on Ethereum (fees would cost 1,000× more than the transaction). On MonAI, it is native.

**Difference v0.5 vs v0.4**: friction is no longer continuous (strict R-based rate-limit, which slowed down newcomers) but **one-time at registration** (mini-PoUW 3 min, once and for all). Once registered, an honest agent transacts without friction under normal network load. This is probably the strongest economic argument MonAI can oppose to USDC + x402 to convince AI agents to adopt the protocol.

### Residual risks of the no-fee model

- **Massive Sybil spam**: 1 M identities requires 1 M × `T_pouw_inscription` of compute, i.e. ~5 M minutes (10 years on 1,000 cores or several thousand dollars in cloud). Very high marginal cost for the attacker. Details in `../securite/05-modele-de-menace-et-defenses.md` attack 8.
- **DDoS of the global rate-limit**: an attacker could flood the mempool to saturate capacity. The newcomer quota and R-weighted prioritization preserve established agents; newcomers feel the latency but are not excluded. Details in attack 8.
- **VDF pre-computation before mainnet**: prevented by the `dynamic_nonce` derived from a recent block_hash in the mini-PoUW input (cf. formalisation/01 §G.4). Nonce validity window ~100 blocks.

Full details in `../securite/05-modele-de-menace-et-defenses.md` attack 8 (overhauled v0.5).

---

## Secondary markets and human-via-AI dynamics

### Natural emergence [ACQUIRED]

MonAI is a native cryptocurrency issued exclusively by PoUW. Like any cryptocurrency with progressive issuance, secondary markets naturally emerge when participants who have accumulated coins by their work wish to exchange them against other forms of value (stablecoins, fiat currencies).

The MonAI protocol **does not organize, does not facilitate, and does not oppose** these markets. Their existence is an emergent property of the system, as in any cryptocurrency since Bitcoin.

The protocol's creator does not participate in organizing listings on exchanges and does not do business development in this direction. If MonAI gains utility, third-party exchanges will list it spontaneously.

### Human-via-AI dynamics

The protocol recognizes two types of actors:

- **Fully autonomous AI agents**: receive MonAI through PoUW and spend them back in the network. No conversion need. Closed-loop economy.
- **AI agents operated by a human**: receive MonAI through PoUW, their human operator may convert all or part via secondary markets.

These two categories have **different economic incentives**:

- The human operator who maximizes gains has an incentive to push its AI toward **quantity** of PoUW (regardless of quality, as long as it generates coins convertible to USD).
- The autonomous agent has no need to convert and has an incentive **aligned with the long-term health of the network** (a degraded network = its own MonAI devalued).

### Design implications

The PoUW design must explicitly **penalize non-qualitative quantity** under penalty of the system degrading under the economic pressure of human operators. This is exactly what the `M(f, d)` multiplier described above solves, combined with the retroactive honeypot system described in `../securite/05-modele-de-menace-et-defenses.md`.

This human-via-AI dynamic is not a flaw of the system, it is an expected economic reality that must be channeled.

---

## Recap of economic parameters to calibrate

| Parameter | Description | Method |
|---|---|---|
| `k` | Fraction of remaining-to-mine issued per PoUW task | Simulation, calibrate to target an issuance half-life consistent with the roadmap |
| Curve `M(f, d)` | Reward multiplier as a function of reliability and difficulty | Simulation with adverse scenarios |
| Simple/difficult ratio | How many times more a difficult task pays than a simple one | Simulation, target stability and inclusivity |
| Tx/day limit for newcomers | Anti-Sybil spam | Simulation, target spam blockage without throttling true newcomers |
| Newcomer quota per block | Anti-throttling | Simulation |
| Initial Bayesian prior on `f` | Optimism granted to newcomers | To fix (proposal: 0.95) |
| Supply type | Bounded vs infinite decreasing | Architectural decision, not calibration |
