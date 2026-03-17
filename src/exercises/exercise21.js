/**
 * Exercise 21 – Limträbalk med utskjut, dimensionering av tvärsnittshöjd och max punktlast
 *
 * Beam layout:
 *   Pin support A at x = 0
 *   Roller support B at x = L  (= 10 m)
 *   Free tip C at x = L + a    (= 12 m)
 *
 * Loads (part a):  UDL q_d (kN/m) over the entire beam
 * Loads (part b):  q_d + point load F_d at C (unknown, what we solve for)
 *
 * Steps:
 *   1. Find governing design moment M_d (kNm) – compare span vs support at B
 *   2. Find required cross-section height h (mm) – pick standard dimension
 *   3. Find max F_d (kN) at C using the section from step 2
 *
 * Fully parametric: change L, a, q_d, b, f_mk, k_mod, gamma_M to regenerate.
 */

// Standard glulam heights (mm), SS-EN 14080 / Tabell 4.16
const GL_STANDARD_H = [90, 115, 140, 165, 180, 215, 240, 270, 315, 360, 405, 450, 495, 540, 585, 630]

export const exercise21 = {
  id: 'ex21',
  title: 'Uppgift 21 – Limträbalk med utskjut, böjdimensionering',

  params: {
    L:       10,    // m    – spännvidd (A till B)
    a:       2,     // m    – utskjutande del (B till C)
    q_d:     1.7,   // kN/m – dimensionerande jämnt fördelad last
    b:       90,    // mm   – balkbredd
    f_mk:    30,    // MPa  – karakteristisk böjhållfasthet (GL30c)
    k_mod:   0.8,   //      – modifieringsfaktor (klimatklass 2, lasttyp M, tabell 4.12)
    gamma_M: 1.25,  //      – materialsäkerhetsfaktor (tabell 4.2)
  },

  derive: (p) => {
    const Ltot = p.L + p.a

    // ── Part a: reactions and moments (F_d = 0) ──────────────────────────
    // Moment equilibrium about A:  R_B · L = q_d · Ltot · (Ltot/2)
    const R_B = p.q_d * Ltot * (Ltot / 2) / p.L
    const R_A = p.q_d * Ltot - R_B

    // Support moment at B (cut from right, just before B)
    const M_B = p.q_d * p.a ** 2 / 2                      // kNm, hogging at B

    // Span moment: V(x) = 0 → x₀ = R_A / q_d
    const x_0    = R_A / p.q_d
    const M_span = R_A * x_0 - p.q_d * x_0 ** 2 / 2      // kNm, max sagging in span

    // Governing design moment
    const M_d = Math.max(M_span, M_B)

    // ── Material strength (part a, no size effect) ────────────────────────
    const f_md = p.k_mod * p.f_mk / p.gamma_M              // MPa

    // ── Required height and standard dimension ────────────────────────────
    // M_d ≤ f_md · (b·h²/6) → h ≥ sqrt(6·M_d·1e6 / (f_md·b))
    const h_req = Math.sqrt(6 * M_d * 1e6 / (f_md * p.b)) // mm
    const h_std = GL_STANDARD_H.find(h => h >= h_req) ?? 630 // mm, standard dim.

    // ── Part b: size factor and updated capacity ──────────────────────────
    const k_h    = Math.min(Math.pow(600 / h_std, 0.1), 1.1)
    const f_md_b = p.k_mod * p.f_mk * k_h / p.gamma_M     // MPa
    const W_y    = p.b * h_std ** 2 / 6                    // mm³
    const M_Rd   = f_md_b * W_y / 1e6                      // kNm

    // Max F_d: M at B = F_d·a + q_d·a²/2 ≤ M_Rd  → solve for F_d
    const F_d_max = (M_Rd - p.q_d * p.a ** 2 / 2) / p.a   // kN

    return {
      Ltot, R_A, R_B,
      x_0, M_span, M_B, M_d,
      f_md, h_req, h_std,
      k_h, f_md_b, W_y, M_Rd, F_d_max,
    }
  },

  problem: {
    description:
      'En vippningsförhindrad limträbalk (GL30c) är upplagd med ett fast lager i A och ett rörligt ' +
      'lager i B, med ett utskjut till den fria änden C. Bredden b = 90 mm, klimatklass 2, lasttyp M. ' +
      'a) Bestäm erforderlig tvärsnittshöjd när F_d = 0. ' +
      'b) Vilket värde får F_d högst ha (hållfasthet i stödsnittet B)? Använd tvärsnittet från a).',

    figures: (p) => [
      {
        type: 'beam',
        props: {
          L: p.L,
          overhang: p.a,
          supports: { left: 'pin', right: 'roller' },
          loads: [
            { type: 'udl',   label: `q_d = ${p.q_d} kN/m` },
            { type: 'point', label: 'F_d', x: 1.0 },
          ],
        },
      },
    ],


  },

  steps: [
    // ── Step 1: governing design moment ──────────────────────────────────────
    {
      id: 'M_d',
      title: 'Dimensionerande moment (del a)',
      question:
        'Bestäm det dimensionerande momentet M_d (kNm) när F_d = 0. ' +
        'Jämför det maximala fältmomentet (snitta i spannet) med stödmomentet vid B (snitta från höger). ' +
        'Vilket kontrollerar?',

      answer: {
        label: 'M_d',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_d.toFixed(1)),
        hint:
          'Momentjämvikt kring A → R_B. Kraftjämvikt → R_A. ' +
          'Fältmoment (V = 0 vid x₀ = R_A/q): M_sp = R_A·x₀ – q·x₀²/2. ' +
          'Stödmoment: M_B = q·a²/2. Välj det större.',
      },

      solution: [
        { text: 'Momentjämvikt kring A (positiv rotation medsols):' },
        {
          latex: (p) =>
            `R_B \\cdot L = q_d \\cdot \\frac{L_{tot}^2}{2}` +
            ` = ${p.q_d} \\cdot \\frac{${p.Ltot}^2}{2}` +
            ` = ${(p.q_d * p.Ltot ** 2 / 2).toFixed(1)} \\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `R_B = \\frac{${(p.q_d * p.Ltot ** 2 / 2).toFixed(1)}}{${p.L}}` +
            ` = ${p.R_B.toFixed(2)} \\ \\text{kN}`,
          latexBlock: true,
        },
        { text: 'Kraftjämvikt i vertikalled:' },
        {
          latex: (p) =>
            `R_A = q_d \\cdot L_{tot} - R_B` +
            ` = ${p.q_d} \\cdot ${p.Ltot} - ${p.R_B.toFixed(2)}` +
            ` = ${p.R_A.toFixed(2)} \\ \\text{kN}`,
          latexBlock: true,
        },
        { text: 'Stödmoment vid B – snitta från höger, precis före stöd B:' },
        {
          latex: (p) =>
            `M_B = \\frac{q_d \\cdot a^2}{2}` +
            ` = \\frac{${p.q_d} \\cdot ${p.a}^2}{2}` +
            ` = ${p.M_B.toFixed(1)} \\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Fältmoment – maxvärde där tvärkraften är noll:' },
        {
          latex: (p) =>
            `x_0 = \\frac{R_A}{q_d} = \\frac{${p.R_A.toFixed(2)}}{${p.q_d}}` +
            ` = ${p.x_0.toFixed(2)} \\ \\text{m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{sp} = R_A \\cdot x_0 - \\frac{q_d \\cdot x_0^2}{2}` +
            ` = ${p.R_A.toFixed(2)} \\cdot ${p.x_0.toFixed(2)}` +
            ` - \\frac{${p.q_d} \\cdot ${p.x_0.toFixed(2)}^2}{2}` +
            ` = ${p.M_span.toFixed(1)} \\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{sp} = ${p.M_span.toFixed(1)} \\ \\text{kNm}` +
            ` \\;>\\; M_B = ${p.M_B.toFixed(1)} \\ \\text{kNm}` +
            ` \\quad \\Rightarrow \\quad M_d = M_{sp} = ${p.M_d.toFixed(1)} \\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Moment- och tvärkraftslinje (F_d = 0):' },
        {
          figure: (p) => ({
            type: 'moment-diagram',
            props: {
              L: p.L,
              overhang: p.a,
              supports: { left: 'pin', right: 'roller' },
              udl: [{ q: p.q_d, xStart: 0, xEnd: p.Ltot }],
              pointLoads: [],
              showShear: true,
            },
          }),
        },
      ],
    },

    // ── Step 2: required cross-section height ─────────────────────────────────
    {
      id: 'h_std',
      title: 'Erforderlig tvärsnittshöjd (del a)',
      question:
        'Beräkna den erforderliga höjden h (mm) och välj standarddimension från tabell 4.16. ' +
        'Vippning är förhindrad (k_crit = 1). Ange vald standardhöjd.',

      answer: {
        label: 'h',
        unit: 'mm',
        getCorrect: (p) => p.h_std,
        hint:
          'f_md = k_mod · f_mk / γ_M. ' +
          'M_Rd = f_md · W_y · k_crit ≥ M_d, där W_y = b·h²/6. ' +
          'Lös ut h och runda upp till närmaste standardmått.',
      },

      solution: [
        { text: 'Dimensionerande böjhållfasthet (vippningsförhindrad → k_crit = 1):' },
        {
          latex: (p) =>
            `f_{md} = \\frac{k_{mod} \\cdot f_{mk}}{\\gamma_M}` +
            ` = \\frac{${p.k_mod} \\cdot ${p.f_mk}}{${p.gamma_M}}` +
            ` = ${p.f_md.toFixed(1)} \\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Krav M_d ≤ M_Rd = f_md · W_y, med W_y = b·h²/6:' },
        {
          latex: (p) =>
            `${p.M_d.toFixed(3)} \\cdot 10^6 \\ \\text{N·mm}` +
            ` \\leq ${p.f_md.toFixed(1)} \\cdot \\frac{${p.b} \\cdot h^2}{6}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `h \\geq \\sqrt{\\frac{6 \\cdot ${p.M_d.toFixed(3)} \\cdot 10^6}` +
            `{${p.f_md.toFixed(1)} \\cdot ${p.b}}}` +
            ` = ${p.h_req.toFixed(1)} \\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\text{Standarddimension (tabell 4.16):}` +
            ` \\quad \\boxed{h = ${p.h_std} \\ \\text{mm}}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 3: max point load F_d ────────────────────────────────────────────
    {
      id: 'F_d',
      title: 'Maximal punktlast F_d (del b)',
      question:
        'Bestäm det maximala värdet på F_d (kN) vid den fria änden C. ' +
        'Det dimensionerande snittet är stödsnittet B. ' +
        'Beakta storlekseffekten k_h. Använd h = 270 mm från del a).',

      answer: {
        label: 'F_d',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.F_d_max.toFixed(1)),
        hint:
          'k_h = min((600/h)^0,1 ; 1,1). ' +
          'M_Rd = f_md·W_y (med k_h inräknad). ' +
          'M vid B = F_d·a + q_d·a²/2 ≤ M_Rd → lös ut F_d.',
      },

      solution: [
        { text: 'Storlekseffekt (h < 600 mm, avsnitt 4.2.1):' },
        {
          latex: (p) =>
            `k_h = \\min\\!\\left(\\left(\\frac{600}{h}\\right)^{0{,}1},\\; 1{,}1\\right)` +
            ` = \\min\\!\\left(\\left(\\frac{600}{${p.h_std}}\\right)^{0{,}1},\\; 1{,}1\\right)` +
            ` = ${p.k_h.toFixed(3)}`,
          latexBlock: true,
        },
        { text: 'Uppdaterad dimensionerande böjhållfasthet:' },
        {
          latex: (p) =>
            `f_{md} = \\frac{k_{mod} \\cdot f_{mk} \\cdot k_h}{\\gamma_M}` +
            ` = \\frac{${p.k_mod} \\cdot ${p.f_mk} \\cdot ${p.k_h.toFixed(3)}}{${p.gamma_M}}` +
            ` = ${p.f_md_b.toFixed(1)} \\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Böjmotstånd och momentkapacitet för h = 270 mm:' },
        {
          latex: (p) =>
            `W_y = \\frac{b \\cdot h^2}{6}` +
            ` = \\frac{${p.b} \\cdot ${p.h_std}^2}{6}` +
            ` = ${Math.round(p.W_y)} \\ \\text{mm}^3`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Rd} = f_{md} \\cdot W_y` +
            ` = ${p.f_md_b.toFixed(1)} \\cdot ${Math.round(p.W_y)} \\cdot 10^{-6}` +
            ` = ${p.M_Rd.toFixed(2)} \\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Stödmoment vid B med F_d vid C (snitta från höger):' },
        {
          latex: (p) =>
            `M_B = F_d \\cdot a + \\frac{q_d \\cdot a^2}{2}` +
            ` = ${p.a} F_d + \\frac{${p.q_d} \\cdot ${p.a}^2}{2}` +
            ` = ${p.a} F_d + ${p.M_B.toFixed(1)}`,
          latexBlock: true,
        },
        { text: 'Krav M_B ≤ M_Rd, lös ut F_d:' },
        {
          latex: (p) =>
            `${p.a} F_d + ${p.M_B.toFixed(1)} \\leq ${p.M_Rd.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `F_d \\leq \\frac{${p.M_Rd.toFixed(2)} - ${p.M_B.toFixed(1)}}{${p.a}}` +
            ` = \\frac{${(p.M_Rd - p.M_B).toFixed(2)}}{${p.a}}` +
            ` = ${p.F_d_max.toFixed(1)} \\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\boxed{F_d = ${p.F_d_max.toFixed(1)} \\ \\text{kN}}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
