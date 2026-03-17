import { CONCRETE, REBAR } from '../data/materials.js'

const concrete = CONCRETE['C25']  // fck=25, fcd=16.7, CRdc=0.12
const rebar    = REBAR['K500B-T'] // fyd=435

// ─── Cross-section rebar layout ───────────────────────────────────────────────
// 5 Ø20 in one row at the bottom.
// h = 720 mm, d = 670 mm  → bar centre 50 mm from bottom.
// 5 bars evenly spaced across b = 350 mm (first/last at 50 mm from edge).
const h_sect = 720
const b_sect = 350
const c_bot  = 50   // mm – from bottom face to bar centre

const rebarXs = [50, 112.5, 175, 237.5, 300].map(x => x / b_sect)
const rebars  = rebarXs.map(x => ({ x, y: c_bot / h_sect }))

// ─── Shared helpers ───────────────────────────────────────────────────────────
function calcVRdc(p) {
  const d     = p.h - p.c_bot
  const k     = Math.min(1 + Math.sqrt(200 / d), 2.0)
  const A_sl  = p.n_main * Math.PI * p.phi_main ** 2 / 4
  const rho_l = Math.min(A_sl / (p.b_w * d), 0.02)
  const v_min = 0.035 * Math.sqrt(k ** 3 * p.fck)
  return Math.max(
    p.CRdc * k * Math.cbrt(100 * rho_l * p.fck) * p.b_w * d / 1000,
    v_min * p.b_w * d / 1000,
  )
}

