import { HEA_SECTIONS } from '../data/sections.js'
import { STEEL } from '../data/materials.js'

const section  = HEA_SECTIONS['HEA300']
const material = STEEL['S355']

export const exercise36 = {
  id: 'ex36',
  title: 'Uppgift 36 – Konsolpelare med excentrisk axiallast, HEA 300 S355',

  derive: (p) => {
    const E_Pa  = p.E_s * 1e6
    const fy_Pa = p.fy  * 1e6
    const A_m2  = p.A   * 1e-6
    const Iy_m4 = p.Iy  * 1e-12
    const Wy_m3 = p.Wy  * 1e-9
    const iy_m  = p.iy  * 1e-3

    // Cross-section class check
    const eps    = Math.sqrt(235 / p.fy)
    const ct_web = (p.h - 2*p.tf - 2*p.R) / p.tw   // balkliv
    const ct_fl  = (p.b/2 - p.tw/2 - p.R) / p.tf   // fläns
    const lim42  = 42 * eps
    const lim14  = 14 * eps

    // Buckling
    const L_cr  = p.beta * p.L
    const lam   = L_cr / (iy_m * Math.PI) * Math.sqrt(fy_Pa / E_Pa)
    const phi   = 0.5 * (1 + p.alpha * (lam - 0.2) + lam**2)
    const chi   = 1 / (phi + Math.sqrt(phi**2 - lam**2))
    const N_bRd = chi * fy_Pa * A_m2 / p.gM1 / 1e3   // kN

    // First-order moment
    const M0_Ed = p.N_Ed * p.e                         // kNm

    // Second-order amplification (Euler method)
    const N_cr  = Math.PI**2 * E_Pa * Iy_m4 / L_cr**2 / 1e3   // kN
    const v     = N_cr / p.N_Ed
    const M_Ed  = M0_Ed * v / (v - 1)                  // kNm

    // Capacities
    const M_cRd = Wy_m3 * fy_Pa / p.gM0 / 1e3         // kNm

    // Interaction
    const eta   = p.N_Ed / N_bRd + M_Ed / M_cRd

    return { eps, ct_web, ct_fl, lim42, lim14, L_cr, lam, phi, chi, N_bRd, M0_Ed, N_cr, v, M_Ed, M_cRd, eta }
  },

  params: {
    N_Ed:  350,           // kN
    e:     0.5,           // m, eccentricity
    L:     8,             // m
    beta:  2.1,           // cantilever: β = 2,1

    // HEA 300
    h:  section.h,        // 290 mm
    b:  section.b,        // 300 mm
    tf: section.tf,       // 14.0 mm
    tw: section.tw,       // 8.5 mm
    R:  section.R,        // 27 mm
    A:  section.A,        // 11 250 mm²
    Iy: section.Iy,       // 182,6 × 10⁶ mm⁴
    Wy: section.Wy,       // 1 260 × 10³ mm³
    iy: section.iy,       // 127 mm

    // S355
    fy:    material.fy,         // 355 MPa
    E_s:   material.E,          // 210 000 MPa
    gM0:   material.gamma_M0,   // 1.0
    gM1:   material.gamma_M1,   // 1.0

    alpha: 0.34,   // knäckningskurva b (valsad I-balk, h/b ≤ 1,2, tf ≤ 100 mm, y-y)
  },

  problem: {
    description:
      'En fast inspänd konsolpelare (HEA 300, S355) är belastad med en dimensionerande ' +
      'axiallast $P_d = 350$ kN som angriper excentriskt i toppen med $e = 0{,}5$ m. ' +
      'Pelaren är stagad mot knäckning i veka riktningen. Kontrollera om pelaren klarar lasten.',

    figures: [
      {
        type: 'column',
        props: { L: 8, N_label: 'P_d', q_label: '', support: 'fixed', topSupport: 'none', e_label: 'e', showDim: true },
      },
      {
        type: 'steel-section',
        props: { h: section.h, b: section.b, tf: section.tf, tw: section.tw, R: section.R },
      },
    ],
  },

  steps: [
    // ── Step 1: Normalkraftskapacitet ────────────────────────────────────────
    {
      id: 'N_bRd',
      title: 'Normalkraftskapacitet $N_{b,Rd}$',
      question: (p) =>
        `Kontrollera att HEA 300 tillhör minst tvärsnittklass 3, beräkna knäckreduktionsfaktorn $\\chi$ ` +
        `för böjknäckning om stark axeln och beräkna normalkraftskapaciteten $N_{b,Rd}$ (kN). ` +
        `Effektiv knäcklängd: $L_{cr} = \\beta L = ${p.beta}\\cdot${p.L}$ m. ` +
        `Knäckningskurva b ($\\alpha = ${p.alpha}$).`,

      answer: {
        label: 'N_{b,Rd}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_bRd.toFixed(0)),
        hint: (p) =>
          `$\\varepsilon = ${p.eps.toFixed(3)}$, $\\bar{\\lambda} = ${p.lam.toFixed(2)}$, ` +
          `$\\chi = ${p.chi.toFixed(2)}$. ` +
          `$N_{b,Rd} = \\chi f_y A / \\gamma_{M1} = ${p.N_bRd.toFixed(0)}$ kN.`,
      },

      solution: [
        { text: 'Kontrollera tvärsnittklass (klass 3-gräns):' },
        {
          latex: (p) =>
            `\\varepsilon = \\sqrt{\\frac{235}{f_y}} = \\sqrt{\\frac{235}{${p.fy}}} = ${p.eps.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) => [
            `\\frac{c}{t_w}_{\\text{balkliv}} = \\frac{h-2t_f-2R}{t_w} = \\frac{${p.h}-2\\cdot${p.tf}-2\\cdot${p.R}}{${p.tw}} = ${p.ct_web.toFixed(2)} \\leq 42\\varepsilon = ${p.lim42.toFixed(1)} \\quad \\checkmark`,
            `\\frac{c}{t_f}_{\\text{fläns}} = \\frac{b/2-t_w/2-R}{t_f} = \\frac{${p.b/2}-${p.tw/2}-${p.R}}{${p.tf}} = ${p.ct_fl.toFixed(2)} \\leq 14\\varepsilon = ${p.lim14.toFixed(1)} \\quad \\checkmark`,
          ],
          latexBlock: true,
        },
        { text: 'Tvärsnittet är minst klass 3 – förenklad metod kan användas.' },
        { text: 'Effektiv knäcklängd och slankhetstalet (konsolpelare, β = 2,1):' },
        {
          latex: (p) =>
            `L_{cr} = \\beta L = ${p.beta}\\cdot${p.L} = ${p.L_cr.toFixed(1)}\\ \\text{m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\bar{\\lambda} = \\frac{L_{cr}}{i_y\\,\\pi}\\sqrt{\\frac{f_y}{E_s}} = ` +
            `\\frac{${p.L_cr.toFixed(1)}}{${p.iy}\\cdot10^{-3}\\cdot\\pi}\\sqrt{\\frac{${p.fy}}{${p.E_s/1000}\\,000}} = ${p.lam.toFixed(2)}`,
          latexBlock: true,
        },
        { text: (p) => `Tabell 2.6: valsad I-balk, $h/b \\leq 1{,}2$, $t_f \\leq 100$ mm, y-y, S355 → knäckningskurva b, $\\alpha = ${p.alpha}$:` },
        {
          latex: (p) =>
            `\\phi = 0{,}5\\bigl(1+${p.alpha}(${p.lam.toFixed(2)}-0{,}2)+${p.lam.toFixed(2)}^2\\bigr) = ${p.phi.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\chi = \\frac{1}{\\phi+\\sqrt{\\phi^2-\\bar{\\lambda}^2}} = \\frac{1}{${p.phi.toFixed(2)}+\\sqrt{${p.phi.toFixed(2)}^2-${p.lam.toFixed(2)}^2}} = ${p.chi.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet:' },
        {
          latex: (p) =>
            `N_{b,Rd} = \\frac{\\chi\\,f_y\\,A}{\\gamma_{M1}} = ` +
            `\\frac{${p.chi.toFixed(2)}\\cdot${p.fy}\\cdot10^6\\cdot${p.A}\\cdot10^{-6}}{${p.gM1}} = ${p.N_bRd.toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 2: Dimensionerande moment ────────────────────────────────────────
    {
      id: 'M_Ed',
      title: 'Dimensionerande moment $M_{Ed}$',
      question: (p) =>
        `Beräkna det dimensionerande böjmomentet. Utgå från första ordningens moment ` +
        `$M_{0,Ed} = P_d\\,e$ och ampliera med Euler-metoden för att få $M_{Ed}$ (kNm).`,

      answer: {
        label: 'M_{Ed}',
        unit: 'kNm',
        getCorrect: (p) => parseFloat(p.M_Ed.toFixed(1)),
        hint: (p) =>
          `$M_{0,Ed} = ${p.N_Ed}\\cdot${p.e} = ${p.M0_Ed.toFixed(0)}$ kNm. ` +
          `$N_{cr} = ${p.N_cr.toFixed(0)}$ kN, $v = ${p.v.toFixed(2)}$, ` +
          `$M_{Ed} = M_{0,Ed}\\cdot v/(v-1) = ${p.M_Ed.toFixed(1)}$ kNm.`,
      },

      solution: [
        { text: 'Första ordningens moment (excentricitet):' },
        {
          latex: (p) =>
            `M_{0,Ed} = P_d\\,e = ${p.N_Ed}\\cdot${p.e} = ${p.M0_Ed.toFixed(0)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Euler-knäckningslast och amplifieringsfaktor:' },
        {
          latex: (p) =>
            `N_{cr} = \\frac{\\pi^2 E I_y}{L_{cr}^2} = ` +
            `\\frac{\\pi^2\\cdot${p.E_s/1000}\\cdot10^9\\cdot${p.Iy/1e6}\\cdot10^{-6}}{${p.L_cr.toFixed(1)}^2} = ${p.N_cr.toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `v = \\frac{N_{cr}}{N_{Ed}} = \\frac{${p.N_cr.toFixed(0)}}{${p.N_Ed}} = ${p.v.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Ed} = M_{0,Ed}\\cdot\\frac{v}{v-1} = ${p.M0_Ed.toFixed(0)}\\cdot\\frac{${p.v.toFixed(2)}}{${p.v.toFixed(2)}-1} = ${p.M_Ed.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
      ],
    },

    // ── Step 3: Interaktionskontroll ──────────────────────────────────────────
    {
      id: 'eta',
      title: 'Interaktionskontroll',
      question: (p) =>
        `Beräkna momentkapaciteten $M_{c,Rd}$ och kontrollera pelaren med ` +
        `interaktionssambandet $N_{Ed}/N_{b,Rd}+M_{Ed}/M_{c,Rd} \\leq 1$. Ange utnyttjandegraden (–).`,

      answer: {
        label: 'N_{Ed}/N_{b,Rd}+M_{Ed}/M_{c,Rd}',
        unit: '–',
        getCorrect: (p) => parseFloat(p.eta.toFixed(2)),
        hint: (p) =>
          `$M_{c,Rd} = W_{el}\\,f_y/\\gamma_{M0} = ${p.M_cRd.toFixed(1)}$ kNm. ` +
          `$\\eta = ${p.N_Ed}/${p.N_bRd.toFixed(0)} + ${p.M_Ed.toFixed(1)}/${p.M_cRd.toFixed(1)} = ${p.eta.toFixed(2)}$.`,
      },

      resultCheck: (p) => ({
        ok: p.eta <= 1,
        latex:
          `\\frac{${p.N_Ed}}{${p.N_bRd.toFixed(0)}} + \\frac{${p.M_Ed.toFixed(1)}}{${p.M_cRd.toFixed(1)}} = ` +
          `${p.eta.toFixed(2)} ${p.eta <= 1 ? '\\leq' : '>'} 1 \\quad ` +
          `${p.eta <= 1 ? '\\Rightarrow \\textbf{Pelaren klarar lasten!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
      }),

      solution: [
        { text: 'Elastisk momentkapacitet (klass 3):' },
        {
          latex: (p) =>
            `M_{c,Rd} = \\frac{W_{el}\\,f_y}{\\gamma_{M0}} = ` +
            `\\frac{${p.Wy/1e3}\\cdot10^{-6}\\cdot${p.fy}\\cdot10^6}{${p.gM0}} = ${p.M_cRd.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Interaktionskontroll (förenklad metod):' },
        {
          latex: (p) =>
            `\\frac{N_{Ed}}{N_{b,Rd}} + \\frac{M_{Ed}}{M_{c,Rd}} = ` +
            `\\frac{${p.N_Ed}}{${p.N_bRd.toFixed(0)}} + \\frac{${p.M_Ed.toFixed(1)}}{${p.M_cRd.toFixed(1)}} = ${p.eta.toFixed(2)} \\leq 1 \\quad \\Rightarrow \\textbf{Pelaren klarar lasten!}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
