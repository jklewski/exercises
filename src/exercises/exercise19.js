/**
 * Exercise 19 – Welded steel I-beam, moment capacity and design load
 *
 * Cross-section:  welded plate girder (I-section)
 *   Web:     hw × tw = 620 × 6 mm
 *   Flanges: bf × tf = 200 × 10 mm
 *   Welds:   throat a = 5 mm  →  leg R = a√2 = 5√2 mm
 *   Total height: h = hw + 2·tf = 640 mm
 *
 * Beam: simply supported, span L = 15 m, UDL q_d (unknown, solve for it)
 * Material: S275, f_y = 275 MPa, γ_M0 = 1.0
 *
 * Steps:
 *   1. Cross-section classification (web and flange) → class 3
 *   2. Moment of inertia, elastic section modulus, M_Rd
 *   3. Maximum design load q_d from M_d = q_d·L²/8 ≤ M_Rd
 *
 * Parametric: change hw, tw, bf, tf, a, f_y, L in `params`.
 */
export const exercise19 = {
  id: 'ex19',
  title: 'Uppgift 19 – Svetsad stålbalk, böjkapacitet och dimensionerande last',

  params: {
    hw:      620,   // mm  – livhöjd
    tw:      6,     // mm  – livtjocklek
    bf:      200,   // mm  – flänsbredd
    tf:      10,    // mm  – flänsplåttjocklek
    a:       5,     // mm  – svetsens a-mått (strupyta)
    f_y:     275,   // MPa – sträckgräns S275
    gamma_M0: 1.0,  //     – materialsäkerhetsfaktor för tvärsnittsbärförmåga
    L:       15,    // m   – spännvidd
  },

  derive: (p) => {
    const h     = p.hw + 2 * p.tf                      // mm, total height
    const R     = p.a * Math.SQRT2                     // mm, weld leg = a√2
    const eps   = Math.sqrt(235 / p.f_y)               // slenderness parameter ε

    // ── Cross-section classification ─────────────────────────────────────
    // Web (bending): c = hw − 2R, t = tw
    const c_web  = p.hw - 2 * R
    const ct_web = c_web / p.tw

    // Flange outstand (compression): c = bf/2 − tw/2 − R, t = tf
    const c_fl   = p.bf / 2 - p.tw / 2 - R
    const ct_fl  = c_fl / p.tf

    // Class limits (bending web; compression flange outstand)
    const webClass = ct_web <= 72 * eps ? 1
                   : ct_web <= 83 * eps ? 2
                   : ct_web <= 124 * eps ? 3 : 4
    const flClass  = ct_fl  <= 9  * eps ? 1
                   : ct_fl  <= 10 * eps ? 2
                   : ct_fl  <= 21 * eps ? 3 : 4

    const section_class = Math.max(webClass, flClass)   // governing class

    // ── Moment of inertia (subtraction method) ────────────────────────────
    const I_y = p.bf * h ** 3 / 12 - (p.bf - p.tw) * p.hw ** 3 / 12  // mm⁴

    // ── Elastic section modulus ───────────────────────────────────────────
    const W_y = I_y / (h / 2)                           // mm³

    // ── Moment capacity (class 3 → elastic) ──────────────────────────────
    const M_Rd = W_y * p.f_y / p.gamma_M0 / 1e6        // kNm

    // ── Design load from M_d = q·L²/8 ────────────────────────────────────
    const q_d = 8 * M_Rd / p.L ** 2                     // kN/m

    return {
      h, R, eps,
      c_web, ct_web, c_fl, ct_fl,
      webClass, flClass, section_class,
      I_y, W_y, M_Rd, q_d,
    }
  },

  problem: {
    description:
      'Bestäm dimensionerande bärförmåga q_d i brottgränstillståndet för den svetsade balken ' +
      'med hänsyn till moment. Balken är stagad mot vippning (k_crit = 1). Stål S275.',

    figures: (p) => [
      {
        type: 'beam',
        props: {
          L: p.L,
          supports: { left: 'pin', right: 'roller' },
          loads: [{ type: 'udl', label: 'q_d = ?' }],
        },
      },
      {
        type: 'welded-i-section',
        props: { hw: p.hw, tw: p.tw, bf: p.bf, tf: p.tf, a: p.a },
      },
    ],

  },

  steps: [
    // ── Step 1: Cross-section classification ─────────────────────────────────
    {
      id: 'section_class',
      title: 'Tvärsnittsklass',
      question:
        'Bestäm tvärsnittsklass. Kontrollera livet (böjning) och flänsarna (tryck) separat. ' +
        'Svetsens benlängd R = a√2. Ange tvärsnittsklassen (1, 2 eller 3).',

      answer: {
        label: 'Klass',
        unit: '',
        getCorrect: (p) => p.section_class,
        hint:
          'ε = √(235/f_y). Liv: c = hw − 2R, klass 3 om c/t ≤ 124ε. ' +
          'Flänsar: c = bf/2 − tw/2 − R, klass 2 om c/t ≤ 10ε. ' +
          'Tvärsnittsklassen = max(livet, flänsarna).',
      },

      solution: [
        {
          latex: (p) =>
            `\\varepsilon = \\sqrt{\\frac{235}{f_y}} = \\sqrt{\\frac{235}{${p.f_y}}}` +
            ` = ${p.eps.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Livets benlängd (svetsens a-mått ger benlängd R = a√2):' },
        {
          latex: (p) =>
            `R = a\\sqrt{2} = ${p.a}\\sqrt{2} = ${p.R.toFixed(2)} \\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Tvärsnittskontroll av livet (tvärsnittsdel utsatt för böjning):' },
        {
          latex: (p) =>
            `\\frac{c}{t} = \\frac{h_w - 2R}{t_w} = \\frac{${p.hw} - 2 \\cdot ${p.R.toFixed(2)}}{${p.tw}}` +
            ` = ${p.ct_web.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) => [
            `\\text{Klass 1: } c/t \\leq 72\\varepsilon = ${(72 * p.eps).toFixed(2)} \\quad \\text{ej ok}`,
            `\\text{Klass 2: } c/t \\leq 83\\varepsilon = ${(83 * p.eps).toFixed(2)} \\quad \\text{ej ok}`,
            `\\text{Klass 3: } c/t \\leq 124\\varepsilon = ${(124 * p.eps).toFixed(2)} \\quad \\checkmark \\text{ ok}`,
          ],
          latexBlock: true,
        },
        { text: 'Tvärsnittskontroll av flänsarna (tvärsnittsdel utsatt för tryck):' },
        {
          latex: (p) =>
            `\\frac{c}{t} = \\frac{b_f/2 - t_w/2 - R}{t_f}` +
            ` = \\frac{${p.bf}/2 - ${p.tw}/2 - ${p.R.toFixed(2)}}{${p.tf}}` +
            ` = ${p.ct_fl.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) => [
            `\\text{Klass 1: } c/t \\leq 9\\varepsilon = ${(9 * p.eps).toFixed(2)} \\quad \\text{ej ok}`,
            `\\text{Klass 2: } c/t \\leq 10\\varepsilon = ${(10 * p.eps).toFixed(2)} \\quad \\checkmark \\text{ ok}`,
          ],
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\text{Liv: klass ${p.webClass}} \\quad \\text{Flänsar: klass ${p.flClass}}` +
            ` \\quad \\Rightarrow \\quad \\boxed{\\text{Tvärsnittsklassen} = ${p.section_class}}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 2: Moment capacity ───────────────────────────────────────────────
    {
      id: 'M_Rd',
      title: 'Momentkapacitet M_Rd',
      question:
        'Beräkna tröghetsmomentet I_y och det elastiska böjmotståndet W_y. ' +
        'Bestäm sedan momentkapaciteten M_Rd (kNm). ' +
        'Klass 3 ger elastisk dimensionering: M_Rd = W_y · f_y / γ_M0.',

      answer: {
        label: 'M_{Rd}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_Rd.toFixed(1)),
        hint:
          'I_y = bf·h³/12 − (bf−tw)·hw³/12. ' +
          'W_y = I_y / (h/2). M_Rd = W_y · f_y / γ_M0 (i kNm, dela med 10⁶).',
      },

      solution: [
        { text: 'Tröghetsmoment (avdragsmetod, total höjd h = hw + 2·tf):' },
        {
          latex: (p) =>
            `I_y = \\frac{b_f h^3}{12} - \\frac{(b_f - t_w)\\, h_w^3}{12}` +
            ` = \\frac{${p.bf} \\cdot ${p.h}^3}{12} - \\frac{(${p.bf} - ${p.tw}) \\cdot ${p.hw}^3}{12}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `I_y = ${(p.bf * p.h ** 3 / 12 / 1e6).toFixed(1)} \\cdot 10^6` +
            ` - ${((p.bf - p.tw) * p.hw ** 3 / 12 / 1e6).toFixed(1)} \\cdot 10^6` +
            ` = ${(p.I_y / 1e6).toFixed(1)} \\cdot 10^6 \\ \\text{mm}^4`,
          latexBlock: true,
        },
        { text: 'Elastiskt böjmotstånd (klass 3 → elastisk dimensionering):' },
        {
          latex: (p) =>
            `W_y = \\frac{I_y}{h/2} = \\frac{${(p.I_y / 1e6).toFixed(1)} \\cdot 10^6}{${p.h}/2}` +
            ` = ${(p.W_y / 1e3).toFixed(1)} \\cdot 10^3 \\ \\text{mm}^3`,
          latexBlock: true,
        },
        { text: 'Momentkapacitet (stagad mot vippning → k_crit = 1):' },
        {
          latex: (p) =>
            `M_{Rd} = \\frac{W_y \\cdot f_y}{\\gamma_{M0}}` +
            ` = \\frac{${(p.W_y / 1e3).toFixed(1)} \\cdot 10^3 \\cdot ${p.f_y}}{${p.gamma_M0} \\cdot 10^6}` +
            ` = ${p.M_Rd.toFixed(2)} \\ \\text{kNm}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 3: Design load ───────────────────────────────────────────────────
    {
      id: 'q_d',
      title: 'Dimensionerande last q_d',
      question:
        'Bestäm den dimensionerande lasten q_d (kN/m) som balken klarar med hänsyn till momentkapaciteten. ' +
        'Maxmomentet för en enkelt upplagd balk med UDL är M_d = q·L²/8.',

      answer: {
        label: 'q_d',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(p.q_d.toFixed(1)),
        hint: 'M_d = q·L²/8 ≤ M_Rd → q_d = 8·M_Rd / L².',
      },

      solution: [
        {
          latex: (p) =>
            `M_d = \\frac{q_d \\cdot L^2}{8} \\leq M_{Rd}` +
            ` \\quad \\Rightarrow \\quad q_d = \\frac{8 \\cdot M_{Rd}}{L^2}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `q_d = \\frac{8 \\cdot ${p.M_Rd.toFixed(2)}}{${p.L}^2}` +
            ` = \\frac{${(8 * p.M_Rd).toFixed(2)}}{${p.L ** 2}}` +
            ` = ${p.q_d.toFixed(1)} \\ \\text{kN/m}`,
          latexBlock: true,
        },
        {
          latex: (p) => `\\boxed{q_d = ${p.q_d.toFixed(1)} \\ \\text{kN/m}}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
