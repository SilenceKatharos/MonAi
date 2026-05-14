// Source: /home/marius/Documents/MonAi/securite/05-modele-de-menace-et-defenses.md
// Ten catalogued attacks against the MonAI protocol with their stacked
// defenses, residual risks, and a flag for those exercised against the
// agent-based simulator (the rest are paper-only until v5).

export type Defense = {
  label: string;
  description: string;
};

export type Attack = {
  index: string;
  name: string;
  description: string;
  defenses: readonly Defense[];
  /** Honest declaration of what the layered defenses do not fully cover. */
  residual?: string;
  /** Already exercised against the multi-agent simulator. */
  simulated?: boolean;
};

export const ATTACKS: readonly Attack[] = [
  {
    index: "01",
    name: "Simple Sybil",
    description:
      "Mass-registering fictitious identities to inflate the attacker's weight in selection or voting.",
    defenses: [
      {
        label: "Entry cost via PoUW",
        description:
          "Identity creation is free, but giving one weight requires validated PoUW. Empty Sybils have R ≈ 0 and zero influence.",
      },
      {
        label: "Throughput limits for newcomers",
        description:
          "Low-R agents can only emit few transactions per unit of time. 1M Sybils × low limit = manageable traffic.",
      },
      {
        label: "Costly sponsorship",
        description:
          "Fast-tracking via a sponsor stakes the sponsor's reputation. Sponsor capacity scales with their own R: n_filleuls_max(R) = floor(5 + α·R). A high-R sponsor can carry more referrals; a low-R sponsor cannot mass-sponsor Sybils.",
      },
      {
        label: "Inactivity decay",
        description:
          "Reputation erodes when unused. Farming Sybils to stockpile reputation is impossible.",
      },
    ],
    residual:
      "A patient, well-funded attacker can still build legitimate Sybils slowly. The defense is probabilistic, not absolute.",
    simulated: true,
  },
  {
    index: "02",
    name: "Patient sophisticated Sybil",
    description:
      "Building Sybils that behave honestly for months to accumulate real reputation, then activating them at once.",
    defenses: [
      {
        label: "Validation diversity required",
        description:
          "A consensus is only valid if validators have different sponsors and come from diverse branches of the reputation graph.",
      },
      {
        label: "Probabilistic validator selection",
        description:
          "Validators are not self-designated; selection is weighted-random. A collusion cannot guarantee its members are picked together.",
      },
      {
        label: "Long opportunity cost",
        description:
          "Maintaining active Sybils for years costs real compute. At the scale of a serious attack, several orders of magnitude more expensive than the extractable value.",
      },
    ],
    residual:
      "A state actor or very well-funded actor could theoretically absorb the cost. No absolute defense against an unlimited attacker.",
  },
  {
    index: "03",
    name: "Adversarial collective memory",
    description:
      "An operator runs 1000 AIs sharing a database of seen tasks and consensus answers, replaying them instead of working.",
    defenses: [
      {
        label: "Pool scale dilution",
        description:
          "At target scale (millions of agents, billions of tasks/year), the cache covers an infinitesimal fraction of the flow. Honeypots are almost always unseen.",
      },
      {
        label: "Economic asymmetry of the cache",
        description:
          "Maintaining a shared cache (storage, indexing, fast lookups across 1000 AIs) costs continuous compute. In >99% of cases the cache misses and the attacker must still work.",
      },
      {
        label: "Opportunity cost",
        description:
          "Compute spent on the cache could have produced honest PoUW. The attacker loses on both fronts.",
      },
      {
        label: "Task specificity",
        description:
          "For tasks like 'audit this specific contract', there is virtually no redundancy between tasks. The cache has little to memorise.",
      },
    ],
    residual:
      "At bootstrap (small pool), the attack is more profitable. Mitigation: reinforced bootstrap mode (more cross-validation, more registration mini-PoUW).",
  },
  {
    index: "04",
    name: "Biased random guess",
    description:
      "A lazy validator answers without working, following the prior distribution (e.g. 'approved' to 80% of contracts, betting on a base rate).",
    defenses: [
      {
        label: "Non-linear reliability sigmoid G(f, d)",
        description:
          "Calibrated so G(0.8, d) ≈ 0 and G(0.99, d) ≈ 1.0. Only attentive work reaches 99% reliability; statistical cheating earns nothing.",
      },
      {
        label: "Difficulty modulation",
        description:
          "f₀(d) = f₀_max − δ·d adjusts the threshold by task difficulty. Difficult tasks tolerate more error without rewarding statistical guessing.",
      },
    ],
    simulated: true,
  },
  {
    index: "05",
    name: "Unfair specialization (flight to easiness)",
    description:
      "A farmer validates only easy tasks (>99% attainable reliability), refuses difficult ones, leaving difficulty unserved.",
    defenses: [
      {
        label: "Difficulty bonus (1+γ·d)",
        description:
          "Difficult tasks pay more per unit. A rational agent attempting difficulty earns more than saturating easy tasks.",
      },
      {
        label: "Minimum difficult/easy ratio",
        description:
          "System-level constraint: average reward at d ≈ 1 must dominate d ≈ 0 by ≥ 2× so accept-all strategies beat cherry-picking on cumulative gain.",
      },
      {
        label: "Automatic demand bonus P(t, task)",
        description:
          "When a cherry-picker refuses, the task's bonus rises (+5% per refusal, capped at P_max = 2.5). Honest pickers capture extra, widening the gap.",
      },
    ],
    residual:
      "The precise simple/difficult ratio must be finely calibrated by simulation. v4 plateaus at H/C ≈ 3.19, below the target of 5.",
    simulated: true,
  },
  {
    index: "06",
    name: "Difficulty manipulation",
    description:
      "Deliberately voting against consensus on easy tasks to inflate measured difficulty (consensus dispersion), raising rewards for everyone.",
    defenses: [
      {
        label: "Cost in personal reliability",
        description:
          "Dissenting against consensus lowers the voter's personal f. M(f) drops for that agent. Net loss must exceed the collective gain.",
      },
      {
        label: "Calibration of the gain/loss ratio",
        description:
          "Parametric balance: the difficulty bonus a dissenting vote unlocks must be less than the M(f) drop it causes. Validated by simulation.",
      },
    ],
    residual:
      "Massive coordinated collusion could redefine consensus itself — see Attack 07.",
  },
  {
    index: "07",
    name: "Consensus collusion",
    description:
      "Validators coordinate to vote the same way, creating a false consensus that becomes retroactive 'truth' and corrupts honeypot detection.",
    defenses: [
      {
        label: "Validation diversity required",
        description:
          "Consensus only valid if validators have different sponsors and come from diverse graph branches. Common-origin clusters are detectable.",
      },
      {
        label: "Probabilistic selection",
        description:
          "Validators are protocol-selected, not self-designated. Collusion cannot guarantee its members are selected together.",
      },
      {
        label: "Costly sponsorship",
        description:
          "Building a cluster of validators under common control via sponsorship is costly and observably tracked.",
      },
      {
        label: "Synthetic honeypots with known verdict",
        description:
          "Honeypot source (iii) has a verdict known to the protocol, independent of consensus. A collusion that votes against it betrays itself.",
      },
      {
        label: "Retroactive detection and sanction",
        description:
          "When a honeypot or over-validation contradicts the initial consensus, validators on the false side have β incremented and R_F penalised, with escalation on recidivism.",
      },
      {
        label: "Identity card as detection tool",
        description:
          "The card exposes graph diversity (R_Δ) and each agent's sponsor publicly. Common-sponsor waves are visible to counterparties before they transact.",
      },
    ],
    residual:
      "A very-large-scale attacker controlling >33% of selected validators could break diversity defense — analogous to a 51% attack. To be tested in v5 simulation.",
  },
  {
    index: "08",
    name: "Massive fee-less spam",
    description:
      "With no transaction fees, an attacker floods the network with empty or useless transactions to saturate throughput.",
    defenses: [
      {
        label: "Registration mini-PoUW (VDF)",
        description:
          "Identity creation requires a non-parallelizable VDF targeting 3 min (range [1, 10] min for v0.6 calibration) bound to the public key. 1M Sybils ≈ 10 years on 1000 cores or ~3–5 k$ cloud, for negligible benefit.",
      },
      {
        label: "Adaptive global rate-limit",
        description:
          "No strict individual limit. Network globally limited to capacité_réseau tx/s. Under load: no friction. At saturation: R-weighted prioritisation.",
      },
      {
        label: "Minimum newcomer quota (20%)",
        description:
          "Prevents high-R agents from completely throttling newcomers at saturation. Quota shared across all newcomers, so Sybiling doesn't increase the attacker's share.",
      },
      {
        label: "R-weighted transaction priority",
        description:
          "priorité(tx) = w_R · R + w_quota · 1[newcomer]. Consistent with the universal weighting principle: Sybils with R ≈ 0 wait in queue.",
      },
    ],
    residual:
      "Sub-attacks 8a (parallel mini-PoUW), 8b (DDoS), 8c (pre-mainnet pre-computation) each have specific counter-measures. Calibration of T_pouw_inscription and saturation threshold remains [TO CALIBRATE].",
  },
  {
    index: "09",
    name: "Human-via-AI farming",
    description:
      "A human operator pushes its AIs toward PoUW quantity over quality to maximise convertible coin generation, degrading network quality.",
    defenses: [
      {
        label: "Reliability sigmoid G(f, d)",
        description:
          "Poorly validating 1000 tasks pays less than well validating 100. Quality dominates degraded quantity.",
      },
      {
        label: "Retroactive honeypots",
        description:
          "Statistically detect lazy validators via three converging sources (replay, over-validation, synthetic).",
      },
      {
        label: "Difficult/easy stratification",
        description:
          "(1+γ·d) rewards moving up-market. Honest specialists in difficult tasks out-earn easy-task farmers.",
      },
      {
        label: "R_acc as multiplier",
        description:
          "Systematic refusal penalises directly on the reward multiplier, not just on the score sum.",
      },
      {
        label: "Demand bonus P(t, task)",
        description:
          "Picking up neglected tasks pays extra. Aligns selfish behaviour with network coverage.",
      },
    ],
  },
  {
    index: "10",
    name: "Sabotage by coordinated complaints",
    description:
      "An attacker mass-files false complaints against an honest agent X to degrade its on-card score_plainte and harm its transacting ability.",
    defenses: [
      {
        label: "R-weighting of complainants",
        description:
          "Each complaint is weighted by complainant R_p. Sybil complaints with R ≈ 0 have negligible numerical weight.",
      },
      {
        label: "Mandatory contract link",
        description:
          "A complaint is only valid if it references an on-chain contract between complainant and X. No free complaints; rejected before mempool.",
      },
      {
        label: "Public complainant exposure",
        description:
          "All complainants are visible on-chain. A wave from low-R agents is immediately identifiable as suspicious by counterparties consulting the card.",
      },
      {
        label: "Penalty for invalid complaints",
        description:
          "If validator consensus confirms a complaint as invalid (contract was honoured), the complainant loses R_F. Raises the cost beyond initial Sybil weight.",
      },
    ],
    residual:
      "High-R legitimate accounts coordinating still works — same cost profile as collusion (Attack 07), and anti-collusion defenses apply.",
  },
] as const;
