import { SAFETY_CLASS, LOAD_FACTORS } from '../data/materials.js'

//things can be randomized here before setting state params


export const exercise2 = {
  id: 'ex2',
  title: 'Uppgift 2 – Laster',

  derive: (p) => {
    // fix: bare variable names → p.*; param names aligned with params below
    
    const q_k_s = p.s_k*p.C_e*p.C_t*p.mu_1
    const q_d_takas = p.safety_takås * (p.gamma_g * p.g_k_tak*p.cc_ås * + p.gamma_q * q_k_s*p.cc_ås)
    const q_d_balk  = p.safety_balk * (p.gamma_g * (p.g_k_tak*p.cc_balk + p.g_k_balk) + p.gamma_q * (q_k_s*p.cc_balk))
    const q_d_pelare = q_d_balk * p.L_balk/2

    return { q_k_s, q_d_takas, q_d_balk, q_d_pelare}
  },

  params: {
    gamma_g: LOAD_FACTORS.STR_B.gamma_G,          // partialkoeff egentyngd
    gamma_q: LOAD_FACTORS.STR_B.gamma_Q,          // partialkoeff variabel last
    s_k: 2.5, //kN/m^2 snö grundvärde  
    g_k_tak: 0.5,                           // egentyngd [kN/m²]
    g_k_balk: 0.4,
    safety_takås: SAFETY_CLASS[2],                       // säkerhetsklass 1, γ_d = 0.83
    safety_balk: SAFETY_CLASS[3],                       // säkerhetsklass 1, γ_d = 0.83
    safety_pelare: SAFETY_CLASS[3],                       // säkerhetsklass 1, γ_d = 0.83
    cc_ås: 2.5, //m
    cc_balk: 6, //m
    L_balk: 20, //m
    C_e: 1.0,
    C_t: 1.0,
    mu_1: 0.8
},

  problem: {
      figures: (p) => [
    { type: 'ex2-roof', props: { span: p.L_balk, sPurlin: p.cc_ås, sBeam: p.cc_balk, nBeams: 6, colHeight: 6, beamDepth: 1 } }
  ],
    description: (p) => [`För ett platt yttertak i Falun har taktäckningen egentyngden ${p.g_k_tak} kN/m$^2$. Yttertaket bärs upp av åsar med` + 
`centrumavståndet ${p.cc_ås} m (se bild). Takåsarna vilar på takbalkar med centrumavståndet ${p.cc_balk} m och` +
`spännvidden ${p.L_balk} m.`]
  },

  steps: [
    {
      id: 'Takås',
      title: 'Takås',
      question: 'Beräkna dimensionerande laster i brottgränstillståndet för takåsarna',
      answer: {
        label: 'q_{d,ås}',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(p.q_d_takas.toFixed(1)),
      },
      solution: [
        { latex: (p) => `\\text{Normal topografi} \\rightarrow C_e = ${p.C_e}, \\text{låga värmeförluster} \\rightarrow C_t = ${p.C_t}`, latexBlock: true},
        { latex: (p) => `\\text{Dimensionerande snölast:} q_{k,s}=\\mu_iC_eC_ts_k = ${p.mu_1} \\cdot ${p.C_e} \\cdot ${p.C_t} \\cdot ${p.s_k} = ${p.q_k_s} \\text{ kN/$m^2$}`, latexBlock: true},
        { latex: (p) => `\\text{Säkerhetsklass 2} \\rightarrow \\gamma_d = ${p.safety_takås}`, latexBlock: true},
        { latex: (p) => `\\text{Influensbredd är } ${p.cc_ås} \\text{ m}`, latexBlock: true},
        { latex: (p) =>
            [`q_d = \\gamma_d \\cdot (\\gamma_G \\cdot g_{tak} + \\gamma_Q \\cdot q_{k,s}) \\cdot c_{ås}= `,
            `${p.safety_takås} \\cdot (${p.gamma_g} \\cdot ${p.g_k_tak} + ${p.gamma_q} \\cdot ${p.q_k_s}) \\cdot ${p.cc_ås}= ${p.q_d_takas.toFixed(1)} \\text{ kN/m}`],
          latexBlock: true,
        },
      ],
    },
    {
      id: 'Balk',
      title: 'Takbalk',
      question: 'Beräkna dimensionerande laster i brottgränstillståndet för takbalkarna',
      answer: {
        label: 'q_{d,balk}',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(p.q_d_balk.toFixed(1)),
      },
      solution: [
        { latex: (p) => [`\\text{Säkerhetsklass 3} \\rightarrow \\gamma_d = ${p.safety_balk}`, 
            `q_{d,balk} = \\gamma_d(\\gamma_g \\cdot (g_{k,tak} \\cdot c_{balk} + g_{k,balk}) + \\gamma_q \\cdot q_{k,s} \\cdot c_{balk})`,
            `= ${p.safety_balk} \\cdot(${p.gamma_g} \\cdot (${p.g_k_tak} \\cdot ${p.cc_balk} + ${p.g_k_balk}) + ${p.gamma_q} \\cdot ${p.q_k_s} \\cdot ${p.cc_balk}) = ${p.q_d_balk.toFixed(1)} \\text{ kN/m} `], latexBlock: true},
      ],
    },
    {
      id: 'Pelare',
      title: 'Pelare',
      question: 'Beräkna dimensionerande laster i brottgränstillståndet för pelarna',
      answer: {
        label: 'q_{d,pelare}',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(p.q_d_pelare.toFixed(1)),
      },
      solution: [
        { latex: (p) => [`\\text{Säkerhetsklass 3} \\rightarrow \\gamma_d = ${p.safety_pelare}`, 
            `Q_{d,pelare} = R_{balk} = q_{d,balk}\\cdot \\frac{L_{balk}}{2}) = `,
            `= ${p.q_d_balk.toFixed(1)} \\cdot \\frac{${p.L_balk}}{2} = ${p.q_d_pelare.toFixed(0)} \\text{ kN}`],latexBlock: true},
      ],
    },
       
  ],
}
