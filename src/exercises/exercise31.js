import { VKR_SECTIONS } from '../data/sections.js'
import { STEEL, GLULAM, CONCRETE, REBAR } from '../data/materials.js'

const vkr    = VKR_SECTIONS['VKR100x60-4']  // h=100, b=60, t=4, A=1200, iy=36.3, iz=24.3
const steel  = STEEL['S275']                 // fy=275, E=210000, γM1=1.0
const glulam = GLULAM['GL30c']               // γM=1.25
const conc   = CONCRETE['C20']               // fck=20, fcd=13.3, Ecm=30000
const rebar  = REBAR['K500B-T']              // fyd=435

// GL30c characteristic compressive strength parallel to grain (EN 14080 table)
const fc0k_GL30c = 24.5   // MPa
const E005_GL30c = 10800  // MPa, E0,05

// ── RC cross-section: 200×200 mm, 4Ø16 (one per corner) ─────────────────
const b_rc = 200
const h_rc = 200
// cnom = cmin + Δcdev = max(10,16)+10 = 26 mm → bar centre at 26+8 = 34 mm from face
const _f_rc = 34 / b_rc
const rebars31c = [
  { x: _f_rc,     y: _f_rc     },
  { x: 1 - _f_rc, y: _f_rc     },
  { x: _f_rc,     y: 1 - _f_rc },
  { x: 1 - _f_rc, y: 1 - _f_rc },
]

