# Exercise App – Architecture Reference

## Stack
React + Vite, KaTeX for math, plain SVG components. No state management library.
Deployed to GitHub Pages via `.github/workflows/deploy.yml` (push to `master` → build → deploy).

---

## Exercise Definition Format

Each exercise is a plain JS object exported from `src/exercises/exercise<id>.js`.

```js
export const exerciseXX = {
  id: 'exXX',
  title: 'Uppgift XX – ...',

  // Optional: computed fields merged into params before rendering.
  // Keeps all calculations in one place; steps read from p.fieldName.
  derive: (p) => {
    const R_A = ...
    return { R_A, M_Ed, d, mu, ... }
  },

  params: {
    L: 9,          // raw inputs
    ...concrete,   // spread from data files
    ...rebar,
  },

  problem: {
    description: 'String shown at top.',
    figures: [                          // array or function (p) => array
      { type: 'beam',          props: { L, supports, loads, divisions? } },
      { type: 'rect-section',  props: { b, h, rebars?, fillColor? } },
      { type: 'ipe-section',   props: { h, b, tf, tw } },
      { type: 'glulam-section',props: { b, h, laminationThickness? } },
      { type: 'moment-diagram',props: { L, supports?, udl?, pointLoads?, divisions?, showShear? } },
    ],
    givenData: [{ name, symbol, value, unit }],
  },

  steps: [
    {
      id: 'stepId',           // used as key in answers state
      title: 'Step title',
      question: 'Question text.',
      answer: {
        label: 'LaTeX label',
        unit: 'kN',
        getCorrect: (p, answers) => number,   // answers = previously submitted values
        hint: 'Hint string.',
      },
      resultCheck: (p, answers) => ({         // optional, shown after correct answer
        ok: boolean,
        latex: 'LaTeX result string',
      }),
      solution: [
        { text: 'Plain text or (p) => string' },
        { latex: 'LaTeX or (p) => string', latexBlock: true },
        { figure: { type: '...', props: { ... } } },  // any registered figure type
      ],
    },
  ],
}
```

Register in `src/exercises/index.js`:
```js
export const exercises = { '23': exercise23, '26a': exercise26a, ... }
```

---

## Data Files (`src/data/`)

| File | Exports | Key fields |
|---|---|---|
| `materials.js` | `CONCRETE`, `REBAR`, `STEEL`, `GLULAM`, `TIMBER`, `LOAD_FACTORS`, `SAFETY_CLASS` | fck/fcd/fctm/Ecm/gamma_btg/CRdc (concrete); fyk/fyd/Es (rebar/steel); fcd/fvd (glulam) |
| `ipe-sections.js` | `IPE_SECTIONS` | h, b, tf, tw, R, A, Aw, Wy, Zy, Iy, g for IPE80–IPE600 |
| `loads.js` | `PSI_FACTORS`, `LIVE_LOADS` | ψ₀/ψ₁/ψ₂ per load type (SS-EN 1990 NA); qk/Qk per category A–G (SS-EN 1991-1-1) |

Usage: `const concrete = CONCRETE['C30']` then `...concrete` in params.

---

## Component Tree

```
App.jsx                        – index page + hash-based routing (#26a → ExerciseShell)
└── ExerciseShell.jsx          – merges derive(params) into params; holds answers state
    ├── FigureRenderer.jsx     – maps { type, props } to SVG component
    └── StepModule.jsx         – one answer + result badge + solution per step
        ├── AnswerField.jsx    – text input with ±10% tolerance check; calls onCorrect(value)
        └── SolutionPanel.jsx  – collapsible; passes params down
            └── SolutionStep.jsx – renders text/latex/figure; resolves fn(p) if needed
```

---

## Shared SVG Components (`src/components/svg/`)

### `BeamSVG`
Props: `L`, `supports { left, right }`, `loads[]`, `divisions?`

Load types: `{ type:'udl', label, color?, xStart?, xEnd? }` — xStart/xEnd as 0–1 fractions
            `{ type:'point', label, x, color? }` — x as 0–1 fraction

Support types: `'pin'`, `'roller'`, `'fixed'`, `'free'`

### `MomentDiagramSVG`
Props: `L`, `supports?`, `udl[]`, `pointLoads[]`, `divisions?`, `showShear?`

Coordinates: **metres** (not fractions). Handles simply supported and cantilevers.
- `{ left:'pin', right:'roller' }` → simply supported (default)
- `{ left:'fixed', right:'free' }` → left cantilever
- `{ left:'free', right:'fixed' }` → right cantilever

Positive M (sagging) plots downward; negative M (hogging) plots upward. Layout is dynamic.

### `RectSection`
Props: `b`, `h`, `fillColor?`, `rebars?` — rebars as `[{ x, y }]` with 0–1 fractions from bottom-left

### `IPESection`
Props: `h`, `b`, `tf`, `tw` — renders I-beam with dimension labels

### `PsiFactorsTable`
Props: `highlight?` — category string for row highlighting (e.g. `'snö'`, `'kontor'`)
Renders ψ₀/ψ₁/ψ₂ table per load type (SS-EN 1990, Tab. NA.A1.1). Figure type: `'psi-factors'`.

