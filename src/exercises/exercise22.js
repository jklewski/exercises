import { CONCRETE, REBAR } from '../data/materials.js'
import { beamSolverDSM } from '../utils/beamSolverDSM.js'

export const exercise22 = {
  id: 'ex22',
  title: 'Uppgift 22 – Böjarmeringsplacering och dimensionering',

  derive: (p) => {
    const { fcd, fck } = CONCRETE[p.grade]
    const { fyd, Es }  = REBAR[p.rebar]

    // ── Three normalised beam cases for theory step ──────────────────────
    // (unit load/UDL — only the shape matters)
    const beam_ss   = beamSolverDSM({
      spans: [1], supports: ['pin', 'pin'],
      pointLoads: [{ x: 0.5, P: 1 }],
    })
    const beam_cont = beamSolverDSM({
      spans: [1, 1], supports: ['pin', 'pin', 'pin'],
      udls: [1, 1],
    })
    const beam_cant = beamSolverDSM({
      spans: [1], supports: ['fixed', 'free'],
      pointLoads: [{ x: 1, P: 1 }],
    })

    // ── Part b: design reinforcement ─────────────────────────────────────
    const M_Ed    = p.q_d * p.L ** 2 / 8    // kNm, simply supported UDL
    const A_bar   = Math.PI * (p.phi / 2) ** 2
    const c_nom   = Math.max(10, p.phi) + 10
    const d       = p.h - c_nom - p.phi / 2

    // Solve 0.32·fcd·b·x² − 0.8·fcd·b·d·x + M_Ed·10⁶ = 0
    const A_ =  0.32 * fcd * p.b
    const B_ = -0.8  * fcd * p.b * d
    const C_ =  M_Ed * 1e6                  // kNm → N·mm
    const x  = (-B_ - Math.sqrt(B_ ** 2 - 4 * A_ * C_)) / (2 * A_)

    const eps_s  = 3.5e-3 * (d - x) / x
    const eps_sy = fyd / Es
    const sigma_s = Math.min(eps_s * Es, fyd)

    const As_req = fcd * 0.8 * x * p.b / fyd
    const n_bars = Math.ceil(As_req / A_bar)
    const As_prov = n_bars * A_bar

    return {
      fcd, fck, fyd, Es,
      c_nom, d, A_bar, eps_sy,
      beam_ss, beam_cont, beam_cant,
      M_Ed, x, eps_s, sigma_s, As_req, n_bars, As_prov,
    }
  },

  params: {
    L:     10,         // m
    q_d:   30,         // kN/m (design load)
    b:     400,        // mm
    h:     800,        // mm
    phi:   20,         // mm
    grade: 'C20',
    rebar: 'K500B-T',
  },

  problem: {
    description: (p) =>
      `Armerad betongbalk, fritt upplagd, spannvidd $L = ${p.L}$ m. ` +
      `Tvärsnitt: $b = ${p.b}$ mm, $h = ${p.h}$ mm. ` +
      `Betong ${p.grade} och armering K500B-T, Ø${p.phi} mm. ` +
      `Dimensionerande last: $q_d = ${p.q_d}$ kN/m.`,

    figures: (p) => [
      {
        type: 'beam',
        props: {
          L: p.L,
          supports: { left: 'pin', right: 'roller' },
          loads: [{ type: 'udl', label: `q_d = ${p.q_d} kN/m` }],
        },
      },
      {
        type: 'rect-section',
        props: { b: p.b, h: p.h, fillColor: '#d1dce8' },
      },
    ],
  },

  steps: [
    // ── Step b: design ───────────────────────────────────────────────────────
    {
      id: 'n_bars',
      title: 'b) Erforderlig underkantsarmering',
      question: (p) =>
        `Beräkna erforderligt antal stänger Ø${p.phi} i underkant för $q_d = ${p.q_d}$ kN/m.`,
      answer: {
        label: 'n',
        unit: 'st',
        getCorrect: (p) => p.n_bars,
        hint: (p) =>
          `Beräkna $M_{Ed} = q_d L^2/8$, lös $x$ ur momentjämvikt och kontrollera att armeringen flyter. ` +
          `$A_{s,req} = f_{cd}\\cdot 0.8x\\cdot b / f_{yd}$, antal = $\\lceil A_{s,req}/A_{bar}\\rceil$.`,
      },
      solution: [
        {
          latex: (p) =>
            `M_{Ed} = \\frac{q_d L^2}{8} = \\frac{${p.q_d}\\cdot ${p.L}^2}{8} = ${p.M_Ed.toFixed(0)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Täckskikt: $c_{nom} = \\max(10,\\,${p.phi})+10 = ${p.c_nom}$ mm. Effektiv höjd (ett lager armering):`,
        },
        {
          latex: (p) =>
            `d = ${p.h} - ${p.c_nom} - \\tfrac{${p.phi}}{2} = ${p.d}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          text: 'Anta normalarmerat tvärsnitt och lös tryckzonshöjd ur momentjämvikt $M_{Ed} = f_{cd}\\cdot 0.8x\\cdot b(d-0.4x)$:',
        },
        {
          latex: (p) =>
            `${p.fcd}\\cdot 0.8x\\cdot ${p.b}\\cdot(${p.d}-0.4x) = ${p.M_Ed.toFixed(0)}\\cdot 10^6 \\quad\\Rightarrow\\quad x = ${p.x.toFixed(0)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\varepsilon_s = 3.5\\cdot\\frac{${p.d}-${p.x.toFixed(0)}}{${p.x.toFixed(0)}} = ${(p.eps_s * 1000).toFixed(1)}\\ \\text{‰} \\gg \\varepsilon_{sy} = ${(p.eps_sy * 1000).toFixed(2)}\\ \\text{‰} \\quad\\Rightarrow\\quad \\sigma_s = f_{yd}\\quad\\checkmark`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `A_{s,req} = \\frac{f_{cd}\\cdot 0.8x\\cdot b}{f_{yd}} = \\frac{${p.fcd}\\cdot 0.8\\cdot ${p.x.toFixed(0)}\\cdot ${p.b}}{${p.fyd}} = ${p.As_req.toFixed(0)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `n = \\left\\lceil\\frac{${p.As_req.toFixed(0)}}{\\pi\\cdot ${p.phi/2}^2}\\right\\rceil = ` +
            `\\left\\lceil\\frac{${p.As_req.toFixed(0)}}{${p.A_bar.toFixed(0)}}\\right\\rceil = ${p.n_bars}` +
            `\\quad\\Rightarrow\\quad ${p.n_bars}\\phi${p.phi}:\\ A_s = ${p.As_prov.toFixed(0)}\\ \\text{mm}^2 \\geq ${p.As_req.toFixed(0)}\\ \\text{mm}^2\\quad\\checkmark`,
          latexBlock: true,
        },
        {
          figure: (p) => ({
            type: 'concrete-uls',
            props: {
              b: p.b, h: p.h, cover: p.c_nom,
              n_bot: p.n_bars, dia_bot: p.phi,
              fc: p.fcd, fy: p.fyd,
            },
          }),
        },
      ],
    },

    // ── Step a: theory ───────────────────────────────────────────────────────
    {
      id: 'theory',
      title: 'a) Böjarmeringsplacering',
      question:
        'I vilka zoner behövs böjarmering i de tre konstruktionstyperna nedan? ' +
        'Motivera med momentdiagram.',

      figures: () => [
        {
          type: 'beam',
          props: {
            supports: { left: 'pin', right: 'roller' },
            loads: [{ type: 'point', x: 0.5, label: 'P' }],
            scale: 0.52, showDimension: false,
          },
        },
        {
          type: 'beam',
          props: {
            L: 2,
            supports: { left: 'pin', right: 'pin' },
            loads: [{ type: 'udl', label: 'q' }],
            intermediateSupports: [0.5],
            scale: 0.52, showDimension: false,
          },
        },
        {
          type: 'beam',
          props: {
            supports: { left: 'fixed', right: 'free' },
            loads: [{ type: 'point', x: 1.0, label: 'P' }],
            scale: 0.52, showDimension: false,
          },
        },
      ],

      solution: [
        {
          text:
            'Armering placeras alltid på **dragsidan** – sidan med dragspänningar, ' +
            'som sammanfaller med den konvexa sidan av böjkurvan. ' +
            'Positivt (saggande) moment → drag i underkant. ' +
            'Negativt (hoggande) moment → drag i överkant.',
        },

        { text: '**1. Fritt upplagd balk med punktlast i mitten** – positivt moment i hela spannet → **armering i underkant**:' },
        { figure: () => ({ type: 'beam', props: { supports: { left: 'pin', right: 'roller' }, loads: [{ type: 'point', x: 0.5, label: 'P' }], rebarBot: true, showDimension: false } }) },
        { figure: (p) => ({ type: 'moment-diagram', props: { precomputed: p.beam_ss, showShear: false, showPeakAnnotations: false } }) },

        { text: '**2. Kontinuerlig tvåspannsbalk med jämnlast** – positivt moment i fälten (underkant), negativt vid mittstödet (överkant) → **armering i underkant i fälten och i överkant vid mittstödet**:' },
        { figure: () => ({ type: 'beam', props: { L: 2, supports: { left: 'pin', right: 'pin' }, loads: [{ type: 'udl', label: 'q' }], intermediateSupports: [0.5], rebarBot: [{ xStart: 0, xEnd: 0.42 }, { xStart: 0.58, xEnd: 1 }], rebarTop: [{ xStart: 0.38, xEnd: 0.62 }], showDimension: false } }) },
        { figure: (p) => ({ type: 'moment-diagram', props: { precomputed: p.beam_cont, showShear: false, showPeakAnnotations: false } }) },

        { text: '**3. Konsol / pelare med last vid fria änden** – negativt moment längs hela längden, max vid inspänningen → **dragsidan är på den sida varifrån lasten verkar; armering placeras i överkant (närmast lasten)**:' },
        { figure: () => ({ type: 'beam', props: { supports: { left: 'fixed', right: 'free' }, loads: [{ type: 'point', x: 1.0, label: 'P' }], rebarTop: true, showDimension: false } }) },
        { figure: (p) => ({ type: 'moment-diagram', props: { precomputed: p.beam_cant, showShear: false, showPeakAnnotations: false } }) },
      ],
    },
  ],
}
