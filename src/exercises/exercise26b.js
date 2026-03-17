import { GLULAM, LOAD_FACTORS } from '../data/materials.js'

const glulam = GLULAM['GL30c']
const lf     = LOAD_FACTORS['STR_B']

export const exercise26b = {
  id: 'ex26b',
  title: 'Uppgift 26b – Tvärkraftskapacitet, limträ GL30c',

  params: {
    L: 12,           // m, spännvidd
    s: 5,            // m, influensbredd (s-avstånd)
    G_k_tak: 0.5,    // kN/m², karakteristisk egenlast tak
    s_snow: 1.2,     // kN/m², karakteristisk snölast
    ...lf,           // gamma_G: 1.2, gamma_Q: 1.5
    // Tvärsnittsdata GL30c 140 × 720
    b: 140,          // mm
    h: 720,          // mm
    // Materialdta GL30c
    ...glulam,       // fmk, fvk, E0mean, rho_k, rho_mean, gamma_M
    // Klimat- och lastfaktorer
    k_mod: 0.8,      // klimatklass 1, snölast → lasttyp M
  },

  problem: {
    description:
      'Kontrollera tvärkraftskapaciteten för takbalken i byggnaden i brottgränstillståndet (STR-B). ' +
      'Balken är av limträ GL30c med tvärsnitt 140 × 720 mm². ' +
      'Klimatklass 1. Densitet för trä är 500 kg/m³. ' +
      'Takbalkarna är skyddade från direkt exponering för nederbörd och solstrålning. ' +
      'Säkerhetsklass 3. Ingen risk för vippning.',

    figures: [
      {
        type: 'beam',
        props: {
          L: 12,
          supports: { left: 'pin', right: 'roller' },
          loads: [
            { type: 'udl', label: 'snö' },
            { type: 'udl', label: 'egt tak' },
          ],
        },
      },
      {
        type: 'glulam-section',
        props: { b: 140, h: 720 },
      },
    ],

  },

  steps: [
    {
      id: 'q_d',
      title: 'Dimensionerande last',
      question:
        'Beräkna den dimensionerande lasten q_d (kN/m). ' +
        'Beräkna först balkens egentyngd G_k,balk = b · h · ρ · g.',
      answer: {
        label: 'q_d',
        unit: 'kN/m',
        getCorrect: (p) => {
          const G_k_balk = (p.b / 1000) * (p.h / 1000) * p.rho_mean * 9.81 / 1000
          return parseFloat(
            (p.gamma_G * (G_k_balk + p.G_k_tak * p.s) + p.gamma_Q * p.s_snow * p.s).toFixed(2)
          )
        },
        hint: 'G_k,balk = 0,14 · 0,72 · 500 · 9,81 / 1000 = 0,494 kN/m. Använd sedan STR-B kombinationen.',
      },
      solution: [
        { text: 'Beräkna balkens egentyngd:' },
        {
          latex: 'G_{k,balk} = b \\cdot h \\cdot \\rho \\cdot g = 0{,}14 \\cdot 0{,}72 \\cdot 500 \\cdot 9{,}81 = 0{,}494 \\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: 'Dimensionerande last, brottgränstillståndet STR-B, säkerhetsklass 3 (γ_d = 1,0):' },
        {
          latex: 'q_d = \\gamma_G \\cdot (G_{k,balk} + G_{k,tak} \\cdot s) + \\gamma_Q \\cdot s_{snow} \\cdot s',
          latexBlock: true,
        },
        {
          latex: 'q_d = 1{,}2 \\cdot (0{,}494 + 0{,}5 \\cdot 5) + 1{,}5 \\cdot 1{,}2 \\cdot 5 = 12{,}59 \\ \\text{kN/m}',
          latexBlock: true,
        },
      ],
    },

    {
      id: 'V_Ed',
      title: 'Dimensionerande tvärkraft',
      question: 'Beräkna den dimensionerande tvärkraften V_Ed (kN) vid upplagen.',
      answer: {
        label: 'V_{Ed}',
        unit: 'kN',
        getCorrect: (p) => {
          const G_k_balk = (p.b / 1000) * (p.h / 1000) * p.rho_mean * 9.81 / 1000
          const q_d = p.gamma_G * (G_k_balk + p.G_k_tak * p.s) + p.gamma_Q * p.s_snow * p.s
          return parseFloat((q_d * p.L / 2).toFixed(1))
        },
        hint: 'Enkelt upplagd balk med UDL: V_Ed = q_d · L / 2.',
      },
      solution: [
        {
          latex: 'V_{Ed} = \\frac{q_d \\cdot L}{2} = \\frac{12{,}59 \\cdot 12}{2} = 76 \\ \\text{kN}',
          latexBlock: true,
        },
      ],
    },

    {
      id: 'V_Rd',
      title: 'Tvärkraftskapacitet',
      question:
        'Beräkna tvärkraftskapaciteten V_Rd (kN) för limträbalken. ' +
        'Snölast → lasttyp M → k_mod = 0,8. ' +
        'Kom ihåg att reducera bredden med sprickfaktorn k_cr = min(3/f_vk; 1).',
      answer: {
        label: 'V_{Rd}',
        unit: 'kN',
        getCorrect: (p) => {
          const f_vd  = p.k_mod * p.fvk / p.gamma_M          // MPa
          const k_cr  = Math.min(3 / p.fvk, 1)
          const b_e   = k_cr * p.b / 1000                    // m
          const h_m   = p.h / 1000                           // m
          return parseFloat((b_e * h_m * f_vd * 1e6 / 1.5 / 1000).toFixed(1))
        },
        hint: 'f_vd = k_mod · f_vk / γ_M. k_cr = min(3/f_vk; 1). V_Rd = b_e · h · f_vd / 1,5.',
      },
      resultCheck: (p) => {
        const G_k_balk = (p.b / 1000) * (p.h / 1000) * p.rho_mean * 9.81 / 1000
        const q_d  = p.gamma_G * (G_k_balk + p.G_k_tak * p.s) + p.gamma_Q * p.s_snow * p.s
        const V_Ed = q_d * p.L / 2
        const f_vd = p.k_mod * p.fvk / p.gamma_M
        const k_cr = Math.min(3 / p.fvk, 1)
        const b_e  = k_cr * p.b / 1000
        const V_Rd = b_e * (p.h / 1000) * f_vd * 1e6 / 1.5 / 1000
        const ok   = V_Rd >= V_Ed
        return {
          ok,
          latex: `V_{Rd} = ${V_Rd.toFixed(0)} \\ \\text{kN} ${ok ? '\\geq' : '<'} V_{Ed} = ${V_Ed.toFixed(0)} \\ \\text{kN} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },
      solution: [
        { text: 'Klimatklass 1, snölast → lasttyp M → k_mod = 0,8. Dimensionerande skjuvhållfasthet:' },
        {
          latex: 'f_{vd} = \\frac{k_{mod} \\cdot f_{vk}}{\\gamma_M} = \\frac{0{,}8 \\cdot 3{,}5}{1{,}25} = 2{,}24 \\ \\text{MPa}',
          latexBlock: true,
        },
        { text: 'Balkarna är skyddade från direkt exponering – reducera bredden med sprickfaktorn k_cr:' },
        {
          latex: 'k_{cr} = \\min\\!\\left(\\frac{3}{f_{vk}};\\, 1\\right) = \\min\\!\\left(\\frac{3}{3{,}5};\\, 1\\right) = 0{,}86',
          latexBlock: true,
        },
        {
          latex: 'b_e = k_{cr} \\cdot b = 0{,}86 \\cdot 0{,}14 = 0{,}12 \\ \\text{m}',
          latexBlock: true,
        },
        { text: 'Tvärkraftskapacitet för ett rektangulärt tvärsnitt:' },
        {
          latex: 'V_{Rd} = \\frac{A \\cdot f_{vd}}{1{,}5} = \\frac{b_e \\cdot h \\cdot f_{vd}}{1{,}5} = \\frac{0{,}12 \\cdot 0{,}72 \\cdot 2{,}24 \\cdot 10^6}{1{,}5} = 129 \\ \\text{kN}',
          latexBlock: true,
        },
        { text: 'Kontroll:' },
        {
          latex: 'V_{Rd} = 129 \\ \\text{kN} \\geq V_{Ed} = 76 \\ \\text{kN} \\quad \\Rightarrow \\quad \\textbf{OK!}',
          latexBlock: true,
        },
      ],
    },
  ],
}
