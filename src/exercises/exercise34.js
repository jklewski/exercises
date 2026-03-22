import { CONCRETE, REBAR } from '../data/materials.js'

const concrete = CONCRETE['C30']
const rebar    = REBAR['K500B-T']

// Section: b=250mm, h_total=500mm (50+400+50), asymmetric reinforcement
// Compression side (top): 2φ16, d' = 50 mm from top
// Tension side (bottom):  4φ16, d  = 450 mm from top
// N_d applied at e = 120 mm above compression face

// Rebar positions in rect-section (x,y as fractions from bottom-left)
const h_tot   = 500   // mm
const b_sect  = 250   // mm
const d_prime = 50    // mm from compression (top) face
const d_eff   = 450   // mm from compression (top) face (= h_tot - 50)

// Tension bars (4φ16) at bottom
const tensionYfrac = (h_tot - d_eff) / h_tot    // 0.1 from bottom
const tensionXs    = [38, 96, 154, 212].map(x => x / b_sect)

// Compression bars (2φ16) at top
const comprYfrac   = (h_tot - d_prime) / h_tot  // 0.9 from bottom
const comprXs      = [62.5, 187.5].map(x => x / b_sect)

const rebars34 = [
  ...tensionXs.map(x => ({ x, y: tensionYfrac })),
  ...comprXs.map(x   => ({ x, y: comprYfrac   })),
]

