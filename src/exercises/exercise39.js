import { IPE_SECTIONS } from '../data/sections.js'
import { STEEL, GLULAM, CONCRETE, REBAR } from '../data/materials.js'

const ipe360   = IPE_SECTIONS['IPE360']
const steel    = STEEL['S235']
const glulam   = GLULAM['GL30c']
const concrete = CONCRETE['C30']
const rebar    = REBAR['K500B-T']

// Rebar layout for RC section – 10Ø16 in two rows (5+5) at bottom of 300×500 section.
// c_nom = 26 mm, bar Ø = 16 mm, vertical clear c = 20 mm.
// Row 1 (bottom): y_centre = 26 + 8 = 34 mm  →  y = 34/500
// Row 2:          y_centre = 34 + 16 + 20 = 70 mm  →  y = 70/500
// x-positions (5 bars across b = 300 mm): 34, 92, 150, 208, 266 mm  →  divide by 300
const rebarXs = [34, 92, 150, 208, 266].map(x => x / 300)
const rebarsRC = [
  ...rebarXs.map(x => ({ x, y: 34 / 500 })),
  ...rebarXs.map(x => ({ x, y: 70 / 500 })),
]

// ── Calculation helpers ────────────────────────────────────────────────────────

function calcSteelDefl(p) {
  const G_k_balk = p.g * 9.81 / 1000                                   // kN/m
  const q_d      = G_k_balk + p.G_k_tak * p.s + p.psi2_snow * p.s_snow * p.s  // kN/m
  const EI       = p.E_steel * 1e6 * p.Iy * 1e-12                      // Nm² (E: MPa→Pa, I: mm⁴→m⁴)
  return (5 * q_d * 1e3 * Math.pow(p.L, 4)) / (384 * EI)              // m
}

function calcGlulamDefl(p) {
  const b_m   = p.b_gl / 1000
  const h_m   = p.h_gl / 1000
  const I     = (b_m * Math.pow(h_m, 3)) / 12                          // m⁴
  const G_k_balk = b_m * h_m * p.rho_mean_gl * 9.81 / 1000             // kN/m
  const q_d   = G_k_balk + p.G_k_tak * p.s + p.psi2_snow * p.s_snow * p.s  // kN/m
  const E_fin = p.E0mean * 1e6 / (1 + p.k_def)                         // Pa
  return (5 * q_d * 1e3 * Math.pow(p.L, 4)) / (384 * E_fin * I)       // m
}

function calcRCDefl(p) {
  // Load
  const G_k_balk = (p.b_btg / 1000) * (p.h_btg / 1000) * p.gamma_btg  // kN/m
  const q_d  = G_k_balk + p.G_k_tak * p.s + p.psi2_snow * p.s_snow * p.s  // kN/m (≈ 7.3)
  // Moment
  const M_Ed = q_d * 1e3 * Math.pow(p.L, 2) / 8                        // Nm
  // Cracking moment
  const W_y  = (p.b_btg / 1000) * Math.pow(p.h_btg / 1000, 2) / 6     // m³
  const M_cr = p.fctm * 1e6 * W_y                                       // Nm
  // Distribution coefficient ζ (β = 0.5 for long-term loading)
  const zeta = 1 - 0.5 * Math.pow(M_cr / M_Ed, 2)
  // Effective E modulus (creep)
  const E_c_eff = p.Ecm * 1e6 / (1 + p.phi_creep)                      // Pa
  // Stage I – uncracked
  const I_y  = (p.b_btg / 1000) * Math.pow(p.h_btg / 1000, 3) / 12    // m⁴
  const EI_I = E_c_eff * I_y                                            // Nm²
  // Stage II – cracked
  const A_s     = p.n_bars * Math.PI * Math.pow(p.phi_rebar, 2) / 4    // mm²
  const rho     = A_s / (p.b_btg * p.d_btg)                            // dimensionless
  const alpha_e = p.Es / (p.Ecm / (1 + p.phi_creep))                   // E_s/E_c,eff (both in MPa)
  const xi      = alpha_e * rho * (Math.sqrt(1 + 2 / (alpha_e * rho)) - 1)
  const d_m     = p.d_btg / 1000                                        // m
  const EI_II   = 0.5 * (p.b_btg / 1000) * Math.pow(d_m, 3) * xi * xi * E_c_eff * (1 - xi / 3)
  // Deflections
  const coeff  = 5 * q_d * 1e3 * Math.pow(p.L, 4) / 384
  const u_I    = coeff / EI_I
  const u_II   = coeff / EI_II
  return zeta * u_II + (1 - zeta) * u_I                                 // m
}

