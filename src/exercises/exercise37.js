import { TIMBER } from '../data/materials.js'

const mat = TIMBER['C24']

export const exercise37 = {
  id: 'ex37',
  title: 'Uppgift 37 – Väggregel C24 45×120, vind som huvudlast',

  derive: (p) => {
    // ── Load combination (wind as main load, STR-B, γd=1.0) ──────────────────
    const G_kh   = p.g_k / Math.cos(p.alpha * Math.PI / 180)  // dead per horiz area
    const q_dv   = p.gam_d * (1.2 * G_kh * p.s + 1.5 * p.psi_sno * p.q_sno_v * p.s + 1.5 * p.q_vind_v * p.s)
    const q_dh   = p.gam_d * (1.2 * G_kh * p.s + 1.5 * p.psi_sno * p.q_sno_h * p.s - 1.5 * p.q_vind_h * p.s)
    const halfL  = p.span / 2
    const R_A    = (q_dv * halfL * (3 * halfL / 2) + q_dh * halfL * (halfL / 2)) / p.span  // kN

    // ── Wind on wall ──────────────────────────────────────────────────────────
    const q_d    = p.gam_d * 1.5 * p.q_vind_vagg * p.s   // kN/m on stud
    const M_Ed   = q_d * p.L ** 2 / 8                     // kNm

    // ── Design strengths ──────────────────────────────────────────────────────
    const f_cd   = p.k_mod * p.fck / p.gam_M              // MPa
    const k_h    = Math.min((150 / p.h) ** 0.2, 1.3)
    const f_md   = p.k_mod * p.fmk / p.gam_M * k_h        // MPa

    // ── Buckling ──────────────────────────────────────────────────────────────
    const i_m    = p.h * 1e-3 / Math.sqrt(12)             // radius of gyration [m]
    const lam    = p.beta * p.L / i_m                     // slenderness
    const lam_rel = lam / Math.PI * Math.sqrt(p.fck / p.E005)
    const k      = 0.5 * (1 + p.beta_c * (lam_rel - 0.3) + lam_rel ** 2)
    const k_c    = 1 / (k + Math.sqrt(k ** 2 - lam_rel ** 2))

    // ── Capacities ────────────────────────────────────────────────────────────
    const A_m2   = p.b * 1e-3 * p.h * 1e-3               // m²
    const N_cRd  = f_cd * 1e6 * A_m2 * k_c / 1e3         // kN
    const W_y    = (p.b * 1e-3) * (p.h * 1e-3) ** 2 / 6  // m³
    const k_crit = 1                                       // braced
    const M_Rd   = f_md * 1e6 * W_y * k_crit / 1e3        // kNm

    // ── Interaction ───────────────────────────────────────────────────────────
    const eta    = R_A / N_cRd + M_Ed / M_Rd

    return { G_kh, q_dv, q_dh, R_A, q_d, M_Ed, f_cd, k_h, f_md, i_m, lam, lam_rel, k, k_c, A_m2, N_cRd, W_y, k_crit, M_Rd, eta }
  },

  params: {
    // Geometry
    span:       9,      // m, total roof span
    alpha:      27,     // degrees, roof pitch
    s:          1.2,    // m, truss/stud spacing (influensbredd)
    L:          2.4,    // m, stud height
    beta:       1.0,    // effective length factor (pin-pin)

    // Characteristic loads (kN/m²)
    g_k:        0.6,    // dead load on slope
    q_sno_v:    0.9,    // snow left (windward) half
    q_sno_h:    0.8,    // snow right (leeward) half
    q_vind_v:   0.5,    // wind on left roof (pressure)
    q_vind_h:   0.35,   // wind on right roof (suction, magnitude)
    q_vind_vagg: 0.5,   // wind on windward wall

    // Combination factors
    psi_sno:    0.6,    // ψ₀ for snow
    gam_d:      1.0,    // γd (safety class 3)

    // Section C24, 45×120 mm
    b:          45,     // mm
    h:          120,    // mm

    // C24 material
    fmk:    mat.fmk,    // 24 MPa
    fck:    mat.fck,    // 21 MPa
    E005:   mat.E005,   // 7400 MPa
    gam_M:  mat.gamma_M, // 1.3
    beta_c: mat.beta_c,  // 0.2
    k_mod:  0.9,        // klimatklass 1, lasttyp S (vind)
  },

  problem: {
    description:
      'En väggregel (C24, 45×120 mm², höjd 2,4 m) bär upp en fribärande takstol med spännvidd 9 m. ' +
      'Takstolarna är placerade med centrumavstånd 1,2 m. Lastvärden är karakteristiska; för snö gäller $\\psi_0 = 0{,}6$. ' +
      'Klimatklass 1, säkerhetsklass 3. Regeln är stagad i veka riktningen. ' +
      'Beräkna dimensionerande normalkraft $P$ (taklast) och transversallast $q_d$ (vind) på regeln, ' +
      'och kontrollera regeln i brottgränstillståndet med vind som huvudlast.',

    figures: [
      { type: 'ex37-house', props: {} },
      {
        type: 'column',
        props: { L: 2.4, N_label: 'P', q_label: 'q_d', support: 'pin', topSupport: 'roller', showDim: true },
      },
    ],
  },

  steps: [
    // ── Step 1: Design load combination → P ───────────────────────────────────
    {
      id: 'P',
      title: 'Dimensionerande normalkraft $P$',
      question: (p) =>
        `Kombinera lasterna med vind som huvudlast (tabell 1.3, 6.10b, $\\gamma_d = ${p.gam_d}$, ` +
        `influensbredd $s = ${p.s}$ m). Beräkna de dimensionerande lasterna på varje takhalva ` +
        `och upplagsreaktionen $R_A = P$ (kN) som normalkraft i regeln.`,

      answer: {
        label: 'P',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.R_A.toFixed(1)),
        hint: (p) =>
          `$G_{k,h} = 0{,}6/\\cos 27° = ${p.G_kh.toFixed(3)}$ kN/m². ` +
          `$q_{d,v} = ${p.q_dv.toFixed(2)}$ kN/m, $q_{d,h} = ${p.q_dh.toFixed(2)}$ kN/m. ` +
          `$R_A = ${p.R_A.toFixed(1)}$ kN.`,
      },

      solution: [
        { text: 'Egentyngd omräknad till horisontell yta:' },
        {
          latex: (p) =>
            `G_{k,h} = \\frac{g_k}{\\cos\\alpha} = \\frac{${p.g_k}}{\\cos 27°} = ${p.G_kh.toFixed(3)}\\ \\text{kN/m}^2`,
          latexBlock: true,
        },
        { text: 'Dimensionerande last per meter balk, vind som huvudlast (6.10b):' },
        {
          latex: (p) => [
            `q_{d,v} = \\gamma_d\\bigl(1{,}2 \\cdot ${p.G_kh.toFixed(3)} \\cdot ${p.s} + 1{,}5 \\cdot ${p.psi_sno} \\cdot ${p.q_sno_v} \\cdot ${p.s} + 1{,}5 \\cdot ${p.q_vind_v} \\cdot ${p.s}\\bigr) = ${p.q_dv.toFixed(2)}\\ \\text{kN/m}`,
            `q_{d,h} = \\gamma_d\\bigl(1{,}2 \\cdot ${p.G_kh.toFixed(3)} \\cdot ${p.s} + 1{,}5 \\cdot ${p.psi_sno} \\cdot ${p.q_sno_h} \\cdot ${p.s} - 1{,}5 \\cdot ${p.q_vind_h} \\cdot ${p.s}\\bigr) = ${p.q_dh.toFixed(2)}\\ \\text{kN/m}`,
          ],
          latexBlock: true,
        },
        { text: 'Momentjämvikt kring höger stöd B (upplagsreaktion vid A är störst):' },
        {
          latex: (p) =>
            `R_A = \\frac{q_{d,v} \\cdot 4{,}5 \\cdot \\frac{3 \\cdot 4{,}5}{2} + q_{d,h} \\cdot 4{,}5 \\cdot \\frac{4{,}5}{2}}{9} = ` +
            `\\frac{${p.q_dv.toFixed(2)} \\cdot 4{,}5 \\cdot 6{,}75 + ${p.q_dh.toFixed(2)} \\cdot 4{,}5 \\cdot 2{,}25}{9} = ${p.R_A.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 2: Wind load on wall → M_Ed ──────────────────────────────────────
    {
      id: 'M_Ed',
      title: 'Transversallast och dimensionerande moment $M_{Ed}$',
      question: (p) =>
        `Beräkna den dimensionerande vindlasten $q_d$ (kN/m) på regeln och det dimensionerande ` +
        `böjmomentet $M_{Ed}$ (kNm). Regeln är fritt upplagd, längd $L = ${p.L}$ m.`,

      answer: {
        label: 'M_{Ed}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_Ed.toFixed(3)),
        hint: (p) =>
          `$q_d = 1{,}5 \\cdot ${p.q_vind_vagg} \\cdot ${p.s} = ${p.q_d.toFixed(2)}$ kN/m. ` +
          `$M_{Ed} = q_d L^2/8 = ${p.M_Ed.toFixed(3)}$ kNm.`,
      },

      solution: [
        { text: 'Dimensionerande vindlast på regeln (vind är huvudlast, lovartssida):' },
        {
          latex: (p) =>
            `q_d = \\gamma_d \\cdot 1{,}5 \\cdot q_{k,vind} \\cdot s = ${p.gam_d} \\cdot 1{,}5 \\cdot ${p.q_vind_vagg} \\cdot ${p.s} = ${p.q_d.toFixed(2)}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        { text: 'Dimensionerande moment (fritt upplagd balk):' },
        {
          latex: (p) =>
            `M_{Ed} = \\frac{q_d L^2}{8} = \\frac{${p.q_d.toFixed(2)} \\cdot ${p.L}^2}{8} = ${p.M_Ed.toFixed(3)}\\ \\text{kNm}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 3: Buckling + interaction check ──────────────────────────────────
    {
      id: 'eta',
      title: 'Knäckning och interaktionskontroll',
      question: (p) =>
        `Beräkna dimensionerande hållfastheter ($f_{cd}$, $f_{md}$ med storlekseffekten $k_h$), ` +
        `knäckreduktionsfaktorn $k_c$ och kontrollera regeln med ` +
        `$N_{Ed}/N_{c,Rd} + M_{Ed}/M_{c,Rd} \\leq 1$. Ange utnyttjandegraden (–).`,

      answer: {
        label: 'N_{Ed}/N_{c,Rd}+M_{Ed}/M_{c,Rd}',
        unit: '–',
        getCorrect: (p) => parseFloat(p.eta.toFixed(2)),
        hint: (p) =>
          `$f_{cd} = ${p.f_cd.toFixed(2)}$ MPa, $f_{md} = ${p.f_md.toFixed(2)}$ MPa. ` +
          `$\\lambda_{rel} = ${p.lam_rel.toFixed(3)}$, $k_c = ${p.k_c.toFixed(2)}$. ` +
          `$N_{c,Rd} = ${p.N_cRd.toFixed(1)}$ kN, $M_{Rd} = ${p.M_Rd.toFixed(2)}$ kNm. ` +
          `$\\eta = ${p.eta.toFixed(2)}$.`,
      },

      resultCheck: (p) => ({
        ok: p.eta <= 1,
        latex:
          `\\frac{${p.R_A.toFixed(1)}}{${p.N_cRd.toFixed(1)}} + \\frac{${p.M_Ed.toFixed(3)}}{${p.M_Rd.toFixed(2)}} = ` +
          `${p.eta.toFixed(2)} ${p.eta <= 1 ? '\\leq' : '>'} 1 \\quad ` +
          `${p.eta <= 1 ? '\\Rightarrow \\textbf{Regeln klarar lasten!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
      }),

      solution: [
        { text: 'Dimensionerande hållfastheter ($k_{mod} = 0{,}9$, klimatklass 1, vind):' },
        {
          latex: (p) =>
            `f_{cd} = \\frac{k_{mod}\\,f_{ck}}{\\gamma_M} = \\frac{${p.k_mod} \\cdot ${p.fck}}{${p.gam_M}} = ${p.f_cd.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: (p) => `Storlekseffekt ($h = ${p.h}$ mm $\\leq 150$ mm):` },
        {
          latex: (p) =>
            `k_h = \\min\\!\\left(\\left(\\frac{150}{${p.h}}\\right)^{\\!0{,}2},\\ 1{,}3\\right) = ${p.k_h.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `f_{md} = \\frac{k_{mod}\\,f_{mk}}{\\gamma_M}\\,k_h = \\frac{${p.k_mod} \\cdot ${p.fmk}}{${p.gam_M}} \\cdot ${p.k_h.toFixed(3)} = ${p.f_md.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Knäckreduktionsfaktor ($\\beta = 1{,}0$, stagad i veka riktningen):' },
        {
          latex: (p) =>
            `i = \\frac{h}{\\sqrt{12}} = \\frac{${p.h / 1000}}{\\sqrt{12}} = ${p.i_m.toFixed(4)}\\ \\text{m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda = \\frac{\\beta L}{i} = \\frac{${p.beta} \\cdot ${p.L}}{${p.i_m.toFixed(4)}} = ${p.lam.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{rel} = \\frac{\\lambda}{\\pi}\\sqrt{\\frac{f_{ck}}{E_{0{,}05}}} = ` +
            `\\frac{${p.lam.toFixed(2)}}{\\pi}\\sqrt{\\frac{${p.fck}}{${p.E005}}} = ${p.lam_rel.toFixed(3)} \\geq 0{,}3 \\rightarrow \\text{knäckning aktuell}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k = 0{,}5\\bigl(1 + ${p.beta_c}(${p.lam_rel.toFixed(3)}-0{,}3)+${p.lam_rel.toFixed(3)}^2\\bigr) = ${p.k.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k_c = \\frac{1}{k+\\sqrt{k^2-\\lambda_{rel}^2}} = \\frac{1}{${p.k.toFixed(3)}+\\sqrt{${p.k.toFixed(3)}^2-${p.lam_rel.toFixed(3)}^2}} = ${p.k_c.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Kapaciteter:' },
        {
          latex: (p) =>
            `N_{c,Rd} = f_{cd}\\,A\\,k_c = ${p.f_cd.toFixed(2)} \\cdot 10^6 \\cdot ${p.b/1000} \\cdot ${p.h/1000} \\cdot ${p.k_c.toFixed(2)} = ${p.N_cRd.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `W_y = \\frac{bh^2}{6} = \\frac{${p.b/1000} \\cdot ${p.h/1000}^2}{6} = ${(p.W_y * 1e6).toFixed(2)} \\cdot 10^{-6}\\ \\text{m}^3`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{c,Rd} = f_{md}\\,W_y\\,k_{crit} = ${p.f_md.toFixed(2)} \\cdot 10^6 \\cdot ${(p.W_y * 1e6).toFixed(2)} \\cdot 10^{-6} \\cdot 1 = ${p.M_Rd.toFixed(2)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Interaktionskontroll:' },
        {
          latex: (p) =>
            `\\frac{N_{Ed}}{N_{c,Rd}} + \\frac{M_{Ed}}{M_{c,Rd}} = ` +
            `\\frac{${p.R_A.toFixed(1)}}{${p.N_cRd.toFixed(1)}} + \\frac{${p.M_Ed.toFixed(3)}}{${p.M_Rd.toFixed(2)}} = ${p.eta.toFixed(2)} \\leq 1 \\quad \\Rightarrow \\textbf{OK!}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
