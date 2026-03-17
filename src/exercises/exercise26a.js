import { IPE_SECTIONS } from '../data/ipe-sections.js'
import { STEEL, LOAD_FACTORS } from '../data/materials.js'

const section  = IPE_SECTIONS['IPE360']
const material = STEEL['S235']
const lf       = LOAD_FACTORS['STR_B']

export const exercise26a = {
  id: 'ex26a',
  title: 'Uppgift 26a – Tvärkraftskapacitet, IPE 360 S235',

  params: {
    L: 12,           // m, spännvidd
    s: 5,            // m, influensbredd (s-avstånd)
    G_k_tak: 0.5,    // kN/m², karakteristisk egenlast tak
    s_snow: 1.2,     // kN/m², karakteristisk snölast
    ...lf,           // gamma_G: 1.2, gamma_Q: 1.5
    ...section,      // h, b, tf, tw, R, A, Aw, Wy, Zy, g
    ...material,     // fy, fu, E, gamma_M0, gamma_M1
  },

  problem: {
    description:
      'Kontrollera tvärkraftskapaciteten för takbalken i byggnaden i brottgränstillståndet (STR-B). ' +
      'Balken är en IPE 360, stål S235. Egentyngd enligt ståltabell. ' +
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
      {type: 'ipe-section',
        props:  {h: 360, b: 170, tf: 12.7, tw: 8},
      }
    ],

  },

  steps: [
    {
      id: 'q_d',
      title: 'Dimensionerande last',
      question:
        'Beräkna den dimensionerande lasten q_d (kN/m) för brottgränstillståndet STR-B. ' +
        'Balkens egentyngd: G_{k,balk} = 57,1 · 9,81 / 1000 = 0,56 kN/m.',
      answer: {
        label: 'q_d',
        unit: 'kN/m',
        getCorrect: (p) => {
          const G_k_balk = p.g * 9.81 / 1000
          return parseFloat(
            (p.gamma_G * (G_k_balk + p.G_k_tak * p.s) + p.gamma_Q * p.s_snow * p.s).toFixed(2)
          )
        },
        hint: 'q_d = γ_G · (G_k,balk + G_k,tak · s) + γ_Q · s_snow · s. G_k,balk är redan i kN/m.',
      },
      solution: [
        { text: 'Brottgränstillståndet STR-B med säkerhetsklass 3 (γ_d = 1,0):' },
        {
          latex: 'q_d = \\gamma_G \\cdot (G_{k,balk} + G_{k,tak} \\cdot s) + \\gamma_Q \\cdot s_{snow} \\cdot s',
          latexBlock: true,
        },
        {
          latex: 'q_d = 1{,}2 \\cdot (0{,}56 + 0{,}5 \\cdot 5) + 1{,}5 \\cdot 1{,}2 \\cdot 5 = 12{,}67 \\ \\text{kN/m}',
          latexBlock: true,
        },
        { text: 'G_k,balk är redan i kN/m och multipliceras därför inte med influensbredden.' },
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
          const G_k_balk = p.g * 9.81 / 1000
          const q_d = p.gamma_G * (G_k_balk + p.G_k_tak * p.s) + p.gamma_Q * p.s_snow * p.s
          return parseFloat((q_d * p.L / 2).toFixed(1))
        },
        hint: 'Enkelt upplagd balk med UDL: V_Ed = q_d · L / 2.',
      },
      solution: [
        { text: 'Maximal tvärkraft uppstår vid upplagen för en enkelt upplagd balk med jämnt fördelad last:' },
        {
          latex: 'V_{Ed} = \\frac{q_d \\cdot L}{2} = \\frac{12{,}67 \\cdot 12}{2} = 76{,}0 \\ \\text{kN}',
          latexBlock: true,
        },
      ],
    },

    {
      id: 'V_Rd',
      title: 'Tvärkraftskapacitet – elastisk dimensionering',
      question:
        'Beräkna den elastiska tvärkraftskapaciteten V_Rd (kN) för IPE 360. ' +
        'Kontrollera först att förenklingsvillkoret A_f / A_w ≥ 0,6 är uppfyllt.',
      answer: {
        label: 'V_{Rd}',
        unit: 'kN',
        getCorrect: (p) =>
          parseFloat(((p.fy / Math.sqrt(3)) * p.Aw / 1000).toFixed(1)),
        hint: 'V_Rd = (f_y / (√3 · γ_M0)) · A_w. Med γ_M0 = 1,0 och A_w i mm², dividera med 1000 för kN.',
      },
      resultCheck: (p) => {
        const G_k_balk = p.g * 9.81 / 1000
        const q_d  = p.gamma_G * (G_k_balk + p.G_k_tak * p.s) + p.gamma_Q * p.s_snow * p.s
        const V_Ed = q_d * p.L / 2
        const V_Rd = (p.fy / Math.sqrt(3)) * p.Aw / 1000
        const ok   = V_Rd >= V_Ed
        return {
          ok,
          latex: `V_{Rd} = ${V_Rd.toFixed(0)} \\ \\text{kN} ${ok ? '\\geq' : '<'} V_{Ed} = ${V_Ed.toFixed(0)} \\ \\text{kN} \\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },
      solution: [
        { text: 'Kontrollera förenklingsvillkoret för I- och H-tvärsnitt (A_f = b · t_f):' },
        {
          latex: '\\frac{A_f}{A_w} = \\frac{170 \\cdot 12{,}7}{2677} = 0{,}81 \\geq 0{,}6 \\quad \\checkmark',
          latexBlock: true,
        },
        { text: 'Villkoret uppfyllt. Elastisk tvärkraftskapacitet:' },
        {
          latex: 'V_{Rd} = \\frac{f_y}{\\sqrt{3} \\cdot \\gamma_{M0}} \\cdot A_w = \\frac{235}{\\sqrt{3} \\cdot 1{,}0} \\cdot 2677 = 363 \\ \\text{kN}',
          latexBlock: true,
        },
        { text: 'Kontroll:' },
        {
          latex: 'V_{Rd} = 363 \\ \\text{kN} \\geq V_{Ed} = 76 \\ \\text{kN} \\quad \\Rightarrow \\quad \\textbf{OK!}',
          latexBlock: true,
        },
      ],
    },
  ],
}
