import { LOAD_FACTORS, SAFETY_CLASS } from '../data/materials.js'

export const exercise14 = {
  id: 'ex14',
  title: 'Uppgift 14 – Stomstabilisering',

  derive: (p) => {
    // Interpolate qp(ze) from table 1.11, terrain type II, h=5m (between 4m and 8m)
    // Given: qp(4m)=0.69, qp(8m)=0.86, reference height=5m → 1/4 of the interval
    const qp_z = p.qp_4 + (p.h - 4) / (8 - 4) * (p.qp_8 - p.qp_4)

    // cpe for zone D: h/d = 5/(3*6) = 0.278, interpolate between 0.25 and 1.0
    const hd     = p.h / (p.nBays_short * p.s)
    const cpe_D  = 0.7 + (hd - 0.25) / (1 - 0.25) * (0.8 - 0.7)
    // cpe for zone E (leeward)
    const cpe_E  = 0.3 + (hd - 0.25) / (1 - 0.25) * (0.5 - 0.3)

    const we       = qp_z * (cpe_D + cpe_E)           // total wind pressure [kN/m²]
    const gamma_d  = SAFETY_CLASS[3]                   // safety class 3 → γd = 1.0
    const q_d      = gamma_d * LOAD_FACTORS.STR_B.gamma_Q * qp_z  // design wind [kN/m²]

    // Force in gavel beam (half of upper-half wall load, one end)
    const L_long    = p.nBays_long  * p.s              // building length [m]
    const P_d_gavel = (p.h / 2) * (L_long / 2) * q_d  // [kN]

    // Strut geometry: horizontal span = s, vertical = h
    const alpha_deg = Math.atan(p.h / p.s) * 180 / Math.PI
    const P_d_strut = P_d_gavel / Math.cos(Math.atan(p.h / p.s))

    return { qp_z, hd, cpe_D, cpe_E, we, gamma_d, q_d, L_long, P_d_gavel, alpha_deg, P_d_strut }
  },

  params: {
    h:           5,     // building height [m]
    s:           6,     // column spacing [m]
    nBays_long:  4,     // number of bays in long direction
    nBays_short: 3,     // number of bays in short direction
    qp_4:        0.69,  // qp at 4 m, terrain type II [kN/m²]
    qp_8:        0.86,  // qp at 8 m, terrain type II [kN/m²]
  },

  problem: {
    description: [
      'En enplans industribyggnad med bärande stomme av balk-pelarsystem skall stabiliseras för vindlast från godtyckligt håll. Stabiliseringen skall åstadkommas med strävor i lämplig omfattning, placerade på lämpligt sätt. Samtliga pelare är ledat infästa i grund och takbalk.',
      'Byggnaden är belägen i Lund och är 5,0 m hög. Samtliga pelaravstånd i långsidor och gavlar är $s = 6{,}0$ m. Taket är plant. Förutsätt terrängtyp II.',
    ],
    figures: [
      { type: 'ex14-frame', props: { nLong: 5, nShort: 4, s: 6, h: 5 } }
    ],
  },

  steps: [
    {
      id: 'struts',
      title: 'a) Placering av strävor',
      question: 'Rita in de strävor som erfordras för att byggnaden skall bli stabil. Strävorna skall bara ta dragkraft. Klicka på knappen i figuren för att se svaret.',
      solution: [
        { text: 'Stomstabilisering behövs i tre plan:' },
        { text: '1. Takplanet – krysstag i de två ändfalten (första och sista fältet) tar upp horisontell vindlast och för den vidare till gavelväggarna.' },
        { text: '2. Gavelväggarna (vänster och höger) – krysstag i ett fält per gavelvägg för den vertikala lastvägen ned till grunden.' },
        { text: '3. Långsidornas väggar behöver inte stabiliseras om taket och gavelväggarna bär horisontallasterna.' },
      ],
    },
    {
      id: 'loadpath',
      title: 'b) Lastväg',
      question: 'Rita in lastvägen för vindlasten mot en pelare på långsidan. Klicka på knappen i figuren för att se svaret.',
      solution: [
        { text: 'Vindlast mot långsidan → övre halvdelens last förs horisontellt via reglar/balkar till takplanet → krysstag i takplanet (drag) för lasten till gavelbalken → gavelbalken för lasten till gavelsträvorna → gavelsträvorna (drag) för lasten ned till grunden.' },
        { text: 'Undre halvdelens last (pelarens nedre del) tas direkt upp i pelarfoten.' },
      ],
    },
    {
      id: 'strut_force',
      title: 'c) Kraft i gavelsträva',
      question: 'Beräkna dimensionerande kraften (kN) i en gavelsträva då en långsida är anblåst.',
      answer: {
        label: 'P_d',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.P_d_strut.toFixed(1)),
        hint: 'Bestäm $q_d$ → beräkna lasten på gavelbalkens influensarea → transformera kraften till strävans riktning med $P_d = F_{horis} / \\cos \\alpha$',
      },
      solution: [
        { text: (p) => `Lund → $v_b = 26$ m/s (figur 1.4). Terrängtyp II, referenshöjd $z_e = h = ${p.h}$ m.` },
        { latex: (p) =>
            `q_p(z_e) = ${p.qp_4} + \\frac{${p.qp_8} - ${p.qp_4}}{4} = ${p.qp_z.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true },
        { text: (p) => `$h/d = ${p.h}/(${p.nBays_short}\\cdot${p.s}) = ${p.hd.toFixed(2)}$, interpolera $c_{pe}$ ur tabell 1.12:` },
        { latex: (p) =>
            `c_{pe,D} = 0{,}7 + \\frac{${p.hd.toFixed(2)} - 0{,}25}{1 - 0{,}25} \\cdot (0{,}8 - 0{,}7) = ${p.cpe_D.toFixed(2)}`,
          latexBlock: true },
        { latex: (p) =>
            `c_{pe,E} = 0{,}3 + \\frac{${p.hd.toFixed(2)} - 0{,}25}{1 - 0{,}25} \\cdot (0{,}5 - 0{,}3) = ${p.cpe_E.toFixed(2)}`,
          latexBlock: true },
        { latex: (p) =>
            `w_e = q_p(c_{pe,D} + c_{pe,E}) = ${p.qp_z.toFixed(2)} \\cdot (${p.cpe_D.toFixed(2)} + ${p.cpe_E.toFixed(2)}) = ${p.we.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true },
        { text: (p) => `Säkerhetsklass 3 → $\\gamma_d = ${p.gamma_d}$. Dimensionerande vindlast (STR-B, enbart variabel):` },
        { latex: (p) =>
            `q_d = \\gamma_d \\cdot 1{,}5 \\cdot q_p = ${p.gamma_d} \\cdot 1{,}5 \\cdot ${p.qp_z.toFixed(2)} = ${p.q_d.toFixed(2)} \\ \\text{kN/m}^2`,
          latexBlock: true },
        { text: (p) => `Anblåst vägg: ${p.nBays_long}·${p.s} = ${p.L_long} m lång, ${p.h} m hög. Lasten på övre halvan förs till gaveln. Dimensionerande kraft i gavelbalk (en ände):` },
        { latex: (p) =>
            `P_{d,gavel} = \\frac{h}{2} \\cdot \\frac{L}{2} \\cdot q_d = \\frac{${p.h}}{2} \\cdot \\frac{${p.L_long}}{2} \\cdot ${p.q_d.toFixed(2)} = ${p.P_d_gavel.toFixed(1)} \\ \\text{kN}`,
          latexBlock: true },
        { text: (p) => `Strävans lutning: $\\alpha = \\arctan(${p.h}/${p.s}) = ${p.alpha_deg.toFixed(1)}°$` },
        { latex: (p) =>
            `P_d = \\frac{P_{d,gavel}}{\\cos \\alpha} = \\frac{${p.P_d_gavel.toFixed(1)}}{\\cos ${p.alpha_deg.toFixed(1)}°} = ${p.P_d_strut.toFixed(1)} \\ \\text{kN}`,
          latexBlock: true },
      ],
    },
  ],
}