export const exercise31 = {
  id: 'ex31',
  title: 'Uppgift 31 – Knäckning, pelare av stål, limträ och betong',

  derive: (p) => {
    const L_cr = p.beta * p.L   // knäcklängd, m

    // ── a) VKR 100×60-4, S275 ────────────────────────────────────────────────
    const eps_s   = Math.sqrt(235 / p.fy)
    const ct_web  = (p.h_s - 2 * p.t_s) / p.t_s
    const ct_fl   = (p.b_s - 2 * p.t_s) / p.t_s
    const lim42   = 42 * eps_s

    const iy_m   = p.iy_s * 1e-3                                  // m
    const lam_a  = L_cr / (iy_m * Math.PI) * Math.sqrt(p.fy / p.E_s)
    const phi_a  = 0.5 * (1 + p.alpha_s * (lam_a - 0.2) + lam_a ** 2)
    const chi_a  = 1 / (phi_a + Math.sqrt(phi_a ** 2 - lam_a ** 2))
    const N_bRd  = chi_a * p.fy * 1e6 * p.A_s * 1e-6 / p.gM1 / 1e3  // kN

    // ── b) GL30c 90×180, klimatklass 2, lasttyp L ─────────────────────────────
    const fcd_gl = p.kmod_gl * p.fc0k / p.gM_gl        // MPa, design compressive strength
    const i_gl   = p.h_gl / 1000 / Math.sqrt(12)       // m, gyration radius (strong axis)
    const lam_gl = L_cr / i_gl                          // slankhet
    const lam_rel_gl = lam_gl / Math.PI * Math.sqrt(p.fc0k / p.E005)
    const k_gl   = 0.5 * (1 + p.betac * (lam_rel_gl - 0.3) + lam_rel_gl ** 2)
    const kc_gl  = 1 / (k_gl + Math.sqrt(k_gl ** 2 - lam_rel_gl ** 2))
    const N_cRd_gl = fcd_gl * 1e6 * (p.b_gl / 1000) * (p.h_gl / 1000) * kc_gl / 1e3  // kN

    // ── c) Betong C20, K500B-T, 200×200, 4Ø16, φef = 2 ─────────────────────
    // Täckande betongskikt och effektivt djup
    const c_nom_c = Math.max(10, p.phi_c) + p.dcdev        // mm
    const d_c     = p.h_c - c_nom_c - p.phi_c / 2          // mm
    const d_m     = d_c / 1000                              // m
    const h_m     = p.h_c / 1000                            // m

    // Geometrisk imperfektion
    const e_i  = L_cr / 400                                 // m
    const M0   = p.N_Ed * e_i                               // kNm

    // Slankhet
    const i_c     = h_m / Math.sqrt(12)                     // m
    const lam_c   = L_cr / i_c                              // slankhet

    // λlim (EC2 ekv. 5.13N)
    const As_c    = p.n_c * Math.PI * (p.phi_c / 1000) ** 2 / 4   // m²
    const Ac_c    = h_m * h_m                               // m²
    const A_fac   = 1 / (1 + 0.2 * p.phi_ef)
    const omega_c = As_c * rebar.fyd / (Ac_c * p.fcd_c)
    const B_fac   = Math.sqrt(1 + 2 * omega_c)
    const C_fac   = 1.7 - p.rm                              // rm=1 (enkel krökning)
    const n_val   = p.N_Ed * 1e3 / (Ac_c * p.fcd_c * 1e6)
    const lam_lim = 20 * A_fac * B_fac * C_fac / Math.sqrt(n_val)

    // Andra ordningens böjstyvhet (nominell styvhetsmetod)
    // ρ = As/Ac ≥ 0.01 → Kc = 0.3/(1+0.5φef), Ks = 0
    const rho_c = As_c / Ac_c
    const Kc_c  = 0.3 / (1 + 0.5 * p.phi_ef)
    const Ecd_c = p.Ecm_c * 1e6 / p.gCE                    // Pa
    const Ic_c  = h_m ** 4 / 12                             // m⁴
    const EI_c  = Kc_c * Ecd_c * Ic_c                      // N·m²
    const N_cr  = Math.PI ** 2 * EI_c / L_cr ** 2 / 1e3   // kN

    // Förstärkt moment (EC2 ekv. 5.28, parabolisk momentfördelning → β = π²/9.6)
    const beta_f = Math.PI ** 2 / 9.6
    const M_Ed  = M0 * (1 + beta_f / (N_cr / p.N_Ed - 1))  // kNm

    // Interaktionsdiagramkontroll
    const nu_c  = p.N_Ed * 1e3 / (h_m * d_m * p.fcd_c * 1e6)
    const mu_c  = M_Ed * 1e3 / (h_m * d_m ** 2 * p.fcd_c * 1e6)

    return {
      L_cr,
      // a
      eps_s, ct_web, ct_fl, lim42,
      lam_a, phi_a, chi_a, N_bRd,
      // b
      fcd_gl, i_gl, lam_gl, lam_rel_gl, k_gl, kc_gl, N_cRd_gl,
      // c
      c_nom_c, d_c, d_m, h_m, e_i, M0,
      i_c, lam_c, As_c, Ac_c, A_fac, omega_c, B_fac, C_fac, n_val, lam_lim,
      rho_c, Kc_c, Ecd_c, Ic_c, EI_c, N_cr,
      beta_f, M_Ed, nu_c, mu_c,
    }
  },

  params: {
    N_Ed: 50,          // kN
    L:    6.5,         // m
    beta: 1,           // ledat infäst i båda ändar

    // a) VKR 100×60-4, S275
    h_s:     vkr.h,        // 100 mm
    b_s:     vkr.b,        //  60 mm
    t_s:     vkr.t,        //   4 mm
    A_s:     vkr.A,        // 1200 mm²
    iy_s:    vkr.iy,       //  36.3 mm (stark axel – vek riktning stagad)
    fy:      steel.fy,     // 275 MPa
    E_s:     steel.E,      // 210 000 MPa
    gM1:     steel.gamma_M1,  // 1.0
    alpha_s: 0.21,         // knäckningskurva a (varmformade rör, S275)

    // b) GL30c 90×180, klimatklass 2, lasttyp L
    h_gl:    180,              // mm (stark axel, pelaren stagad i vek riktning)
    b_gl:     90,              // mm
    fc0k:    fc0k_GL30c,       // 24.5 MPa
    E005:    E005_GL30c,       // 10800 MPa
    gM_gl:   glulam.gamma_M,   // 1.25
    kmod_gl: 0.7,              // klimatklass 2, lasttyp L
    betac:   0.1,              // β_c (limträ)

    // c) Betong C20, K500B-T, 200×200, 4Ø16
    h_c:     200,             // mm
    b_c:     200,             // mm
    phi_c:    16,             // mm, armeringsdiameter
    n_c:       4,             // antal armeringsjärn
    fcd_c:   conc.fcd,        // 13.3 MPa
    Ecm_c:   conc.Ecm,        // 30 000 MPa
    gCE:     1.2,             // γ_CE
    phi_ef:  2.0,             // effektivt kryptal
    dcdev:   10,              // mm, Δc_dev
    rm:      1,               // momentkvot (enkel krökning)
  },

  problem: {
    description:
      'Bestäm erforderlig dimension för pelaren under följande tre förutsättningar. ' +
      'Dimensionerande normalkraft $P_d = 50$ kN, pelarlängd $L = 6{,}5$ m, ' +
      'ledat infäst i båda ändar ($\\beta = 1$). ' +
      'Pelaren är stagad i veka riktningen. ' +
      'a) VKR-tvärsnitt av stål S275. ' +
      'b) Limträtvärsnitt GL30c, klimatklass 2, lasttyp L. ' +
      'c) Armerat betongtvärsnitt, betong C20, K500B-T, $\\varphi_{ef} = 2$.',

    figures: [
      {
        type: 'column',
        props: { L: 6.5, N_label: 'P_d', q_label: '', support: 'pin', topSupport: 'roller', showDim: true },
      },
    ],
  },

  steps: [

    // ── Steg 1a: Stål VKR 100×60-4 ─────────────────────────────────────────
    {
      id: 'N_bRd_steel',
      title: 'Steg 1a – Normalkraftskapacitet, stål VKR 100×60-4',
      question:
        'Prova VKR 100×60-4 i S275. ' +
        'Kontrollera att tvärsnittet tillhör minst klass 3. ' +
        'Beräkna slankhetstalet $\\bar{\\lambda}$ (knäckning om stark axeln, pelaren stagad i vek riktning) ' +
        'och reduktionsfaktorn $\\chi$ (knäckningskurva a, $\\alpha = 0{,}21$). ' +
        'Beräkna normalkraftskapaciteten $N_{b,Rd}$ (kN).',

      figures: [
        {
          type: 'steel-section',
          props: { ...vkr },
        },
      ],

      answer: {
        label: 'N_{b,Rd}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_bRd.toFixed(1)),
        hint: (p) =>
          `$\\varepsilon = ${p.eps_s.toFixed(3)}$, $c/t = ${p.ct_web.toFixed(0)} \\leq 42\\varepsilon = ${p.lim42.toFixed(1)}$ OK. ` +
          `$\\bar{\\lambda} = L_{cr}/(i_y\\pi)\\sqrt{f_y/E_s} = ${p.lam_a.toFixed(3)}$, ` +
          `$\\chi = ${p.chi_a.toFixed(4)}$.`,
      },

      resultCheck: (p) => {
        const ok = p.N_bRd >= p.N_Ed
        return {
          ok,
          latex:
            `N_{b,Rd} = ${p.N_bRd.toFixed(1)}\\ \\text{kN} ` +
            `${ok ? '\\geq' : '<'} ` +
            `P_d = ${p.N_Ed}\\ \\text{kN} \\quad ` +
            `${ok ? '\\Rightarrow \\textbf{OK! — Välj VKR 100×60-4}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        { text: 'Kontrollera att tvärsnittet tillhör minst klass 3:' },
        {
          latex: (p) =>
            `\\varepsilon = \\sqrt{\\frac{235}{${p.fy}}} = ${p.eps_s.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\frac{c}{t} = \\frac{${p.h_s}-2\\cdot${p.t_s}}{${p.t_s}} = ${p.ct_web.toFixed(0)} \\leq 42\\varepsilon = ${p.lim42.toFixed(2)} \\quad \\checkmark`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\frac{c}{t} = \\frac{${p.b_s}-2\\cdot${p.t_s}}{${p.t_s}} = ${p.ct_fl.toFixed(0)} \\leq ${p.lim42.toFixed(2)} \\quad \\checkmark`,
          latexBlock: true,
        },
        { text: 'Knäcklängd (ledat i båda ändar, β = 1):' },
        {
          latex: (p) =>
            `L_{cr} = \\beta L = ${p.beta}\\cdot${p.L} = ${p.L_cr.toFixed(1)}\\ \\text{m}`,
          latexBlock: true,
        },
        { text: 'Relativ slankhet (knäckning om stark axeln y, pelaren stagad i vek z-riktning):' },
        {
          latex: (p) =>
            `\\bar{\\lambda} = \\frac{L_{cr}}{i_y\\,\\pi}\\sqrt{\\frac{f_y}{E_s}} = ` +
            `\\frac{${p.L_cr.toFixed(1)}}{${p.iy_s}\\cdot10^{-3}\\cdot\\pi}\\sqrt{\\frac{${p.fy}}{${(p.E_s/1000).toFixed(0)}\\,000}} = ${p.lam_a.toFixed(4)} \\geq 0{,}2`,
          latexBlock: true,
        },
        { text: 'Knäckningskurva a (varmformade rör, S275) → α = 0,21:' },
        {
          latex: (p) =>
            `\\phi = 0{,}5\\bigl(1+${p.alpha_s}(${p.lam_a.toFixed(4)}-0{,}2)+${p.lam_a.toFixed(4)}^2\\bigr) = ${p.phi_a.toFixed(4)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\chi = \\frac{1}{\\phi+\\sqrt{\\phi^2-\\bar{\\lambda}^2}} = ` +
            `\\frac{1}{${p.phi_a.toFixed(4)}+\\sqrt{${p.phi_a.toFixed(4)}^2-${p.lam_a.toFixed(4)}^2}} = ${p.chi_a.toFixed(4)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet vid knäckning (tryck):' },
        {
          latex: (p) =>
            `N_{b,Rd} = \\frac{\\chi f_y A}{\\gamma_{M1}} = ` +
            `\\frac{${p.chi_a.toFixed(4)}\\cdot${p.fy}\\cdot10^6\\cdot${p.A_s}\\cdot10^{-6}}{${p.gM1}} = ${p.N_bRd.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 2b: Limträ GL30c 90×180 ────────────────────────────────────────
    {
      id: 'N_cRd_gl',
      title: 'Steg 2b – Normalkraftskapacitet, limträ GL30c 90×180',
      question:
        'Prova GL30c 90×180 mm i klimatklass 2 och lasttyp L. ' +
        'Beräkna reduktionsfaktorn för knäckning $k_c$ (pelaren stagad i vek riktning → knäckning om stark axeln med $h = 180$ mm). ' +
        'Beräkna normalkraftskapaciteten $N_{c,Rd}$ (kN).',

      figures: [
        {
          type: 'glulam-section',
          props: { b: 90, h: 180, laminationThickness: 45 },
        },
      ],

      answer: {
        label: 'N_{c,Rd}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_cRd_gl.toFixed(1)),
        hint: (p) =>
          `$f_{c,0,d} = k_{mod}\\,f_{c0k}/\\gamma_M = ${p.kmod_gl}\\cdot24{,}5/1{,}25 = ${p.fcd_gl.toFixed(2)}$ MPa. ` +
          `$i = h/\\sqrt{12}$, $\\lambda = L_{cr}/i$, $\\lambda_{rel} = \\lambda/\\pi\\sqrt{f_{c0k}/E_{0,05}}$. ` +
          `$\\beta_c = 0{,}1$ (limträ).`,
      },

      resultCheck: (p) => {
        const ok = p.N_cRd_gl >= p.N_Ed
        return {
          ok,
          latex:
            `N_{c,Rd} = ${p.N_cRd_gl.toFixed(1)}\\ \\text{kN} ` +
            `${ok ? '\\geq' : '<'} ` +
            `P_d = ${p.N_Ed}\\ \\text{kN} \\quad ` +
            `${ok ? '\\Rightarrow \\textbf{OK! — Välj GL30c 90×180}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        { text: 'Material- och tvärsnittsegenskaper:' },
        {
          latex: (p) =>
            `f_{c,0,d} = \\frac{k_{mod}\\,f_{c,0,k}}{\\gamma_M} = ` +
            `\\frac{${p.kmod_gl}\\cdot${p.fc0k}}{${p.gM_gl}} = ${p.fcd_gl.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Gyrationradien för stark axeln (h = 180 mm, pelaren stagad i vek b-riktning):' },
        {
          latex: (p) =>
            `i = \\frac{h}{\\sqrt{12}} = \\frac{${p.h_gl}\\cdot10^{-3}}{\\sqrt{12}} = ${(p.i_gl * 1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda = \\frac{\\beta L}{i} = \\frac{${p.beta}\\cdot${p.L}}{${(p.i_gl).toFixed(5)}} = ${p.lam_gl.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{rel} = \\frac{\\lambda}{\\pi}\\sqrt{\\frac{f_{c,0,k}}{E_{0,05}}} = ` +
            `\\frac{${p.lam_gl.toFixed(3)}}{\\pi}\\sqrt{\\frac{${p.fc0k}}{${p.E005}}} = ${p.lam_rel_gl.toFixed(4)} \\geq 0{,}3`,
          latexBlock: true,
        },
        { text: 'Knäckreduktionsfaktor (β_c = 0,1 för limträ):' },
        {
          latex: (p) =>
            `k = 0{,}5\\bigl(1+${p.betac}(${p.lam_rel_gl.toFixed(4)}-0{,}3)+${p.lam_rel_gl.toFixed(4)}^2\\bigr) = ${p.k_gl.toFixed(4)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k_c = \\frac{1}{k+\\sqrt{k^2-\\lambda_{rel}^2}} = ` +
            `\\frac{1}{${p.k_gl.toFixed(4)}+\\sqrt{${p.k_gl.toFixed(4)}^2-${p.lam_rel_gl.toFixed(4)}^2}} = ${p.kc_gl.toFixed(3)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet vid knäckning (tryck):' },
        {
          latex: (p) =>
            `N_{c,Rd} = f_{c,0,d}\\,A\\,k_c = ` +
            `${p.fcd_gl.toFixed(2)}\\cdot10^6\\cdot${p.b_gl/1000}\\cdot${p.h_gl/1000}\\cdot${p.kc_gl.toFixed(3)} = ${p.N_cRd_gl.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 3c: Betong C20, K500B-T, 200×200, 4Ø16 ─────────────────────────
    {
      id: 'M_Ed_conc',
      title: 'Steg 3c – Normalkraft + andra ordningens effekter, betong C20',
      question:
        'Prova ett betongtvärsnitt 200×200 mm² med ett armeringsjärn $\\phi 16$ K500B-T i varje hörn. ' +
        'Kontrollera om andra ordningens effekter måste beaktas ($\\lambda$ vs $\\lambda_{lim}$). ' +
        'Beräkna det dimensionerande momentet $M_{Ed}$ (kNm) inklusive geometrisk imperfektion och andra ordningens förstärkning.',

      figures: [
        {
          type: 'rect-section',
          props: {
            b:         b_rc,
            h:         h_rc,
            rebars:    rebars31c,
            rebarDia:  16,
            fillColor: '#e8e8e8',
          },
        },
      ],

      answer: {
        label: 'M_{Ed}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_Ed.toFixed(3)),
        hint: (p) =>
          `$e_i = l_0/400 = ${p.L_cr.toFixed(1)}/400 = ${(p.e_i * 1000).toFixed(2)}$ mm, ` +
          `$M_0 = P_d\\cdot e_i = ${p.M0.toFixed(4)}$ kNm. ` +
          `$\\lambda = ${p.lam_c.toFixed(1)} > \\lambda_{lim} = ${p.lam_lim.toFixed(1)}$ → andra ordningen. ` +
          `$N_{cr} = ${p.N_cr.toFixed(1)}$ kN.`,
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `\\frac{N}{b\\,d\\,f_{cd}} = ${p.nu_c.toFixed(2)},\\quad ` +
          `\\frac{M}{b\\,d^2 f_{cd}} = ${p.mu_c.toFixed(2)} ` +
          `\\Rightarrow \\omega = 0 \\Rightarrow A_s = 0 \\quad \\Rightarrow \\textbf{OK!}\\text{ (minimiarmerng väljs)}`,
      }),

      solution: [
        { text: 'Täckande betongskikt och effektivt djup (EC2 avsnitt 3.9):' },
        {
          latex: (p) =>
            `c_{nom} = c_{min} + \\Delta c_{dev} = \\max(10,\\,${p.phi_c})+${p.dcdev} = ${p.c_nom_c}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `d = h - c_{nom} - \\frac{\\phi}{2} = ${p.h_c}-${p.c_nom_c}-\\frac{${p.phi_c}}{2} = ${p.d_c}\\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Geometrisk imperfektion:' },
        {
          latex: (p) =>
            `e_i = \\frac{l_0}{400} = \\frac{${p.L_cr.toFixed(1)}}{400} = ${(p.e_i * 1000).toFixed(2)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_0 = P_d\\cdot e_i = ${p.N_Ed}\\cdot${(p.e_i).toFixed(5)} = ${p.M0.toFixed(4)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Beräkning av λ och λlim (EC2 ekv. 5.13N):' },
        {
          latex: (p) =>
            `i = \\frac{h}{\\sqrt{12}} = \\frac{${p.h_c/1000}}{\\sqrt{12}} = ${(p.i_c * 1000).toFixed(1)}\\ \\text{mm}, \\quad ` +
            `\\lambda = \\frac{\\beta L}{i} = \\frac{${p.L_cr.toFixed(1)}}{${(p.i_c).toFixed(4)}} = ${p.lam_c.toFixed(1)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `A = \\frac{1}{1+0{,}2\\varphi_{ef}} = \\frac{1}{1+0{,}2\\cdot${p.phi_ef}} = ${p.A_fac.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\omega = \\frac{A_s f_{yd}}{A_c f_{cd}} = ` +
            `\\frac{4\\cdot\\frac{\\pi\\cdot${p.phi_c}^2}{4}\\cdot${rebar.fyd}}{${p.h_c}^2\\cdot${p.fcd_c}} = ${p.omega_c.toFixed(4)}, \\quad B = \\sqrt{1+2\\omega} = ${p.B_fac.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `r_m = 1 \\Rightarrow C = 1{,}7 - r_m = 0{,}7, \\quad n = \\frac{N_{Ed}}{A_c f_{cd}} = \\frac{${p.N_Ed}\\cdot10^3}{${p.h_c/1000}^2\\cdot${p.fcd_c}\\cdot10^6} = ${p.n_val.toFixed(5)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{lim} = \\frac{20\\,A\\,B\\,C}{\\sqrt{n}} = ` +
            `\\frac{20\\cdot${p.A_fac.toFixed(3)}\\cdot${p.B_fac.toFixed(3)}\\cdot0{,}7}{\\sqrt{${p.n_val.toFixed(5)}}} = ${p.lam_lim.toFixed(1)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda = ${p.lam_c.toFixed(1)} \\geq \\lambda_{lim} = ${p.lam_lim.toFixed(1)} \\quad \\Rightarrow \\text{Andra ordningens effekter måste beaktas!}`,
          latexBlock: true,
        },
        { text: 'Böjstyvhet (nominell styvhetsmetod, ρ ≥ 0,01 → Kc = 0,3/(1+0,5φef), Ks = 0):' },
        {
          latex: (p) =>
            `K_c = \\frac{0{,}3}{1+0{,}5\\varphi_{ef}} = \\frac{0{,}3}{1+0{,}5\\cdot${p.phi_ef}} = ${p.Kc_c.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `E_{cd} = \\frac{E_{cm}}{\\gamma_{CE}} = \\frac{${p.Ecm_c/1000}}{${p.gCE}} = ${(p.Ecd_c/1e9).toFixed(0)}\\ \\text{GPa}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `I_c = \\frac{b h^3}{12} = \\frac{${p.h_c/1000}\\cdot${p.h_c/1000}^3}{12} = ${(p.Ic_c).toExponential(3)}\\ \\text{m}^4`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `EI = K_c\\,E_{cd}\\,I_c = ${p.Kc_c.toFixed(2)}\\cdot${(p.Ecd_c/1e9).toFixed(0)}\\cdot10^9\\cdot${(p.Ic_c).toExponential(3)} = ${(p.EI_c/1e3).toFixed(0)}\\cdot10^3\\ \\text{Nm}^2`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `N_{cr} = \\frac{\\pi^2 EI}{(\\beta L)^2} = \\frac{\\pi^2\\cdot${(p.EI_c/1e3).toFixed(0)}\\cdot10^3}{${p.L_cr.toFixed(1)}^2} = ${p.N_cr.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
        { text: 'Förstärkt dimensionerande moment (parabolisk momentfördelning → β = π²/9,6):' },
        {
          latex: (p) =>
            `\\beta = \\frac{\\pi^2}{c_0} = \\frac{\\pi^2}{9{,}6} = ${p.beta_f.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Ed} = M_0\\!\\left(1 + \\frac{\\beta}{N_{cr}/N_{Ed}-1}\\right) = ` +
            `${p.M0.toFixed(4)}\\!\\left(1 + \\frac{${p.beta_f.toFixed(3)}}{${p.N_cr.toFixed(1)}/${p.N_Ed}-1}\\right) = ${p.M_Ed.toFixed(3)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Kontroll med interaktionsdiagram (fig. 3.3):' },
        {
          latex: (p) =>
            `\\frac{N}{b\\,d\\,f_{cd}} = \\frac{${p.N_Ed}\\cdot10^3}{${p.h_c/1000}\\cdot${p.d_c/1000}\\cdot${p.fcd_c}\\cdot10^6} = ${p.nu_c.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\frac{M}{b\\,d^2 f_{cd}} = \\frac{${p.M_Ed.toFixed(3)}\\cdot10^3}{${p.h_c/1000}\\cdot${p.d_c/1000}^2\\cdot${p.fcd_c}\\cdot10^6} = ${p.mu_c.toFixed(2)}`,
          latexBlock: true,
        },
        {
          text:
            'Avläsning i figur 3.3 ger $\\omega = 0 \\Rightarrow A_s = 0$ — armeringen behövs ej för lastkapaciteten. ' +
            'Välj ändå **200×200 mm², 1Ø16 i varje hörn** av praktiska skäl (minimiarmering, gjutbarhet).',
        },
      ],
    },
  ],
}
