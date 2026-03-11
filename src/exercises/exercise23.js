import { CONCRETE, REBAR } from '../data/materials.js'

const concrete = CONCRETE['C30']    // fck=30, fcd=20
const rebar    = REBAR['K500B-T']   // fyd=435



// ─── Figure specs reused in solutions ────────────────────────────────────────

const momentDiagramFigure = {
  type: 'moment-diagram',
  props: {
    L: 9,
    udl: [{ q: 20 }],
    pointLoads: [{ P: 75, x: 3 }, { P: 75, x: 6 }],
    divisions: [3, 3, 3],
    showShear: true,
  },
}

export const exercise23 = {
  id: 'ex23',
  title: 'Uppgift 23 – Böjmomentsdimensionering, armerad betong',

  // All intermediate results computed once and merged into p
  derive: (p) => {
    const R_A     = (p.q_d * p.L + 2 * p.P_d) / 2
    const x       = p.L / 2
    const M_Ed    = R_A * x - (p.q_d * x * x) / 2 - p.P_d * (x - p.x1)
    const d       = p.h - p.c_nom - p.phi / 2
    const mu      = (M_Ed * 1e6) / (p.b * d * d * p.fcd)
    const omega   = 1 - Math.sqrt(1 - 2 * mu)
    const A_s_req = omega * p.b * d * p.fcd / p.fyd
    return { R_A, M_Ed, d, mu, omega, A_s_req }
  },

  params: {
    L:    9,      // m, spännvidd
    P_d:  75,     // kN, dimensionerande punktlast
    q_d:  20,     // kN/m, dimensionerande jämnlast (inkl. egentyngd)
    x1:   3,      // m, position för vänster punktlast
    x2:   6,      // m, position för höger punktlast
    // Tvärsnitt
    b:    350,    // mm
    h:    650,    // mm
    phi:  16,     // mm, armeringsdiameter
    c_nom: 26,    // mm, nominellt täckskikt
    // Betong C30
    ...concrete,  // fck, fcd, fctm, Ecm, gamma_btg, CRdc
    // Armering K500B-T
    ...rebar,     // fyk, fyd, Es
  },

  problem: {
    description:
      'Beräkna erforderlig armering med hänsyn till böjmoment i balken. ' +
      'Betong C30 och armering K500B-T, Ø16. ' +
      'Täckskikt $c_{nom}$ = 26 mm. ' +
      'Dimensionerande laster: $P_d$ = 75 kN (punktlaster) och $q_d$ = 20 kN/m (jämnlast, inkl. egentyngd).',

    figures: [
      {
        type: 'beam',
        props: {
          L: 9,
          supports: { left: 'pin', right: 'roller' },
          loads: [
            { type: 'udl',   label: 'q_d = 20 kN/m' },
            { type: 'point', label: 'P_d', x: 1 / 3 },
            { type: 'point', label: 'P_d', x: 2 / 3 },
          ],
          divisions: [3, 3, 3],
        },
      },
      {
        type: 'rect-section',
        props: {
          b: 350,
          h: 650,
          fillColor: '#e8e8e8',
        },
      },
    ],

    //givenData: [
    //  { name: 'Spännvidd',      symbol: 'L',         value: '9',   unit: 'm'     },
    //  { name: 'Punktlast',      symbol: 'P_d',        value: '75',  unit: 'kN'    },
    //  { name: 'Jämnlast',       symbol: 'q_d',        value: '20',  unit: 'kN/m'  },
    //  { name: 'Bredd',          symbol: 'b',          value: '350', unit: 'mm'    },
    //  { name: 'Höjd',           symbol: 'h',          value: '650', unit: 'mm'    },
    //  { name: 'Betongkvalitet', symbol: 'f_{ck}',    value: '30',  unit: 'MPa'   },
    //  { name: 'Armering',       symbol: 'f_{yd}',    value: '435', unit: 'MPa'   },
    //  { name: 'Täckskikt',      symbol: 'c_{nom}',   value: '26',  unit: 'mm'    },
    //],
  },

  steps: [

    // ── Step 1 ───────────────────────────────────────────────────────────────
    {
      id: 'M_Ed',
      title: 'Dimensionerande moment',
      question:
        'Beräkna det dimensionerande böjmomentet $M_{Ed,max}$ (kNm). ' +
        'Kontrollera snitt vid x = L/2 (midspann).',
      answer: {
        label: 'M_{Ed,max}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_Ed.toFixed(1)),
        hint: 'M(x) = R_A·x − q_d·x²/2 − P_d·(x−3). Beräkna vid x = 4,5 m.',
      },
      solution: [
        { text: 'Totallasten på balken:' },
        {
          latex: (p) =>
            `F_{tot} = q_d \\cdot L + 2P_d = ${p.q_d} \\cdot ${p.L} + 2 \\cdot ${p.P_d} = ${p.q_d * p.L + 2 * p.P_d} \\ \\text{kN}`,
          latexBlock: true,
        },
        { text: 'Symmetrisk last → $R_A = R_B = F_{tot} / 2$:' },
        {
          latex: (p) =>
            `R_A = \\frac{${p.q_d * p.L + 2 * p.P_d}}{2} = ${p.R_A} \\ \\text{kN}`,
          latexBlock: true,
        },
        {
          text: (p) => `Frilägg snittet vid x = ${p.L / 2} m (midspann):`,
        },
        {
          latex: (p) =>
            `M_{Ed}(${p.L / 2}) = R_A \\cdot ${p.L / 2} - \\frac{q_d \\cdot ${p.L / 2}^2}{2} - P_d \\cdot (${p.L / 2} - ${p.x1})`,
          latexBlock: true,
        },
        {
          latex: (p) => {
            const x     = p.L / 2
            const term1 = p.R_A * x
            const term2 = p.q_d * x * x / 2
            const term3 = p.P_d * (x - p.x1)
            return (
              `= ${p.R_A} \\cdot ${x} - \\frac{${p.q_d} \\cdot ${x * x}}{2} - ${p.P_d} \\cdot ${x - p.x1}` +
              ` = ${term1} - ${term2} - ${term3} = ${p.M_Ed} \\ \\text{kNm}`
            )
          },
          latexBlock: true,
        },
        { text: 'Moment- och tvärkraftsdiagram:' },
        { figure: momentDiagramFigure },
      ],
    },

    // ── Step 2 ───────────────────────────────────────────────────────────────
    {
      id: 'A_s',
      title: 'Erforderlig armeringsarea',
      question:
        'Beräkna erforderlig armeringsarea $A_s$ (mm²). ',
      answer: {
        label: 'A_{s}',
        unit: 'mm²',
        getCorrect: (p) => parseFloat(p.A_s_req.toFixed(0)),
        hint: 'μ = M_Ed/(b·d²·f_cd). ω = 1 − √(1−2μ). A_s = ω·b·d·f_cd / f_yd.',
      },
      resultCheck: (p) => {
        const n_bars  = 9
        const A_s_sel = n_bars * Math.PI * p.phi ** 2 / 4
        const ok      = A_s_sel >= p.A_s_req
        return {
          ok,
          latex:
            `A_{s,req} = ${p.A_s_req.toFixed(0)} \\ \\text{mm}^2 \\rightarrow ` +
            `\\text{Välj } (7{+}2)\\phi 16{:} \\ A_s = ${A_s_sel.toFixed(0)} \\ \\text{mm}^2 ` +
            `${ok ? '\\geq' : '<'} A_{s,req} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },
      solution: [
        { text: 'Beräkna dimensionerande materialegenskaper'},
        {latex: (p) => 
          `f_{cd} = \\frac{f_{ck}}{\\gamma_m} = \\frac{${p.fck}}{1.5} = ${p.fcd} \\ \\text{MPa}`,
          latexBlock: true,
        },
        {latex: (p) => 
          `f_{yd} = \\frac{f_{yk}}{\\gamma_m} = \\frac{${p.fyk}}{1.0} = ${p.fyd} \\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Effektiv höjd (förenklat, ett lager):' },
        {
          latex: (p) =>
            `d = h - c_{nom} - \\frac{\\phi}{2} = ${p.h} - ${p.c_nom} - ${p.phi / 2} = ${p.d} \\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Relativ momentkapacitet μ:' },
        {
          latex: (p) =>
            `\\mu = \\frac{M_{Ed}}{b \\cdot d^2 \\cdot f_{cd}} = \\frac{${p.M_Ed.toFixed(1)} \\times 10^6}{${p.b} \\cdot ${p.d}^2 \\cdot ${p.fcd}} = ${p.mu.toFixed(3)}`,
          latexBlock: true,
        },
        { text: 'Relativ armeringsmängd ω (förenklat tryckzonsblock):' },
        {
          latex: (p) =>
            `\\omega = 1 - \\sqrt{1 - 2\\mu} = 1 - \\sqrt{1 - 2 \\cdot ${p.mu.toFixed(3)}} = ${p.omega.toFixed(3)}`,
          latexBlock: true,
        },
        { text: 'Erforderlig armeringsarea:' },
        {
          latex: (p) =>
            `A_{s,req} = \\frac{\\omega \\cdot b \\cdot d \\cdot f_{cd}}{f_{yd}} = ` +
            `\\frac{${p.omega.toFixed(3)} \\cdot ${p.b} \\cdot ${p.d} \\cdot ${p.fcd}}{${p.fyd}} \\approx ${p.A_s_req.toFixed(0)} \\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          text: (p) => `Välj (7+2)Ø${p.phi} (7 stänger i undre rad + 2 i övre rad):`,
        },
        {
          latex: (p) => {
            const n_bars  = 9
            const A_s_sel = n_bars * Math.PI * p.phi ** 2 / 4
            return (
              `A_s = ${n_bars} \\cdot \\frac{\\pi \\cdot ${p.phi}^2}{4} = ${n_bars} \\cdot ${(Math.PI * p.phi ** 2 / 4).toFixed(0)} = ${A_s_sel.toFixed(0)} \\ \\text{mm}^2 ` +
              `\\geq ${p.A_s_req.toFixed(0)} \\ \\text{mm}^2 \\quad \\Rightarrow \\textbf{OK!}`
            )
          },
          latexBlock: true,
        },
      ],
    },
  ],
}