export const exercise39 = {
  id: 'ex39',
  title: 'Uppgift 39 – Nedböjning i bruksgränstillståndet',

  params: {
    // Common geometry & loads
    L: 12,               // m, spännvidd
    s: 5,                // m, s-avstånd (influensbredd)
    G_k_tak: 0.5,        // kN/m², karakteristisk egenlast tak
    s_snow: 1.2,         // kN/m², karakteristisk snölast
    psi2_snow: 0.2,      // ψ₂ för snö
    L_lim: 250,          // deformationskrav L/250

    // a) Stålbalk IPE 360 S235
    h_ipe: ipe360.h,     // 360 mm
    b_ipe: ipe360.b,     // 170 mm
    tf: ipe360.tf,       // 12.7 mm
    tw: ipe360.tw,       // 8.0 mm
    Iy: ipe360.Iy,       // 16270e4 mm⁴
    g: ipe360.g,         // 57.1 kg/m
    E_steel: steel.E,    // 210000 MPa

    // b) Limträ GL30c 140 × 720 mm², klimatklass 2
    b_gl: 140,           // mm
    h_gl: 720,           // mm
    E0mean: glulam.E0mean,       // 13000 MPa
    rho_mean_gl: glulam.rho_mean, // 500 kg/m³
    k_def: 0.8,          // klimatklass 2

    // c) Armerad betong 300 × 500 mm², 10Ø16, C30 + K500B-T
    b_btg: 300,          // mm
    h_btg: 500,          // mm
    d_btg: 450,          // mm, effektiv höjd (given)
    fctm: concrete.fctm, // 2.9 MPa
    Ecm: concrete.Ecm,   // 33000 MPa
    gamma_btg: 24,       // kN/m³
    phi_rebar: 16,       // mm, stångdiameter
    n_bars: 10,          // antal stänger
    Es: rebar.Es,        // 200000 MPa
    phi_creep: 2.2,      // kryptalet φ(∞, t₀)
  },

  problem: {
    description:
      'Kontrollera deformationerna för takbalken i bruksgränstillståndet för kvasi-permanent ' +
      'lastkombination. Deformationskrav: $L/250$. ' +
      'Takbalkarna ligger med s-avstånd på 5 m. Egentyngd tak: 0,5 kN/m². ' +
      'Karaktäristisk snölast: 1,2 kN/m², $\\psi_2 = 0{,}2$. ' +
      'Tre alternativ studeras: ' +
      'a) IPE 360 S235, ' +
      'b) Limträ GL30c, tvärsnitt 140 × 720 mm², klimatklass 2, ' +
      'c) Armerad betong, tvärsnitt 300 × 500 mm², 10 Ø16 (5+5), C30 + K500B-T.',

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
    ],
  },

  steps: [
    // ── a) Stålbalk IPE 360 S235 ───────────────────────────────────────────────
    {
      id: 'u_d_steel',
      title: 'a) Stålbalk IPE 360 S235 – Nedböjning',
      question:
        'Beräkna nedböjningen $u_d$ (mm) för IPE 360-balken under kvasi-permanent last ' +
        '($q_d = G_{k,balk} + G_{k,tak}\\cdot s + \\psi_2\\cdot s_{snow}\\cdot s$). ' +
        'Egentyngd: $G_{k,balk} = 57{,}1 \\cdot 9{,}81 / 1000 = 0{,}56$ kN/m. ' +
        'Kontrollera att $u_d \\leq L/250$.',

      figures: (p) => [
        {
          type: 'steel-section',
          props: { h: p.h_ipe, b: p.b_ipe, tf: p.tf, tw: p.tw },
        },
      ],

      answer: {
        label: 'u_d',
        unit: 'mm',
        getCorrect: (p) => parseFloat((calcSteelDefl(p) * 1000).toFixed(0)),
        hint: 'Använd balktabellen: $u_d = 5qL^4/(384EI)$. $I_y = 162{,}7 \\cdot 10^6$ mm⁴, $E = 210$ GPa.',
      },

      resultCheck: (p) => {
        const u_mm  = calcSteelDefl(p) * 1000
        const u_lim = p.L * 1000 / p.L_lim
        const ok    = u_mm <= u_lim
        return {
          ok,
          latex: `u_d = ${u_mm.toFixed(0)}\\ \\text{mm} ${ok ? '\\leq' : '>'} \\dfrac{L}{250} = ${u_lim.toFixed(0)}\\ \\text{mm} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        { text: 'Kvasi-permanent lastkombination (tabell 1.5, uttryck 6.16b):' },
        {
          latex: 'q_d = 1{,}0 \\cdot G_{k,j} + \\textstyle\\sum \\psi_{2,i} Q_{k,i}',
          latexBlock: true,
        },
        { text: 'Balkens egentyngd (ur ståltabell):' },
        {
          latex: 'G_{k,balk} = 57{,}1 \\cdot 9{,}81 / 1000 = 0{,}56\\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: '$G_{k,balk}$ är redan i kN/m och multipliceras inte med influensbredden.' },
        {
          latex: 'q_d = 0{,}56 + 0{,}5 \\cdot 5 + 0{,}2 \\cdot 1{,}2 \\cdot 5 = 4{,}26\\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: 'Dimensionerande nedböjning (enkelt upplagd balk, balktabellen):' },
        {
          latex: 'u_d = \\frac{5qL^4}{384EI} = \\frac{5 \\cdot 4{,}26 \\cdot 10^3 \\cdot 12^4}{384 \\cdot 210 \\cdot 10^9 \\cdot 162{,}7 \\cdot 10^{-6}} = 0{,}034\\ \\text{m}',
          latexBlock: true,
        },
        { text: 'Kontroll:' },
        {
          latex: '\\frac{L}{250} = \\frac{12}{250} = 0{,}048\\ \\text{m} \\geq 0{,}034\\ \\text{m} \\quad \\Rightarrow \\quad \\textbf{OK!}',
          latexBlock: true,
        },
      ],
    },

    // ── b) Limträ GL30c ────────────────────────────────────────────────────────
    {
      id: 'u_d_glulam',
      title: 'b) Limträ GL30c – Nedböjning med krypning',
      question:
        'Beräkna den slutliga nedböjningen $w_{fin}$ (mm) för limträbalken 140 × 720 mm² ' +
        'i klimatklass 2. Krypningen beaktas via den effektiva elasticitetsmodulen ' +
        '$E_{mean,fin} = E_{mean}/(1 + k_{def})$ med $k_{def} = 0{,}8$.',

      figures: (p) => [
        {
          type: 'glulam-section',
          props: { b: p.b_gl, h: p.h_gl },
        },
      ],

      answer: {
        label: 'w_{fin}',
        unit: 'mm',
        getCorrect: (p) => parseFloat((calcGlulamDefl(p) * 1000).toFixed(0)),
        hint: '$G_{k,balk} = 0{,}14\\cdot 0{,}72\\cdot 500\\cdot 9{,}81/1000 = 0{,}494$ kN/m. $E_{mean,fin} = 13000/1{,}8 = 7222$ MPa. $I = bh^3/12$.',
      },

      resultCheck: (p) => {
        const w_mm  = calcGlulamDefl(p) * 1000
        const u_lim = p.L * 1000 / p.L_lim
        const ok    = w_mm <= u_lim
        return {
          ok,
          latex: `w_{fin} = ${w_mm.toFixed(0)}\\ \\text{mm} ${ok ? '\\leq' : '>'} \\dfrac{L}{250} = ${u_lim.toFixed(0)}\\ \\text{mm} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        { text: 'Balkens egentyngd (densitet 500 kg/m³):' },
        {
          latex: 'G_{k,balk} = b \\cdot h \\cdot \\rho \\cdot g = 0{,}14 \\cdot 0{,}72 \\cdot 500 \\cdot 9{,}81 / 1000 = 0{,}494\\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: 'Kvasi-permanent dimensionerande last:' },
        {
          latex: 'q_d = 0{,}494 + 0{,}5 \\cdot 5 + 0{,}2 \\cdot 1{,}2 \\cdot 5 = 4{,}194\\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: 'Tröghetsmomentet:' },
        {
          latex: 'I_y = \\frac{bh^3}{12} = \\frac{0{,}14 \\cdot 0{,}72^3}{12} = 4{,}354 \\cdot 10^{-3}\\ \\text{m}^4',
          latexBlock: true,
        },
        { text: 'Klimatklass 2 → $k_{def} = 0{,}8$. Effektiv elasticitetsmodul med krypning:' },
        {
          latex: 'E_{mean,fin} = \\frac{E_{mean}}{1 + k_{def}} = \\frac{13\\,000}{1 + 0{,}8} = 7222\\ \\text{MPa}',
          latexBlock: true,
        },
        { text: 'Slutlig nedböjning ($w_{net,fin} = w_{fin}$, ingen välvning):' },
        {
          latex: 'w_{fin} = \\frac{5 q_d L^4}{384\\, E_{mean,fin}\\, I} = \\frac{5 \\cdot 4{,}194 \\cdot 10^3 \\cdot 12^4}{384 \\cdot 7222 \\cdot 10^6 \\cdot 4{,}354 \\cdot 10^{-3}} = 0{,}036\\ \\text{m}',
          latexBlock: true,
        },
        { text: 'Kontroll:' },
        {
          latex: '\\frac{L}{250} = 0{,}048\\ \\text{m} \\geq 0{,}036\\ \\text{m} \\quad \\Rightarrow \\quad \\textbf{OK!}',
          latexBlock: true,
        },
      ],
    },

    // ── c) Armerad betong ──────────────────────────────────────────────────────
    {
      id: 'u_d_btg',
      title: 'c) Armerad betong – Nedböjning med sprickbildning',
      question:
        'Beräkna nedböjningen $u_d$ (mm) för den armerade betongbalken ' +
        '(300 × 500 mm², 10 Ø16, $d = 450$ mm, C30). ' +
        'Interpolera mellan stadium I (osprucket) och stadium II (sprucket) med ' +
        'fördelningskoefficienten $\\zeta$ (RoF 3.10.1.2). ' +
        'Kryptalet: $\\varphi(\\infty,t_0) = 2{,}2$ (fyrsidig uttorkning, pålastning efter 28 dagar, cementtyp N).',

      figures: (p) => [
        {
          type: 'rect-section',
          props: {
            b: p.b_btg,
            h: p.h_btg,
            rebars: rebarsRC,
            fillColor: '#e8e8e8',
          },
        },
      ],

      answer: {
        label: 'u_d',
        unit: 'mm',
        getCorrect: (p) => parseFloat((calcRCDefl(p) * 1000).toFixed(0)),
        hint: 'Beräkna $q_d$, $M_{Ed}$, $M_{cr}$, $\\zeta$, $E_{c,eff}$, $(EI)_I$, $(EI)_{II}$. Sedan $u_d = \\zeta\\,u_{II} + (1-\\zeta)\\,u_I$.',
      },

      resultCheck: (p) => {
        const u_mm  = calcRCDefl(p) * 1000
        const u_lim = p.L * 1000 / p.L_lim
        const ok    = u_mm <= u_lim
        return {
          ok,
          latex: `u_d = ${u_mm.toFixed(0)}\\ \\text{mm} ${ok ? '\\leq' : '>'} \\dfrac{L}{250} = ${u_lim.toFixed(0)}\\ \\text{mm} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!} — \\text{balken klarar inte kravet!}'}`,
        }
      },

      solution: [
        { text: 'Egentyngd balk och kvasi-permanent dimensionerande last:' },
        {
          latex: 'G_{k,balk} = 0{,}3 \\cdot 0{,}5 \\cdot 24 = 3{,}6\\ \\text{kN/m}',
          latexBlock: true,
        },
        {
          latex: 'q_d = 3{,}6 + 0{,}5 \\cdot 5 + 0{,}2 \\cdot 1{,}2 \\cdot 5 = 7{,}3\\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: 'Dimensionerande moment i mittspan:' },
        {
          latex: 'M_{Ed} = \\frac{qL^2}{8} = \\frac{7{,}3 \\cdot 10^3 \\cdot 12^2}{8} = 131{,}4\\ \\text{kNm}',
          latexBlock: true,
        },
        { text: 'Spricklast (böjmotstånd för osprucket tvärsnitt):' },
        {
          latex: 'M_{cr} = f_{ctm} \\cdot W_y = 2{,}9 \\cdot 10^6 \\cdot \\frac{0{,}3 \\cdot 0{,}5^2}{6} = 36{,}25\\ \\text{kNm}',
          latexBlock: true,
        },
        { text: '$M_{Ed} > M_{cr}$ → tvärsnittet spricker. Fördelningskoefficient ($\\beta = 0{,}5$ för långtidslast):' },
        {
          latex: '\\zeta = 1 - \\beta \\left(\\frac{M_{cr}}{M_{Ed}}\\right)^{\\!2} = 1 - 0{,}5 \\cdot \\left(\\frac{36{,}25}{131{,}4}\\right)^{\\!2} = 0{,}96',
          latexBlock: true,
        },
        { text: 'Kryptalet ($h_0 = 2A_c/u = 187{,}5$ mm, $t_0 = 28$ dagar):' },
        {
          latex: '\\varphi(\\infty,t_0) = 2{,}2 \\quad (\\text{RoF figur 3.1})',
          latexBlock: true,
        },
        { text: 'Effektiv elasticitetsmodul (inkl. krypning):' },
        {
          latex: 'E_{c,eff} = \\frac{E_{cm}}{1 + \\varphi} = \\frac{33}{1 + 2{,}2} = 10{,}3\\ \\text{GPa}',
          latexBlock: true,
        },
        { text: 'Stadium I – osprucket tvärsnitt:' },
        {
          latex: '(EI)_I = E_{c,eff} \\cdot I_y = 10{,}3 \\cdot 10^9 \\cdot \\frac{0{,}3 \\cdot 0{,}5^3}{12} = 32{,}19 \\cdot 10^6\\ \\text{Nm}^2',
          latexBlock: true,
        },
        { text: 'Stadium II – sprucket tvärsnitt. Armeringsandel och modulkvot:' },
        {
          latex: '\\rho = \\frac{A_s}{b\\,d} = \\frac{10\\pi\\,(16^2/4)}{300 \\cdot 450} = 0{,}01489',
          latexBlock: true,
        },
        {
          latex: '\\alpha_e = \\frac{E_s}{E_{c,eff}} = \\frac{200}{10{,}3} = 19{,}42',
          latexBlock: true,
        },
        { text: 'Neutralaxelns relativa läge i stadium II:' },
        {
          latex: '\\xi = \\alpha_e\\,\\rho\\!\\left(\\sqrt{1 + \\dfrac{2}{\\alpha_e\\,\\rho}} - 1\\right) = 0{,}524',
          latexBlock: true,
        },
        {
          latex: '(EI)_{II} = 0{,}5\\,b\\,d^3\\,\\xi^2\\,E_{c,eff}\\!\\left(1 - \\frac{\\xi}{3}\\right) = 31{,}9 \\cdot 10^6\\ \\text{Nm}^2',
          latexBlock: true,
        },
        { text: 'Nedböjning i stadium I respektive stadium II:' },
        {
          latex: 'u_{d,I} = \\frac{5qL^4}{384(EI)_I} = \\frac{5 \\cdot 7{,}3 \\cdot 10^3 \\cdot 12^4}{384 \\cdot 32{,}19 \\cdot 10^6} = 61{,}2\\ \\text{mm}',
          latexBlock: true,
        },
        {
          latex: 'u_{d,II} = \\frac{5qL^4}{384(EI)_{II}} = \\frac{5 \\cdot 7{,}3 \\cdot 10^3 \\cdot 12^4}{384 \\cdot 31{,}9 \\cdot 10^6} = 61{,}8\\ \\text{mm}',
          latexBlock: true,
        },
        { text: 'Total nedböjning (interpolering med fördelningskoefficienten):' },
        {
          latex: 'u_d = \\zeta\\,u_{d,II} + (1 - \\zeta)\\,u_{d,I} = 0{,}96 \\cdot 61{,}8 + 0{,}04 \\cdot 61{,}2 = 62\\ \\text{mm}',
          latexBlock: true,
        },
        { text: 'Kontroll:' },
        {
          latex: '\\frac{L}{250} = 48\\ \\text{mm} < 62\\ \\text{mm} \\quad \\Rightarrow \\quad \\textbf{Ej OK! — Balken klarar inte kravet!}',
          latexBlock: true,
        },
      ],
    },
  ],
}
