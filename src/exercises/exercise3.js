export const exercise3 = {
  id: 'ex3',
  title: 'Uppgift 3 – Vindlast',

  derive: (p) => {
    // a) Wind against long side
    const hd_long   = p.h / p.d_long
    const cpe10_D_long = 0.7 + (hd_long - 0.25) * (0.8 - 0.7) / (1 - 0.25)
    const w_long    = p.qk_z * (cpe10_D_long + p.cpi)
    const qk_long   = w_long * p.s_pelare           // kN/m (line load per column)

    // b) Wind against short side
    const hd_short  = p.h / p.d_short
    const cpe10_D_short = 0.7                        // h/d < 0.25 → table value
    const w_short   = p.qk_z * (cpe10_D_short + p.cpi)

    // c) Roof suction (zone F, flat roof)
    const qk_roof   = p.qk_z * p.cpe1_F

    return { hd_long, cpe10_D_long, w_long, qk_long, hd_short, cpe10_D_short, w_short, qk_roof }
  },

  params: {
    qk_z:     0.45,   // karakteristisk hastighetstryck [kN/m²]
    h:        7,      // byggnadshöjd [m]
    d_long:   20,     // djup vid anblåsning mot långsida [m]
    d_short:  50,     // byggnadens längd / djup mot kortsida [m]
    s_pelare: 6,      // pelarcentrumavstånd [m]
    cpi:      0.3,    // inre vindlast (sug, |cpi| = 0.3, mest ogynnsamt med yttre tryck)
    cpe1_F:   2.5,    // lokal formfaktor, zon F platt tak (absolutvärde)
  },

  problem: {
    description: 'Byggnaden i uppgift 2 är 50 m lång. Vindlaster mot väggarna förs över till pelarna via ' +
      'horisontella sekundärbalkar. Anta terrängtyp III. Vid beräkning av invändig vindlast behöver den ' +
      'relativa öppningsarean inte uppskattas – välj antingen undertryck ($c_{pi} = -0{,}3$) eller ' +
      'övertryck ($c_{pi} = +0{,}2$). Bestäm karakteristiska värden för:',
  },

  steps: [
    {
      id: 'wind_long',
      title: 'a) Vind mot långsida',
      question: 'Bestäm maximal karakteristisk horisontallast (kN/m) på pelarna vid byggnadens långsidor.',
      answer: {
        label: 'q_k',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(p.qk_long.toFixed(1)),
      },
      solution: [
{ text: 'Terrängtyp III' },
{ text: 'Väljer byggnadens höjd (7 m) som referenshöjd och antar på säkra sidan att denna vindlast verkar över hela byggnadens höjd.' },
{ text: 'Falun $\\rightarrow$ $v_b = 23$ m/s (figur 1.5)' },
{ text: 'Ur tabell 1.12 interpoleras värdena för terrängtyp III, höjd 4 resp. 8 m. För att få ett värde på $q_k$ för $z = 7$ m.' },
        { latex: (p) =>
            `\\frac{h}{d} = \\frac{${p.h}}{${p.d_long}} = ${p.hd_long.toFixed(2)}`,
          latexBlock: true },
        { text: 'Störst horisontallast fås på lovartssidan: zon D (figur 1.6).' },
        
        { text: (p) => `Anblåst area per ${5} pelare: $h \\cdot s_{pelare} =$` },
        
{ latex: (p) =>
    `= ${p.h} \\cdot ${p.s_pelare} = ${p.h * p.s_pelare} \\ \\text{m}^2 > 10 \\ \\text{m}^2`,
  latexBlock: true },
        { latex: (p) =>
            `c_{pe,10} = 0.7 + (${p.hd_long.toFixed(2)} - 0.25) \\cdot \\frac{0.8 - 0.7}{1 - 0.25} = ${p.cpe10_D_long.toFixed(2)}`,
          latexBlock: true },
        { text: 'Inre vindlast: det mest ogynnsamma av $c_{pi} = +0.2$ och $c_{pi} = -0.3$. Inre vindsug samverkar med yttre vindtryck → $c_{pi} = -0.3$ ger sug, absolut värde $0.3$ adderas.' },
        { latex: (p) =>
            `w = q_k(z)(c_{pe} + c_{pi}) = ${p.qk_z} \\cdot (${p.cpe10_D_long.toFixed(2)} + ${p.cpi}) = ${p.w_long.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true },
        { latex: (p) =>
            `q_k = w \\cdot s_{pelare} = ${p.w_long.toFixed(2)} \\cdot ${p.s_pelare} = ${p.qk_long.toFixed(1)} \\ \\text{kN/m}`,
          latexBlock: true },
      ],
    },
    {
      id: 'wind_short',
      title: 'b) Vind mot kortsida',
      question: 'Bestäm maximal karakteristisk horisontallast (kN/m²) på gavelväggarna.',
      answer: {
        label: 'q_k',
        unit: 'kN/m²',
        getCorrect: (p) => parseFloat(p.w_short.toFixed(2)),
      },
      solution: [
        { latex: (p) =>
            `\\frac{h}{d} = \\frac{${p.h}}{${p.d_short}} = ${p.hd_short.toFixed(2)} < 0{,}25 \\Rightarrow \\text{zon D (figur 1.6)}`,
          latexBlock: true },
        { latex: (p) =>
            `\\text{Anblåst area: } h \\cdot b_{byggnad} = ${p.h} \\cdot ${p.d_long} = ${p.h * p.d_long} > 10 \\text{ m}^2 \\Rightarrow c_{pe} = c_{pe,10} = ${p.cpe10_D_short}`,
          latexBlock: true },
        { latex: (p) =>
            `c_{pi} = -0{,}3 \\text{ (se deluppgift a)}`,
          latexBlock: true },
        { latex: (p) =>
            `q_k = w = ${p.qk_z} \\cdot (${p.cpe10_D_short} + ${p.cpi}) = ${p.w_short.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true },
      ],
    },
    {
      id: 'wind_roof',
      title: 'c) Vindsug i tak',
      question: 'Bestäm maximal karakteristisk sugkraft (kN/m²) som påverkar taktäckningen.',
      answer: {
        label: 'q_k',
        unit: 'kN/m²',
        getCorrect: (p) => parseFloat(p.qk_roof.toFixed(1)),
      },
      solution: [
        { text: 'För störst vindsug på taktäckningen väljs det största negativa $c_{pe}$ för plana tak ur figur 1.7. Negativt tecken anger vindsug.' },
        { latex: (p) =>
            `c_{pe,1}(\\text{zon F}) = -${p.cpe1_F}`,
          latexBlock: true },
        { latex: (p) =>
            `q_k = w_e = ${p.qk_z} \\cdot ${p.cpe1_F} = ${p.qk_roof.toFixed(1)} \\ \\text{kN/m}^2`,
          latexBlock: true },
      ],
    },
  ],
}
