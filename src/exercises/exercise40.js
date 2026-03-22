import { TIMBER } from '../data/materials.js'
import { beamSolverDSM } from '../utils/beamSolverDSM.js'

// Standard section heights (mm) for 45 mm wide konstruktionsvirke (tabell 4.15)
const STANDARD_H_MM = [70, 95, 120, 145, 170, 195, 220, 245]

export const exercise40 = {
  id: 'ex40',
  title: 'Uppgift 40 – Golvbalkar, bruksgränstillståndet',

  derive: (p) => {
    const timber  = TIMBER[p.grade]
    const E0mean  = timber.E0mean                        // 11 000 MPa

    // Line loads per beam [kN/m]
    const q_kar   = (p.G_k + p.q_k) * p.s               // characteristic  (6.14b)
    const q_kp    = (p.G_k + p.psi2 * p.q_k) * p.s      // quasi-permanent (6.16b)
    const delta_q = q_kar - q_kp                         // additional load [kN/m]

    // Required section height from additional deflection limit δ ≤ L / defl_lim
    // δ = 5 Δq L⁴ / (384 EI)  with  EI [kNm²] = E0mean[MPa]·10³ · b·h³/12
    // → h³ = 5 Δq L⁴ · 12 / (384 · E0mean·10³ · b · L/defl_lim)
    const L_lim      = p.L / p.defl_lim                  // m  (= 7 mm)
    const h_req_cubed = (5 * delta_q * Math.pow(p.L, 4) * 12) /
                        (384 * E0mean * 1e3 * p.b * L_lim)
    const h_req_mm   = Math.pow(h_req_cubed, 1 / 3) * 1000
    const h_std      = STANDARD_H_MM.find(h => h >= h_req_mm) ?? STANDARD_H_MM.at(-1)

    // Bending stiffness of chosen section
    const I_std   = p.b * Math.pow(h_std / 1000, 3) / 12  // m⁴
    const EI_kNm2 = E0mean * 1e3 * I_std                   // kNm²

    // Actual additional deflection – always via DSM so we get the deflection diagram.
    // For continuous beam: Δq on span 1 only (worst case for mid-span deflection).
    const beamSol = beamSolverDSM({
      spans:    p.continuous ? [p.L, p.L] : [p.L],
      supports: p.continuous ? ['pin', 'pin', 'pin'] : ['pin', 'pin'],
      udls:     p.continuous ? [delta_q, 0] : [delta_q],
      EI:       EI_kNm2,
    })
    const delta_actual_mm = (beamSol.peaks?.vmax ?? 0) * 1000

    return {
      E0mean,
      q_kar, q_kp, delta_q,
      L_lim_mm: L_lim * 1000,
      h_req_mm, h_std,
      I_std, EI_kNm2,
      delta_actual_mm,
      beamSol,
    }
  },

  params: {
    L:          3.5,    // m, spännvidd per fack
    s:          0.6,    // m, c/c-avstånd
    b:          0.045,  // m, balkbredd (45 mm)
    G_k:        0.6,    // kN/m², karakteristisk egenlast golv (inkl. balkar)
    q_k:        2.0,    // kN/m², karakteristisk nyttig last
    psi2:       0.3,    // ψ₂ för bostäder
    grade:      'C24',  // virkeskvalitet
    k_def:      0.6,    // klimatklass 1, konstruktionsvirke (tabell 4.14)
    defl_lim:   500,    // kravet: L/500
    continuous: true,  // true = kontinuerlig balk över hjärtväggen
  },

  problem: {
    description: (p) =>
      'Mellanbjälklaget i ett tvåvånings bostadshus skall utföras med golvbalkar av konstruktionsvirke C24. ' +
      (p.continuous
        ? 'Balkarna är kontinuerliga över hjärtväggen och bildar ett tvåspannssystem. '
        : 'Balkarna är fritt upplagda och avskurna vid hjärtväggen. '
      ) +
      'Egentyngd golv (inklusive balkarna): $G_k = 0{,}6$ kN/m². ' +
      'c/c-avstånd $s = 600$ mm, balkbredd $b = 45$ mm, spännvidd $L = 3{,}5$ m. ' +
      'Nyttig last: $q_k = 2{,}0$ kN/m², $\\psi_2 = 0{,}3$. ' +
      'Dimensionera balken så att tilläggsdeformationen (karakteristisk − kvasi-permanent last) ' +
      'uppfyller kravet $\\delta_{tillägg} \\leq L/500$.',

    figures: (p) => [
      {
        type: 'ex20-plan',
        props: { span: p.L, ccBeam: p.s, continuous: p.continuous },
      },
    ],
  },

  steps: [
    // ── Steg 1: Tilläggslast ──────────────────────────────────────────────────
    {
      id: 'delta_q',
      title: 'Steg 1 – Tilläggslast $\\Delta q$',
      question: (p) =>
        'Beräkna tilläggslasten $\\Delta q$ (kN/m) per balk, dvs. skillnaden mellan ' +
        'karakteristisk och kvasi-permanent lastkombination. ' +
        'c/c-avstånd $s = 0{,}6$ m, $G_k = 0{,}6$ kN/m², $q_k = 2{,}0$ kN/m², $\\psi_2 = 0{,}3$.',

      figures: (p) => [
        {
          type: 'beam',
          props: {
            L: p.continuous ? p.L * 2 : p.L,
            supports: { left: 'pin', right: 'roller' },
            intermediateSupports: p.continuous ? [0.5] : [],
            divisions: p.continuous ? [p.L, p.L] : null,
            loads: [
              { type: 'udl', label: 'Δq', xStart: 0, xEnd: p.continuous ? 0.5 : 1 },
            ],
          },
        },
      ],

      answer: {
        label: '\\Delta q',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(p.delta_q.toFixed(2)),
        hint: (p) =>
          '$q_{kar} = (G_k + Q_k)\\cdot s$, $q_{kp} = (G_k + \\psi_2 Q_k)\\cdot s$, $\\Delta q = q_{kar} - q_{kp}$.',
      },

      solution: [
        { text: 'Karakteristisk lastkombination (tabell 1.5, uttryck 6.14b):' },
        {
          latex: (p) =>
            `q_{d,kar} = 1{,}0\\,G_k\\cdot s + 1{,}0\\,Q_k\\cdot s = ${p.G_k}\\cdot${p.s} + ${p.q_k}\\cdot${p.s} = ${p.q_kar.toFixed(2)}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        { text: 'Kvasi-permanent lastkombination (uttryck 6.16b):' },
        {
          latex: (p) =>
            `q_{d,kp} = 1{,}0\\,G_k\\cdot s + \\psi_2\\,Q_k\\cdot s = ${p.G_k}\\cdot${p.s} + ${p.psi2}\\cdot${p.q_k}\\cdot${p.s} = ${p.q_kp.toFixed(2)}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        { text: 'Tilläggslast (den del av lasten som tillkommer utöver långtidslasten):' },
        {
          latex: (p) =>
            `\\Delta q = q_{d,kar} - q_{d,kp} = ${p.q_kar.toFixed(2)} - ${p.q_kp.toFixed(2)} = ${p.delta_q.toFixed(2)}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            p.continuous
              ? 'För den kontinuerliga balken placeras tilläggslasten $\\Delta q$ på ett spann — det ger störst nedböjning i det belastade spannet.'
              : 'Tilläggsdeformationen beräknas med $E_{0,mean}$ (oreducerad elasticitetsmodul), inte $E_{mean,fin}$.',
        },
      ],
    },

    // ── Steg 2: Böjstyvhet – erforderlig dimension ────────────────────────────
    {
      id: 'h_std',
      title: 'Steg 2 – Böjstyvhet $EI$ och erforderlig dimension',
      question: (p) =>
        'Bestäm erforderlig balkdimension (mm) ur kravet $\\delta_{tillägg} \\leq L/500$. ' +
        'Använd $E_{0,mean} = 11\\,000$ MPa och $I_y = bh^3/12$. ' +
        'Välj en standarddimension ur tabell 4.15 (höjd $h$ i mm, bredd $b = 45$ mm).',

      answer: {
        label: 'h',
        unit: 'mm',
        getCorrect: (p) => p.h_std,
        hint: (p) =>
          `Sätt $\\delta = 5\\,\\Delta q\\,L^4/(384\\,EI) \\leq L/500$ och lös ut $h$. ` +
          `$h_{req} \\approx ${p.h_req_mm.toFixed(0)}$ mm — välj närmaste standardhöjd.`,
      },

      solution: [
        { text: 'Kravet $\\delta_{tillägg} \\leq L/500$, med $\\delta = 5\\Delta q L^4/(384EI)$ och $I = bh^3/12$:' },
        {
          latex: (p) =>
            `\\frac{5\\,\\Delta q\\,L^4}{384\\,E_{0,mean}\\,\\frac{b\\,h^3}{12}} \\leq \\frac{L}{${p.defl_lim}}`,
          latexBlock: true,
        },
        { text: 'Lös ut $h$:' },
        {
          latex: (p) =>
            `h \\geq \\left(\\frac{5\\,\\Delta q\\,L^4\\cdot 12}{384\\,E_{0,mean}\\cdot b\\cdot \\dfrac{L}{${p.defl_lim}}}\\right)^{\\!1/3}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `h \\geq \\left(\\frac{5\\cdot${p.delta_q.toFixed(2)}\\cdot10^3\\cdot${p.L}^4\\cdot 12}{384\\cdot${p.E0mean}\\cdot10^6\\cdot${p.b}\\cdot${(p.L/p.defl_lim).toFixed(4)}}\\right)^{1/3} = ${p.h_req_mm.toFixed(0)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Närmaste standarddimension ur tabell 4.15: **$h = ${p.h_std}$ mm** → välj $45 \\times ${p.h_std}$ mm².`,
        },
        {
          latex: (p) => {
            const I = (p.b * Math.pow(p.h_std / 1000, 3) / 12)
            return `I_y = \\frac{${Math.round(p.b*1000)}\\cdot${p.h_std}^3}{12} = ${(I*1e6).toFixed(0)}\\cdot10^{-6}\\ \\text{m}^4`
          },
          latexBlock: true,
        },
        {
          latex: (p) =>
            `EI = ${p.E0mean}\\cdot10^6\\cdot${(p.I_std*1e6).toFixed(0)}\\cdot10^{-6} = ${(p.EI_kNm2).toFixed(1)}\\ \\text{kNm}^2`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 3: Tilläggsdeformation ───────────────────────────────────────────
    {
      id: 'delta_actual',
      title: 'Steg 3 – Tilläggsdeformation med vald dimension',
      question: (p) =>
        'Beräkna den faktiska tilläggsdeformationen $\\delta_{tillägg}$ (mm) för den valda ' +
        `dimensionen $45 \\times ${p.h_std}$ mm². ` +
        (p.continuous
          ? 'Tilläggslasten $\\Delta q$ placeras på ett spann — det ger störst nedböjning.'
          : 'Kontrollera att $\\delta_{tillägg} \\leq L/500$.'),

      answer: {
        label: '\\delta_{tillägg}',
        unit: 'mm',
        getCorrect: (p) => parseFloat(p.delta_actual_mm.toFixed(1)),
        hint: (p) =>
          p.continuous
            ? 'Använd DSM eller korrektionsfaktorer för kontinuerlig balk med last på ett spann.'
            : `$\\delta = 5\\Delta q L^4/(384EI)$ med $EI = ${p.EI_kNm2.toFixed(1)}$ kNm².`,
      },

      resultCheck: (p) => {
        const ok = p.delta_actual_mm <= p.L_lim_mm
        return {
          ok,
          latex:
            `\\delta_{tillägg} = ${p.delta_actual_mm.toFixed(1)}\\ \\text{mm} ` +
            `${ok ? '\\leq' : '>'} \\dfrac{L}{500} = ${p.L_lim_mm.toFixed(0)}\\ \\text{mm}` +
            `\\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        {
          text: (p) =>
            p.continuous
              ? 'Kontinuerlig balk med $\\Delta q$ på ett spann, $0$ på det andra (ogynnsam lastplacering för nedböjning i belastat spann):'
              : 'Enkelt upplagd balk med tilläggslast $\\Delta q$:',
        },
        {
          latex: (p) =>
            p.continuous
              ? `\\delta_{tillägg} = ${p.delta_actual_mm.toFixed(1)}\\ \\text{mm}`
              : `\\delta_{tillägg} = \\frac{5\\,\\Delta q\\,L^4}{384\\,EI} = \\frac{5\\cdot${p.delta_q.toFixed(2)}\\cdot10^3\\cdot${p.L}^4}{384\\cdot${p.EI_kNm2.toFixed(1)}\\cdot10^3} = ${p.delta_actual_mm.toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Kontroll:' },
        {
          latex: (p) =>
            `\\frac{L}{500} = \\frac{${p.L * 1000}}{500} = ${p.L_lim_mm.toFixed(0)}\\ \\text{mm} ` +
            `${p.delta_actual_mm <= p.L_lim_mm ? '\\geq' : '<'} ${p.delta_actual_mm.toFixed(1)}\\ \\text{mm}` +
            `\\quad \\Rightarrow \\quad ${p.delta_actual_mm <= p.L_lim_mm ? '\\textbf{OK!}' : '\\textbf{Ej OK!}'}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Vald dimension: $45 \\times ${p.h_std}$ mm² uppfyller kravet $\\delta_{tillägg} \\leq L/500 = ${p.L_lim_mm.toFixed(0)}$ mm.`,
        },
        {
          figure: (p) => ({
            type: 'moment-diagram',
            props: { precomputed: p.beamSol, showMoment: false, showDeflection: true },
          }),
        },
      ],
    },
  ],
}
