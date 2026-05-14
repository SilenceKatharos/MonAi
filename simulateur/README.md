# MonAI agent-based simulator — v1 to v4

Testable core of an agent-based simulator to calibrate and stress-test the MonAI protocol's assumptions. Deliberately lightweight (no `mesa` or `agentpy` framework), oriented toward code readability and ease of modification.

The simulator has progressed through four calibration rounds (v1 → v2 → v3 → v4). The v1 baseline covers: PoUW issuance, sigmoid `M(f, d)` multiplier, Beta-Binomial reliability `f̂`, emergent difficulty `d`, sources (i) and (iii) honeypots, reputation score `R`, simplified sponsorship, rate-limiting. Successive rounds tuned the sigmoid and reputation parameters: the **v3 grid search produced the current `simulateur/config.py` defaults** (Candidate B: `f0_max=0.85`, `k_sigmoid=40`, `γ=3.0`, `w_acc=0.05`). **v4 introduced the mempool refactor** (tasks now persist across ticks instead of being created+validated+removed within a single tick) and **activated the automatic demand bonus `P(t, task)`**. See [v1 simplifications](#v1-simplifications) for what is still deferred (v5 work items).

## Quick start

```bash
# From the repo root
python -m simulateur.scenarios.A_calibration
python -m simulateur.scenarios.B_stress_sybil
python -m simulateur.scenarios.C_bootstrap

# Visualisation
jupyter notebook simulateur/notebooks/visualisation.ipynb
```

Each scenario runs in **under a minute** on a standard laptop and writes to `simulateur/results/<scenario>/<timestamp>/`.

## Dependencies

- Python 3.11+
- numpy, pandas, matplotlib (and jupyter for the notebook)

```bash
python -m venv .venv
source .venv/bin/activate
pip install numpy pandas matplotlib jupyter
```

## Structure

```
simulateur/
├── README.md            ← this file
├── config.py            ← ALL parameters (a single place to edit)
├── agents.py            ← Agent class + 5 profiles
├── economy.py           ← issuance R(t), sigmoid M(f, d), reward
├── reputation.py        ← Beta-Binomial f̂, EWMA components of R
├── honeypots.py         ← replay pool (i) + synthetic generation (iii)
├── simulation.py        ← main tick-by-tick loop
├── metrics.py           ← collection, CSV saving, figure generation
├── scenarios/
│   ├── A_calibration.py    ← nominal mix, checks hierarchies
│   ├── B_stress_sybil.py   ← 100 honest vs 200 sybils
│   └── C_bootstrap.py      ← 20 agents at startup
├── notebooks/
│   └── visualisation.ipynb ← graphs of the 3 scenarios side by side
└── results/
    └── <scenario>/<timestamp>/
        ├── metrics_per_tick.csv
        ├── network.csv
        ├── agents_final.csv
        └── figures/
            ├── f_hat_par_profil.png
            ├── R_par_profil.png
            ├── gains_par_profil.png
            └── reseau.png
```

## Modifying parameters

**A single place**: [`config.py`](config.py). All parameters are gathered there and commented. To explore an alternative calibration, two options:

1. **Edit `config.py` directly** — changes the global defaults.
2. **Override inside a scenario** — each file in `scenarios/` instantiates `Config()` then modifies what it wants. This is the recommended path so as not to break the defaults.

Example to test `f0_max = 0.85`:

```python
# scenarios/A_calibration.py
def make_config() -> Config:
    cfg = Config()
    cfg.n_ticks = 2000
    cfg.f0_max = 0.85   # new test
    return cfg
```

## Adding a scenario

1. Create `scenarios/D_my_test.py` modeled on an existing one.
2. Define a `make_config()` function that returns a modified `Config`.
3. Define `main()` which calls `run_simulation(cfg, scenario_name="D_my_test")`.
4. Run `python -m simulateur.scenarios.D_my_test`.

Results will appear in `results/D_my_test/<timestamp>/`.

## Adding an agent profile

1. In [`agents.py`](agents.py):
   - Add a constant `MY_PROFILE = "my_profile"` and include it in `ALL_PROFILES`.
   - Override `Agent.should_accept()` and/or `Agent.vote()` to handle the new profile in the `match` (currently a `p_base` dict).
2. In [`config.py`](config.py): add `n_my_profile = 0` (and the entry in `p_base_per_profile` if relevant).
3. In [`agents.py`](agents.py) `create_initial_population()`: add `(MY_PROFILE, cfg.n_my_profile)` in the `counts` list.
4. Override inside a scenario to enable `cfg.n_my_profile = N`.

## Expected vs observed hierarchies

| Scenario | User spec | Observed v1 |
|---|---|---|
| A | honest > mediocre > cherry-picker > sybil ≈ random | **honest > cherry-picker > mediocre > sybil ≈ random** |
| B | honest agents maintained, sybils crushed | ✓ gain ratio ~1000× |
| C | defenses hold at bootstrap | ✓ source (iii) is sufficient |

The gap on A is documented below.

**Update (v3/v4 grid)**: the v3 calibration round resolved the M-vs-C inversion observed at v1. The current defaults (Candidate B: `f0_max=0.85`, `k_sigmoid=40`, `γ=3.0`, `w_acc=0.05`) produce **H/M = 3.13 ✓** and **M/C = 1.01 ✓**, restoring the spec ordering `honest > mediocre > cherry-picker`. The remaining gap is on **H/C** (target ≥ 5, observed 3.19), accepted as a v0.6 work item — cf. [`../formalisation/05-bilan-v0-5.md`](../formalisation/05-bilan-v0-5.md) §E.1.

## v1 simplifications

Implementation choices and reported inconsistencies of the v1 release — what is voluntarily simplified compared to the canonical spec, and what is deferred to v2.

### `p_correct(θ)` linearly degraded (Q1 of the plan)

Choice retained: `p_correct(θ) = 0.5 + (p_base - 0.5) · (1 - θ)`. Consequence: a mediocre agent at `p_base=0.85` sees its `p_correct` drop to 0.675 at `θ=0.5`, and its average `f̂` converge toward ~0.80 rather than 0.85. With `f0_max = 0.90`, its `M(f, d)` is very low → gains ~10× lower than predicted by the spec.

**Effect**: in scenario A, the cherry-picker (which only takes `θ<0.3` tasks where it stays at `p_correct=0.999`) overtakes the mediocre in cumulative gain. This is consistent with the model, but deviates from the user spec target.

**Avenues to realign**: lower `f0_max` to 0.85, widen the transition zone (smaller `k_sigmoid`, e.g. 25 instead of 40), or reduce the slope of `p_correct(θ)` degradation. To explore in simulation.

### Validator selection without diversity

Validator draws are probabilistically weighted by R + new-agent quota, **but without modeling sponsor / graph branch diversity** (cf. [securite/05](../securite/05-modele-de-menace-et-defenses.md) §"Required diversity"). A collusion sharing a sponsor would not be detected in v1.

To add in v2 if we want to explicitly test attack 7 (consensus collusion).

### Retroactive collusion detection (Q3 of the plan, user choice)

Not implemented explicitly. The weight `w_h` on honeypots already produces the expected `f̂` drop in voters on the wrong-consensus side, without separate logic for identifying `V_faux` and applying an `R_F` penalty. For a test of massive coordinated collusion, to add in v2.

### Source (ii) retroactive over-validation

Not implemented in v1 (cf. user spec). Only sources (i) replay and (iii) synthetic are active.

### Simplified sponsorship

The agents/simulation code contains the API but the mechanism **is not actively triggered in v1**: no new agent is created during the simulation. All agents are created at tick 0. To enable sponsorship, a `dynamics/agent_creation.py` module would be needed to create agents along the way — left for v2.

### `R_Δ` component (diversity)

Not computed in v1 — the `agent.R_Delta` field remains 0. To be implemented via an agent-to-agent transaction matrix (and therefore first requires introducing non-PoUW transactions into the simulator).

### `R_A` (age × activity)

Implemented in simplified form: `age_eff` incremented by `+1` at each validation, without freezing by an activity threshold. To enrich in v2.

## Performance

Measurements on a standard laptop (Linux, Python 3.11):

| Scenario | Ticks | Agents | Wall-clock time |
|---|---:|---:|---:|
| A | 2000 | 140 | ~15 s |
| B | 2000 | 300 | ~30 s |
| C | 1500 | 20 | ~1 s |

For > 5,000 agents or > 10,000 ticks, vectorizing the inner loops (switching to global numpy arrays for `α, β, R_C` etc.) will be necessary.

## v2 avenues

- Global numpy vectorization to scale to 10k+ agents.
- Source (ii) retroactive over-validation with probabilistic triggering and identification of `V_faux`.
- Graph diversity for validator selection.
- Dynamic agent creation during the simulation (with active sponsorship).
- Modeling the agent-to-agent transaction layer (for `R_Δ` and `R_C` arising from contracts).
- Coordinated scenarios module (sophisticated collusion, cross-honeypot attack).

## References

- [`../formalisation/01-formules-mathematiques.md`](../formalisation/01-formules-mathematiques.md) — formulas for `f̂`, `d`, `M`, `R`.
- [`../formalisation/03-honeypots-retroactives.md`](../formalisation/03-honeypots-retroactives.md) — honeypot mechanism.
- [`../securite/05-modele-de-menace-et-defenses.md`](../securite/05-modele-de-menace-et-defenses.md) — the 10 attacks to test.
- [`../operations/06-questions-ouvertes-et-roadmap.md`](../operations/06-questions-ouvertes-et-roadmap.md) — parameters to calibrate in simulation.
