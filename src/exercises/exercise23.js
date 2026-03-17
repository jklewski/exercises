import { CONCRETE, REBAR } from '../data/materials.js'
import { solveBeam }       from '../utils/beamSolver.js'

const concrete = CONCRETE['C30']    // fck=30, fcd=20
const rebar    = REBAR['K500B-T']   // fyd=435



// ─── Figure specs reused in solutions ────────────────────────────────────────

const momentDiagramFigure = (p) => ({
  type: 'moment-diagram',
  props: {
    L:          p.L,
    udl:        [{ q: p.q_d / 1e3 }],                                      // N/m → kN/m
    pointLoads: p.pointLoads.map(({ P, x }) => ({ P: P / 1e3, x })),       // N → kN
    showShear:  true,
  },
})

export const exercise23 = {
  id: 'ex23',
  title: 'Uppgift 23 – Böjmomentsdimensionering, armerad betong',

  // All intermediate results computed once and merged into p
  derive: (p) => {
    // ── Loads & moment via general beam solver (SI: N/m, N → N·m) ──────
    const { R_A, M_max } = solveBeam({
      L:          p.L,
      udl:        [{ q: p.q_d }],
      pointLoads: p.pointLoads,
    })
    const M_Ed = M_max   // N·m (governing design moment)

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
    L:    9,        // m
    q_d:  20e3,     // N/m, dimensionerande jämnlast
    pointLoads: [   // { P: N, x: m }
      { P: 75e3, x: 3 },

    ],
    // Tvärsnitt
    b:    500/1000,    // mm
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

    figures: (p) => [
      {
        type: 'beam',
        props: {
          L: p.L,
          supports: { left: 'pin', right: 'roller' },
          loads: [
            { type: 'udl', label: `q_d = ${p.q_d / 1e3} kN/m` },
            ...p.pointLoads.map(({ P, x }) => ({
              type: 'point',
              label: `${P / 1e3} kN`,
              x: x / p.L,
            })),
          ],
          divisions: (() => {
            const xs = [0, ...p.pointLoads.map(pl => pl.x), p.L]
            return xs.slice(1).map((x, i) => x - xs[i])
          })(),
        },
      },
      {
        type: 'rect-section',
        props: {
          b: p.b * 1000,
          h: p.h * 1000,
          fillColor: '#e8e8e8',
        },
      },
    ],
  },

  steps: [

    // ── Step 1 ───────────────────────────────────────────────────────────────
    {
      id: 'M_Ed',
      title: 'Dimensionerande moment',
      question:
        'Beräkna det dimensionerande böjmomentet $M_{Ed,max}$ (kNm). ',
      answer: {
        label: 'M_{Ed,max}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_Ed_kNm.toFixed(1)),
      },
      solution: [
        {
          text: 'Använd momentjämvikt och sedan kraftjämvikt för att beräkna stödreaktioner. "Följ lasten" för att härleda tvärkraftsdiagrammet, och integrera sedan för att få momentdiagram. Största moment måste vara antingen under en punktlast eller i mitten (där utbredd last ger max).'
        },
        

        { figure: (p) => momentDiagramFigure(p) },
      ],
    },

    // ── Step 2 ───────────────────────────────────────────────────────────────
    {
      id: 'x_na',
      title: 'Tryckzonens höjd x',
      question:
        'Beräkna tryckzonens höjd $x$ (mm) med hjälp av momentjämvikt. ',
      answer: {
        label: 'x',
        unit: 'mm',
        getCorrect: (p) => parseFloat(p.x_na_mm.toFixed(0)),
        hint: 'Utgå från momentjämvikt $M_{Ed}$ = $f_{cd}b\\cdot0.8x(d-0.4x)$',
      },
      solution: [
        { text: 'Beräkna dimensionerande materialegenskaper:' },
        {
          latex: (p) =>
            `f_{cd} = \\frac{f_{ck}}{\\gamma_m} = \\frac{${p.fck}}{1.5} = ${p.fcd} \\ \\text{MPa}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `f_{yd} = \\frac{f_{yk}}{\\gamma_m} = \\frac{${p.fyk}}{1.0} = ${p.fyd} \\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Effektiv höjd (ett lager armering):' },
        {
          latex: (p) =>
            `d = h - c_{nom} - \\frac{\\phi}{2} = ${(p.h*1000).toFixed(0)} - ${(p.c_nom*1000).toFixed(0)} - ${(p.phi*1000/2).toFixed(0)} = ${p.d_mm} \\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Momentjämvikt ger andragradsekvation i x:' },
        {
          latex: (p) => [
            `M_{Ed} = \\underbrace{f_{cd} \\cdot b \\cdot 0.8x}_{F_c} \\cdot \\underbrace{(d-0.4x)}_{z}`,
            `${p.M_Ed_kNm.toFixed(1)} \\cdot 10^6 = ${p.fcd} \\cdot ${(p.b*1000).toFixed(0)} \\cdot 0.8x \\cdot (${p.d_mm} - 0.4x)`,
           `\\Rightarrow\\quad x = ${p.x_na_mm.toFixed(0)} \\ \\text{mm}`,
          ],
          latexBlock: true,
        },
      ],
    },

    // ── Step 3 ───────────────────────────────────────────────────────────────
    {
      id: 'A_s',
      title: 'Erforderlig armeringsarea',
      question: 'Beräkna erforderlig armeringsarea $A_s$ (mm²).',
      answer: {
        label: 'A_{s,req}',
        unit: 'mm²',
        getCorrect: (p) => parseFloat(p.A_s_req_mm2.toFixed(0)),
      },
      resultCheck: (p) => {
        const n_bars  = p.n_bars
        const phi_mm  = p.phi * 1000
        const A_s_sel = n_bars * Math.PI * phi_mm ** 2 / 4   // mm²
        const ok      = A_s_sel >= p.A_s_req_mm2
        return {
          ok,
          latex:
            `A_{s,req} = ${p.A_s_req_mm2.toFixed(0)} \\ \\text{mm}^2 \\rightarrow ` +
            `\\text{Välj } ${n_bars}\\phi${phi_mm.toFixed(0)}{:} \\ A_s = ${A_s_sel.toFixed(0)} \\ \\text{mm}^2 ` +
            `${ok ? '\\geq' : '<'} A_{s,req} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },
      solution: [
        { text: 'Kontrollera spänning i armeringen vid ULS:' },
        {
          latex: (p) => [
            `\\sigma_s = \\min \\begin{cases} E_s \\cdot \\varepsilon_{cu} \\cdot \\dfrac{d-x}{x} \\\\ f_{yd} \\end{cases}`,
            `= \\min \\begin{cases} 200\\,000 \\cdot 3.5 \\cdot \\dfrac{${p.d_mm}-${p.x_na_mm.toFixed(0)}}{${p.x_na_mm.toFixed(0)}} = ${(p.sigma_s/1e6).toFixed(0)} \\ \\text{MPa} \\\\ ${p.fyd} \\ \\text{MPa} \\end{cases}`,
            `\\Rightarrow\\quad \\sigma_s = ${(p.sigma_s/1e6).toFixed(0)} \\ \\text{MPa}`,
          ],
          latexBlock: true,
        },
        { text: 'Erforderlig armeringsarea från kraftjämvikt:' },
        {
          latex: (p) =>
            `A_{s,req} = \\frac{f_{cd} \\cdot b \\cdot 0.8x}{\\sigma_s} = \\frac{${p.fcd} \\cdot ${(p.b*1000).toFixed(0)} \\cdot 0.8 \\cdot ${p.x_na_mm.toFixed(0)}}{${(p.sigma_s/1e6).toFixed(0)}} = ${p.A_s_req_mm2.toFixed(0)} \\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          text: (p) => `Välj ${p.n_bars}Ø${(p.phi*1000).toFixed(0)}:`,
        },
        {
          latex: (p) => {
            const phi_mm  = p.phi * 1000
            const A_s_sel = p.n_bars * Math.PI * phi_mm ** 2 / 4
            return (
              `A_s = ${p.n_bars} \\cdot \\frac{\\pi \\cdot ${phi_mm.toFixed(0)}^2}{4} = ${A_s_sel.toFixed(0)} \\ \\text{mm}^2` +
              ` \\geq ${p.A_s_req_mm2.toFixed(0)} \\ \\text{mm}^2 \\quad \\Rightarrow \\textbf{OK!}`
            )
          },
          latexBlock: true,
        },
        { text: 'Spänningsfördelning med vald armering (tryckzonen något större pga upprundat antal stänger):' },
        {
          figure: (p) => ({
            type: 'concrete-uls',
            props: {
              b:       p.b     * 1000,
              h:       p.h     * 1000,
              cover:   p.c_nom * 1000,
              n_bot:   p.n_bars,
              dia_bot: p.phi   * 1000,
              fc:      p.fcd,
              fy:      p.fyd,
            },
          }),
        },
      ],
    },
  ],
}
