import { STEEL, GLULAM, CONCRETE, REBAR } from '../data/materials.js'
import { HEA_SECTIONS } from '../data/sections.js'

const steel   = STEEL['S275']      // fy=275, γM0=1.0
const glulam  = GLULAM['GL30c']    // fmk=30, γM=1.25
const concrete = CONCRETE['C25']   // fck=25, fcd=16.7
const rebar    = REBAR['K500B-T']  // fyd=435

// GL30c – characteristic compressive strength parallel to grain (EN 14080, tabell)
const fc0k_GL30c = 24.5  // MPa

// ── Concrete section rebars: 4Ø5 one in each corner of 50×50 ─────────────
const b_conc = 50
const h_conc = 50
const cc = 10  // mm from face to bar centre
const rebarsConc = [
  { x: cc / b_conc,             y: cc / h_conc             },  // bottom-left
  { x: (b_conc - cc) / b_conc,  y: cc / h_conc             },  // bottom-right
  { x: cc / b_conc,             y: (h_conc - cc) / h_conc  },  // top-left
  { x: (b_conc - cc) / b_conc,  y: (h_conc - cc) / h_conc  },  // top-right
]

export const exercise30 = {
  id: 'ex30',
  title: 'Uppgift 30 – Centrisk tryckkraft, tre material',

  derive: (p) => {
    // ── a) Stål S275 ──────────────────────────────────────────────────────
    const A_req_steel = (p.gamma_M0 * p.N_d * 1e3) / p.fy  // mm²

    // ── b) Limträ GL30c, klimatklass 2, lasttyp M ─────────────────────────
    const fcd_glulam = (p.kmod * p.fc0k) / p.gamma_M_glulam  // MPa
    const A_req_glulam = (p.N_d * 1e3) / fcd_glulam          // mm²

    // ── c) Betong C25 + B500AB-W (kallbearbetat stål) ─────────────────────
    // Ac = b·h − As,  men för 50×50 försummas armeringsandelen i Ac
    const As_c = 4 * Math.PI * p.phi_rebar ** 2 / 4        // mm², 4 st Ø5
    const Ac   = p.b_conc * p.h_conc - As_c                // mm² (netto)
    const NcRd = p.fcd * 1e6 * Ac / 1e6 +
                 0.5 * p.fyd * 1e6 * As_c / 1e6            // kN

    return {
      A_req_steel,
      fcd_glulam,
      A_req_glulam,
      As_c,
      Ac,
      NcRd,
    }
  },

  params: {
    N_d: 50,                     // kN, dimensionerande normalkraft

    // a) Stål S275
    fy:       steel.fy,          // 275 MPa
    gamma_M0: steel.gamma_M0,    // 1.0

    // b) Limträ GL30c, klimatklass 2, lasttyp M
    fc0k:          fc0k_GL30c,       // 24.5 MPa
    kmod:          0.8,              // klimatklass 2 + lasttyp M
    gamma_M_glulam: glulam.gamma_M,  // 1.25

    // c) Betong C25 + B500AB-W
    fcd:       concrete.fcd,     // 16.7 MPa
    fyd:       rebar.fyd,        // 435 MPa (0.5·fyd används för kallbearbetat)
    b_conc,                      // 50 mm
    h_conc,                      // 50 mm
    phi_rebar: 5,                // mm, diameter
  },

  problem: {
    description:
      'Ett tvärsnitt belastas med en centrisk normalkraft med dimensionerande värde ' +
      '$N_d = 50$ kN i brottgränstillståndet. ' +
      'Bestäm erforderligt tvärsnitt utan hänsyn till knäckning för följande tre fall: ' +
      'a) HEA-tvärsnitt av stål S275, ' +
      'b) Limträtvärsnitt med kvalitet GL30c, klimatklass 2 och lasttyp M, ' +
      'c) Armerat betongtvärsnitt av betong C25 och armering B500AB-W.',
    figures: [],
  },

  steps: [
    // ── Steg 1 (a): Stål S275 – HEA-tvärsnitt ────────────────────────────
    {
      id: 'A_req_steel',
      title: 'Steg 1a – Erforderlig area, stål S275',
      question:
        'Beräkna erforderlig tvärsnittsarea $A$ (mm²) för ett HEA-tvärsnitt av stål S275 ' +
        'vid centrisk normalkraft $N_d = 50$ kN. ' +
        'Välj sedan lämpligt HEA-tvärsnitt ur tabellerna.',

      figures: [
        {
          type: 'steel-section',
          props: { ...HEA_SECTIONS['HEA100'] },
        },
      ],

      answer: {
        label: 'A_{req}',
        unit: 'mm²',
        getCorrect: (p) => parseFloat(p.A_req_steel.toFixed(1)),
        hint:
          '$N_{c,Rd} = \\dfrac{f_y A}{\\gamma_{M0}} \\geq N_d$ ' +
          '$\\Rightarrow A \\geq \\dfrac{\\gamma_{M0} N_d}{f_y}$. ' +
          'S275: $f_y = 275$ MPa, $\\gamma_{M0} = 1{,}0$.',
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `A_{req} = \\frac{\\gamma_{M0}\\,N_d}{f_y} = ` +
          `\\frac{${p.gamma_M0}\\cdot${p.N_d}\\cdot10^3}{${p.fy}\\cdot10^6} = ` +
          `${p.A_req_steel.toFixed(1)}\\ \\text{mm}^2 ` +
          `\\Rightarrow \\textbf{Välj HEA 100}\\ (A = 2124\\ \\text{mm}^2 \\geq ${p.A_req_steel.toFixed(1)}\\ \\text{mm}^2)`,
      }),

      solution: [
        { text: 'Normalkraftskapacitet utan knäckning (EC3):' },
        {
          latex: () =>
            `N_{c,Rd} = \\frac{f_y A}{\\gamma_{M0}}`,
          latexBlock: true,
        },
        { text: 'Löses för erforderlig area:' },
        {
          latex: (p) =>
            `A \\geq \\frac{\\gamma_{M0}\\,N_d}{f_y} = ` +
            `\\frac{${p.gamma_M0}\\cdot${p.N_d}\\cdot10^3}{${p.fy}\\cdot10^6} = ` +
            `${p.A_req_steel.toFixed(1)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          text:
            'Det minsta HEA-tvärsnitt för vilket tvärsnittsdata finns i formelsamlingen ' +
            'är **HEA 100** med $A = 2124$ mm² $\\geq 181{,}8$ mm² — **OK!**',
        },
      ],
    },

    // ── Steg 2 (b): Limträ GL30c ──────────────────────────────────────────
    {
      id: 'A_req_glulam',
      title: 'Steg 2b – Erforderlig area, limträ GL30c',
      question:
        'Beräkna erforderlig tvärsnittsarea $A$ (mm²) för ett limträtvärsnitt ' +
        'GL30c i klimatklass 2 och lasttyp M. ' +
        'Välj sedan lämpligt standardtvärsnitt ur tabell 4.16.',

      figures: [
        {
          type: 'glulam-section',
          props: { b: 90, h: 180, laminationThickness: 45 },
        },
      ],

      answer: {
        label: 'A_{req}',
        unit: 'mm²',
        getCorrect: (p) => parseFloat(p.A_req_glulam.toFixed(0)),
        hint:
          'Beräkna designhållfastheten: $f_{c,0,d} = k_{mod}\\,f_{c,0,k}/\\gamma_M$. ' +
          'GL30c: $f_{c,0,k} = 24{,}5$ MPa. ' +
          'Klimatklass 2 + lasttyp M: $k_{mod} = 0{,}8$. ' +
          'Limträ: $\\gamma_M = 1{,}25$.',
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `A_{req} = \\frac{N_d}{f_{c,0,d}} = ` +
          `\\frac{${p.N_d}\\cdot10^3}{${p.fcd_glulam.toFixed(2)}\\cdot10^6} = ` +
          `${p.A_req_glulam.toFixed(0)}\\ \\text{mm}^2 ` +
          `\\Rightarrow \\textbf{Välj GL30c 90{\\times}180}\\ (A = 16\\,200\\ \\text{mm}^2 \\geq ${p.A_req_glulam.toFixed(0)}\\ \\text{mm}^2)`,
      }),

      solution: [
        { text: 'Dimensionerande tryckhållfasthet parallellt fiber (EC5):' },
        {
          latex: (p) =>
            `f_{c,0,d} = \\frac{k_{mod}\\,f_{c,0,k}}{\\gamma_M} = ` +
            `\\frac{${p.kmod}\\cdot${p.fc0k}}{${p.gamma_M_glulam}} = ${p.fcd_glulam.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Erforderlig area:' },
        {
          latex: (p) =>
            `A \\geq \\frac{N_d}{f_{c,0,d}} = ` +
            `\\frac{${p.N_d}\\cdot10^3}{${p.fcd_glulam.toFixed(2)}\\cdot10^6} = ` +
            `${p.A_req_glulam.toFixed(0)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        {
          text:
            'Det minsta tvärsnitt för GL30c enligt tabell 4.16 är **90×180 mm²** ' +
            'med $A = 16\\,200$ mm² $\\geq 3189$ mm² — **OK!**',
        },
      ],
    },

    // ── Steg 3 (c): Armerat betongtvärsnitt ──────────────────────────────
    {
      id: 'NcRd_conc',
      title: 'Steg 3c – Normalkraftskapacitet, armerat betongtvärsnitt',
      question:
        'Testa ett tvärsnitt $b = h = 50$ mm av betong C25 med ett armeringsjärn $\\phi 5$ ' +
        'B500AB-W (kallbearbetat stål) i varje hörn. ' +
        'Beräkna normalkraftskapaciteten $N_{c,Rd}$ (kN) och kontrollera att den överstiger $N_d$.',

      figures: [
        {
          type: 'rect-section',
          props: {
            b:         b_conc,
            h:         h_conc,
            rebars:    rebarsConc,
            rebarDia:  5,
            fillColor: '#e8e8e8',
          },
        },
      ],

      answer: {
        label: 'N_{c,Rd}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.NcRd.toFixed(1)),
        hint:
          '$N_{c,Rd} = f_{cd}\\,A_c + 0{,}5\\,f_{yd}\\,A_s$. ' +
          'Kallbearbetat stål: tryckhållfasthet $= 0{,}5\\,f_{yd}$ (avsnitt 3.2.1). ' +
          '$A_s = 4\\cdot\\pi\\phi^2/4$, $A_c \\approx b\\cdot h - A_s$.',
      },

      resultCheck: (p) => {
        const ok = p.NcRd >= p.N_d
        return {
          ok,
          latex:
            `N_{c,Rd} = ${p.NcRd.toFixed(1)}\\ \\text{kN} ` +
            `${ok ? '\\geq' : '<'} ` +
            `N_d = ${p.N_d}\\ \\text{kN} \\quad ` +
            `${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        { text: 'Armeringsarea (4 st Ø5):' },
        {
          latex: (p) =>
            `A_s = 4\\cdot\\frac{\\pi\\cdot${p.phi_rebar}^2}{4} = ${p.As_c.toFixed(1)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        { text: 'Nettobetongarea:' },
        {
          latex: (p) =>
            `A_c = b\\cdot h - A_s = ${p.b_conc}\\cdot${p.h_conc} - ${p.As_c.toFixed(1)} = ${p.Ac.toFixed(1)}\\ \\text{mm}^2`,
          latexBlock: true,
        },
        { text: 'Designvärde betong (C25, EC2):' },
        {
          latex: (p) =>
            `f_{cd} = \\frac{\\alpha_{cc}\\,f_{ck}}{\\gamma_C} = \\frac{1\\cdot25}{1{,}5} = ${p.fcd}\\ \\text{MPa}`,
          latexBlock: true,
        },
        {
          text:
            'För kallbearbetat stål (B500AB-W) gäller att tryckhållfastheten ' +
            'begränsas till $0{,}5\\,f_{yd}$ (EC2 avsnitt 3.2.1):',
        },
        {
          latex: (p) =>
            `0{,}5\\,f_{yd} = 0{,}5\\cdot${p.fyd} = ${(0.5 * p.fyd).toFixed(0)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet (EC2 kap. 8.3.3.1):' },
        {
          latex: (p) =>
            `N_{c,Rd} = f_{cd}\\,A_c + 0{,}5\\,f_{yd}\\,A_s` +
            ` = ${p.fcd}\\cdot10^6\\cdot${(p.Ac / 1e6).toFixed(6)} + 0{,}5\\cdot${p.fyd}\\cdot10^6\\cdot${(p.As_c / 1e6).toFixed(6)}` +
            ` = ${p.NcRd.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `N_{c,Rd} = ${p.NcRd.toFixed(1)}\\ \\text{kN} \\geq N_d = ${p.N_d}\\ \\text{kN} \\quad \\Rightarrow \\textbf{OK!}`,
          latexBlock: true,
        },
        {
          text:
            'Svar: $50\\times50$ mm² med $1\\,\\phi5$ i varje hörn. ' +
            '(Notera att tvärsnitt är extremt litet och ej praktiskt användbart — ' +
            'minimiarmering och produktionskrav ger ett större tvärsnitt i praktiken.)',
        },
      ],
    },
  ],
}
