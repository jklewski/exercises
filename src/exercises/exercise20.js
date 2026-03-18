import { TIMBER, LOAD_FACTORS, SAFETY_CLASS } from '../data/materials.js'
import { beamSolverDSM } from '../utils/beamSolverDSM.js'

// Standard heights (mm) for 45 mm wide konstruktionsvirke (tabell 4.15)
const STANDARD_H_MM = [70, 95, 120, 145, 170, 195, 220, 245]

export const exercise20 = {
  id: 'ex20',
  title: 'Uppgift 20 – Dimensionering av golvbalkar',

  derive: (p) => {
    const timber   = TIMBER[p.grade]
    const f_mk     = timber.fmk                     // MPa
    const gamma_M  = timber.gamma_M                 // 1.3
    const k_mod    = 0.8                             // medellång last, klimatklass 1
    const f_md     = k_mod * f_mk / gamma_M         // MPa
    const gamma_d  = SAFETY_CLASS[p.safetyClass]    // 0.91 for klass 2
    const gamma_G  = LOAD_FACTORS.STR_B.gamma_G     // 1.2
    const gamma_Q  = LOAD_FACTORS.STR_B.gamma_Q     // 1.5


    // Line load on one beam [kN/m] = area load × influence width (= c/c)
    const q_d = gamma_d * (gamma_G * p.g_k * p.ccBeam + gamma_Q * p.q_k * p.ccBeam)

    // Solve beam and read design moment as max|M(x)| from the distribution
    const beamDiagram = p.continuous
      ? beamSolverDSM({ spans: [p.span, p.span], supports: ['pin', 'pin', 'pin'], udls: [q_d, q_d] })
      : beamSolverDSM({ spans: [p.span],          supports: ['pin', 'pin'],         udls: [q_d]      })

    const M_d = beamDiagram.peaks.Mmax   // kNm

    // Required section modulus [m³]:  W = M_d [kNm·10³ Nm] / f_md [MPa·10⁶ N/m²]
    const W_req = (M_d * 1e3) / (f_md * 1e6)

    // Required height [m]: W_y = b·h²/6  →  h = √(6·W_req / b)
    const h_req_m  = Math.sqrt(6 * W_req / p.b)
    const h_req_mm = h_req_m * 1000

    // Round up to nearest standard dimension
    const h_std = STANDARD_H_MM.find(h => h >= h_req_mm) ?? STANDARD_H_MM.at(-1)

    // Actual section modulus and moment capacity (for check)
    const W_std  = p.b * (h_std / 1000) ** 2 / 6     // m³
    const M_Rd   = f_md * 1e6 * W_std / 1e3          // kNm

    return {
      f_mk, gamma_M, k_mod, f_md,
      gamma_d, gamma_G, gamma_Q,
      q_d, M_d,
      W_req, h_req_mm, h_std,
      W_std, M_Rd,
      beamDiagram,
    }
  },

  params: {
    span:        3.5,   // beam span, m
    ccBeam:      0.6,   // c/c beam spacing, m
    b:           0.045, // beam width, m
    g_k:         0.6,   // characteristic dead load (incl. beams), kN/m²
    q_k:         2.0,   // characteristic live load (residential floor), kN/m²
    grade:       'C24', // timber grade
    safetyClass: 2,     // safety class
    continuous:  false, // true = 2-span continuous over centre wall
  },

  problem: {
    description: (p) => [
      'Mellanbjälklaget i ett tvåvånings bostadshus skall utföras med golvbalkar av konstruktionsvirke. ' +
      (p.continuous
        ? 'Balkarna är kontinuerliga över hjärtväggen och bildar ett tvåspanns system. '
        : 'Balkarna är fritt upplagda och är avskurna vid hjärtväggen. '
      ) +
      'Dimensionera balkarna för uppkommande moment i brottgränstillståndet. ' +
      'Balkarna är stagade mot vippning. Egentyngd golv är $g_k = 0{,}6$ kN/m² (inklusive balkarna).',
      'c/c-avstånd mellan balkarna är 600 mm. Välj virkeskvalitet C24 och dimensionerna för ' +
      'säkerhetsklass 2. Balkarna skall ha bredden 45 mm.',
    ],

    figures: (p) => [
      {
        type: 'ex20-plan',
        props: {
          span:       p.span,
          ccBeam:     p.ccBeam,
          continuous: p.continuous,
        },
      },
    ],

  },

  steps: [
    {
      id: 'moment',
      title: 'a) Dimensionerande moment',
      question: (p) =>
        'Beräkna det dimensionerande momentet $M_d$ (kNm). ',
      answer: {
        label: 'M_d',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_d.toFixed(2)),
        hint: (p) => p.continuous
          ? 'Beräkna $q_d = \\gamma_d(\\gamma_G g_k + \\gamma_Q q_k)\\cdot c/c$, sedan stödmomentet $M_d = q_d L^2 / 8$.'
          : 'Beräkna $q_d = \\gamma_d(\\gamma_G g_k + \\gamma_Q q_k)\\cdot c/c$, sedan $M_d = q_d L^2 / 8$.',
      },
      solution: [

        {
          text: (p) =>
            `Säkerhetsklass ${p.safetyClass} → $\\gamma_d = ${p.gamma_d}$. ` +
            `Lastkombination STR-B, nyttig last som ensam variabel:`,
        },
        {
          latex: (p) =>
            `q_d = \\gamma_d\\bigl(${p.gamma_G}\\cdot g_k\\cdot c/c + ${p.gamma_Q}\\cdot q_{k,NL}\\cdot c/c\\bigr)`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `q_d = ${p.gamma_d}\\bigl(${p.gamma_G}\\cdot${p.g_k}\\cdot${p.ccBeam} + ${p.gamma_Q}\\cdot${p.q_k}\\cdot${p.ccBeam}\\bigr) = ${p.q_d.toFixed(2)}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        {
          text: (p) => p.continuous
            ? 'Balken är kontinuerlig med två lika spännvidd och symmetrisk last. ' +
              'Stödmomentet över hjärtväggen bestäms ur tredjemomentssatsen och ger:'
            : 'Fritt upplagd balk med jämnt fördelad last:',
        },
        {
          latex: (p) => p.continuous ? `M_B = -\\frac{q_d L^2}{8}` : null,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_d = \\max|M(x)| = ${p.M_d.toFixed(2)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          figure: (p) => ({
            type: 'moment-diagram',
            props: {
              precomputed: p.beamDiagram,
              showShear: true,
            },
          }),
        },
      ],
    },

    {
      id: 'dimension',
      title: 'b) Erforderlig balkdimension',
      question:
        'Bestäm erforderlig balkdimension. Balkbredden är $b = 45$ mm. ' +
        'Välj en standarddimension ur tabell 4.15 ($h$ i mm).',
      answer: {
        label: 'h',
        unit: 'mm',
        getCorrect: (p) => p.h_std,
        hint: 'Ställ upp villkoret $M_{Rd} \\geq M_d$ och lös ut $h$. ' +
              '$M_{Rd} = f_{md}\\cdot W_y\\cdot k_{crit}$, där $W_y = bh^2/6$.',
      },
      solution: [
                {
          text: (p) =>
            `C${p.grade.slice(1)} → $f_{mk} = ${p.f_mk}$ MPa. ` +
            `Klimatklass 1, medellång lastvaraktighet → $k_{mod} = ${p.k_mod}$. ` +
            `Stagad mot vippning → $k_{crit} = 1$.`,
        },
        {
          latex: (p) =>
            `f_{md} = \\frac{k_{mod}\\cdot f_{mk}}{\\gamma_M} = \\frac{${p.k_mod}\\cdot${p.f_mk}}{${p.gamma_M}} = ${p.f_md.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        {
          text: () => 'Momentkapacitet: $M_{Rd} = f_{md}\\cdot W_y\\cdot k_{crit}$. Villkor $M_{Rd} \\geq M_d$:',
        },
        {
          latex: (p) =>
            `${p.f_md.toFixed(2)}\\cdot 10^6 \\cdot \\frac{${p.b * 1000}\\cdot h^2}{6\\cdot 10^9} \\cdot 1 \\geq ${p.M_d.toFixed(2)}\\cdot 10^3`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `h \\geq \\sqrt{\\frac{6\\cdot M_d}{f_{md}\\cdot b}} = \\sqrt{\\frac{6\\cdot${p.M_d.toFixed(2)}\\cdot 10^3}{${p.f_md.toFixed(2)}\\cdot 10^6\\cdot${p.b}}} = ${p.h_req_mm.toFixed(0)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Närmaste standarddimension (tabell 4.15): $h = ${p.h_std}$ mm. ` +
            `Vald dimension: **${Math.round(p.b * 1000)} × ${p.h_std} mm**.`,
        },
        {
          latex: (p) =>
            `M_{Rd} = ${p.f_md.toFixed(2)}\\cdot 10^6 \\cdot \\frac{${Math.round(p.b*1000)}\\cdot${p.h_std}^2}{6\\cdot 10^9} = ${p.M_Rd.toFixed(2)}\\ \\text{kNm} \\geq ${p.M_d.toFixed(2)}\\ \\text{kNm}\\ ✓`,
          latexBlock: true,
        },
      ],
    },
  ],
}