### `LiveLoadTable`
Props: `highlight?` — category code for row highlighting (e.g. `'B'`, `'C1'`)
Renders characteristic imposed loads qk/Qk per building category (SS-EN 1991-1-1). Figure type: `'live-loads'`.

### `GlulamSection`
Props: `b`, `h`, `laminationThickness?` (default 45 mm) — alternating lamination bands

---

## Key Patterns

### `derive(p)` — pre-computed params
`ExerciseShell` merges `exercise.derive(exercise.params)` into the params object passed to all components. Use for intermediate values shared across multiple steps (R_A, M_Ed, d, μ, ω, …).

### Answer propagation
`answers` state lives in `ExerciseShell` and is passed to every `StepModule`. `getCorrect(p, answers)` and `resultCheck(p, answers)` can read previously submitted step values via `answers.stepId`.

### Solution lambdas
`text` and `latex` in solution steps accept either a plain string or a function `(p) => string`. `p` is the enriched params (including derived values). Use functions to embed computed numbers:
```js
{ latex: (p) => `R_A = ${p.R_A} \\ \\text{kN}`, latexBlock: true }
```

### Figure in solution
```js
{ figure: { type: 'moment-diagram', props: { L: 9, udl: [...], ... } } }
```
Any registered figure type works inside a solution step.

---

## Directory Structure

```
src/
├── data/                        # Static reference data (no JSX)
│   ├── loads.js                 # LIVE_LOADS, PSI_FACTORS
│   ├── materials.js             # CONCRETE, REBAR, STEEL, GLULAM, LOAD_FACTORS, SAFETY_CLASS
│   └── ipe-sections.js          # IPE section lookup table
│
├── math/                        # Math rendering
│   ├── Equation.jsx             # KaTeX wrapper – inline or block
│   └── InlineText.jsx           # Splits "$...$" from plain text → renders mixed
│
├── components/
│   ├── exercise/                # Exercise UI
│   │   ├── ExerciseShell.jsx    # Top-level: header, problem statement, step list
│   │   ├── StepModule.jsx       # One step: question + answer field + solution panel
│   │   ├── AnswerField.jsx      # Input + check button + ±10% tolerance
│   │   ├── SolutionPanel.jsx    # Collapsible wrapper
│   │   └── SolutionStep.jsx     # One row: text / LaTeX / figure
│   └── svg/                     # Reusable figure components
│       ├── FigureRenderer.jsx   # Registry: { type, props } → component
│       ├── BeamSVG.jsx
│       ├── MomentDiagramSVG.jsx
│       ├── IPESection.jsx / IPECrossSection.jsx
│       ├── GlulamSection.jsx / RectSection.jsx
│       ├── PsiFactorsTable.jsx
│       └── LiveLoadTable.jsx
│
├── exercises/                   # Exercise definitions (pure JS, no JSX)
│   ├── index.js                 # Registry – must be updated manually for each new exercise
│   ├── exercise1.js
│   ├── exercise2.js
│   ├── exercise23.js
│   ├── exercise26a/b/c.js
│   └── figures/                 # Exercise-specific SVG (not shared)
│       └── Exercise2Figure.jsx  # Roof elevation + plan; type: 'ex2-roof'
│
├── App.jsx                      # Hash router: #2 → exercises['2'] → ExerciseShell
└── main.jsx
```

---

## LaTeX / Math in Text Fields

Any string field (`title`, `question`, `description`, `hint`, `text` in solution) supports inline math using `$...$`:

```js
question: 'Beräkna $q_d$ (kN/m²) för kategori C1.'
```

For block equations in solution steps, use `latex` with `latexBlock: true`:
```js
{ latex: (p) => `q_d = ${p.q_d.toFixed(2)} \\ \\text{kN/m}^2`, latexBlock: true }
```

`latex` can also be an array for multi-line equations:
```js
{ latex: ['line 1', 'line 2'], latexBlock: true }
```

---

## Exercise-Specific Figures

Put in `src/exercises/figures/`, register in `FigureRenderer.jsx` with a namespaced type:
```js
// FigureRenderer.jsx
import Exercise2Figure from '../../exercises/figures/Exercise2Figure.jsx'
const REGISTRY = {
  ...
  'ex2-roof': Exercise2Figure,
}
```

Use `figures` as a function to pass exercise params into figure props:
```js
figures: (p) => [
  { type: 'ex2-roof', props: { span: p.L_balk, sPurlin: p.cc_ås, sBeam: p.cc_balk } }
]
```

---

## Exercises Implemented

| ID  | Title | Topic |
|---|---|---|
| 1   | Uppgift 1 – Laster | ULS/SLS design loads, kat. C1 & C3 |
| 2   | Uppgift 2 – Takbalk | Roof beam loading, elevation + plan figure |
| 23  | Böjmomentsdimensionering, betong C30 | RC bending, EC2 rectangular stress block |
| 26a | Tvärkraft, stål IPE360 | Shear, Steel S235, V_Rd = A_w · f_yd / √3 |
| 26b | Tvärkraft, limträ GL30c | Shear, Glulam, V_Rd = b_e · h · f_vd / 1.5 |
| 26c | Tvärkraft, armerad betong C30 | Shear, RC, EN 1992 eq 6.2 |
