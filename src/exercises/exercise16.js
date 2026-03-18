import { LOAD_FACTORS, SAFETY_CLASS } from '../data/materials.js'

export const exercise16 = {
  id: 'ex16',
  title: 'Uppgift 16 – Skivverkan, takdiafragma',

  derive: (p) => {
    const buildingLen = p.nBeamBays * p.ccBeam

    // Interpolate c_pe for wind on vertical walls (EN 1991-1-4, tabell 7.1)
    // h/d between 0.25 and 1.0: linear interpolation
    const h_d = p.buildingH / p.span
    const t   = Math.min(Math.max((h_d - 0.25) / 0.75, 0), 1)
    const c_pe_D = 0.7 + 0.1 * t
    const c_pe_E = 0.3 + 0.2 * t

    const w_k     = p.q_k * (c_pe_D + c_pe_E)           // char. wind pressure [kN/m²]
    const gamma_d = SAFETY_CLASS[3]                       // safety class 3 → γ_d = 1.0
    const gamma_Q = LOAD_FACTORS.STR_B.gamma_Q            // 1.5
    const q_d     = gamma_d * gamma_Q * w_k               // design wind pressure [kN/m²]
    const q_d_tak = q_d * p.buildingH / 2                 // line load on roof [kN/m]

    // Diaphragm treated as simply-supported deep beam (span = buildingLen, depth = p.span)
    const V_d   = (q_d_tak * buildingLen) / 2             // shear reaction at each gable [kN]
    const v_d   = V_d / p.span                            // shear flow [kN/m]

    // Screw spacing
    const s_m   = p.F_screw / v_d                         // [m]
    const s_mm  = Math.round(s_m * 1000)                  // [mm]

    // Chord force (outer purlin AC)
    const M_mitt  = (q_d_tak * buildingLen ** 2) / 8      // midspan moment [kNm]
    const N_takås = M_mitt / p.span                        // chord force [kN]

    // Brace force S₁ in gable frame
    const ccCol     = p.span / p.nGableBays
    const alpha     = Math.atan(p.buildingH / ccCol)
    const alpha_deg = alpha * 180 / Math.PI
    const P_d       = V_d / Math.cos(alpha)

    return {
      buildingLen, h_d, c_pe_D, c_pe_E, w_k,
      gamma_d, gamma_Q, q_d, q_d_tak,
      V_d, v_d,
      s_m, s_mm,
      M_mitt, N_takås,
      ccCol, alpha, alpha_deg, P_d,
    }
  },

  params: {
    q_k:        0.64,   // karakteristisk vindlast (topphastighetsttryck), kN/m²
    span:       18,     // byggnadens bredd / takskivans djup, m
    ccBeam:     7,      // c/c takbalkar längs byggnadens längd, m
    nBeamBays:  5,      // antal fack längs byggnadens längd
    ccPurlin:   3.25,   // c/c takåsar, m (only affects sektion figure)
    buildingH:  8,      // byggnadshöjd (markkant till takfot), m
    ridgeH:     3,      // extra höjd från takfot till nock, m
    nGableBays: 3,      // antal pelarfack i gaveln
    v_R:        4.0,    // skjuvbärförmåga takplåt, kN/m
    F_screw:    2.0,    // bärförmåga per plåtskruv, kN
  },

  problem: {
    description: [
      'En lagerbyggnad har en takskiva av profilerad plåt (TP 45, t = 0,7 mm) upplagd på kontinuerliga ' +
      'takåsar IPE 140 med centrumavståndet 2,25 m. Takåsarna vilar på fackverksbalkar med ' +
      'centrumavståndet 7,0 m och spännvidden 18 m, utom i gavelfacken AB och CD där takbalkarna ' +
      'utgörs av IPE-profiler.',
      'Vind är huvudlast med karakteristiskt värde $q_k = 0{,}64$ kN/m² (topphastighetsttryck). ' +
      'Samtliga pelare antas ledade i båda ändar. Skivverkan i taket förutsätts.',
    ],

    figures: (p) => [
      {
        type: 'ex16-stomplan',
        props: {
          span:       p.span,
          ccBeam:     p.ccBeam,
          nBeamBays:  p.nBeamBays,
          ccPurlin:   p.ccPurlin,
          nGableBays: p.nGableBays,
        },
      },
      {
        type: 'ex16-sektion',
        props: {
          span:        p.span,
          nGableBays:  p.nGableBays,
          buildingH:   p.buildingH,
          ridgeH:      p.ridgeH,
          nPurlSpaces: Math.round(p.span / p.ccPurlin),
        },
      },
      {
        type: 'ex16-detalj',
        props: {},
      },
    ],

    givenData: [
      { name: 'Karakteristisk vindlast (q_p)',  symbol: 'q_k',       value: 0.64, unit: 'kN/m²' },
      { name: 'Spännvidd takbalkar',             symbol: 'b',         value: 18,   unit: 'm'     },
      { name: 'c/c takbalkar',                   symbol: 'c_{balk}',  value: 7,    unit: 'm'     },
      { name: 'Antal fack (längd)',              symbol: 'n',         value: 5,    unit: '–'     },
      { name: 'Byggnadshöjd',                    symbol: 'h',         value: 8,    unit: 'm'     },
      { name: 'Antal pelarfack i gaveln',        symbol: 'n_{gavel}', value: 3,    unit: '–'     },
      { name: 'Skjuvbärförmåga takplåt',         symbol: 'v_R',       value: 4.0,  unit: 'kN/m'  },
      { name: 'Bärförmåga per plåtskruv',        symbol: 'F_{skruv}', value: 2.0,  unit: 'kN'    },
    ],
  },

  steps: [
    {
      id: 'shear_flow',
      title: 'a) Skjuvflöde i takplåten',
      question:
        'Beräkna dimensionerande skjuvflöde $v_{d}$ (kN/m) i takplåten. ' +
        'Kontrollera att villkoret $l/b \\geq 1{,}5$ är uppfyllt. Kontrollera att $v_{d} \\leq v_R = 4{,}0$ kN/m. ' +
        'Vind räknas som ensam variabel last (STR-B), säkerhetsklass 3.',
      answer: {
        label: 'v_{d}',
        unit: 'kN/m',
        getCorrect: (p) => parseFloat(p.v_d.toFixed(2)),
        hint: 'Beräkna dimensionerande vindtryck $q_d$ via STR-B. ' +
              'Lasten mot övre halvan av väggen förs till taket. ' +
              'Skjuvflödet: $v_d = V_d / b$, där $V_d$ är reaktionen vid gaveln.',
      },
      solution: [
        {
          text: (p) =>
            `Vindtryckskoefficienter för vertikal vägg, $h/d = ${p.buildingH}/${p.span} = ${p.h_d.toFixed(2)}$ ` +
            `(interpolera ur EN 1991-1-4 tabell 7.1):`,
        },
        {
          latex: (p) =>
            `c_{pe,D} = 0{,}7 + \\frac{${p.h_d.toFixed(2)}-0{,}25}{0{,}75}\\cdot(0{,}8-0{,}7) = ${p.c_pe_D.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `c_{pe,E} = 0{,}3 + \\frac{${p.h_d.toFixed(2)}-0{,}25}{0{,}75}\\cdot(0{,}5-0{,}3) = ${p.c_pe_E.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `w_k = q_k(c_{pe,D}+c_{pe,E}) = ${p.q_k}\\cdot(${p.c_pe_D.toFixed(3)}+${p.c_pe_E.toFixed(3)}) = ${p.w_k.toFixed(2)}\\ \\text{kN/m}^2`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Säkerhetsklass 3 → $\\gamma_d = ${p.gamma_d}$. Dimensionerande vindlast (STR-B, ensam variabel):`,
        },
        {
          latex: (p) =>
            `q_d = \\gamma_d \\cdot 1{,}5 \\cdot w_k = ${p.gamma_d}\\cdot 1{,}5\\cdot${p.w_k.toFixed(2)} = ${p.q_d.toFixed(2)}\\ \\text{kN/m}^2`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Pelarna är ledat infästa → lasten mot övre halvan ($h/2 = ${p.buildingH / 2}$ m) förs till taket:`,
        },
        {
          latex: (p) =>
            `q_{d,tak} = q_d\\cdot\\frac{h}{2} = ${p.q_d.toFixed(2)}\\cdot\\frac{${p.buildingH}}{2} = ${p.q_d_tak.toFixed(2)}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Takskivan (djup $b = ${p.span}$ m, längd $l = ${p.buildingLen}$ m) som fri balk. ` +
            `Kontroll: $l/b = ${p.buildingLen}/${p.span} = ${(p.buildingLen / p.span).toFixed(2)} \\geq 1{,}5$ ✓`,
        },
        {
          latex: (p) =>
            `V_d = \\frac{q_{d,tak}\\cdot l}{2} = \\frac{${p.q_d_tak.toFixed(2)}\\cdot${p.buildingLen}}{2} = ${p.V_d.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `v_d = \\frac{V_d}{b} = \\frac{${p.V_d.toFixed(1)}}{${p.span}} = ${p.v_d.toFixed(2)}\\ \\text{kN/m} \\leq v_R = ${p.v_R}\\ \\text{kN/m}\\ ✓`,
          latexBlock: true,
        },
      ],
    },

    {
      id: 'screw_spacing',
      title: 'b) Skruvavstånd längs rand AB',
      question:
        'Beräkna c/c-avstånd $s$ (mm) för plåtskruvarna längs randen AB om varje ' +
        'skruv kan överföra $F_{skruv} = 2{,}0$ kN.',
      answer: {
        label: 's',
        unit: 'mm',
        getCorrect: (p) => p.s_mm,
        hint: 'Varje meter kräver att $v_d$ kN tas upp. Antal skruvar per meter: $n = v_d / F_{skruv}$, sedan $s = 1/n$.',
      },
      solution: [
        {
          figure: (p) => ({
            type: 'ex16-diaphragm',
            props: {
              buildingLen: p.buildingLen,
              span:        p.span,
              q_d_tak:     p.q_d_tak,
              V_d:         p.V_d,
            },
          }),
        },
        {
          text: (p) =>
            `Varje meter längs randen AB behöver $v_d = ${p.v_d.toFixed(2)}$ kN/m tas upp. ` +
            `Varje skruv bär $F_{skruv} = ${p.F_screw}$ kN → antal skruvar per meter:`,
        },
        {
          latex: (p) =>
            `n = \\frac{v_d}{F_{skruv}} = \\frac{${p.v_d.toFixed(2)}}{${p.F_screw}} = ${(p.v_d / p.F_screw).toFixed(2)}\\ \\text{st/m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `s = \\frac{1}{n} = \\frac{${p.F_screw}}{${p.v_d.toFixed(2)}} = ${p.s_m.toFixed(3)}\\ \\text{m} = ${p.s_mm}\\ \\text{mm}`,
          latexBlock: true,
        },
      ],
    },

    {
      id: 'purlin_force',
      title: 'c) Normalkraft i yttre takåsen AC',
      question:
        'Beräkna maximala normalkraften $N_{takås}$ (kN) i den yttre takåsen AC. ' +
        'Åsen fungerar som dragband (kantbalk) i takskivans bärande system.',
      answer: {
        label: 'N_{takås}',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.N_takås.toFixed(1)),
        hint: 'Takskivan beter sig som en fri balk med djup $b$. ' +
              'Momentet i mittsnitt ger normalkrafter i kantbalkarna: $N_{takås} = M_{mitt}/b$.',
      },
      solution: [
        {
          text: (p) =>
            `Takskivan (fri balk, spännvidd $l = ${p.buildingLen}$ m, linjärlast $q_{d,tak} = ${p.q_d_tak.toFixed(2)}$ kN/m):`,
        },
        {
          latex: (p) =>
            `M_{mitt} = \\frac{q_{d,tak}\\cdot l^2}{8} = \\frac{${p.q_d_tak.toFixed(2)}\\cdot${p.buildingLen}^2}{8} = ${p.M_mitt.toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Momentet bärs av ett kraftpar i de yttre takåsarna med hävarmlängd $b = ${p.span}$ m:`,
        },
        {
          latex: (p) =>
            `N_{takås} = \\frac{M_{mitt}}{b} = \\frac{${p.M_mitt.toFixed(1)}}{${p.span}} = ${p.N_takås.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },

    {
      id: 'brace_force',
      title: 'd) Kraft i vindsträva S₁',
      question:
        'Beräkna kraften $P_d$ (kN) i vindsträvorna i gavelfacket. ' +
        'Diagonalerna tar enbart dragkrafter. Strävan är lutad mot pelarna.',
      answer: {
        label: 'P_d',
        unit: 'kN',
        getCorrect: (p) => parseFloat(p.P_d.toFixed(1)),
        hint: 'Reaktionen $V_d$ förs in i gaveln som horisontalkraft vid taknivå. ' +
              'Strävans lutning: $\\alpha = \\arctan(h / c_{c,pelare})$. ' +
              'Kraft i sträva: $P_d = V_d / \\cos\\alpha$.',
      },
      solution: [
        {
          text: (p) =>
            `Horisontell reaktion vid gaveln: $V_d = ${p.V_d.toFixed(1)}$ kN (från a). ` +
            `Pelaravstånd i gaveln: $c_c = ${p.span}/${p.nGableBays} = ${p.ccCol.toFixed(1)}$ m.`,
        },
        {
          figure: (p) => ({
            type: 'ex16-brace-geo',
            props: {
              ccCol:     p.ccCol,
              buildingH: p.buildingH,
              V_d:       p.V_d,
              P_d:       p.P_d,
              alpha_deg: p.alpha_deg,
            },
          }),
        },
        {
          latex: (p) =>
            `\\alpha = \\arctan\\!\\left(\\frac{h}{c_c}\\right) = \\arctan\\!\\left(\\frac{${p.buildingH}}{${p.ccCol.toFixed(1)}}\\right) = ${p.alpha_deg.toFixed(1)}°`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `P_d = \\frac{V_d}{\\cos\\alpha} = \\frac{${p.V_d.toFixed(1)}}{\\cos ${p.alpha_deg.toFixed(1)}°} = ${p.P_d.toFixed(1)}\\ \\text{kN}`,
          latexBlock: true,
        },
      ],
    },
  ],
}
