import { CONCRETE, REBAR } from '../data/materials.js'

const concrete20 = CONCRETE['C20']
const rebar      = REBAR['K500B-T']

// Rebar layout: 4Ø12 per side (symmetric), 300 × 400 column
// d  = 372 mm (from top to bottom steel tyngdpunkt)
// d' = 28 mm  (from top to top steel tyngdpunkt)
// 4 bars evenly across b = 300 mm with c_nom = 22 mm cover
const colBarXs = [28, 109.3, 190.7, 272].map(x => x / 300)
const rebars38 = [
  ...colBarXs.map(x => ({ x, y: 28 / 400 })),   // bottom bars (at d' = 28 mm from bottom)
  ...colBarXs.map(x => ({ x, y: 1 - 28 / 400 })), // top bars (at 28 mm from top)
]

export const exercise38 = {
  id: 'ex38',
  title: 'Uppgift 38 – Pelardimensionering, andraordningseffekter',

  derive: (p) => {
    const fcd  = p.fck / 1.5                         // MPa (alpha_cc = 1.0)
    const Ecd  = p.Ecm / p.gamma_CE                  // MPa (för knäckning)

    // Effective depth
    const c_min    = Math.max(10, p.phi)              // mm: max(10,12) = 12
    const c_nom    = c_min + p.delta_c_dev            // mm: 22
    const d_mm     = p.h - c_nom - p.phi / 2          // mm: 372
    const d_prime  = c_nom + p.phi / 2                // mm: 28
    const d_m      = d_mm / 1000                      // m
    const b_m      = p.b / 1000                       // m
    const h_m      = p.h / 1000                       // m

    // Effective buckling length & geometric imperfection
    const l0  = p.beta_col * p.L                      // m: 8.72
    const e_i = l0 / 400                              // m: 0.0218

    // First-order moment at column base (cantilever)
    // M₀ = qL²/2 + N·(e_int + e_i)
    const M0 = p.q_d * p.L * p.L / 2 + p.N_Ed * (p.e_int + e_i)  // kNm

    // Radius of gyration and slenderness
    const i_col      = h_m / Math.sqrt(12)            // m
    const lambda     = l0 / i_col                     // –

    // Relative axial force
    const n_rel = (p.N_Ed * 1e3) / (b_m * h_m * fcd * 1e6)  // –

    // λ_lim factors (ω unknown → use B = 1.1 conservative)
    const A_fac      = 1 / (1 + 0.2 * p.phi_ef)      // 0.714
    const B_fac      = 1.1
    const C_fac      = 1.7                             // rm = 0 (constant M from lateral UDL)
    const lambda_lim = 20 * A_fac * B_fac * C_fac / Math.sqrt(n_rel)

    // ── Nominal stiffness (avsnitt 3.5.3), with final answer As (4Ø12 each side) ───
    const n_bars_final = 4                             // bars per side (converged answer)
    const n_total      = 2 * n_bars_final
    const phi_m        = p.phi / 1000                 // m

    const Ic = b_m * Math.pow(h_m, 3) / 12            // m⁴
    const Is_per_bar = (Math.PI * Math.pow(phi_m, 4) / 64) +
                       (Math.PI * Math.pow(phi_m, 2) / 4) * Math.pow(d_m - h_m / 2, 2)
    const Is = n_total * Is_per_bar                   // m⁴

    const k1 = Math.sqrt(p.fck / 20)                  // 1.0 for C20
    const k2 = n_rel * lambda / 170                   // 0.0555
    const Kc = k1 * k2 / (1 + p.phi_ef)              // 0.0185
    const Ks = 1

    const EI = Kc * Ecd * 1e6 * Ic + Ks * p.Es * 1e6 * Is  // Nm²
    const N_cr_kN = Math.PI * Math.PI * EI / (l0 * l0) / 1000

    // β for symmetric triangular moment distribution (from cantilever UDL): c₀ = 12
    const beta_fac = Math.PI * Math.PI / 12            // 0.822
    const M_Ed = M0 * (1 + beta_fac / (N_cr_kN / p.N_Ed - 1))  // kNm

    // Dimensionless N-M ratios
    const nu_rel = (p.N_Ed * 1e3) / (b_m * d_m * fcd * 1e6)
    const mu_rel = (M_Ed * 1e3)   / (b_m * d_m * d_m * fcd * 1e6)

    // Mechanical reinforcement ratio from interaction diagram
    // (ω read from RoF figur 3.4 for ν ≈ 0.135, μ ≈ 0.17 → ω = 0.13)
    const omega   = 0.13
    const A_s_req = omega * b_m * d_m * (fcd / p.fyd)  // m² per side
    const n_req   = 4 * A_s_req / (Math.PI * Math.pow(phi_m, 2))
    const n_bars  = Math.ceil(n_req)                    // → 4

    return {
      fcd, Ecd,
      c_nom, d_mm, d_prime, d_m,
      l0, e_i,
      M0,
      i_col, lambda, lambda_lim, n_rel,
      A_fac, B_fac, C_fac,
      Kc, Ks, Ic, Is, EI, N_cr_kN, beta_fac, M_Ed,
      nu_rel, mu_rel, omega, A_s_req, n_req, n_bars,
    }
  },

  params: {
    // Geometry
    L:           4,      // m, pelarens fria höjd
    b:           300,    // mm, bredd
    h:           400,    // mm, höjd (böjriktning)
    phi:         12,     // mm, stångdiameter
    // Loads (already design values)
    N_Ed:        200,    // kN, dimensionerande normalkraft
    q_d:         6.5,   // kN/m, dimensionerande horisontell last
    e_int:       0.1,   // m, avsiktlig excentricitet
    // Material
    grade:       'C20',
    fck:         concrete20.fck,   // 20 MPa
    Ecm:         concrete20.Ecm,   // 30 000 MPa
    fyd:         rebar.fyd,        // 435 MPa
    Es:          rebar.Es,         // 200 000 MPa
    // Column design
    beta_col:    2.18,  // effektiv knäcklängdsfaktor
    gamma_CE:    1.2,   // för E_cd = E_cm / γ_CE  (avsnitt 3.5.3)
    phi_ef:      2.0,   // effektivt kryptal
    delta_c_dev: 10,    // mm, Δcdev
  },

  problem: {
    description: (p) =>
      `Bestäm erforderlig armering för pelaren i brottgränstillståndet. ` +
      `Dimensionerande laster: $P_d = ${p.N_Ed}$ kN (axlast) och $q_d = ${p.q_d}$ kN/m (horisontell last). ` +
      `Avsiktlig excentricitet $e = ${p.e_int * 1000}$ mm. ` +
      `Betong C20, armering K500B-T Ø${p.phi}, $\\varphi_{ef} = ${p.phi_ef}$. ` +
      `Knäcklängdsfaktor $\\beta = ${p.beta_col}$ (inspänd fot, fri topp).`,

    figures: [
      {
        type: 'column',
        props: { L: 4, N_label: 'P_d', q_label: 'q_d', e_label: 'e', support: 'fixed' },
      },
      {
        type: 'rect-section',
        props: { b: 300, h: 400, rebars: rebars38, fillColor: '#e8e8e8' },
      },
    ],
  },

  steps: [
    // ── Steg 1: Effektiv höjd, geometrisk imperfektion och M₀ ─────────────────
    {
      id: 'M0',
      title: 'Steg 1 – Effektiv höjd $d$ och första ordningens moment $M_0$',
      question: (p) =>
        `Beräkna den effektiva höjden $d$ (mm) och det dimensionerande böjmomentet ` +
        `$M_0$ (kNm) i första ordningen vid pelarens inspänning. ` +
        `Täckskikt: $c_{min} = \\max(10;\\ \\phi) = ${Math.max(10, p.phi)}$ mm, $\\Delta c_{dev} = ${p.delta_c_dev}$ mm. ` +
        `Knäcklängd $l_0 = \\beta L = ${p.beta_col}\\cdot${p.L}$ m. ` +
        `Geometrisk imperfektion: $e_i = l_0/400$.`,

      answer: {
        label: 'M_0',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M0.toFixed(1)),
        hint: (p) =>
          `$c_{nom} = ${p.c_nom}$ mm → $d = ${p.h} - ${p.c_nom} - ${p.phi}/2 = ${p.d_mm}$ mm. ` +
          `$e_i = l_0/400 = ${(p.e_i * 1000).toFixed(1)}$ mm. ` +
          `$M_0 = q\\,L^2/2 + N\\,(e + e_i)$.`,
      },

      solution: [
        { text: 'Effektivt täckskikt och effektiv höjd:' },
        {
          latex: (p) =>
            `c_{min} = \\max(10;\\ ${p.phi}) = ${Math.max(10, p.phi)}\\ \\text{mm} \\quad \\Rightarrow \\quad c_{nom} = ${Math.max(10, p.phi)} + ${p.delta_c_dev} = ${p.c_nom}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `d = h - c_{nom} - \\tfrac{\\phi}{2} = ${p.h} - ${p.c_nom} - 6 = ${p.d_mm}\\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Knäcklängd och geometrisk imperfektion:' },
        {
          latex: (p) =>
            `l_0 = \\beta L = ${p.beta_col}\\cdot${p.L} = ${p.l0.toFixed(2)}\\ \\text{m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `e_i = \\frac{l_0}{400} = \\frac{${p.l0.toFixed(2)}}{400} = ${(p.e_i * 1000).toFixed(1)}\\ \\text{mm} = ${p.e_i.toFixed(4)}\\ \\text{m}`,
          latexBlock: true,
        },
        { text: 'Första ordningens moment vid inspänningen (inspänd konsol):' },
        {
          latex: (p) =>
            `M_0 = \\frac{q_d L^2}{2} + N_{Ed}(e + e_i) = \\frac{${p.q_d}\\cdot${p.L}^2}{2} + ${p.N_Ed}\\cdot(${p.e_int} + ${p.e_i.toFixed(4)}) = ${p.M0.toFixed(2)}\\ \\text{kNm}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 2: Slankhetskontroll ──────────────────────────────────────────────
    {
      id: 'lambda',
      title: 'Steg 2 – Slankhet $\\lambda$ och slankhetsgräns $\\lambda_{lim}$',
      question: (p) =>
        'Beräkna pelarens slankhet $\\lambda$ och slankhetsgränsen $\\lambda_{lim}$ (RoF avsnitt 5.3). ' +
        'Behöver andraordningseffekter beaktas?',

      answer: {
        label: '\\lambda',
        unit: '–',
        getCorrect: (p) => parseFloat(p.lambda.toFixed(1)),
        hint: (p) =>
          `Trögetsradien $i = h/\\sqrt{12} = ${(p.i_col * 1000).toFixed(1)}$ mm. ` +
          `$\\lambda = l_0/i$. ` +
          `$\\lambda_{lim} = 20ABC/\\sqrt{n}$ med $A = ${p.A_fac.toFixed(3)}$, $B = ${p.B_fac}$, $C = ${p.C_fac}$, $n = ${p.n_rel.toFixed(3)}$.`,
      },

      resultCheck: (p) => {
        const needs2nd = p.lambda > p.lambda_lim
        return {
          ok: needs2nd,   // "OK" here means second-order IS needed (as expected)
          latex:
            `\\lambda = ${p.lambda.toFixed(1)} ` +
            `${needs2nd ? '>' : '\\leq'} \\lambda_{lim} = ${p.lambda_lim.toFixed(1)} ` +
            `\\quad \\Rightarrow \\textbf{Andraordningseffekter måste beaktas!}`,
        }
      },

      solution: [
        { text: 'Trögetsradie och slankhet:' },
        {
          latex: (p) =>
            `i = \\frac{h}{\\sqrt{12}} = \\frac{${p.h / 1000}}{\\sqrt{12}} = ${p.i_col.toFixed(4)}\\ \\text{m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda = \\frac{l_0}{i} = \\frac{${p.l0.toFixed(2)}}{${p.i_col.toFixed(4)}} = ${p.lambda.toFixed(1)}`,
          latexBlock: true,
        },
        { text: 'Slankhetsgräns $\\lambda_{lim} = 20ABC/\\sqrt{n}$:' },
        {
          latex: (p) =>
            `n = \\frac{N_{Ed}}{A_c\\,f_{cd}} = \\frac{${p.N_Ed}\\cdot10^3}{${p.b / 1000}\\cdot${p.h / 1000}\\cdot${p.fcd.toFixed(1)}\\cdot10^6} = ${p.n_rel.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `A = \\frac{1}{1+0{,}2\\,\\varphi_{ef}} = \\frac{1}{1+0{,}2\\cdot${p.phi_ef}} = ${p.A_fac.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `B = 1{,}1 \\quad (\\omega\\ \\text{okänt}), \\quad C = 1{,}7 \\quad (r_m = 0)`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{lim} = \\frac{20\\cdot${p.A_fac.toFixed(3)}\\cdot${p.B_fac}\\cdot${p.C_fac}}{\\sqrt{${p.n_rel.toFixed(3)}}} = ${p.lambda_lim.toFixed(1)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda = ${p.lambda.toFixed(1)} > \\lambda_{lim} = ${p.lambda_lim.toFixed(1)} \\quad \\Rightarrow \\quad \\textbf{Andraordningseffekter måste beaktas!}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 3: Andraordningsmoment och erforderlig armering ──────────────────
    {
      id: 'n_bars',
      title: 'Steg 3 – Andraordningsmoment $M_{Ed}$ och erforderlig armering',
      question: (p) =>
        'Beräkna det dimensionerande momentet $M_{Ed}$ med nominell styvhetsmetoden (RoF avsnitt 3.5.3) ' +
        'och bestäm erforderlig armering (antal stänger per sida). ' +
        'Iterera tills konvergens. Läs av den mekaniska armeringsdelen $\\omega$ ur RoF figur 3.4 ' +
        `och beräkna $A_s = \\omega\\,b\\,d\\,f_{cd}/f_{yd}$.`,

      answer: {
        label: 'n_{\\phi}',
        unit: 'stänger per sida',
        getCorrect: (p) => p.n_bars,
        hint: (p) =>
          `Slutvärde: $M_{Ed} \\approx ${p.M_Ed.toFixed(0)}$ kNm, ` +
          `$\\nu = ${p.nu_rel.toFixed(3)}$, $\\mu = ${p.mu_rel.toFixed(3)}$ ` +
          `→ avläs $\\omega \\approx ${p.omega}$ ur figur 3.4 → $n \\approx ${p.n_req.toFixed(1)}$ → välj **${p.n_bars}Ø${p.phi} per sida**.`,
      },

      solution: [
        { text: 'Styvhetskoefficienter (nominell styvhet):' },
        {
          latex: (p) =>
            `k_1 = \\sqrt{\\frac{f_{ck}}{20}} = \\sqrt{\\frac{${p.fck}}{20}} = ${Math.sqrt(p.fck / 20).toFixed(2)}, \\quad k_2 = n\\,\\frac{\\lambda}{170} = ${p.n_rel.toFixed(3)}\\cdot\\frac{${p.lambda.toFixed(1)}}{170} = ${(p.n_rel * p.lambda / 170).toFixed(4)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `K_c = \\frac{k_1 k_2}{1+\\varphi_{ef}} = \\frac{${Math.sqrt(p.fck / 20).toFixed(2)}\\cdot${(p.n_rel * p.lambda / 170).toFixed(4)}}{1+${p.phi_ef}} = ${p.Kc.toFixed(4)}, \\quad K_s = 1`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `E_{cd} = \\frac{E_{cm}}{\\gamma_{CE}} = \\frac{${p.Ecm / 1000}}{${p.gamma_CE}} = ${(p.Ecd / 1000).toFixed(0)}\\ \\text{GPa}`,
          latexBlock: true,
        },
        { text: 'Tröghetsmomenten (med konvergerat antal 4Ø12 per sida, n = 8 stänger totalt):' },
        {
          latex: (p) =>
            `I_c = \\frac{b\\,h^3}{12} = \\frac{${p.b / 1000}\\cdot${p.h / 1000}^3}{12} = ${(p.Ic * 1e4).toFixed(2)}\\cdot10^{-4}\\ \\text{m}^4`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `I_s = 8\\!\\left[\\frac{\\pi\\phi^4}{64} + \\frac{\\pi\\phi^2}{4}\\!\\left(d-\\frac{h}{2}\\right)^{\\!2}\\right] = ${(p.Is * 1e5).toFixed(3)}\\cdot10^{-5}\\ \\text{m}^4`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `EI = K_c\\,E_{cd}\\,I_c + K_s\\,E_s\\,I_s = ${(p.EI / 1e6).toFixed(3)}\\cdot10^6\\ \\text{Nm}^2`,
          latexBlock: true,
        },
        { text: 'Kritisk knäcklast och andraordningsmoment:' },
        {
          latex: (p) =>
            `N_{cr} = \\frac{\\pi^2 EI}{l_0^2} = \\frac{\\pi^2\\cdot${(p.EI / 1e6).toFixed(2)}\\cdot10^6}{${p.l0.toFixed(2)}^2} = ${p.N_cr_kN.toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\beta = \\frac{\\pi^2}{c_0} = \\frac{\\pi^2}{12} = ${p.beta_fac.toFixed(3)} \\quad (\\text{symmetrisk triangulär momentfördelning})`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Ed} = M_0\\!\\left(1 + \\frac{\\beta}{N_{cr}/N_{Ed}-1}\\right) = ${p.M0.toFixed(2)}\\!\\left(1+\\frac{${p.beta_fac.toFixed(3)}}{${p.N_cr_kN.toFixed(0)}/${p.N_Ed}-1}\\right) = ${p.M_Ed.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Relativa krafter och avläsning ur interaktionsdiagram (RoF figur 3.4):' },
        {
          latex: (p) =>
            `\\nu = \\frac{N_{Ed}}{b\\,d\\,f_{cd}} = \\frac{${p.N_Ed}\\cdot10^3}{${p.b / 1000}\\cdot${p.d_mm / 1000}\\cdot${p.fcd.toFixed(1)}\\cdot10^6} = ${p.nu_rel.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\mu = \\frac{M_{Ed}}{b\\,d^2\\,f_{cd}} = \\frac{${p.M_Ed.toFixed(1)}\\cdot10^3}{${p.b / 1000}\\cdot${(p.d_mm / 1000).toFixed(3)}^2\\cdot${p.fcd.toFixed(1)}\\cdot10^6} = ${p.mu_rel.toFixed(3)}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Avläsning ur figur 3.4: $\\omega = ${p.omega}$`,
        },
        {
          latex: (p) =>
            `A_s = \\omega\\,b\\,d\\,\\frac{f_{cd}}{f_{yd}} = ${p.omega}\\cdot${p.b / 1000}\\cdot${(p.d_mm / 1000).toFixed(3)}\\cdot\\frac{${p.fcd.toFixed(1)}}{${p.fyd}} = ${(p.A_s_req * 1e4).toFixed(2)}\\cdot10^{-4}\\ \\text{m}^2\\ \\text{per sida}`,
          latexBlock: true,
        },
        {
          latex: (p) => {
            const phi_m = p.phi / 1000
            return `n = \\frac{4A_s}{\\pi\\,\\phi^2} = \\frac{4\\cdot${(p.A_s_req * 1e4).toFixed(2)}\\cdot10^{-4}}{\\pi\\cdot${p.phi / 1000}^2} = ${p.n_req.toFixed(1)} \\rightarrow \\textbf{${p.n_bars}\\,Ø${p.phi}\\ \\text{per sida}}`
          },
          latexBlock: true,
        },
      ],
    },
  ],
}
