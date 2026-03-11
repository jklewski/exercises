import { LIVE_LOADS, PSI_FACTORS } from '../data/loads.js'
import { SAFETY_CLASS, LOAD_FACTORS } from '../data/materials.js'

//things can be randomized here before setting state params
const liveCatC1 = LIVE_LOADS.find(r => r.category === 'C1')
const liveCatC3 = LIVE_LOADS.find(r => r.category === 'C3')  // fix: 'C' → 'C1'
const psiCatC = PSI_FACTORS.find(r => r.load === 'NL_C')

const SF = SAFETY_CLASS[1]
const COEFFS = LOAD_FACTORS.STR_B


export const exercise1 = {
  id: 'ex1',
  title: 'Uppgift 1 – Laster',

  derive: (p) => {
    // fix: bare variable names → p.*; param names aligned with params below
    const q_d_ULS_CatC1 = p.safety * (p.gamma_g * p.g_k + p.gamma_q * p.qk_NL_CatC1)
    const q_d_ULS_CatC3 = p.safety * (p.gamma_g * p.g_k + p.gamma_q * p.qk_NL_CatC3)

    const q_d_FREQ_CatC1 = p.g_k + p.psi1_NL_CatC * p.qk_NL_CatC1
    const q_d_FREQ_CatC3 = p.g_k + p.psi1_NL_CatC * p.qk_NL_CatC3

    return { q_d_ULS_CatC1, q_d_ULS_CatC3, q_d_FREQ_CatC1, q_d_FREQ_CatC3 }
  },

  params: {
    qk_NL_CatC1: liveCatC1.qk,         // nyttig last kat. B  [kN/m²]
    qk_NL_CatC3: liveCatC3.qk,         // nyttig last kat. C1 [kN/m²]
    psi1_NL_CatC: psiCatC.psi1,  // ψ₁ kat. B
    gamma_g: COEFFS.gamma_G,          // partialkoeff egentyngd
    gamma_q: COEFFS.gamma_Q,          // partialkoeff variabel last
    g_k: 3,                           // egentyngd [kN/m²]
    safety: SF,                       // säkerhetsklass 1, γ_d = 0.83
  },

  problem: {
    description: 'Bestäm dimensionerande last i brott- och bruksgränstillståndet' +
    '(tillfällig olägenhet) för två bjälklag i en skolbyggnad – ett som ska bära' +
    'laster från en lektionssal respektive en korridor. Egentyngden på bjälklagen' + 
    'är i båda fallen 3 kN/m2',

  },

  steps: [
    {
      id: 'q_d_ULS_CatC1',
      title: 'Dimensionerande last ULS – kat. C1',
      question: 'Beräkna dimensionerande last $q_d$ (kN/m²) för kategori C1 i brottgränstillstånd.',
      answer: {
        label: 'q_d',
        unit: 'kN/m²',
        getCorrect: (p) => parseFloat(p.q_d_ULS_CatC1.toFixed(2)),
      },
      solution: [
        { latex: (p) =>
            `q_d = \\gamma_d \\cdot (\\gamma_G \\cdot g_k + \\gamma_Q \\cdot q_{k,NL}) = ` +
            `${p.safety} \\cdot (${p.gamma_g} \\cdot ${p.g_k} + ${p.gamma_q} \\cdot ${p.qk_NL_CatC1}) = ` +
            `${p.q_d_ULS_CatC1.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true,
        },
      ],
    },
        {
      id: 'q_d_SLS_CatC1',
      title: 'Dimensionerande last SLS – kat. C1',
      question: 'Beräkna dimensionerande last $q_d$ (kN/m²) för kategori C1 i bruksgränstillstånd (frekvent).',
      answer: {
        label: 'q_d',
        unit: 'kN/m²',
        getCorrect: (p) => parseFloat(p.q_d_FREQ_CatC1.toFixed(2)),
      },
      solution: [
        { latex: (p) =>
            `q_d = g_k + \\psi_1 q_{k,NL} = ` +
            `${p.g_k} + ${p.psi1_NL_CatC} \\cdot ${p.qk_NL_CatC1}) = ` +
            `${p.q_d_FREQ_CatC1.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true,
        },
      ],
    },
        {
      id: 'q_d_ULS_CatC3',
      title: 'Dimensionerande last ULS – kat. C3',
      question: 'Beräkna dimensionerande last $q_d$ (kN/m²) för kategori C3 i brottgränstillstånd.',
      answer: {
        label: 'q_d',
        unit: 'kN/m²',
        getCorrect: (p) => parseFloat(p.q_d_ULS_CatC3.toFixed(2)),
      },
      solution: [
        { latex: (p) =>
            `q_d = \\gamma_d \\cdot (\\gamma_G \\cdot g_k + \\gamma_Q \\cdot q_{k,NL}) = ` +
            `${p.safety} \\cdot (${p.gamma_g} \\cdot ${p.g_k} + ${p.gamma_q} \\cdot ${p.qk_NL_CatC3}) = ` +
            `${p.q_d_ULS_CatC3.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true,
        },
      ],
    },
        {
      id: 'q_d_SLS_CatC3',
      title: 'Dimensionerande last SLS – kat. C3',
      question: 'Beräkna dimensionerande last $q_d$ (kN/m²) för kategori C3 i bruksgränstillstånd (frekvent).',
      answer: {
        label: 'q_d',
        unit: 'kN/m²',
        getCorrect: (p) => parseFloat(p.q_d_FREQ_CatC3.toFixed(2)),
      },
      solution: [
        { latex: (p) =>
            `q_d = g_k + \\psi_1 q_{k,NL} = ` +
            `${p.g_k} + ${p.psi1_NL_CatC} \\cdot ${p.qk_NL_CatC3} = ` +
            `${p.q_d_FREQ_CatC3.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true,
        },
      ],
    },
  ],
}