export const exercise34 = {
  id: 'ex34',
  title: 'Uppgift 34 – Excentrisk normalkraft, armerat betongtvärsnitt',

  derive: (p) => {
    const fcd_Pa = p.fcd * 1e6   // Pa
    const fyd_Pa = p.fyd * 1e6   // Pa
    const Es_Pa  = p.Es  * 1e6   // Pa

    // Steel areas (m²)
    const phi_m  = p.phi / 1000
    const As     = p.n_tension * Math.PI * phi_m ** 2 / 4
    const As_c   = p.n_compr  * Math.PI * phi_m ** 2 / 4

    // Dimensions in metres
    const b    = p.b    / 1000
    const d    = p.d    / 1000
    const d_pr = p.d_pr / 1000
    const e    = p.e    / 1000   // eccentricity above compression face

    // ── Moment equilibrium around N_d → quadratic in x ─────────────────────
    // All forces × arm from N_d (N_d is e above compression face):
    //   F_s  × (d + e)       = 0 (tension steel arm)
    //   F_s' × (d' + e)      = 0 (compression steel arm)
    //   F_c  × (0.4x + e)    = 0 (concrete centroid arm)
    //
    // Assuming both bars yield: σ_s = σ_s' = f_yd
    //
    // Rearranges to: A_q·x² + B_q·x + C_q = 0
    // with A_q = 0.32·fcd·b, B_q = 0.8·fcd·b·e, C_q = -(fyd·As·(d+e) - fyd·As_c·(d'+e))

    const A_q  =  0.32 * fcd_Pa * b
    const B_q  =  0.8  * fcd_Pa * b * e
    const C_q  = -(fyd_Pa * As * (d + e) - fyd_Pa * As_c * (d_pr + e))
    const disc = Math.sqrt(B_q ** 2 - 4 * A_q * C_q)
    const x    = (-B_q + disc) / (2 * A_q)   // m, neutral axis depth

    // ── Strain verification ─────────────────────────────────────────────────
    const eps_cu = 3.5e-3                         // ultimate concrete strain
    const eps_sy = fyd_Pa / Es_Pa                 // yield strain
    const eps_s  = eps_cu * (d    - x) / x        // tension steel
    const eps_s_c= eps_cu * (x    - d_pr) / x     // compression steel

    const yields_tension = eps_s  >= eps_sy
    const yields_compr   = eps_s_c >= eps_sy

    // ── Force equilibrium → N_d ─────────────────────────────────────────────
    const Fc = fcd_Pa * 0.8 * x * b              // N (concrete compression)
    const Fs = fyd_Pa * As                        // N (tension steel)
    const Fs_c = fyd_Pa * As_c                    // N (compression steel)
    const N_d  = (Fc + Fs_c - Fs) / 1000         // kN

    return {
      As, As_c, phi_m, b, d, d_pr, e,
      A_q, B_q, C_q,
      x, x_mm: x * 1000,
      eps_cu, eps_sy, eps_s, eps_s_c,
      yields_tension, yields_compr,
      Fc, Fs, Fs_c, N_d,
    }
  },

  params: {
    // Geometry (mm)
    b:         250,
    h:         500,    // total height = 50 + 400 + 50
    d:         450,    // effective depth to tension steel
    d_pr:       50,    // distance to compression steel
    phi:        16,    // bar diameter (mm)
    n_tension:   4,    // bars on tension side
    n_compr:     2,    // bars on compression side
    e:         120,    // eccentricity of N_d above compression face (mm)
    // Material
    ...concrete,       // fck=30, fcd=20, fctm=2.9, Ecm=33000
    ...rebar,          // fyk=500, fyd=435, Es=200000
  },

  problem: {
    description:
      'Tvärsnittet är armerat med $4\\phi16$ K500B-T på dragsidan och $2\\phi16$ K500B-T på trycksidan. ' +
      'Det belastas i brottgränstillståndet med en excentrisk normalkraft $N_d$ vars angreppspunkt ' +
      'befinner sig $e = 120$ mm ovanför den tryckta kantfibern. ' +
      'Bestäm bärförmågan $N_d$ (kN). ' +
      'Betong C30, armering K500B-T Ø16. ' +
      'Betäckning: $d = 450$ mm, $d^{\\prime} = 50$ mm.',

    figures: [
      {
        type: 'rect-section',
        props: {
          b:         b_sect,
          h:         h_tot,
          rebars:    rebars34,
          rebarDia:  16,
          fillColor: '#e8e8e8',
        },
      },
    ],
  },

  steps: [
    // ── Steg 1: Neutrallagrets läge ─────────────────────────────────────────
    {
      id: 'x_na',
      title: 'Steg 1 – Neutrallagrets läge $x$',
      question:
        'Antag att all armering flyter ($\\sigma_s = \\sigma_s^{\\prime} = f_{yd}$). ' +
        'Ställ upp momentjämvikt kring angreppspunkten för $N_d$ (som befinner sig $e = 120$ mm ' +
        'ovanför den tryckta kantfibern) och beräkna neutrallagrets djup $x$ (mm).',

      answer: {
        label: 'x',
        unit: 'mm',
        getCorrect: (p) => parseFloat(p.x_mm.toFixed(1)),
        hint:
          'Momentjämvikt kring $N_d$: ' +
          '$\\sigma_s A_s(d+e) - \\sigma_s^{\\prime}A_s^{\\prime}(d^{\\prime}+e) - f_{cd}\\cdot0.8x\\cdot b\\cdot(0.4x+e)=0$. ' +
          'Lös andragradsekvationen.',
      },

      solution: [
        { text: 'Beräkna armeringsareor och materialvärden:' },
        {
          latex: (p) =>
            `A_s = 4\\cdot\\frac{\\pi\\cdot${p.phi}^2}{4} = ${(p.As * 1e6).toFixed(1)}\\ \\text{mm}^2, \\quad A_s^{\\prime} = 2\\cdot\\frac{\\pi\\cdot${p.phi}^2}{4} = ${(p.As_c * 1e6).toFixed(1)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `f_{cd} = \\frac{\\alpha_{cc}\\,f_{ck}}{\\gamma_C} = \\frac{1\\cdot${p.fck}}{1{,}5} = ${p.fcd}\\ \\text{MPa}, \\quad f_{yd} = ${p.fyd}\\ \\text{MPa}`,
          latexBlock: true,
        },
        {
          text: 'Momentjämvikt kring N_d (positiva moment moturs). ' +
                'N_d befinner sig e = 120 mm ovanför den tryckta kantfibern, ' +
                'alltså är armhävstängerna: dragsida (d+e), trycksida (d\'+e), betong (0,4x+e):',
        },
        {
          latex: (p) =>
            `F_s(d+e) - F_s^{\\prime}(d^{\\prime}+e) - f_{cd}\\cdot0{,}8x\\cdot b\\cdot(0{,}4x+e) = 0`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `${p.fyd}\\cdot10^6\\cdot${(p.As * 1e4).toFixed(2)}\\cdot10^{-4}\\cdot${((p.d + p.e) / 1000).toFixed(2)} ` +
            `- ${p.fyd}\\cdot10^6\\cdot${(p.As_c * 1e4).toFixed(2)}\\cdot10^{-4}\\cdot${((p.d_pr + p.e) / 1000).toFixed(2)} ` +
            `- ${p.fcd}\\cdot10^6\\cdot0{,}8x\\cdot${p.b / 1000}\\cdot(0{,}4x+${p.e / 1000}) = 0`,
          latexBlock: true,
        },
        { text: 'Andragradsekvation i x (koefficienter i Pa, m):' },
        {
          latex: (p) =>
            `${(p.A_q / 1e6).toFixed(2)}\\cdot10^6\\,x^2 + ${(p.B_q / 1e3).toFixed(0)}\\cdot10^3\\,x - ${((-p.C_q) / 1e3).toFixed(1)}\\cdot10^3 = 0`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\Rightarrow\\quad x = ${p.x_mm.toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 2: Kontroll av armeringsspänningar ─────────────────────────────
    {
      id: 'eps_check',
      title: 'Steg 2 – Kontroll av armeringsspänningar',
      question:
        'Kontrollera att båda armeringslagren verkligen flyter vid ULS. ' +
        'Beräkna töjningen i dragarmeringen $\\varepsilon_s$ (‰).',

      answer: {
        label: '\\varepsilon_s',
        unit: '‰',
        getCorrect: (p) => parseFloat((p.eps_s * 1000).toFixed(1)),
        hint: (p) =>
          `$\\varepsilon_s = \\varepsilon_{cu}\\dfrac{d-x}{x} = 3{,}5\\cdot\\dfrac{${p.d}-${p.x_mm.toFixed(1)}}{${p.x_mm.toFixed(1)}}$ ‰`,
      },

      resultCheck: (p) => ({
        ok: p.yields_tension && p.yields_compr,
        latex:
          `\\varepsilon_s = ${(p.eps_s * 1000).toFixed(1)}\\ \\text{‰} \\geq \\varepsilon_{sy} = ${(p.eps_sy * 1000).toFixed(3)}\\ \\text{‰} \\quad \\checkmark \\qquad ` +
          `\\varepsilon_s^{\\prime} = ${(p.eps_s_c * 1000).toFixed(1)}\\ \\text{‰} \\geq \\varepsilon_{sy} \\quad \\checkmark \\quad \\Rightarrow \\textbf{Antagandena stämmer!}`,
      }),

      solution: [
        { text: 'Flytgränstöjning:' },
        {
          latex: (p) =>
            `\\varepsilon_{sy} = \\frac{f_{yd}}{E_s} = \\frac{${p.fyd}}{${(p.Es / 1000).toFixed(0)}\\,000} = ${(p.eps_sy * 1000).toFixed(3)}\\ \\text{‰}`,
          latexBlock: true,
        },
        { text: 'Töjning i dragarmering (underkant):' },
        {
          latex: (p) =>
            `\\varepsilon_s = \\varepsilon_{cu}\\frac{d-x}{x} = 3{,}5\\cdot\\frac{${p.d}-${p.x_mm.toFixed(1)}}{${p.x_mm.toFixed(1)}} = ${(p.eps_s * 1000).toFixed(1)}\\ \\text{‰} \\geq ${(p.eps_sy * 1000).toFixed(3)}\\ \\text{‰} \\quad \\Rightarrow \\sigma_s = f_{yd}`,
          latexBlock: true,
        },
        { text: 'Töjning i tryckarmering (överkant):' },
        {
          latex: (p) =>
            `\\varepsilon_s^{\\prime} = \\varepsilon_{cu}\\frac{x-d^{\\prime}}{x} = 3{,}5\\cdot\\frac{${p.x_mm.toFixed(1)}-${p.d_pr}}{${p.x_mm.toFixed(1)}} = ${(p.eps_s_c * 1000).toFixed(1)}\\ \\text{‰} \\geq ${(p.eps_sy * 1000).toFixed(3)}\\ \\text{‰} \\quad \\Rightarrow \\sigma_s^{\\prime} = f_{yd}`,
          latexBlock: true,
        },
        { text: 'Antagandena om flytande armering är uppfyllda.' },
      ],
    },

    // ── Steg 3: Bärförmågan N_d ────────────────────────────────────────────
    {
      id: 'N_d',
      title: 'Steg 3 – Bärförmåga $N_d$',
      question:
        'Beräkna bärförmågan $N_d$ (kN) med kraftjämvikt i tvärsnittet.',

      answer: {
        label: 'N_d',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_d.toFixed(0)),
        hint: (p) =>
          `$N_d = f_{cd}\\cdot0{,}8x\\cdot b + A_s^{\\prime}f_{yd} - A_s f_{yd}$. ` +
          `Betongkraft $F_c = ${(p.Fc / 1000).toFixed(0)}$ kN, ` +
          `tryckarmering $F_s^{\\prime} = ${(p.Fs_c / 1000).toFixed(0)}$ kN, ` +
          `dragarmering $F_s = ${(p.Fs / 1000).toFixed(0)}$ kN.`,
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `N_d = ${(p.Fc / 1000).toFixed(0)} + ${(p.Fs_c / 1000).toFixed(0)} - ${(p.Fs / 1000).toFixed(0)} = ${p.N_d.toFixed(0)}\\ \\text{kN}`,
      }),

      solution: [
        { text: 'Kraftjämvikt i axialriktningen (tryck positivt):' },
        {
          latex: (p) =>
            `A_s\\sigma_s + N_d = f_{cd}\\cdot0{,}8x\\cdot b + A_s^{\\prime}\\sigma_s^{\\prime}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `N_d = f_{cd}\\cdot0{,}8x\\cdot b + A_s^{\\prime}f_{yd} - A_s f_{yd}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `F_c = ${p.fcd}\\cdot10^6\\cdot0{,}8\\cdot${p.x_mm.toFixed(4) / 1000}\\cdot${p.b / 1000} = ${(p.Fc / 1000).toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `F_s^{\\prime} = ${p.fyd}\\cdot10^6\\cdot${(p.As_c * 1e6).toFixed(1)}\\cdot10^{-6} = ${(p.Fs_c / 1000).toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `F_s = ${p.fyd}\\cdot10^6\\cdot${(p.As * 1e6).toFixed(1)}\\cdot10^{-6} = ${(p.Fs / 1000).toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `N_d = ${(p.Fc / 1000).toFixed(0)} + ${(p.Fs_c / 1000).toFixed(0)} - ${(p.Fs / 1000).toFixed(0)} = \\mathbf{${p.N_d.toFixed(0)}\\ \\text{kN}}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
