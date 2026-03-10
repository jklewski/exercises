import { CONCRETE, REBAR, LOAD_FACTORS } from '../data/materials.js'

const concrete = CONCRETE['C30']       // fck=30, fcd=20, gamma_btg=24
const rebar    = REBAR['K500B-T']      // fyd=435
const lf       = LOAD_FACTORS['STR_B'] // gamma_G=1.2, gamma_Q=1.5

// ─── Rebar layout ─────────────────────────────────────────────────────────────
// 10Ø16 in two rows (5+5) at the bottom of the section (b=300, h=500).
// Cover c_nom = 26mm, bar Ø = 16mm, min clear between rows c = 20mm.
//
// Bar center from bottom:
//   Row 1 (bottom): c_nom + Ø/2 = 26 + 8 = 34mm  →  y = 34/500 = 0.068
//   Row 2 (above):  34 + Ø + c  = 34 + 16 + 20 = 70mm  →  y = 70/500 = 0.14
//
// Bar centers from left (evenly spaced, 5 bars across b=300mm):
//   First: c_nom + Ø/2 = 34mm, last: 300 - 34 = 266mm
//   Positions: 34, 92, 150, 208, 266mm  →  divide by 300 for fraction
// ─── Shared calculation helpers ───────────────────────────────────────────────
function calcQ_d(p) {
  const G_k_balk = (p.b_w / 1000) * (p.h / 1000) * p.gamma_btg
  return p.gamma_G * (G_k_balk + p.G_k_tak * p.s) + p.gamma_Q * p.s_snow * p.s
}

function calcV_Ed(p, answers) {
  const q_d = answers.q_d ?? calcQ_d(p)   // use submitted value if available
  return q_d * p.L / 2
}

function calcV_Rdc(p) {
  const d             = p.h - p.c_nom - p.phi - p.c_vert / 2
  const k             = Math.min(1 + Math.sqrt(200 / d), 2.0)
  const A_sl          = p.n_bars * Math.PI * p.phi**2 / 4
  const rho_l         = Math.min(A_sl / (p.b_w * d), 0.02)
  const v_min         = 0.035 * Math.sqrt(k**3 * p.fck)
  const V_formula     = (p.CRdc * k * Math.cbrt(100 * rho_l * p.fck)) * p.b_w * d / 1000
  const V_min         = v_min * p.b_w * d / 1000
  return Math.max(V_formula, V_min)
}

const rebarXs = [34, 92, 150, 208, 266].map(x => x / 300)
const rebars = [
  ...rebarXs.map(x => ({ x, y: 34 / 500 })),  // row 1 (bottom)
  ...rebarXs.map(x => ({ x, y: 70 / 500 })),  // row 2
]

