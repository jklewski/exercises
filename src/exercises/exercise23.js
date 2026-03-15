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
    // ── Loads & moment (N, m → N·m) ────────────────────────────────────
    const R_A    = (p.q_d * p.L + 2 * p.P_d) / 2
    const x_beam = p.L / 2
    const M_Ed   = R_A * x_beam - (p.q_d * x_beam ** 2) / 2 - p.P_d * (x_beam - p.x1)  // N·m

    // ── Section geometry (m) ────────────────────────────────────────────
    const d = p.h - p.c_nom - p.phi / 2   // m

    // ── Material properties in Pa ───────────────────────────────────────
    const fcd_Pa = p.fcd * 1e6   // MPa → Pa
    const fyd_Pa = p.fyd * 1e6
    const Es_Pa  = p.Es  * 1e6

    // ── Neutral axis from rectangular stress block (all SI: Pa, m, N·m) ─
    // M_Ed = fcd · b · 0.8x · (d − 0.4x)  →  A·x² + B·x + C = 0
    const A_q   =  0.32 * fcd_Pa * p.b
    const B_q   = -0.8  * fcd_Pa * p.b * d
    const C_q   =  M_Ed
    const disc  = Math.sqrt(B_q ** 2 - 4 * A_q * C_q)
    const x_na1 = (-B_q - disc) / (2 * A_q)
    const x_na2 = (-B_q + disc) / (2 * A_q)
    const x_na  = [x_na1, x_na2].find(x => x > 0 && x < d)   // m

    // ── Steel strain and stress at ULS ──────────────────────────────────
    const eps_s   = 3.5e-3 * (d - x_na) / x_na
    const sigma_s = Math.min(Es_Pa * eps_s, fyd_Pa)            // Pa

    // ── Required steel area (m²) ────────────────────────────────────────
    const A_s_req = fcd_Pa * p.b * 0.8 * x_na / sigma_s        // m²

    // ── Convenient display units ────────────────────────────────────────
    const M_Ed_kNm    = M_Ed   / 1e3    // N·m  → kNm
    const d_mm        = d      * 1e3    // m    → mm
    const x_na_mm     = x_na   * 1e3   // m    → mm
    const A_s_req_mm2 = A_s_req * 1e6  // m²   → mm²
    const n_bars = Math.ceil(A_s_req / ((p.phi/2)**2 * 3.14))
    return {
      R_A, M_Ed, M_Ed_kNm,
      d, d_mm,
      x_na, x_na_mm, x_na1, x_na2,
      A_q, B_q, C_q,
      eps_s, sigma_s,
      A_s_req, A_s_req_mm2,
      n_bars,
    }
  },

  params: {
    L:    9,      // m, spännvidd
    P_d:  75e3,     // kN, dimensionerande punktlast
    q_d:  20e3,     // kN/m, dimensionerande jämnlast (inkl. egentyngd)
    x1:   3,      // m, position för vänster punktlast
    x2:   6,      // m, position för höger punktlast
    // Tvärsnitt
    b:    350/1000,    // mm
    h:    650/1000,    // mm
    phi:  16/1000,     // mm, armeringsdiameter
    c_nom: 26/1000,    // m, nominellt täckskikt
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
props: (p) => ({
  b: p.b * 1000,
  h: p.h * 1000,
  fillColor: '#e8e8e8',
}),
      },
    ],
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
        getCorrect: (p) => parseFloat(p.M_Ed_kNm.toFixed(1)),
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
        getCorrect: (p) => parseFloat(p.A_s_req_mm2.toFixed(0)),
        hint: 'μ = M_Ed/(b·d²·f_cd). ω = 1 − √(1−2μ). A_s = ω·b·d·f_cd / f_yd.',
      },
      resultCheck: (p) => {
        const n_bars    = p.n_bars
        const phi_mm    = p.phi * 1000
        const A_s_sel   = n_bars * Math.PI * phi_mm ** 2 / 4   // mm²
        const ok        = A_s_sel >= p.A_s_req_mm2
        return {
          ok,
          latex:
            `A_{s,req} = ${p.A_s_req_mm2.toFixed(0)} \\ \\text{mm}^2 \\rightarrow ` +
            `\\text{Välj } ${p.n_bars}\\phi ${phi_mm}{:} \\ A_s = ${A_s_sel.toFixed(0)} \\ \\text{mm}^2 ` +
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
        { text: 'Använd momentjämvikt för att beräkna storlek på tryckzonen:' },
        {
          latex: (p) => [
            `M_{Ed} = \\underbrace{f_{cd} \\cdot b \\cdot 0.8x}_{kraft} \\underbrace{(d-0.4x)}_{hävarm} `,
            `${p.M_Ed.toFixed(0)} = ${p.fcd} \\cdot ${p.b} \\cdot ${0.8} \\cdot x \\cdot (${p.d} - 0.4${p.x_na.toFixed(0)})`,
            `\\Rightarrow x = ${(p.x_na*1000).toFixed(0)} mm`],
          latexBlock: true,
        },
        {text: 'Kontrollera nu spänning i armeringen:'},
        {
          latex: (p) => [`\\sigma_s = \\min \\begin{cases}  E_s\\varepsilon_{cu} \\frac{d-x}{x} \\\\ f_{yd} \\end{cases}`,
            `\\sigma_s = \\min \\begin{cases}  200 \\cdot 10^9 \\cdot 3.5 \\frac{${(p.d*1000).toFixed(0)}-${(p.x_na*1000).toFixed(0)}}{${(p.x_na*1000).toFixed(0)}} =${((200 * 3.5 * p.d-p.x_na)/p.x_na).toFixed(0)} \\text{ MPa}\\\\ ${p.fyd} \\text{ MPa} \\end{cases}`,
            `\\Rightarrow\\sigma_s = ${p.sigma_s/1e6} \\text{ MPa}`           
          ],
           
          latexBlock: true,
        },

        { text: 'Erforderlig armeringsarea:' },

        {
          text: (p) => `Välj ${p.n_bars}Ø${p.phi}:`,
        },

          {
            latex: (p) => {
            const n_bars  = p.n_bars
            const A_s_sel = n_bars * Math.PI * p.phi ** 2 / 4
            return (
              `A_s = ${n_bars} \\cdot \\frac{\\pi \\cdot ${p.phi*1000}^2}{4} = ${n_bars} \\cdot ${(Math.PI * p.phi*1000 ** 2 / 4).toFixed(0)} = ${(A_s_sel*1000000).toFixed(0)} \\ \\text{mm}^2 ` +
              `\\geq ${(p.A_s_req*1e6).toFixed(0)} \\ \\text{mm}^2 \\quad \\Rightarrow \\textbf{OK!}`
            )
            
          },
          latexBlock: true,
        },
        {text: 'Om man räknar ut spänningsfördelning med vald armering så får man en något större tryckzon och kapacitet, eftersom man avrundade antal armeringsstänger uppåt. Jämför bilden nedan med dina beräkningar och reflektera kring dina beräkningar:'},
          {
    figure: (p) => ({
      type: 'concrete-uls',
      props: {
        b:       p.b     * 1000,       // m → mm
        h:       p.h     * 1000,       // m → mm
        cover:   p.c_nom * 1000,       // m → mm
        n_bot:   p.n_bars,
        dia_bot: p.phi   * 1000,       // m → mm
        fc:      p.fcd,                // MPa (as-is)
        fy:      p.fyd,                // MPa (as-is)
      },
    }),
  },
      ],
    },
  ],
}
