import { STEEL } from '../data/materials.js'
import { HEA_SECTIONS } from '../data/sections.js'

const hea   = HEA_SECTIONS['HEA280']  // h=270, b=280, tf=13, tw=8, R=24, iy=119, iz=70, A=9726
const steel = STEEL['S275']            // fy=275, E=210000, γM1=1.0

export const exercise32 = {
  id: 'ex32',
  title: 'Uppgift 32 – Knäckning, HEA 280 S275, stagad på mitten i veka riktningen',

  derive: (p) => {
    // ── Tvärsnittsklass ──────────────────────────────────────────────────────
    const eps     = Math.sqrt(235 / p.fy)
    const ct_web  = (p.h - 2 * p.tf - 2 * p.R) / p.tw   // (270-26-48)/8 = 24.5
    const ct_fl   = (p.b / 2 - p.tw / 2 - p.R) / p.tf   // (140-4-24)/13 = 8.62
    const lim42   = 42 * eps
    const lim14   = 14 * eps

    // ── Styva riktningen (y-y): Lcr = β·L = 9 m ──────────────────────────────
    const Lcr_y  = p.beta * p.L
    const iy_m   = p.iy * 1e-3
    const lam_y  = Lcr_y / (iy_m * Math.PI) * Math.sqrt(p.fy / p.E)
    const phi_y  = 0.5 * (1 + p.alpha_y * (lam_y - 0.2) + lam_y ** 2)
    const chi_y  = 1 / (phi_y + Math.sqrt(phi_y ** 2 - lam_y ** 2))
    const N_bRd_y = chi_y * p.fy * 1e6 * p.A * 1e-6 / p.gM1 / 1e3   // kN

    // ── Veka riktningen (z-z): Lcr = β·L/2 = 4.5 m ───────────────────────────
    const Lcr_z  = p.beta * p.L / 2
    const iz_m   = p.iz * 1e-3
    const lam_z  = Lcr_z / (iz_m * Math.PI) * Math.sqrt(p.fy / p.E)
    const phi_z  = 0.5 * (1 + p.alpha_z * (lam_z - 0.2) + lam_z ** 2)
    const chi_z  = 1 / (phi_z + Math.sqrt(phi_z ** 2 - lam_z ** 2))
    const N_bRd_z = chi_z * p.fy * 1e6 * p.A * 1e-6 / p.gM1 / 1e3   // kN

    // ── Dimensionerande kapacitet ─────────────────────────────────────────────
    const N_bRd = Math.min(N_bRd_y, N_bRd_z)

    return {
      eps, ct_web, ct_fl, lim42, lim14,
      Lcr_y, lam_y, phi_y, chi_y, N_bRd_y,
      Lcr_z, lam_z, phi_z, chi_z, N_bRd_z,
      N_bRd,
    }
  },

  params: {
    L:    9,              // m, pelarlängd
    beta: 1,              // ledat i båda ändar

    // HEA 280
    h:   hea.h,           // 270 mm
    b:   hea.b,           // 280 mm
    tf:  hea.tf,          //  13 mm (flänstjocklek)
    tw:  hea.tw,          //   8 mm (livtjocklek)
    R:   hea.R,           //  24 mm (avrundningsradie)
    iy:  hea.iy,          // 119 mm
    iz:  hea.iz,          //  70 mm
    A:   hea.A,           // 9726 mm²

    // S275
    fy:  steel.fy,        // 275 MPa
    E:   steel.E,         // 210 000 MPa
    gM1: steel.gamma_M1,  // 1.0

    alpha_y: 0.34,        // knäckningskurva b (y-y, h/b ≤ 1,2, tf ≤ 100 mm, S275)
    alpha_z: 0.49,        // knäckningskurva c (z-z, h/b ≤ 1,2, tf ≤ 100 mm, S275)
  },

  problem: {
    description:
      'Beräkna centrisk tryckkapacitet $P_d$ i brottgränstillståndet med hänsyn till ' +
      'plan knäckning hos nedanstående valsade profil. ' +
      'Stål S275, HEA 280, pelarlängd $L = 9$ m, ledat infäst i båda ändar ($\\beta = 1$). ' +
      'Pelaren är stagad på mitten i veka riktningen ($L_{cr,z} = L/2 = 4{,}5$ m).',

    figures: [
      {
        type: 'column',
        props: { L: 9, N_label: 'P_d', q_label: '', support: 'pin', topSupport: 'roller', showDim: true },
      },
      { type: 'steel-section', props: { ...hea } },
    ],
  },

  steps: [

    // ── Steg 1: Tvärsnittsklasskontroll ─────────────────────────────────────
    {
      id: 'section_class',
      title: 'Steg 1 – Tvärsnittsklasskontroll, HEA 280 S275',
      question:
        'Kontrollera att HEA 280 i S275 tillhör minst klass 3. ' +
        'Beräkna $\\varepsilon$ och kontrollera $c/t$ för både livet och flänsarna. ' +
        'Ange $c/t$-kvoten för livet.',

      answer: {
        label: 'c/t_{\\text{liv}}',
        unit: '',
        getCorrect: (p) => parseFloat(p.ct_web.toFixed(1)),
        hint: (p) =>
          `$\\varepsilon = \\sqrt{235/${p.fy}} = ${p.eps.toFixed(3)}$. ` +
          `Liv: $(h - 2t_f - 2R)/t_w = (${p.h}-2\\cdot${p.tf}-2\\cdot${p.R})/${p.tw}$.`,
      },

      resultCheck: (p) => {
        const webOk = p.ct_web <= p.lim42
        const flOk  = p.ct_fl  <= p.lim14
        return {
          ok: webOk && flOk,
          latex:
            `\\text{Liv: }\\frac{c}{t} = ${p.ct_web.toFixed(1)} \\leq 42\\varepsilon = ${p.lim42.toFixed(1)} \\quad ${webOk ? '\\checkmark' : '\\times'} \\\\[4pt]` +
            `\\text{Fläns: }\\frac{c}{t} = ${p.ct_fl.toFixed(1)} \\leq 14\\varepsilon = ${p.lim14.toFixed(1)} \\quad ${flOk ? '\\checkmark' : '\\times'} \\\\[4pt]` +
            `\\Rightarrow \\textbf{Tvärsnittet är minst klass 3.}`,
        }
      },

      solution: [
        {
          latex: (p) =>
            `\\varepsilon = \\sqrt{\\frac{235}{${p.fy}}} = ${p.eps.toFixed(3)}`,
          latexBlock: true,
        },
        { text: 'Tvärsnittskontroll av livet:' },
        {
          latex: (p) =>
            `\\frac{c}{t} = \\frac{h - 2t_f - 2R}{t_w} = ` +
            `\\frac{${p.h} - 2\\cdot${p.tf} - 2\\cdot${p.R}}{${p.tw}} = ${p.ct_web.toFixed(1)} \\leq 42\\varepsilon = ${p.lim42.toFixed(1)} \\quad \\checkmark`,
          latexBlock: true,
        },
        { text: 'Tvärsnittskontroll av flänsarna:' },
        {
          latex: (p) =>
            `\\frac{c}{t} = \\frac{b/2 - t_w/2 - R}{t_f} = ` +
            `\\frac{${p.b}/2 - ${p.tw}/2 - ${p.R}}{${p.tf}} = ${p.ct_fl.toFixed(1)} \\leq 14\\varepsilon = ${p.lim14.toFixed(1)} \\quad \\checkmark`,
          latexBlock: true,
        },
        { text: 'Tvärsnittet tillhör minst klass 3.' },
      ],
    },

    // ── Steg 2: Styva riktningen (y-y) ──────────────────────────────────────
    {
      id: 'N_bRd_strong',
      title: 'Steg 2 – Normalkraftskapacitet, styva riktningen (y-y)',
      question:
        'Knäckning om stark axeln: $L_{cr} = \\beta L = 9$ m. ' +
        'Tabell 2.6 ger knäckningskurva b för valsade I-balkar med $h/b \\leq 1{,}2$, ' +
        '$t_f \\leq 100$ mm, knäckning om y-y i S275 ($\\alpha = 0{,}34$). ' +
        'Beräkna $\\bar{\\lambda}$, $\\chi$ och normalkraftskapaciteten $N_{c,Rd}$ (kN).',

      answer: {
        label: 'N_{c,Rd,y}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_bRd_y.toFixed(0)),
        hint: (p) =>
          `$L_{cr} = ${p.Lcr_y}$ m, $i_y = ${p.iy}$ mm, ` +
          `$\\bar{\\lambda} = L_{cr}/(i_y\\pi)\\sqrt{f_y/E} = ${p.lam_y.toFixed(2)}$. ` +
          `$\\alpha = ${p.alpha_y}$ (kurva b).`,
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `N_{c,Rd,y} = \\frac{\\chi_y f_y A}{\\gamma_{M1}} = ` +
          `\\frac{${p.chi_y.toFixed(2)} \\cdot ${p.fy} \\cdot 10^6 \\cdot ${p.A} \\cdot 10^{-6}}{${p.gM1}} = ${p.N_bRd_y.toFixed(0)}\\ \\text{kN}`,
      }),

      solution: [
        { figure: { type: 'column', props: { L: 9, N_label: 'P_d', q_label: '', support: 'pin', topSupport: 'roller', showDim: true } } },
        { text: 'Knäcklängd (ledat i båda ändar, β = 1):' },
        {
          latex: (p) =>
            `L_{cr} = \\beta L = ${p.beta} \\cdot ${p.L} = ${p.Lcr_y}\\ \\text{m}`,
          latexBlock: true,
        },
        { text: 'Relativ slankhet (knäckning om y-y):' },
        {
          latex: (p) =>
            `\\bar{\\lambda} = \\frac{L_{cr}}{i_y\\,\\pi}\\sqrt{\\frac{f_y}{E_s}} = ` +
            `\\frac{${p.Lcr_y}}{${p.iy}\\cdot10^{-3}\\cdot\\pi}\\sqrt{\\frac{${p.fy}}{${(p.E/1000).toFixed(0)}\\,000}} = ${p.lam_y.toFixed(2)} \\geq 0{,}2`,
          latexBlock: true,
        },
        { text: `Knäckningskurva b (valsad I-balk, $h/b \\leq 1{,}2$, y-y, S275) $\\rightarrow \\alpha = ${0.34}$:` },
        {
          latex: (p) =>
            `\\phi = 0{,}5\\bigl(1 + ${p.alpha_y}(${p.lam_y.toFixed(2)}-0{,}2)+${p.lam_y.toFixed(2)}^2\\bigr) = ${p.phi_y.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\chi = \\frac{1}{\\phi+\\sqrt{\\phi^2-\\bar{\\lambda}^2}} = ` +
            `\\frac{1}{${p.phi_y.toFixed(2)}+\\sqrt{${p.phi_y.toFixed(2)}^2-${p.lam_y.toFixed(2)}^2}} = ${p.chi_y.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet (tryck, styva riktningen):' },
        {
          latex: (p) =>
            `N_{c,Rd,y} = \\frac{\\chi_y f_y A}{\\gamma_{M1}} = ` +
            `\\frac{${p.chi_y.toFixed(2)}\\cdot${p.fy}\\cdot10^6\\cdot${p.A}\\cdot10^{-6}}{${p.gM1}} = ${p.N_bRd_y.toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 3: Veka riktningen (z-z) ────────────────────────────────────────
    {
      id: 'N_bRd_weak',
      title: 'Steg 3 – Normalkraftskapacitet, veka riktningen (z-z)',
      question:
        'Pelaren är stagad på mitten i veka riktningen, varför $L_{cr,z} = L/2 = 4{,}5$ m. ' +
        'Tabell 2.6 ger knäckningskurva c för valsade I-balkar med $h/b \\leq 1{,}2$, ' +
        '$t_f \\leq 100$ mm, knäckning om z-z i S275 ($\\alpha = 0{,}49$). ' +
        'Beräkna $\\bar{\\lambda}$, $\\chi$ och $N_{c,Rd,z}$ (kN). ' +
        'Ange sedan dimensionerande kapacitet $P_d = \\min(N_{c,Rd,y},\\,N_{c,Rd,z})$.',

      answer: {
        label: 'P_d',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_bRd.toFixed(0)),
        hint: (p) =>
          `$L_{cr,z} = L/2 = ${p.Lcr_z}$ m, $i_z = ${p.iz}$ mm, ` +
          `$\\bar{\\lambda}_z = ${p.lam_z.toFixed(2)}$, $\\alpha = ${p.alpha_z}$ (kurva c). ` +
          `$N_{c,Rd,z} = ${p.N_bRd_z.toFixed(0)}$ kN.`,
      },

      resultCheck: (p) => {
        const govAxis = p.N_bRd_y <= p.N_bRd_z ? 'y' : 'z'
        return {
          ok: true,
          latex:
            `N_{c,Rd,z} = ${p.N_bRd_z.toFixed(0)}\\ \\text{kN} \\\\[6pt]` +
            `P_d = \\min(N_{c,Rd,y},\\,N_{c,Rd,z}) = \\min(${p.N_bRd_y.toFixed(0)},\\,${p.N_bRd_z.toFixed(0)}) = ${p.N_bRd.toFixed(0)}\\ \\text{kN} ` +
            `\\quad \\Rightarrow \\textbf{Dimensionerande: ${govAxis === 'y' ? 'styva riktningen (y-y)' : 'veka riktningen (z-z)'}}`,
        }
      },

      solution: [
        { figure: { type: 'column', props: { L: 9, N_label: 'P_d', q_label: '', support: 'pin', topSupport: 'roller', midSupport: 'roller', showDim: true } } },
        { text: 'Effektiv knäcklängd i veka riktningen (stagad på mitten):' },
        {
          latex: (p) =>
            `L_{cr,z} = \\frac{\\beta L}{2} = \\frac{${p.beta}\\cdot${p.L}}{2} = ${p.Lcr_z}\\ \\text{m}`,
          latexBlock: true,
        },
        { text: 'Relativ slankhet (knäckning om z-z):' },
        {
          latex: (p) =>
            `\\bar{\\lambda}_z = \\frac{L_{cr,z}}{i_z\\,\\pi}\\sqrt{\\frac{f_y}{E_s}} = ` +
            `\\frac{${p.Lcr_z}}{${p.iz}\\cdot10^{-3}\\cdot\\pi}\\sqrt{\\frac{${p.fy}}{${(p.E/1000).toFixed(0)}\\,000}} = ${p.lam_z.toFixed(2)} \\geq 0{,}2`,
          latexBlock: true,
        },
        { text: `Knäckningskurva c (valsad I-balk, $h/b \\leq 1{,}2$, z-z, S275) $\\rightarrow \\alpha = ${0.49}$:` },
        {
          latex: (p) =>
            `\\phi = 0{,}5\\bigl(1 + ${p.alpha_z}(${p.lam_z.toFixed(2)}-0{,}2)+${p.lam_z.toFixed(2)}^2\\bigr) = ${p.phi_z.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\chi_z = \\frac{1}{\\phi+\\sqrt{\\phi^2-\\bar{\\lambda}_z^2}} = ` +
            `\\frac{1}{${p.phi_z.toFixed(2)}+\\sqrt{${p.phi_z.toFixed(2)}^2-${p.lam_z.toFixed(2)}^2}} = ${p.chi_z.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet (tryck, veka riktningen):' },
        {
          latex: (p) =>
            `N_{c,Rd,z} = \\frac{\\chi_z f_y A}{\\gamma_{M1}} = ` +
            `\\frac{${p.chi_z.toFixed(2)}\\cdot${p.fy}\\cdot10^6\\cdot${p.A}\\cdot10^{-6}}{${p.gM1}} = ${p.N_bRd_z.toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
        { text: 'Jämförelse och svar:' },
        {
          latex: (p) =>
            `P_d = \\min(N_{c,Rd,y},\\,N_{c,Rd,z}) = \\min(${p.N_bRd_y.toFixed(0)},\\,${p.N_bRd_z.toFixed(0)}) = \\mathbf{${p.N_bRd.toFixed(0)}\\ \\text{kN}}`,
          latexBlock: true,
        },
        {
          text:
            'Styva riktningen (y-y) med $L_{cr} = 9$ m är dimensionerande trots att den veka ' +
            'riktningen har sämre knäckningskurva (c vs b), eftersom slankhetstalet $\\bar{\\lambda}_y > \\bar{\\lambda}_z$.',
        },
      ],
    },
  ],
}