export const exercise29 = {
  id: 'ex29',
  title: 'Uppgift 29 – Tvärkraftsarmering, betong C25',

  derive: (p) => {
    // Reactions (moment about B)
    const R_A   = (p.P_d * (p.L - p.xP) + p.q_d * p.L ** 2 / 2) / p.L
    const R_B   = p.P_d + p.q_d * p.L - R_A
    const V_EdA = R_A   // max shear, at support A
    const V_EdB = R_B   // shear at support B

    // Cross-section
    const d     = p.h - p.c_bot                         // mm, effective depth
    const k     = Math.min(1 + Math.sqrt(200 / d), 2.0)
    const A_sl  = p.n_main * Math.PI * p.phi_main ** 2 / 4
    const rho_l = Math.min(A_sl / (p.b_w * d), 0.02)

    // Shear capacity without stirrups (EC2 eq. 6.2a / 6.2b)
    const v_min       = 0.035 * Math.sqrt(k ** 3 * p.fck)
    const V_Rdc_form  = p.CRdc * k * Math.cbrt(100 * rho_l * p.fck) * p.b_w * d / 1000
    const V_Rdc_min   = v_min * p.b_w * d / 1000
    const V_Rdc       = Math.max(V_Rdc_form, V_Rdc_min)

    // Stirrup spacing (EC2 eq. 6.8, vertical stirrups, θ = 22.5°)
    const A_sw      = p.n_legs * Math.PI * p.phi_sw ** 2 / 4   // mm², one stirrup
    const z         = 0.9 * d                                    // mm, inner lever arm
    const cot_theta = 2.5                                        // θ = 22.5°
    // s = A_sw · z · f_ywd · cot θ / V_Ed  [mm]
    const s_stirrup = A_sw * z * p.fyd * cot_theta / (V_EdA * 1000)

    // Compressed concrete strut check (EC2 eq. 6.9)
    const v1      = 0.6 * (1 - p.fck / 250)
    const V_Rdmax = p.b_w * z * v1 * p.fcd * cot_theta / (1000 * (1 + cot_theta ** 2))

    return {
      R_A, R_B, V_EdA, V_EdB,
      d, k, A_sl, rho_l, v_min, V_Rdc_form, V_Rdc_min, V_Rdc,
      A_sw, z, cot_theta, s_stirrup, v1, V_Rdmax,
    }
  },

  params: {
    // Beam geometry
    L:  10,    // m, span
    xP: 1.5,   // m, point load position from A
    P_d: 70,   // kN, design point load
    q_d: 20,   // kN/m, design UDL (incl. self-weight)
    // Cross-section
    b_w:      350,   // mm
    h:        720,   // mm  (d + c_bot = 670 + 50)
    c_bot:     50,   // mm, distance bottom face → bar centre
    phi_main:  20,   // mm, main bar diameter
    n_main:     5,   // number of main bars
    // Concrete C25
    ...concrete,     // fck, fcd, fctm, Ecm, CRdc
    // Steel K500B-T  (K500AB-W stirrups have same f_yd)
    ...rebar,        // fyd=435
    // Stirrups φ6
    phi_sw: 6,       // mm, stirrup bar diameter
    n_legs: 2,       // number of stirrup legs
  },

  problem: {
    description:
      'Kontrollera om balken behöver tvärkraftsarmeras. ' +
      'Balken belastas med en utbredd last $q_d = 20$ kN/m (inkl. egentyngd) och en punktlast $P_d = 70$ kN. ' +
      'Alla armeringsstänger dras fram till stöd. ' +
      'Betong C25, längdarmering K500B-T. ' +
      'Om tvärkraftsarmering behövs, bestäm centrumavstånd för byglarna. ' +
      'Bygelarmering $\\phi 6$, K500AB-W.',

    figures: [
      {
        type: 'beam',
        props: {
          L: 10,
          supports: { left: 'pin', right: 'roller' },
          loads: [
            { type: 'udl',   label: 'q_d = 20 kN/m' },
            { type: 'point', label: 'P_d = 70 kN', x: 0.15 },
          ],
          divisions: [1.5, 8.5],
        },
      },
      {
        type: 'rect-section',
        props: {
          b: b_sect,
          h: h_sect,
          rebars,
          fillColor: '#e8e8e8',
        },
      },
    ],


  },

  steps: [
    // ── Step 1: Design shear force ─────────────────────────────────────────────
    {
      id: 'V_EdA',
      title: 'Dimensionerande tvärkraft',
      question:
        'Beräkna den dimensionerande tvärkraften $V_{Ed}$ (kN) vid stöd A ' +
        '(den kritiska sektionen med störst tvärkraft).',
      answer: {
        label: 'V_{Ed,A}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.V_EdA.toFixed(1)),
        hint:
          'Momentjämvikt kring B: ' +
          '$R_A \\cdot L = P_d \\cdot (L - x_P) + q_d \\cdot L^2 / 2$.',
      },
      solution: [
        {
          figure: {
            type: 'moment-diagram',
            props: {
              L: 10,
              udl: [{ q: 20 }],
              pointLoads: [{ P: 70, x: 1.5 }],
              divisions: [1.5, 8.5],
              showShear: true,
            },
          },
        },
      ],
    },

    // ── Step 2: Shear capacity without stirrups ────────────────────────────────
    {
      id: 'V_Rdc',
      title: 'Tvärkraftskapacitet utan tvärkraftsarmering',
      question:
        'Beräkna tvärkraftskapaciteten $V_{Rdc}$ (kN) utan tvärkraftsarmering ' +
        '(EC2 ekv. 6.2). Ingen förspänning → $\\sigma_{cp} = 0$.',
      answer: {
        label: 'V_{Rdc}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.V_Rdc.toFixed(1)),
        hint:
          '$C_{Rd,c} = 0{,}18/\\gamma_C = 0{,}12$. ' +
          '$k = 1 + \\sqrt{200/d}$. ' +
          '$\\rho_l = A_{sl}/(b_w \\cdot d) \\leq 0{,}02$.',
      },
      resultCheck: (p) => {
        const ok = p.V_Rdc >= p.V_EdA
        return {
          ok,
          latex:
            `V_{Rdc} = ${p.V_Rdc.toFixed(1)} \\ \\text{kN} ` +
            `${ok ? '\\geq' : '<'} ` +
            `V_{Ed,A} = ${p.V_EdA.toFixed(1)} \\ \\text{kN} \\quad ` +
            `${ok ? '\\Rightarrow \\textbf{OK! — ingen tvärkraftsarmering krävs.}' : '\\Rightarrow \\textbf{Ej OK! — tvärkraftsarmering krävs.}'}`,
        }
      },
      solution: [
        { text: 'Skalningsfaktor och armeringsandel:' },
        {
          latex: (p) =>
            `k = 1 + \\sqrt{\\frac{200}{d}} = 1 + \\sqrt{\\frac{200}{${p.d}}} = ${p.k.toFixed(3)} \\leq 2{,}0`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `A_{sl} = 5 \\cdot \\frac{\\pi \\cdot 20^2}{4} = ${p.A_sl.toFixed(1)} \\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\rho_l = \\frac{A_{sl}}{b_w \\cdot d} = \\frac{${p.A_sl.toFixed(1)}}{${p.b_w} \\cdot ${p.d}} = ${p.rho_l.toFixed(4)} \\leq 0{,}02`,
          latexBlock: true,
        },
        { text: 'Tvärkraftskapacitet (EC2 ekv. 6.2a):' },
        {
          latex: (p) =>
            `V_{Rdc} = C_{Rd,c} \\cdot k \\cdot \\sqrt[3]{100 \\rho_l f_{ck}} \\cdot b_w \\cdot d` +
            ` = 0{,}12 \\cdot ${p.k.toFixed(3)} \\cdot \\sqrt[3]{100 \\cdot ${p.rho_l.toFixed(4)} \\cdot 25} \\cdot ${p.b_w} \\cdot ${p.d} \\cdot 10^{-3}` +
            ` = ${p.V_Rdc_form.toFixed(1)} \\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `v_{min} \\cdot b_w \\cdot d = ${p.v_min.toFixed(3)} \\cdot ${p.b_w} \\cdot ${p.d} \\cdot 10^{-3} = ${p.V_Rdc_min.toFixed(1)} \\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `V_{Rdc} = \\max(${p.V_Rdc_form.toFixed(1)},\\ ${p.V_Rdc_min.toFixed(1)}) = ${p.V_Rdc.toFixed(1)} \\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `V_{Rdc} = ${p.V_Rdc.toFixed(1)} \\ \\text{kN} < V_{Ed,A} = ${p.V_EdA.toFixed(1)} \\ \\text{kN}` +
            ` \\quad \\Rightarrow \\text{tvärkraftsarmering behövs!}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Kontroll vid stöd B: $V_{Rdc} = ${p.V_Rdc.toFixed(1)}$ kN $\\geq V_{Ed,B} = ${p.V_EdB.toFixed(1)}$ kN → OK, ingen tvärkraftsarmering vid stöd B.`,
        },
      ],
    },

    // ── Step 3: Stirrup spacing ────────────────────────────────────────────────
    {
      id: 's_stirrup',
      title: 'Centrumavstånd för tvärkraftsarmering',
      question:
        'Tvärkraftsarmering behövs vid stöd A (0–1,5 m från stöd A). ' +
        'Beräkna det erforderliga centrumavståndet $s$ (mm) för byglarna $\\phi 6$. ' +
        'Anta flack spricklutning: $\\theta = 22{,}5°$, $\\cot \\theta = 2{,}5$.',
      answer: {
        label: 's',
        unit: 'mm',
        getCorrect: (p) => parseFloat(p.s_stirrup.toFixed(1)),
        hint:
          'Ur $V_{Rd,s} = V_{Ed,A}$: $s = \\dfrac{A_{sw}}{V_{Ed}} z f_{ywd} \\cot \\theta$. ' +
          '$A_{sw} = 2 \\times \\pi \\cdot 6^2/4$, $z = 0{,}9d$.',
      },
      solution: [
        { text: 'Armeringsarea för ett bygelpår (2 ben, φ6):' },
        {
          latex: (p) =>
            `A_{sw} = 2 \\cdot \\frac{\\pi \\cdot ${p.phi_sw}^2}{4} = ${p.A_sw.toFixed(2)} \\ \\text{mm}^2`,
          latexBlock: true,
        },
        { text: 'Inre hävarmsarm:' },
        {
          latex: (p) =>
            `z = 0{,}9 \\cdot d = 0{,}9 \\cdot ${p.d} = ${p.z.toFixed(0)} \\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Erforderligt centrumavstånd (ur $V_{Rd,s} = V_{Ed,A}$, EC2 ekv. 6.8):' },
        {
          latex: (p) =>
            `s = \\frac{A_{sw}}{V_{Ed}} \\cdot z \\cdot f_{ywd} \\cdot \\cot \\theta` +
            ` = \\frac{${p.A_sw.toFixed(2)}}{${p.V_EdA.toFixed(1)} \\cdot 10^3}` +
            ` \\cdot ${p.z.toFixed(0)} \\cdot ${p.fyd} \\cdot ${p.cot_theta}` +
            ` = ${p.s_stirrup.toFixed(1)} \\ \\text{mm}`,
          latexBlock: true,
        },
        { text: (p) => `Välj $s = 230$ mm. Kontroll max avstånd: $s_{l,max} = 0{,}75d = 0{,}75 \\cdot ${p.d} = ${(0.75 * p.d).toFixed(0)}$ mm $\\geq s$ → OK!` },
        { text: 'Kontroll tryckt betongsträva (EC2 ekv. 6.9):' },
        {
          latex: (p) =>
            `V_{Rd,max} = \\frac{\\alpha_{cw} b_w z \\nu_1 f_{cd} \\cot \\theta}{1 + \\cot^2 \\theta}` +
            ` = \\frac{1 \\cdot ${p.b_w} \\cdot ${p.z.toFixed(0)} \\cdot ${p.v1.toFixed(2)} \\cdot ${p.fcd} \\cdot ${p.cot_theta}}{(1 + ${p.cot_theta}^2) \\cdot 10^3}` +
            ` = ${p.V_Rdmax.toFixed(1)} \\ \\text{kN} \\gg V_{Ed,A} \\quad \\text{OK!}`,
          latexBlock: true,
        },
        {
          text: 'Svar: φ6 s = 230 mm, placerade 0–1,5 m från stöd A. Ingen tvärkraftsarmering vid stöd B.',
        },
      ],
    },
  ],
}
