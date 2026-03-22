import { VKR_SECTIONS } from '../data/sections.js'
import { STEEL, GLULAM, CONCRETE, REBAR } from '../data/materials.js'

const vkr     = VKR_SECTIONS['VKR120x60-6.3']
const steel   = STEEL['S275']
const glulam  = GLULAM['GL30c']
const conc    = CONCRETE['C20']
const rebar   = REBAR['K500B-T']

// RC cross-section: 220×220, 4Ø12 at corners
// c_nom = 22 mm, d = 192 mm → bar centre 28 mm from each face
const _f = 28 / 220
const rebars35c = [
  { x: _f,     y: _f     },
  { x: 1 - _f, y: _f     },
  { x: _f,     y: 1 - _f },
  { x: 1 - _f, y: 1 - _f },
]

export const exercise35 = {
  id: 'ex35',
  title: 'Uppgift 35 – Pelar med N+M: stål, limträ och betong',

  derive: (p) => {
    // ── Part a) VKR 120×60-6.3, S275 ────────────────────────────────────────
    const E_Pa  = p.E_s  * 1e6
    const fy_Pa = p.fy   * 1e6
    const A_m2  = p.A_s  * 1e-6    // mm² → m²
    const Iy_m4 = p.Iy_s * 1e-12   // mm⁴ → m⁴
    const Wy_m3 = p.Wy_s * 1e-9    // mm³ → m³
    const iy_m  = p.iy_s * 1e-3    // mm → m

    const eps_s  = Math.sqrt(235 / p.fy)
    const ct_web = (p.h_s - 2*p.t_s) / p.t_s    // (h-2t)/t
    const ct_fl  = (p.b_s - 2*p.t_s) / p.t_s    // (b-2t)/t
    const lim42  = 42 * eps_s
    const lim14  = 14 * eps_s

    const L_cr   = p.beta * p.L                   // m, knäcklängd
    const lam_a  = L_cr / (iy_m * Math.PI) * Math.sqrt(fy_Pa / E_Pa)
    const phi_a  = 0.5 * (1 + p.alpha_s * (lam_a - 0.2) + lam_a**2)
    const chi_a  = 1 / (phi_a + Math.sqrt(phi_a**2 - lam_a**2))
    const N_bRd  = chi_a * fy_Pa * A_m2 / p.gM1 / 1e3    // kN

    const N_cr_a = Math.PI**2 * E_Pa * Iy_m4 / L_cr**2 / 1e3  // kN
    const v_a    = N_cr_a / p.N_Ed
    const M_Ed_a = p.M0_Ed * v_a / (v_a - 1)                   // kNm
    const M_cRd  = Wy_m3 * fy_Pa / p.gM0 / 1e3                 // kNm
    const eta_a  = p.N_Ed / N_bRd + M_Ed_a / M_cRd

    // ── Part b) GL30c 90×225 ─────────────────────────────────────────────────
    const h_gl_m = p.h_gl / 1000
    const b_gl_m = p.b_gl / 1000
    const fcd_b  = p.kmod * p.fck_gl / p.gMgl                  // MPa
    const k_h    = Math.min((600 / p.h_gl)**0.1, 1.1)
    const fmd_b  = p.kmod * p.fmk * k_h / p.gMgl              // MPa

    const i_b        = h_gl_m / Math.sqrt(12)
    const lambda_b   = L_cr / i_b
    const lam_rel_b  = lambda_b / Math.PI * Math.sqrt(p.fck_gl / p.E005)
    const k_b        = 0.5 * (1 + p.betac * (lam_rel_b - 0.3) + lam_rel_b**2)
    const k_c        = 1 / (k_b + Math.sqrt(k_b**2 - lam_rel_b**2))

    const N_cRd_b = fcd_b * 1e6 * b_gl_m * h_gl_m * k_c / 1e3  // kN
    const W_y_b   = b_gl_m * h_gl_m**2 / 6                       // m³
    const M_Rd_b  = fmd_b * 1e6 * W_y_b / 1e3                   // kNm (k_crit=1)
    const eta_b   = p.N_Ed / N_cRd_b + p.M0_Ed / M_Rd_b

    // ── Part c) RC 220×220, 4Ø12 ─────────────────────────────────────────────
    const fcd_c_Pa = p.fcd_c * 1e6
    const c_nom    = Math.max(10, p.phi_c) + p.dcdev             // mm
    const d_c      = p.h_c - c_nom - p.phi_c / 2                 // mm
    const d_m_c    = d_c / 1000                                   // m
    const h_m_c    = p.h_c / 1000                                 // m
    const e_i_c    = L_cr / 400                                   // m
    const M0_c     = p.M0_Ed + p.N_Ed * e_i_c                    // kNm

    const i_c       = h_m_c / Math.sqrt(12)
    const lambda_c  = L_cr / i_c

    // λ_lim
    const A_s_rc   = p.n_rc * Math.PI * (p.phi_c/1000)**2 / 4   // m²
    const A_c_rc   = h_m_c**2                                     // m²
    const A_fac    = 1 / (1 + 0.2 * p.phi_ef)
    const omega_c  = A_s_rc * rebar.fyd / (A_c_rc * p.fcd_c)    // MPa/MPa
    const B_fac    = Math.sqrt(1 + 2 * omega_c)
    const C_fac    = 0.7                  // r_m = 1 for symmetric lateral loading
    const n_rc_val = p.N_Ed * 1e3 / (A_c_rc * fcd_c_Pa)
    const lam_lim  = 20 * A_fac * B_fac * C_fac / Math.sqrt(n_rc_val)

    // 2nd-order moment – nominal stiffness (avsnitt 3.5.3)
    const Ecd_Pa  = p.Ecm_c * 1e6 / p.gCE
    const I_c_c   = h_m_c**4 / 12                                 // m⁴ (square)
    const phi_m   = p.phi_c / 1000                                 // m
    const arm     = d_m_c - h_m_c / 2                             // m
    const I_s_c   = p.n_rc * (Math.PI*phi_m**4/64 + Math.PI*phi_m**2/4*arm**2)
    const k1_c    = Math.sqrt(p.fck_c / 20)
    const k2_c    = n_rc_val * lambda_c / 170
    const K_c_c   = k1_c * k2_c / (1 + p.phi_ef)
    const EI_c    = K_c_c * Ecd_Pa * I_c_c + 1 * p.Es_c * 1e6 * I_s_c   // N·m²
    const N_cr_c  = Math.PI**2 * EI_c / L_cr**2 / 1e3             // kN
    const beta_f  = Math.PI**2 / 9.6                               // parabolic diagram
    const M_Ed_c  = M0_c * (1 + beta_f / (N_cr_c / p.N_Ed - 1))  // kNm

    // Interaction diagram read
    const nu_c    = p.N_Ed * 1e3 / (h_m_c * d_m_c * fcd_c_Pa)
    const mu_c    = M_Ed_c * 1e3 / (h_m_c * d_m_c**2 * fcd_c_Pa)
    const A_s_req = p.omega_rd * h_m_c * d_m_c * p.fcd_c / rebar.fyd    // m²
    const n_req   = 4 * A_s_req / (Math.PI * phi_m**2)    // bars per side for 4-bar scheme

    return {
      // a
      eps_s, ct_web, ct_fl, lim42, lim14,
      L_cr, lam_a, phi_a, chi_a, N_bRd,
      N_cr_a, v_a, M_Ed_a, M_cRd, eta_a,
      // b
      fcd_b, k_h, fmd_b, i_b, lambda_b, lam_rel_b, k_b, k_c,
      N_cRd_b, W_y_b, M_Rd_b, eta_b,
      // c
      c_nom, d_c, d_m_c, e_i_c, M0_c,
      i_c, lambda_c, A_fac, omega_c, B_fac, lam_lim,
      Ecd_Pa, I_c_c, I_s_c, k1_c, k2_c, K_c_c, EI_c, N_cr_c, beta_f,
      M_Ed_c, nu_c, mu_c, A_s_req, n_req,
    }
  },

  params: {
    // Loads (common)
    N_Ed:  50,      // kN
    M0_Ed: 12,      // kNm (qL²/8 = 6×4²/8)
    L:      4,      // m
    beta:   1,      // pin-pin, β = 1

    // a) VKR 120×60-6.3, S275
    h_s:   vkr.h,   // 120 mm
    b_s:   vkr.b,   //  60 mm
    t_s:   vkr.t,   // 6.3 mm
    A_s:   vkr.A,   // 2070 mm²
    Iy_s:  vkr.Iy,  // 3 580 000 mm⁴
    Wy_s:  vkr.Wy,  //   59 700 mm³
    iy_s:  vkr.iy,  //   41.6 mm
    fy:    steel.fy,   // 275 MPa
    E_s:   steel.E,    // 210 000 MPa
    gM0:   steel.gamma_M0,  // 1.0
    gM1:   steel.gamma_M1,  // 1.0
    alpha_s: 0.21,           // knäckningskurva a (varmformade rör, S275)

    // b) GL30c 90×225
    h_gl:    225,    // mm (stark axel, böjriktning)
    b_gl:     90,    // mm
    fmk:     glulam.fmk,    // 30 MPa
    fck_gl:  24.5,           // MPa (karakteristisk tryckhållfasthet f_c,0,k)
    E005:    10800,           // MPa (E_0,05)
    gMgl:    glulam.gamma_M, // 1.25
    kmod:    0.9,            // klimatklass 2, lasttyp S
    betac:   0.1,            // β_c (limträ)

    // c) RC 220×220, 4Ø12, C20, K500B-T
    h_c:     220,    // mm
    phi_c:    12,    // mm
    n_rc:      4,    // total bars
    fck_c:   conc.fck,   // 20 MPa
    fcd_c:   conc.fcd,   // 13.3 MPa
    Ecm_c:   conc.Ecm,   // 30 000 MPa
    Es_c:    rebar.Es,   // 200 000 MPa
    gCE:     1.2,         // γ_CE (E_cd = E_cm/γ_CE)
    phi_ef:  2.0,         // effektivt kryptal
    dcdev:   10,          // mm, Δc_dev
    omega_rd: 0.08,       // avläst ur interaktionsdiagram fig 3.4
  },

  problem: {
    description:
      'Bestäm erforderlig pelardimension för pelaren i figuren för tre alternativ: ' +
      'a) VKR-tvärsnitt av stål S275, ' +
      'b) Limträtvärsnitt GL30c, klimatklass 2, lasttyp S, ' +
      'c) Armerat betongtvärsnitt, betong C20, K500B-T, $\\varphi_{ef} = 2$. ' +
      'Dimensionerande laster: $P_d = 50$ kN (axlast) och $q_d = 6$ kN/m (horisontell vindlast). ' +
      'Pelarlängd $L = 4$ m, ledat infäst i båda ändar ($\\beta = 1$). ' +
      'Pelaren är stagad i veka riktningen.',

    figures: [
      {
        type: 'column',
        props: { L: 4, N_label: 'P_d', q_label: 'q_d', support: 'pin', topSupport: 'roller', showDim: true },
      },
    ],
  },

  steps: [

    // ── Step 1: VKR 120×60-6.3, S275 ────────────────────────────────────────
    {
      id: 'a_eta',
      title: 'a) VKR 120×60-6.3, S275 – Tryckt-böjd stålpelare',
      question: (p) =>
        `Kontrollera stålpelaren VKR 120×60-6.3 i S275. ` +
        `Kontrollera att tvärsnittet är minst klass 3, beräkna slankhetstalet $\\bar{\\lambda}$ och ` +
        `reduktionsfaktorn $\\chi$ (knäckningskurva a, $\\alpha = ${p.alpha_s}$). ` +
        `Beräkna $N_{b,Rd}$ och det förstärkta momentet $M_{Ed}$ med Eulerlasten. ` +
        `Ange utnyttjandegraden $\\eta = N_{Ed}/N_{b,Rd} + M_{Ed}/M_{c,Rd}$ (–).`,

      figures: (p) => [
        { type: 'steel-section', props: { h: p.h_s, b: p.b_s, t: p.t_s } },
      ],

      answer: {
        label: '\\eta',
        unit: '–',
        getCorrect: (p) => parseFloat(p.eta_a.toFixed(2)),
        hint: (p) =>
          `$\\varepsilon = ${p.eps_s.toFixed(3)}$, $c/t_{web} = ${p.ct_web.toFixed(2)} \\leq 42\\varepsilon$. ` +
          `$\\bar{\\lambda} = ${p.lam_a.toFixed(2)}$, $\\chi = ${p.chi_a.toFixed(2)}$. ` +
          `$N_{b,Rd} = ${p.N_bRd.toFixed(1)}$ kN, $N_{cr} = ${p.N_cr_a.toFixed(1)}$ kN, ` +
          `$M_{Ed} = ${p.M_Ed_a.toFixed(2)}$ kNm, $M_{c,Rd} = ${p.M_cRd.toFixed(1)}$ kNm.`,
      },

      resultCheck: (p) => ({
        ok: p.eta_a <= 1,
        latex:
          `\\frac{${p.N_Ed}}{${p.N_bRd.toFixed(1)}} + \\frac{${p.M_Ed_a.toFixed(2)}}{${p.M_cRd.toFixed(1)}} = ` +
          `${p.eta_a.toFixed(2)} ${p.eta_a <= 1 ? '\\leq' : '>'} 1 \\quad ` +
          `${p.eta_a <= 1 ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
      }),

      solution: [
        { text: 'Kontrollera att tvärsnittet tillhör minst klass 3:' },
        {
          latex: (p) =>
            `\\varepsilon = \\sqrt{\\frac{235}{${p.fy}}} = ${p.eps_s.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) => [
            `\\frac{c}{t}_{\\text{web}} = \\frac{${p.h_s}-2\\cdot${p.t_s}}{${p.t_s}} = ${p.ct_web.toFixed(2)} \\leq 42\\varepsilon = ${p.lim42.toFixed(1)} \\quad \\checkmark`,
            `\\frac{c}{t}_{\\text{fläns}} = \\frac{${p.b_s}-2\\cdot${p.t_s}}{${p.t_s}} = ${p.ct_fl.toFixed(2)} \\leq 14\\varepsilon = ${p.lim14.toFixed(1)} \\quad \\checkmark`,
          ],
          latexBlock: true,
        },
        { text: 'Slankhet och knäckreduktionsfaktor (knäckning om stark axeln, knäckningskurva a):' },
        {
          latex: (p) =>
            `L_{cr} = \\beta L = ${p.beta}\\cdot${p.L} = ${p.L_cr.toFixed(1)}\\ \\text{m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\bar{\\lambda} = \\frac{L_{cr}}{i_y\\,\\pi}\\sqrt{\\frac{f_y}{E_s}} = ` +
            `\\frac{${p.L_cr.toFixed(1)}}{${p.iy_s}\\cdot10^{-3}\\cdot\\pi}\\sqrt{\\frac{${p.fy}}{${p.E_s/1000}\\,000}} = ${p.lam_a.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\phi = 0{,}5\\bigl(1 + ${p.alpha_s}(${p.lam_a.toFixed(2)}-0{,}2) + ${p.lam_a.toFixed(2)}^2\\bigr) = ${p.phi_a.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\chi = \\frac{1}{\\phi+\\sqrt{\\phi^2-\\bar{\\lambda}^2}} = ${p.chi_a.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet och interaktionskontroll:' },
        {
          latex: (p) =>
            `N_{b,Rd} = \\frac{\\chi\\,f_y\\,A}{\\gamma_{M1}} = ` +
            `\\frac{${p.chi_a.toFixed(2)}\\cdot${p.fy}\\cdot10^6\\cdot${p.A_s}\\cdot10^{-6}}{${p.gM1}} = ${p.N_bRd.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `N_{cr} = \\frac{\\pi^2 E I_y}{L_{cr}^2} = ${p.N_cr_a.toFixed(1)}\\ \\text{kN}, \\quad v = \\frac{N_{cr}}{N_{Ed}} = ${p.v_a.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Ed} = M_{0,Ed}\\cdot\\frac{v}{v-1} = ${p.M0_Ed}\\cdot\\frac{${p.v_a.toFixed(2)}}{${p.v_a.toFixed(2)}-1} = ${p.M_Ed_a.toFixed(2)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{c,Rd} = \\frac{W_{el}\\,f_y}{\\gamma_{M0}} = ${p.M_cRd.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\frac{N_{Ed}}{N_{b,Rd}} + \\frac{M_{Ed}}{M_{c,Rd}} = ` +
            `\\frac{${p.N_Ed}}{${p.N_bRd.toFixed(1)}} + \\frac{${p.M_Ed_a.toFixed(2)}}{${p.M_cRd.toFixed(1)}} = ${p.eta_a.toFixed(2)} \\leq 1 \\quad \\Rightarrow \\textbf{OK!}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 2: GL30c 90×225 ─────────────────────────────────────────────────
    {
      id: 'b_eta',
      title: 'b) GL30c 90×225 – Limträpelare',
      question: (p) =>
        `Kontrollera limträpelaren GL30c 90×225 mm. ` +
        `Klimatklass 2, lasttyp S ($k_{mod} = ${p.kmod}$, $\\gamma_M = ${p.gMgl}$, $\\beta_c = ${p.betac}$). ` +
        `Beräkna dimensionerande hållfastheter, slankhetsgränsen $\\lambda_{rel}$, ` +
        `knäckreduktionsfaktorn $k_c$, kapaciteter $N_{c,Rd}$ och $M_{Rd}$. ` +
        `Ange utnyttjandegraden $N_{Ed}/N_{c,Rd} + M_{Ed}/M_{Rd}$ (–). ` +
        `Obs: andra ordningens effekter ingår i interaktionssambandet för limträ.`,

      figures: (p) => [
        { type: 'glulam-section', props: { b: p.b_gl, h: p.h_gl } },
      ],

      answer: {
        label: 'N_{Ed}/N_{c,Rd}+M_{Ed}/M_{Rd}',
        unit: '–',
        getCorrect: (p) => parseFloat(p.eta_b.toFixed(2)),
        hint: (p) =>
          `$f_{cd} = ${p.fcd_b.toFixed(2)}$ MPa, $k_h = ${p.k_h.toFixed(2)}$, $f_{md} = ${p.fmd_b.toFixed(2)}$ MPa. ` +
          `$\\lambda_{rel} = ${p.lam_rel_b.toFixed(3)}$, $k_c = ${p.k_c.toFixed(2)}$. ` +
          `$N_{c,Rd} = ${p.N_cRd_b.toFixed(1)}$ kN, $M_{Rd} = ${p.M_Rd_b.toFixed(1)}$ kNm.`,
      },

      resultCheck: (p) => ({
        ok: p.eta_b <= 1,
        latex:
          `\\frac{${p.N_Ed}}{${p.N_cRd_b.toFixed(1)}} + \\frac{${p.M0_Ed}}{${p.M_Rd_b.toFixed(1)}} = ` +
          `${p.eta_b.toFixed(2)} ${p.eta_b <= 1 ? '\\leq' : '>'} 1 \\quad ` +
          `${p.eta_b <= 1 ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
      }),

      solution: [
        { text: 'Dimensionerande hållfastheter:' },
        {
          latex: (p) =>
            `f_{cd} = \\frac{k_{mod}\\,f_{c,0,k}}{\\gamma_M} = \\frac{${p.kmod}\\cdot${p.fck_gl}}{${p.gMgl}} = ${p.fcd_b.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k_h = \\min\\!\\left(\\left(\\frac{600}{${p.h_gl}}\\right)^{0{,}1},\\ 1{,}1\\right) = ${p.k_h.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `f_{md} = \\frac{k_{mod}\\,f_{mk}}{\\gamma_M}\\,k_h = \\frac{${p.kmod}\\cdot${p.fmk}}{${p.gMgl}}\\cdot${p.k_h.toFixed(2)} = ${p.fmd_b.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Slankhet och knäckreduktionsfaktor (knäckning om stark axeln):' },
        {
          latex: (p) =>
            `i = \\frac{h}{\\sqrt{12}} = \\frac{${p.h_gl/1000}}{\\sqrt{12}} = ${p.i_b.toFixed(4)}\\ \\text{m}, \\quad \\lambda = \\frac{L_{cr}}{i} = ${p.lambda_b.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{rel} = \\frac{\\lambda}{\\pi}\\sqrt{\\frac{f_{c,0,k}}{E_{0,05}}} = ` +
            `\\frac{${p.lambda_b.toFixed(2)}}{\\pi}\\sqrt{\\frac{${p.fck_gl}}{${p.E005}}} = ${p.lam_rel_b.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k = 0{,}5\\bigl(1 + ${p.betac}\\cdot(${p.lam_rel_b.toFixed(3)}-0{,}3) + ${p.lam_rel_b.toFixed(3)}^2\\bigr) = ${p.k_b.toFixed(4)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k_c = \\frac{1}{k+\\sqrt{k^2-\\lambda_{rel}^2}} = ${p.k_c.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Kapaciteter och interaktionskontroll:' },
        {
          latex: (p) =>
            `N_{c,Rd} = f_{cd}\\cdot A\\cdot k_c = ${p.fcd_b.toFixed(2)}\\cdot10^6\\cdot${p.b_gl/1000}\\cdot${p.h_gl/1000}\\cdot${p.k_c.toFixed(2)} = ${p.N_cRd_b.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `W_y = \\frac{bh^2}{6} = \\frac{${p.b_gl/1000}\\cdot${p.h_gl/1000}^2}{6} = ${(p.W_y_b*1e6).toFixed(2)}\\cdot10^{-6}\\ \\text{m}^3`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Rd} = f_{md}\\cdot W_y = ${p.fmd_b.toFixed(2)}\\cdot10^6\\cdot${(p.W_y_b*1e6).toFixed(2)}\\cdot10^{-6} = ${p.M_Rd_b.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\frac{N_{Ed}}{N_{c,Rd}} + \\frac{M_{Ed}}{M_{Rd}} = ` +
            `\\frac{${p.N_Ed}}{${p.N_cRd_b.toFixed(1)}} + \\frac{${p.M0_Ed}}{${p.M_Rd_b.toFixed(1)}} = ${p.eta_b.toFixed(2)} \\leq 1 \\quad \\Rightarrow \\textbf{OK!}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 3: RC 220×220, 4Ø12, C20 ───────────────────────────────────────
    {
      id: 'c_n',
      title: 'c) RC 220×220 – Armerat betongtvärsnitt',
      question: (p) =>
        `Kontrollera betongpelaren 220×220 mm, C20, K500B-T, $\\varphi_{ef} = ${p.phi_ef}$. ` +
        `Beräkna effektiv höjd $d$ och första ordningens moment $M_0$ inkl. geometrisk imperfektion $e_i = l_0/400$. ` +
        `Kontrollera om andra ordningens effekter måste beaktas ($\\lambda$ vs $\\lambda_{lim}$). ` +
        `Beräkna $M_{Ed}$ med nominell styvhetsmetoden och avläs erforderlig armering ur ` +
        `interaktionsdiagrammet ($\\omega_{rd} = ${p.omega_rd}$). ` +
        `Ange erforderligt antal armeringsstänger per hörn (–).`,

      figures: () => [
        { type: 'rect-section', props: { b: 220, h: 220, rebars: rebars35c, rebarDia: 12, fillColor: '#e8e8e8' } },
      ],

      answer: {
        label: 'n_{\\phi}',
        unit: 'stänger per hörn',
        getCorrect: (p) => Math.ceil(p.n_req / 4),
        hint: (p) =>
          `$c_{nom} = ${p.c_nom}$ mm, $d = ${p.d_c}$ mm. ` +
          `$M_0 = ${p.M0_c.toFixed(1)}$ kNm. ` +
          `$\\lambda = ${p.lambda_c.toFixed(1)} > \\lambda_{lim} = ${p.lam_lim.toFixed(1)}$ → andra ordningen. ` +
          `$N_{cr} = ${p.N_cr_c.toFixed(1)}$ kN, $M_{Ed} = ${p.M_Ed_c.toFixed(1)}$ kNm. ` +
          `$\\nu = ${p.nu_c.toFixed(2)}$, $\\mu = ${p.mu_c.toFixed(2)}$ → $\\omega = ${p.omega_rd}$ → 1 stång per hörn.`,
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `n_{req} = ${p.n_req.toFixed(2)} < 4 \\quad \\Rightarrow \\quad ` +
          `\\textbf{1\\,\\text{Ø}${p.phi_c}\\ \\text{i varje hörn räcker!}}`,
      }),

      solution: [
        { text: 'Nominellt täckskikt och effektiv höjd:' },
        {
          latex: (p) =>
            `c_{nom} = \\max(10;\\ ${p.phi_c}) + \\Delta c_{dev} = ${p.phi_c} + ${p.dcdev} = ${p.c_nom}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `d = h - c_{nom} - \\tfrac{\\phi}{2} = ${p.h_c} - ${p.c_nom} - ${p.phi_c/2} = ${p.d_c}\\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Första ordningens moment inkl. geometrisk imperfektion:' },
        {
          latex: (p) =>
            `e_i = \\frac{l_0}{400} = \\frac{${p.L_cr.toFixed(1)}}{400} = ${(p.e_i_c*1000).toFixed(0)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_0 = M_{0,Ed} + N_{Ed}\\,e_i = ${p.M0_Ed} + ${p.N_Ed}\\cdot${p.e_i_c.toFixed(3)} = ${p.M0_c.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Slankhetsgräns – måste andra ordningens effekter beaktas?' },
        {
          latex: (p) =>
            `\\lambda = \\frac{l_0}{i} = \\frac{${p.L_cr.toFixed(1)}}{${p.h_c/1000}/\\sqrt{12}} = ${p.lambda_c.toFixed(1)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `A = ${p.A_fac.toFixed(3)},\\quad B = ${p.B_fac.toFixed(3)},\\quad C = 0{,}7,\\quad n = ${(p.N_Ed*1e3/((p.h_c/1000)**2*p.fcd_c*1e6)).toFixed(4)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{lim} = \\frac{20\\,A\\,B\\,C}{\\sqrt{n}} = ${p.lam_lim.toFixed(1)} < \\lambda = ${p.lambda_c.toFixed(1)} \\quad \\Rightarrow \\textbf{Andra ordningen måste beaktas!}`,
          latexBlock: true,
        },
        { text: 'Nominell styvhetsmetod – dimensionerande moment:' },
        {
          latex: (p) =>
            `k_1 = \\sqrt{\\frac{f_{ck}}{20}} = ${p.k1_c.toFixed(2)}, \\quad k_2 = n\\frac{\\lambda}{170} = ${p.k2_c.toFixed(4)}, \\quad K_c = \\frac{k_1 k_2}{1+\\varphi_{ef}} = ${p.K_c_c.toFixed(5)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `EI = K_c\\,E_{cd}\\,I_c + K_s\\,E_s\\,I_s = ${(p.EI_c/1e3).toFixed(0)}\\cdot10^3\\ \\text{Nm}^2`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `N_{cr} = \\frac{\\pi^2 EI}{l_0^2} = ${p.N_cr_c.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Ed} = M_0\\!\\left(1 + \\frac{\\beta}{N_{cr}/N_{Ed}-1}\\right) = ` +
            `${p.M0_c.toFixed(1)}\\!\\left(1+\\frac{${p.beta_f.toFixed(3)}}{${p.N_cr_c.toFixed(1)}/${p.N_Ed}-1}\\right) = ${p.M_Ed_c.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Avläsning ur interaktionsdiagram och erforderlig armering:' },
        {
          latex: (p) =>
            `\\nu = \\frac{N_{Ed}}{b\\,d\\,f_{cd}} = ${p.nu_c.toFixed(2)}, \\quad \\mu = \\frac{M_{Ed}}{b\\,d^2\\,f_{cd}} = ${p.mu_c.toFixed(2)} \\quad \\Rightarrow \\omega = ${p.omega_rd}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `A_s = \\omega\\,b\\,d\\,\\frac{f_{cd}}{f_{yd}} = ${(p.A_s_req*1e4).toFixed(3)}\\cdot10^{-4}\\ \\text{m}^2`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `n = \\frac{4\\,A_s}{\\pi\\,\\phi^2} = ${p.n_req.toFixed(2)} < 4 \\quad \\Rightarrow \\quad \\textbf{1\\,\\text{Ø}${p.phi_c}\\ \\text{i varje hörn}}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
