import { CONCRETE, REBAR } from '../data/materials.js'

export const exercise24 = {
  id: 'ex24',
  title: 'Uppgift 24 – Momentkapacitet, armerad betong',

  derive: (p) => {
    const { fcd, fck } = CONCRETE[p.grade]
    const { fyd, Es }  = REBAR[p.rebar]
    const eps_cu = 3.5e-3
    const eps_sy = fyd / Es   // yield strain

    // ── Cover (EC2: cmin = max(10, φ), Δcdev = 10) ──────────────────────
    const c_nom   = Math.max(10, p.phi) + 10      // 26 mm for φ16
    const c_clear = Math.max(20, p.phi)           // 20 mm for φ16

    // Bar area (mm²)
    const A_bar = Math.PI * (p.phi / 2) ** 2

    // Layer y-positions from top face (same formula as ConcreteULSSVG)
    const yL1 = p.h - c_nom - p.phi / 2
    const yL2 = yL1 - p.phi - c_clear

    // Effective depth for n bars: fill layer 1 first, remainder in layer 2
    const nmax = Math.max(1, Math.floor((p.b - 2 * (p.phi + c_nom)) / (2 * p.phi)))
    function effD(n) {
      const n1 = Math.min(n, nmax)
      const n2 = Math.max(0, n - n1)
      return n2 > 0 ? Math.round((n1 * yL1 + n2 * yL2) / n) : yL1
    }

    // Top bar centroid from top face
    const d_prime = c_nom + p.phi / 2   // 34 mm

    // ── Part a: n_bot_a bottom bars, no top bars ─────────────────────────
    const d_a  = effD(p.n_bot_a)
    const As_a = p.n_bot_a * A_bar

    // First assume normally reinforced (steel yields) to check
    const x_norm_a   = As_a * fyd / (fcd * 0.8 * p.b)
    const eps_trial_a = eps_cu * (d_a - x_norm_a) / x_norm_a
    const overreinforced_a = eps_trial_a < eps_sy

    let x_a, eps_s_a, sigma_s_a
    if (!overreinforced_a) {
      x_a      = x_norm_a
      eps_s_a  = eps_trial_a
      sigma_s_a = fyd
    } else {
      // Overreinforced: σs = εcu*(d−x)/x · Es
      // As·εcu·(d−x)·Es = fcd·0.8·x²·b  →  0.8b·fcd·x² + As·εcu·Es·x − As·εcu·Es·d = 0
      const A_ = 0.8 * p.b * fcd
      const B_ = As_a * eps_cu * Es
      const C_ = -B_ * d_a
      x_a      = (-B_ + Math.sqrt(B_ ** 2 - 4 * A_ * C_)) / (2 * A_)
      eps_s_a  = eps_cu * (d_a - x_a) / x_a
      sigma_s_a = eps_s_a * Es
    }

    const MRd_a = fcd * 0.8 * x_a * p.b * (d_a - 0.4 * x_a) / 1e6   // kNm

    // ── Part b: n_bot_b bottom + n_top_b top bars ────────────────────────
    const d_b   = effD(p.n_bot_b)
    const As_b  = p.n_bot_b * A_bar
    const Asp_b = p.n_top_b * A_bar

    // Assume both top and bottom steel yield
    const x_b    = (As_b - Asp_b) * fyd / (fcd * 0.8 * p.b)
    const eps_s_b  = eps_cu * (d_b - x_b) / x_b
    const eps_sp_b = eps_cu * (x_b - d_prime) / x_b

    const MRd_b = (
      fcd * 0.8 * x_b * p.b * (d_b - 0.4 * x_b)
      + Asp_b * fyd * (d_b - d_prime)
    ) / 1e6   // kNm

    return {
      fcd, fck, fyd, Es, eps_cu, eps_sy,
      c_nom, c_clear, d_prime, A_bar,
      // Part a
      d_a, As_a, x_norm_a, eps_trial_a, overreinforced_a, x_a, eps_s_a, sigma_s_a, MRd_a,
      // Part b
      d_b, As_b, Asp_b, x_b, eps_s_b, eps_sp_b, MRd_b,
    }
  },

  params: {
    b:       250,        // mm, section width
    h:       400,        // mm, section height
    phi:     16,         // mm, bar diameter
    n_bot_a: 10,         // bottom bars for part a
    n_bot_b: 8,          // bottom bars for part b
    n_top_b: 2,          // top bars for part b
    grade:   'C25',
    rebar:   'K500B-T',
  },

  problem: {
    description: (p) =>
      `Bestäm momentkapaciteten för ett rektangulärt betongtvärsnitt, $b = ${p.b}$ mm, ` +
      `$h = ${p.h}$ mm. Betong ${p.grade} och armering K500B-T, Ø${p.phi} mm. ` +
      'Nominellt täckskikt beräknas enligt EC2.',

    figures: (p) => [
      {
        type: 'concrete-uls',
        props: {
          b: p.b, h: p.h, cover: p.c_nom,
          n_bot: p.n_bot_a, dia_bot: p.phi,
          n_top: 0,
          fc: p.fcd, fy: p.fyd,
          sectionOnly: true, label: 'a)',
        },
      },
      {
        type: 'concrete-uls',
        props: {
          b: p.b, h: p.h, cover: p.c_nom,
          n_bot: p.n_bot_b, dia_bot: p.phi,
          n_top: p.n_top_b, dia_top: p.phi,
          fc: p.fcd, fy: p.fyd,
          sectionOnly: true, label: 'b)',
        },
      },
    ],
  },

  steps: [
    // ── Step a ───────────────────────────────────────────────────────────────
    {
      id: 'MRd_a',
      title: `a) Enbart underkantsarmering`,
      question: (p) =>
        `Bestäm momentkapaciteten $M_{Rd}$ (kNm) med ${p.n_bot_a}Ø${p.phi} enbart i underkant.`,
      answer: {
        label: 'M_{Rd}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.MRd_a.toFixed(0)),
      },
      solution: [
        {
          text: (p) =>
            `Täckskikt: $c_{min} = \\max(10,\\,\\phi) = ${Math.max(10, p.phi)}$ mm, ` +
            `$\\Delta c_{dev} = 10$ mm $\\Rightarrow c_{nom} = ${p.c_nom}$ mm.`,
        },
        {
          latex: (p) =>
            `d = h - c_{nom} - \\tfrac{\\phi}{2} = ${p.h} - ${p.c_nom} - ${p.phi / 2} = ${p.d_a}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `A_s = ${p.n_bot_a}\\cdot\\frac{\\pi\\cdot${p.phi}^2}{4} = ${p.As_a.toFixed(0)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          text: 'Antag normalarmerat tvärsnitt ($\\sigma_s = f_{yd}$) och beräkna tryckzonshöjd:',
        },
        {
          latex: (p) =>
            `x = \\frac{A_s f_{yd}}{f_{cd}\\cdot 0.8\\cdot b} = ` +
            `\\frac{${p.As_a.toFixed(0)}\\cdot ${p.fyd}}{${p.fcd}\\cdot 0.8\\cdot ${p.b}} = ${p.x_norm_a.toFixed(0)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          text: 'Kontrollera töjning i armeringen:',
        },
        {
          latex: (p) =>
            `\\varepsilon_s = \\varepsilon_{cu}\\frac{d-x}{x} = 3.5\\cdot\\frac{${p.d_a}-${p.x_norm_a.toFixed(0)}}{${p.x_norm_a.toFixed(0)}} = ${(p.eps_trial_a * 1000).toFixed(2)}\\ \\text{‰}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\varepsilon_{sy} = \\frac{f_{yd}}{E_s} = \\frac{${p.fyd}}{${p.Es / 1000}\\,000} = ${(p.eps_sy * 1000).toFixed(2)}\\ \\text{‰}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            p.overreinforced_a
              ? '$\\varepsilon_s < \\varepsilon_{sy}$ → **Överarmerat tvärsnitt.** Armeringen når inte flytgränsen.'
              : '$\\varepsilon_s \\geq \\varepsilon_{sy}$ → Normalarmerat. Armeringen flyter.',
        },
        {
          text: (p) =>
            p.overreinforced_a
              ? 'Sätt $\\sigma_s = \\varepsilon_{cu}\\tfrac{d-x}{x}E_s$ och lös kraftjämvikt $A_s\\sigma_s = f_{cd}\\cdot 0.8x\\cdot b$:'
              : null,
        },
        {
          latex: (p) =>
            p.overreinforced_a
              ? `0.8\\cdot ${p.b}\\cdot ${p.fcd}\\cdot x^2 + ${p.As_a.toFixed(0)}\\cdot 3.5\\cdot 10^{-3}\\cdot ${p.Es / 1000}\\,000\\cdot x ` +
                `- ${p.As_a.toFixed(0)}\\cdot 3.5\\cdot 10^{-3}\\cdot ${p.Es / 1000}\\,000\\cdot ${p.d_a} = 0`
              : null,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\Rightarrow x = ${p.x_a.toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\varepsilon_s = 3.5\\cdot\\frac{${p.d_a}-${p.x_a.toFixed(1)}}{${p.x_a.toFixed(1)}} = ${(p.eps_s_a * 1000).toFixed(2)}\\ \\text{‰}\\quad` +
            `\\Rightarrow\\quad \\sigma_s = ${p.sigma_s_a.toFixed(0)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        {
          text: 'Momentkapacitet (momentjämvikt kring tryckkraftens angreppspunkt):',
        },
        {
          latex: (p) =>
            `M_{Rd} = f_{cd}\\cdot 0.8x\\cdot b\\cdot(d - 0.4x) = ` +
            `${p.fcd}\\cdot 0.8\\cdot ${p.x_a.toFixed(1)}\\cdot ${p.b}\\cdot(${p.d_a} - 0.4\\cdot ${p.x_a.toFixed(1)}) ` +
            `= ${p.MRd_a.toFixed(0)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          figure: (p) => ({
            type: 'concrete-uls',
            props: {
              b: p.b, h: p.h, cover: p.c_nom,
              n_bot: p.n_bot_a, dia_bot: p.phi,
              n_top: 0,
              fc: p.fcd, fy: p.fyd,
            },
          }),
        },
      ],
    },

    // ── Step b ───────────────────────────────────────────────────────────────
    {
      id: 'MRd_b',
      title: 'b) Med tryckt armering i överkant',
      question: (p) =>
        `Bestäm momentkapaciteten $M_{Rd}$ (kNm) med ${p.n_bot_b}Ø${p.phi} i underkant ` +
        `och ${p.n_top_b}Ø${p.phi} i överkant.`,
      answer: {
        label: 'M_{Rd}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.MRd_b.toFixed(1)),
      },
      solution: [
        {
          text: (p) =>
            `Överkantarmeringens tyngdpunkt: $d' = c_{nom} + \\phi/2 = ${p.c_nom} + ${p.phi / 2} = ${p.d_prime}$ mm.`,
        },
        {
          latex: (p) =>
            `A_s = ${p.n_bot_b}\\cdot\\frac{\\pi\\cdot ${p.phi}^2}{4} = ${p.As_b.toFixed(0)}\\ \\text{mm}^2, \\quad ` +
            `A_s^{\\prime} = ${p.n_top_b}\\cdot\\frac{\\pi\\cdot ${p.phi}^2}{4} = ${p.Asp_b.toFixed(0)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          text: 'Antag att både under- och överkantarmeringen flyter ($\\sigma_s = \\sigma_s\' = f_{yd}$). Kraftjämvikt:',
        },
        {
          latex: (p) =>
            `A_s f_{yd} = f_{cd}\\cdot 0.8x\\cdot b + A_s' f_{yd}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `x = \\frac{(A_s - A_s')f_{yd}}{f_{cd}\\cdot 0.8\\cdot b} = ` +
            `\\frac{(${p.As_b.toFixed(0)} - ${p.Asp_b.toFixed(0)})\\cdot ${p.fyd}}{${p.fcd}\\cdot 0.8\\cdot ${p.b}} = ${p.x_b.toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          text: 'Verifiera antagandena:',
        },
        {
          latex: (p) =>
            `\\varepsilon_s = 3.5\\cdot\\frac{${p.d_b}-${p.x_b.toFixed(1)}}{${p.x_b.toFixed(1)}} = ${(p.eps_s_b * 1000).toFixed(2)}\\ \\text{‰} > \\varepsilon_{sy} = ${(p.eps_sy * 1000).toFixed(2)}\\ \\text{‰}\\quad\\checkmark`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\varepsilon_s' = 3.5\\cdot\\frac{${p.x_b.toFixed(1)}-${p.d_prime}}{${p.x_b.toFixed(1)}} = ${(p.eps_sp_b * 1000).toFixed(2)}\\ \\text{‰} > \\varepsilon_{sy}\\quad\\checkmark`,
          latexBlock: true,
        },
        {
          text: 'Momentkapacitet (momentjämvikt kring underkantsarmeringen):',
        },
        {
          latex: (p) =>
            `M_{Rd} = f_{cd}\\cdot 0.8x\\cdot b\\cdot(d-0.4x) + A_s' f_{yd}(d - d')`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `= ${p.fcd}\\cdot 0.8\\cdot ${p.x_b.toFixed(1)}\\cdot ${p.b}\\cdot(${p.d_b}-0.4\\cdot ${p.x_b.toFixed(1)}) ` +
            `+ ${p.Asp_b.toFixed(0)}\\cdot ${p.fyd}\\cdot(${p.d_b}-${p.d_prime}) = ${p.MRd_b.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          figure: (p) => ({
            type: 'concrete-uls',
            props: {
              b: p.b, h: p.h, cover: p.c_nom,
              n_bot: p.n_bot_b, dia_bot: p.phi,
              n_top: p.n_top_b, dia_top: p.phi,
              fc: p.fcd, fy: p.fyd,
            },
          }),
        },
      ],
    },
  ],
}