export const exercise26c = {
  id: 'ex26c',
  title: 'Uppgift 26c – Tvärkraftskapacitet, armerad betong',

  params: {
    L: 12,             // m, spännvidd
    s: 5,              // m, influensbredd (s-avstånd)
    G_k_tak: 0.5,      // kN/m², karakteristisk egenlast tak
    s_snow: 1.2,       // kN/m², karakteristisk snölast
    ...lf,             // gamma_G, gamma_Q
    // Tvärsnittsdata
    b_w: 300,          // mm, bredd
    h: 500,            // mm, höjd
    // Betong C30
    ...concrete,       // fck, fcd, fctm, Ecm, gamma_btg, CRdc
    // Armering K500B-T
    ...rebar,          // fyk, fyd, Es, gamma_s
    phi: 16,           // mm, stångdiameter
    n_bars: 10,        // antal stänger
    // Täckskikt
    c_nom: 26,         // mm, nominellt täckskikt
    c_vert: 20,        // mm, avstånd mellan parallella stänger (vertikalt)
  },

  problem: {
    description:
      'Kontrollera tvärkraftskapaciteten för takbalken i byggnaden i brottgränstillståndet (STR-B). ' +
      'Balken är av armerad betong med tvärsnittet 300 × 500 mm² och armerad i underkant med ' +
      '10 Ø16 i två lager (5 + 5). Betongkvalitet C30 och armering K500B-T. ' +
      'Säkerhetsklass 3. Täckskikt c_nom = 26 mm, avstånd mellan parallella stänger c = 20 mm.',

    figures: [
      {
        type: 'beam',
        props: {
          L: 12,
          supports: { left: 'pin', right: 'roller' },
          loads: [
            { type: 'udl', label: 'snö' },
            { type: 'udl', label: 'egt tak' },
          ],
        },
      },
      {
        type: 'rect-section',
        props: {
          b: 300,
          h: 500,
          rebars,
          fillColor: '#e8e8e8',  // concrete grey
        },
      },
    ],

    givenData: [
      { name: 'Spännvidd',        symbol: 'L',          value: '12',  unit: 'm'     },
      { name: 'S-avstånd',        symbol: 's',           value: '5',   unit: 'm'     },
      { name: 'Egentyngd tak',    symbol: 'G_{k,tak}',  value: '0,5', unit: 'kN/m²' },
      { name: 'Snölast',          symbol: 's_{snow}',   value: '1,2', unit: 'kN/m²' },
      { name: 'Bredd',            symbol: 'b_w',         value: '300', unit: 'mm'    },
      { name: 'Höjd',             symbol: 'h',           value: '500', unit: 'mm'    },
      { name: 'Betongkvalitet',   symbol: 'f_{ck}',     value: '30',  unit: 'MPa'   },
      { name: 'Armering',         symbol: 'f_{yd}',     value: '435', unit: 'MPa'   },
      { name: 'Armeringsarea',    symbol: 'A_s',         value: '10 × π16²/4 ≈ 2011', unit: 'mm²' },
      { name: 'Täckskikt',        symbol: 'c_{nom}',    value: '26',  unit: 'mm'    },
    ],
  },

  steps: [
    {
      id: 'q_d',
      title: 'Dimensionerande last',
      question:
        'Beräkna den dimensionerande lasten q_d (kN/m). ' +
        'Beräkna först balkens egentyngd G_k,balk = b · h · γ_btg.',
      answer: {
        label: 'q_d',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(calcQ_d(p).toFixed(2)),
        hint: 'G_k,balk = 0,3 · 0,5 · 24 = 3,6 kN/m. Säkerhetsklass 3 → γ_d = 1,0.',
      },
      solution: [
        { text: 'Beräkna balkens egentyngd (betongtäthet 24 kN/m³):' },
        {
          latex: 'G_{k,balk} = b_w \\cdot h \\cdot \\gamma_{btg} = 0{,}3 \\cdot 0{,}5 \\cdot 24 = 3{,}6 \\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: 'Dimensionerande last, STR-B, säkerhetsklass 3 (γ_d = 1,0):' },
        {
          latex: 'q_d = 1{,}2 \\cdot (3{,}6 + 0{,}5 \\cdot 5) + 1{,}5 \\cdot 1{,}2 \\cdot 5 = 16{,}3 \\ \\text{kN/m}',
          latexBlock: true,
        },
      ],
    },

    {
      id: 'V_Ed',
      title: 'Dimensionerande tvärkraft',
      question:
        'Beräkna den dimensionerande tvärkraften V_Ed (kN) och den effektiva höjden d (mm). ' +
        'Effektiv höjd: d = h − c_nom − Ø − c/2.',
      answer: {
        label: 'V_{Ed}',
        unit: 'kN',
        getCorrect: (p, answers) => parseFloat(calcV_Ed(p, answers).toFixed(1)),
        hint: 'V_Ed = q_d · L / 2. d = 500 − 26 − 16 − 20/2 = 448 mm.',
      },
      solution: [
        {
          latex: 'V_{Ed} = \\frac{q_d \\cdot L}{2} = \\frac{16{,}3 \\cdot 12}{2} = 98 \\ \\text{kN}',
          latexBlock: true,
        },
        { text: 'Effektiv höjd (avstånd från ovankant till armeringens tyngdpunkt):' },
        {
          latex: 'd = h - c_{nom} - \\phi - \\frac{c}{2} = 500 - 26 - 16 - \\frac{20}{2} = 448 \\ \\text{mm}',
          latexBlock: true,
        },
      ],
    },

    {
      id: 'V_Rdc',
      title: 'Tvärkraftskapacitet utan tvärkraftsarmering',
      question:
        'Beräkna tvärkraftskapaciteten V_Rdc (kN) för det armerade betongtvärsnittet utan tvärkraftsarmering. ' +
        'Ingen förspänning → σ_cp = 0. C_Rd,c = 0,18/γ_C = 0,12.',
      answer: {
        label: 'V_{Rdc}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(calcV_Rdc(p).toFixed(1)),
        hint: 'k = 1 + √(200/d). ρ_l = A_sl/(b_w·d). V_Rdc = C_Rd,c · k · (100·ρ_l·f_ck)^(1/3) · b_w · d',
      },
      resultCheck: (p, answers) => {
        const V_Ed = calcV_Ed(p, answers)
        const V_Rd = calcV_Rdc(p)
        const ok   = V_Rd >= V_Ed
        return {
          ok,
          latex: `V_{Rdc} = ${V_Rd.toFixed(0)} \\ \\text{kN} ${ok ? '\\geq' : '<'} V_{Ed} = ${V_Ed.toFixed(0)} \\ \\text{kN} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK! - Tvärkraftsarmera!}'}`,
        }
      },
      solution: [
        // TODO: Fill in solution steps. Structure:
        //
        //   { text: 'Some explanation text here.' },
        //   { latex: 'k = 1 + \\sqrt{\\frac{200}{d}} = ...', latexBlock: true },
        //
        // Each object can have:
        //   text      – plain text paragraph (optional)
        //   latex     – LaTeX string rendered by KaTeX (optional)
        //   latexBlock – true for display/block math, false/omit for inline
        //
        { text: 'TODO: Add solution steps here.' },
      ],
    },
  ],
}
