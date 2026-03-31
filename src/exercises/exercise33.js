import { GLULAM } from '../data/materials.js'

const glulam = GLULAM['GL30c']   // γM=1.25

const fc0k_GL30c = 24.5    // MPa, karakteristisk tryckhållfasthet parallellt fibern
const E005_GL30c = 10800   // MPa, E0,05

export const exercise33 = {
  id: 'ex33',
  title: 'Uppgift 33 – Knäckning, limträpelare 115×315 GL30c',

  derive: (p) => {
    // ── Dimensionerande tryckhållfasthet ────────────────────────────────────
    const fcd = p.kmod * p.fck / p.gM     // MPa

    // ── a) Styva riktningen (knäckning om stark axeln, h=315 mm) ────────────
    const i_strong     = (p.h / 1000) / Math.sqrt(12)                          // m
    const lam_strong   = p.beta * p.L / i_strong
    const lam_rel_s    = lam_strong / Math.PI * Math.sqrt(p.fck / p.E005)
    const k_strong     = 0.5 * (1 + p.betac * (lam_rel_s - 0.3) + lam_rel_s ** 2)
    const kc_strong    = 1 / (k_strong + Math.sqrt(k_strong ** 2 - lam_rel_s ** 2))
    const N_cRd_strong = fcd * 1e6 * (p.b / 1000) * (p.h / 1000) * kc_strong / 1e3  // kN

    // ── b) Veka riktningen (knäckning om vek axeln, b=115 mm) ───────────────
    const i_weak     = (p.b / 1000) / Math.sqrt(12)                            // m
    const lam_weak   = p.beta * p.L / i_weak
    const lam_rel_w  = lam_weak / Math.PI * Math.sqrt(p.fck / p.E005)
    const k_weak     = 0.5 * (1 + p.betac * (lam_rel_w - 0.3) + lam_rel_w ** 2)
    const kc_weak    = 1 / (k_weak + Math.sqrt(k_weak ** 2 - lam_rel_w ** 2))
    const N_cRd_weak = fcd * 1e6 * (p.b / 1000) * (p.h / 1000) * kc_weak / 1e3  // kN

    return {
      fcd,
      i_strong, lam_strong, lam_rel_s, k_strong, kc_strong, N_cRd_strong,
      i_weak,   lam_weak,   lam_rel_w, k_weak,   kc_weak,   N_cRd_weak,
    }
  },

  params: {
    L:    4,              // m
    beta: 1,              // ledat i båda ändar

    h:    315,            // mm (stark axel)
    b:    115,            // mm (vek axel)

    fck:   fc0k_GL30c,    // 24.5 MPa
    E005:  E005_GL30c,    // 10800 MPa
    gM:    glulam.gamma_M, // 1.25
    kmod:  0.8,           // klimatklass 1, lasttyp M
    betac: 0.1,           // limträ
  },

  problem: {
    description:
      'En limträpelare med tvärsnittet $115 \\times 315$ mm² och längden $L = 4$ m är ledat ' +
      'infäst i båda ändar ($\\beta = 1$). Kvalitet GL30c, klimatklass 1, lasttyp M. ' +
      'Bestäm dimensionerande centrisk tryckkraft i brottgränstillståndet: ' +
      'a) om den är helt förhindrad att böja ut i veka riktningen, ' +
      'b) om den är oförhindrad att böja ut i veka riktningen.',

    figures: [
      {
        type: 'column',
        props: { L: 4, N_label: 'P_d', q_label: '', support: 'pin', topSupport: 'roller', color: '#f0d9a0', showDim: true },
      },
      {
        type: 'glulam-section',
        props: { b: 115, h: 315, laminationThickness: 45 },
      },
    ],
  },

  steps: [

    // ── Steg 1: Styva riktningen ─────────────────────────────────────────────
    {
      id: 'N_cRd_strong',
      title: 'Steg 1a – Normalkraftskapacitet, styva riktningen (h = 315 mm)',
      question:
        'Pelaren är förhindrad att böja ut i veka riktningen. ' +
        'Knäckning sker därför om stark axeln med gyrationradien $i = h/\\sqrt{12}$. ' +
        'Beräkna $\\lambda_{rel}$, reduktionsfaktorn $k_c$ och ' +
        'normalkraftskapaciteten $N_{c,Rd}$ (kN).',

      answer: {
        label: 'N_{c,Rd,a}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_cRd_strong.toFixed(0)),
        hint: (p) =>
          `$f_{cd} = k_{mod}\\,f_{ck}/\\gamma_M = ${p.kmod}\\cdot${p.fck}/${p.gM} = ${p.fcd.toFixed(2)}$ MPa. ` +
          `$i = h/\\sqrt{12} = ${(p.i_strong * 1000).toFixed(1)}$ mm, ` +
          `$\\lambda_{rel} = ${p.lam_rel_s.toFixed(2)}$.`,
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `N_{c,Rd} = f_{cd}\\,A\\,k_c = ` +
          `${p.fcd.toFixed(2)} \\cdot ${p.b} \\cdot ${p.h} \\cdot ${p.kc_strong.toFixed(2)} \\cdot 10^{-3} = ` +
          `\\mathbf{${p.N_cRd_strong.toFixed(0)}\\ \\text{kN}}`,
      }),

      solution: [
        { figure: { type: 'glulam-section', props: { b: 115, h: 315, laminationThickness: 45 } } },
        { text: 'Dimensionerande tryckhållfasthet (klimatklass 1, lasttyp M):' },
        {
          latex: (p) =>
            `f_{cd} = \\frac{k_{mod}\\,f_{ck}}{\\gamma_M} = \\frac{${p.kmod}\\cdot${p.fck}}{${p.gM}} = ${p.fcd.toFixed(2)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Gyrationradie för stark axeln ($h = 315$ mm):' },
        {
          latex: (p) =>
            `i = \\frac{h}{\\sqrt{12}} = \\frac{${p.h/1000}}{\\sqrt{12}} = ${(p.i_strong*1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda = \\frac{\\beta L}{i} = \\frac{${p.beta}\\cdot${p.L}}{${p.i_strong.toFixed(5)}} = ${p.lam_strong.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{rel} = \\frac{\\lambda}{\\pi}\\sqrt{\\frac{f_{ck}}{E_{0,05}}} = ` +
            `\\frac{${p.lam_strong.toFixed(2)}}{\\pi}\\sqrt{\\frac{${p.fck}}{${p.E005}}} = ${p.lam_rel_s.toFixed(2)} \\geq 0{,}3`,
          latexBlock: true,
        },
        { text: 'Knäckreduktionsfaktor ($\\beta_c = 0{,}1$ för limträ):' },
        {
          latex: (p) =>
            `k = 0{,}5\\bigl(1+${p.betac}(${p.lam_rel_s.toFixed(2)}-0{,}3)+${p.lam_rel_s.toFixed(2)}^2\\bigr) = ${p.k_strong.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k_c = \\frac{1}{k+\\sqrt{k^2-\\lambda_{rel}^2}} = ` +
            `\\frac{1}{${p.k_strong.toFixed(2)}+\\sqrt{${p.k_strong.toFixed(2)}^2-${p.lam_rel_s.toFixed(2)}^2}} = ${p.kc_strong.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet (tryck):' },
        {
          latex: (p) =>
            `N_{c,Rd} = f_{cd}\\,A\\,k_c = ${p.fcd.toFixed(2)}\\cdot10^6\\cdot${p.b/1000}\\cdot${p.h/1000}\\cdot${p.kc_strong.toFixed(2)} = ${p.N_cRd_strong.toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 2: Veka riktningen ──────────────────────────────────────────────
    {
      id: 'N_cRd_weak',
      title: 'Steg 1b – Normalkraftskapacitet, veka riktningen (b = 115 mm)',
      question:
        'Pelaren är oförhindrad att böja ut i veka riktningen. ' +
        'Knäckning sker om vek axeln med gyrationradien $i = b/\\sqrt{12}$. ' +
        'Beräkna $\\lambda_{rel}$, reduktionsfaktorn $k_c$ och ' +
        'normalkraftskapaciteten $N_{c,Rd}$ (kN).',

      answer: {
        label: 'N_{c,Rd,b}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_cRd_weak.toFixed(0)),
        hint: (p) =>
          `$i = b/\\sqrt{12} = ${(p.i_weak * 1000).toFixed(1)}$ mm, ` +
          `$\\lambda = ${p.lam_weak.toFixed(2)}$, ` +
          `$\\lambda_{rel} = ${p.lam_rel_w.toFixed(2)}$.`,
      },

      resultCheck: (p) => ({
        ok: true,
        latex:
          `N_{c,Rd} = f_{cd}\\,A\\,k_c = ` +
          `${p.fcd.toFixed(2)} \\cdot ${p.b} \\cdot ${p.h} \\cdot ${p.kc_weak.toFixed(2)} \\cdot 10^{-3} = ` +
          `\\mathbf{${p.N_cRd_weak.toFixed(0)}\\ \\text{kN}}`,
      }),

      solution: [
        { figure: { type: 'glulam-section', props: { b: 115, h: 315, laminationThickness: 45 } } },
        { text: 'Gyrationradie för vek axeln ($b = 115$ mm):' },
        {
          latex: (p) =>
            `i = \\frac{b}{\\sqrt{12}} = \\frac{${p.b/1000}}{\\sqrt{12}} = ${(p.i_weak*1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda = \\frac{\\beta L}{i} = \\frac{${p.beta}\\cdot${p.L}}{${p.i_weak.toFixed(5)}} = ${p.lam_weak.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\lambda_{rel} = \\frac{\\lambda}{\\pi}\\sqrt{\\frac{f_{ck}}{E_{0,05}}} = ` +
            `\\frac{${p.lam_weak.toFixed(2)}}{\\pi}\\sqrt{\\frac{${p.fck}}{${p.E005}}} = ${p.lam_rel_w.toFixed(2)} \\geq 0{,}3`,
          latexBlock: true,
        },
        { text: 'Knäckreduktionsfaktor ($\\beta_c = 0{,}1$ för limträ):' },
        {
          latex: (p) =>
            `k = 0{,}5\\bigl(1+${p.betac}(${p.lam_rel_w.toFixed(2)}-0{,}3)+${p.lam_rel_w.toFixed(2)}^2\\bigr) = ${p.k_weak.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `k_c = \\frac{1}{k+\\sqrt{k^2-\\lambda_{rel}^2}} = ` +
            `\\frac{1}{${p.k_weak.toFixed(2)}+\\sqrt{${p.k_weak.toFixed(2)}^2-${p.lam_rel_w.toFixed(2)}^2}} = ${p.kc_weak.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Normalkraftskapacitet (tryck):' },
        {
          latex: (p) =>
            `N_{c,Rd} = f_{cd}\\,A\\,k_c = ${p.fcd.toFixed(2)}\\cdot10^6\\cdot${p.b/1000}\\cdot${p.h/1000}\\cdot${p.kc_weak.toFixed(2)} = ${p.N_cRd_weak.toFixed(0)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
