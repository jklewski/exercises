import { CONCRETE, REBAR } from '../data/materials.js'

const concrete25 = CONCRETE['C25']
const rebar      = REBAR['K500B-T']

// Rebar layout: 5Ø16 in single row, d = 400 mm (50 mm from bottom) in 300 × 450 section
// x-positions: evenly distributed in 300 mm width (same spacing as exercise 39's 5-bar row)
const rebarXs41 = [34, 92, 150, 208, 266].map(x => x / 300)
const rebars41  = rebarXs41.map(x => ({ x, y: 50 / 450 }))

export const exercise41 = {
  id: 'ex41',
  title: 'Uppgift 41 – Nedböjning, armerad betong (bruksgränstillståndet)',

  derive: (p) => {
    const b_m = p.b / 1000   // m
    const h_m = p.h / 1000   // m
    const d_m = p.d / 1000   // m

    const Wy   = b_m * h_m * h_m / 6                   // m³
    const Iy   = b_m * Math.pow(h_m, 3) / 12            // m⁴
    const M_cr = p.fctm * 1e6 * Wy                      // Nm

    const A_s  = p.n_bars * Math.PI * Math.pow(p.phi / 1000, 2) / 4  // m²
    const rho  = A_s / (b_m * d_m)                      // –

    // ── Karakteristisk lastkombination ────────────────────────────────────────
    const q_kar    = p.G_k + p.q_k                                      // kN/m
    const M_Ed_kar = q_kar * 1e3 * p.L * p.L / 8                       // Nm
    const beta_kar = 1.0                                                 // korttidslast
    const zeta_kar = Math.max(0, 1 - beta_kar * Math.pow(M_cr / M_Ed_kar, 2))

    // No creep for characteristic – use Ecm directly
    const alpha_e_kar = p.Es / p.Ecm                                    // –
    const xi_kar      = alpha_e_kar * rho * (Math.sqrt(1 + 2 / (alpha_e_kar * rho)) - 1)
    const EI_I_kar    = p.Ecm * 1e6 * Iy                                // Nm²
    const EI_II_kar   = 0.5 * b_m * Math.pow(d_m, 3) * xi_kar * xi_kar *
                        p.Ecm * 1e6 * (1 - xi_kar / 3)                  // Nm²
    const coeff_kar   = 5 * q_kar * 1e3 * Math.pow(p.L, 4) / 384
    const u_I_kar     = coeff_kar / EI_I_kar                             // m
    const u_II_kar    = coeff_kar / EI_II_kar                            // m
    const u_d_kar     = zeta_kar * u_II_kar + (1 - zeta_kar) * u_I_kar  // m

    // ── Kvasi-permanent lastkombination ───────────────────────────────────────
    const q_kp     = p.G_k + p.psi2 * p.q_k                             // kN/m
    const M_Ed_kp  = q_kp * 1e3 * p.L * p.L / 8                        // Nm
    const beta_kp  = 0.5                                                 // långtidslast
    const zeta_kp  = Math.max(0, 1 - beta_kp * Math.pow(M_cr / M_Ed_kp, 2))

    const E_c_eff    = p.Ecm / (1 + p.phi_creep)                        // MPa
    const alpha_e_kp = p.Es / E_c_eff                                   // –
    const xi_kp      = alpha_e_kp * rho * (Math.sqrt(1 + 2 / (alpha_e_kp * rho)) - 1)
    const EI_I_kp    = E_c_eff * 1e6 * Iy                               // Nm²
    const EI_II_kp   = 0.5 * b_m * Math.pow(d_m, 3) * xi_kp * xi_kp *
                       E_c_eff * 1e6 * (1 - xi_kp / 3)                  // Nm²
    const coeff_kp   = 5 * q_kp * 1e3 * Math.pow(p.L, 4) / 384
    const u_I_kp     = coeff_kp / EI_I_kp                               // m
    const u_II_kp    = coeff_kp / EI_II_kp                              // m
    const u_d_kp     = zeta_kp * u_II_kp + (1 - zeta_kp) * u_I_kp      // m

    // ── Kontinuerlig balk (b), kvasi-permanent, ζ = 1 ─────────────────────────
    // v_max = qL⁴ / (185·EI_II)  vid x = 0,42L  (balktabell, 3-stöds balk)
    const u_d_cont = q_kp * 1e3 * Math.pow(p.L, 4) / (185 * EI_II_kp)  // m

    return {
      b_m, h_m, d_m, Wy, Iy, M_cr,
      A_s, rho,
      q_kar, M_Ed_kar, beta_kar, zeta_kar, alpha_e_kar, xi_kar, EI_I_kar, EI_II_kar,
      u_I_kar, u_II_kar, u_d_kar,
      q_kp, M_Ed_kp, beta_kp, zeta_kp, E_c_eff, alpha_e_kp, xi_kp, EI_I_kp, EI_II_kp,
      u_I_kp, u_II_kp, u_d_kp,
      u_d_cont,
    }
  },

  params: {
    L:          6,       // m, spännvidd
    b:          300,     // mm, balkbredd
    h:          450,     // mm, balkhöjd
    d:          400,     // mm, effektiv höjd (50 mm till stångarnas tyngdpunkt)
    G_k:        22,      // kN/m, karakteristisk egentyngd inkl. balkens
    q_k:        10,      // kN/m, karakteristisk nyttig last
    psi2:       0.3,     // ψ₂ för nyttig last (bostäder/kontor)
    grade:      'C25',   // betongklass
    fctm:       concrete25.fctm,   // 2.6 MPa
    Ecm:        concrete25.Ecm,    // 31 000 MPa
    phi:        16,      // mm, stångdiameter
    n_bars:     5,       // antal stänger
    Es:         rebar.Es,          // 200 000 MPa
    phi_creep:  2.3,     // kryptalet φ(∞,t₀)  (h₀=360 mm, t₀=28 d, cement N, RF 50 %)
    L_lim:      250,     // deformationskrav L/250
  },

  problem: {
    description: (p) =>
      'En fritt upplagd armerad betongbalk, spännvidd $L = 6$ m, ' +
      'har tvärsnittet 300 × 450 mm² och är armerad med 5 Ø16 K500B-T ($d = 400$ mm). ' +
      'Betong C25. Egentyngd inkl. balk: $G_k = 22$ kN/m, nyttig last $q_k = 10$ kN/m, ' +
      '$\\psi_2 = 0{,}3$. Kryptalet $\\varphi(\\infty,t_0) = 2{,}3$ ' +
      '(uttorkning från halva balkens omkrets, pålastning efter 28 dagar, cementtyp N). ' +
      'a) Beräkna mittnedböjningen för karakteristisk respektive kvasi-permanent ' +
      'lastkombination. ' +
      'b) Antag att balken görs kontinuerlig (totallängd 12 m, 6 m i varje fack) och räkna ' +
      'med $(EI)_{II}$ längs hela balkens längd — beräkna den totala långtidsnedböjningen.',

    figures: [
      {
        type: 'beam',
        props: {
          L: 6,
          supports: { left: 'pin', right: 'roller' },
          loads: [
            { type: 'udl', label: 'G_k + q_k' },
          ],
        },
      },
      {
        type: 'rect-section',
        props: { b: 300, h: 450, rebars: rebars41, fillColor: '#e8e8e8' },
      },
    ],
  },

  steps: [
    // ── Steg 1: Karakteristisk lastkombination ─────────────────────────────────
    {
      id: 'u_d_kar',
      title: 'Steg 1 (a) – Mittnedböjning, karakteristisk lastkombination',
      question: (p) =>
        'Beräkna mittnedböjningen $u_d$ (mm) för den karakteristiska lastkombinationen ' +
        `$q_{d,kar} = G_k + Q_k$. Tvärsnitt: $${p.b}\\times${p.h}$ mm², $d = ${p.d}$ mm, ` +
        `5 Ø${p.phi} K500B-T. Betong C25: $f_{ctm} = ${p.fctm}$ MPa, $E_{cm} = ${p.Ecm/1000}$ GPa. ` +
        'Interpolera med fördelningskoefficienten $\\zeta$ ($\\beta = 1{,}0$ för korttidslast).',

      answer: {
        label: 'u_{d,kar}',
        unit: 'mm',
        getCorrect: (p) => parseFloat((p.u_d_kar * 1000).toFixed(0)),
        hint: (p) =>
          `$q_{d,kar} = ${p.q_kar}$ kN/m → $M_{Ed} = ${(p.M_Ed_kar/1e3).toFixed(1)}$ kNm. ` +
          `$M_{cr} = ${(p.M_cr/1e3).toFixed(1)}$ kNm, $\\zeta = ${p.zeta_kar.toFixed(2)}$, ` +
          `$(EI)_I = ${(p.EI_I_kar/1e6).toFixed(1)}$ MNm², ` +
          `$(EI)_{II} = ${(p.EI_II_kar/1e6).toFixed(1)}$ MNm².`,
      },

      resultCheck: (p) => {
        const u_mm  = p.u_d_kar * 1000
        const u_lim = p.L * 1000 / p.L_lim
        const ok    = u_mm <= u_lim
        return {
          ok,
          latex:
            `u_{d,kar} = ${u_mm.toFixed(0)}\\ \\text{mm} ${ok ? '\\leq' : '>'} ` +
            `\\dfrac{L}{250} = ${u_lim.toFixed(0)}\\ \\text{mm}` +
            `\\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        { text: 'Karakteristisk lastkombination (tabell 1.5, uttryck 6.14b):' },
        {
          latex: (p) =>
            `q_{d,kar} = G_k + Q_k = ${p.G_k} + ${p.q_k} = ${p.q_kar}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Ed,kar} = \\frac{q_{d,kar}\\,L^2}{8} = \\frac{${p.q_kar}\\cdot10^3\\cdot${p.L}^2}{8} = ${(p.M_Ed_kar/1e3).toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        { text: 'Spricklast (böjmotstånd osprucket tvärsnitt):' },
        {
          latex: (p) =>
            `W_y = \\frac{b\\,h^2}{6} = \\frac{${p.b}\\cdot${p.h}^2}{6} = ${(p.Wy*1e6).toFixed(0)}\\cdot10^{-6}\\ \\text{m}^3`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{cr} = f_{ctm}\\,W_y = ${p.fctm}\\cdot10^6\\cdot${(p.Wy*1e6).toFixed(0)}\\cdot10^{-6} = ${(p.M_cr/1e3).toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `$M_{Ed,kar} = ${(p.M_Ed_kar/1e3).toFixed(0)}$ kNm $> M_{cr} = ${(p.M_cr/1e3).toFixed(1)}$ kNm → tvärsnittet spricker.`,
        },
        { text: 'Fördelningskoefficient ($\\beta = 1{,}0$ för karakteristisk/korttidslast):' },
        {
          latex: (p) =>
            `\\zeta = 1 - \\beta\\left(\\frac{M_{cr}}{M_{Ed}}\\right)^{\\!2} = 1 - 1{,}0\\left(\\frac{${(p.M_cr/1e3).toFixed(1)}}{${(p.M_Ed_kar/1e3).toFixed(0)}}\\right)^{\\!2} = ${p.zeta_kar.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Stadium I – osprucket tvärsnitt (ingen krypreduktion för karakteristisk LK):' },
        {
          latex: (p) =>
            `I_y = \\frac{b\\,h^3}{12} = \\frac{${p.b}\\cdot${p.h}^3}{12} = ${(p.Iy*1e6).toFixed(2)}\\cdot10^{-3}\\ \\text{m}^4`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `(EI)_I = E_{cm}\\,I_y = ${p.Ecm}\\cdot10^6\\cdot${(p.Iy*1e6).toFixed(2)}\\cdot10^{-3} = ${(p.EI_I_kar/1e6).toFixed(1)}\\cdot10^6\\ \\text{Nm}^2`,
          latexBlock: true,
        },
        { text: 'Stadium II – sprucket tvärsnitt. Armeringsandel och modulkvot:' },
        {
          latex: (p) =>
            `\\rho = \\frac{A_s}{b\\,d} = \\frac{${p.n_bars}\\cdot\\pi\\cdot(${p.phi}/2)^2}{${p.b}\\cdot${p.d}} = ${p.rho.toFixed(5)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\alpha_e = \\frac{E_s}{E_{cm}} = \\frac{${p.Es/1000}}{${p.Ecm/1000}} = ${p.alpha_e_kar.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\xi = \\alpha_e\\,\\rho\\!\\left(\\sqrt{1+\\dfrac{2}{\\alpha_e\\,\\rho}}-1\\right) = ${p.xi_kar.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `(EI)_{II} = 0{,}5\\,b\\,d^3\\,\\xi^2\\,E_{cm}\\!\\left(1-\\frac{\\xi}{3}\\right) = ${(p.EI_II_kar/1e6).toFixed(1)}\\cdot10^6\\ \\text{Nm}^2`,
          latexBlock: true,
        },
        { text: 'Nedböjning i stadium I respektive II:' },
        {
          latex: (p) =>
            `u_{d,I} = \\frac{5\\,q\\,L^4}{384\\,(EI)_I} = \\frac{5\\cdot${p.q_kar}\\cdot10^3\\cdot${p.L}^4}{384\\cdot${(p.EI_I_kar/1e6).toFixed(1)}\\cdot10^6} = ${(p.u_I_kar*1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `u_{d,II} = \\frac{5\\,q\\,L^4}{384\\,(EI)_{II}} = \\frac{5\\cdot${p.q_kar}\\cdot10^3\\cdot${p.L}^4}{384\\cdot${(p.EI_II_kar/1e6).toFixed(1)}\\cdot10^6} = ${(p.u_II_kar*1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Total nedböjning (interpolering med $\\zeta$):' },
        {
          latex: (p) =>
            `u_d = \\zeta\\,u_{d,II} + (1-\\zeta)\\,u_{d,I} = ${p.zeta_kar.toFixed(2)}\\cdot${(p.u_II_kar*1000).toFixed(1)} + ${(1-p.zeta_kar).toFixed(2)}\\cdot${(p.u_I_kar*1000).toFixed(1)} = ${(p.u_d_kar*1000).toFixed(0)}\\ \\text{mm}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 2: Kvasi-permanent lastkombination ────────────────────────────────
    {
      id: 'u_d_kp',
      title: 'Steg 2 (a) – Mittnedböjning, kvasi-permanent lastkombination',
      question: (p) =>
        'Beräkna mittnedböjningen $u_d$ (mm) för den kvasi-permanenta lastkombinationen ' +
        '$q_{d,kp} = G_k + \\psi_2\\,Q_k$. Beakta krypningens inverkan via den effektiva ' +
        `elasticitetsmodulen $E_{c,ef} = E_{cm}/(1+\\varphi)$ med $\\varphi = ${p.phi_creep}$. ` +
        'Använd $\\beta = 0{,}5$ för långtidslast.',

      answer: {
        label: 'u_{d,kp}',
        unit: 'mm',
        getCorrect: (p) => parseFloat((p.u_d_kp * 1000).toFixed(0)),
        hint: (p) =>
          `$q_{d,kp} = ${p.q_kp}$ kN/m. ` +
          `$E_{c,ef} = ${p.Ecm/1000}/(1+${p.phi_creep}) = ${p.E_c_eff.toFixed(0)}$ MPa. ` +
          `$\\zeta = ${p.zeta_kp.toFixed(2)}$, ` +
          `$(EI)_{II} = ${(p.EI_II_kp/1e6).toFixed(1)}$ MNm².`,
      },

      resultCheck: (p) => {
        const u_mm  = p.u_d_kp * 1000
        const u_lim = p.L * 1000 / p.L_lim
        const ok    = u_mm <= u_lim
        return {
          ok,
          latex:
            `u_{d,kp} = ${u_mm.toFixed(0)}\\ \\text{mm} ${ok ? '\\leq' : '>'} ` +
            `\\dfrac{L}{250} = ${u_lim.toFixed(0)}\\ \\text{mm}` +
            `\\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        { text: 'Kvasi-permanent lastkombination (tabell 1.5, uttryck 6.16b):' },
        {
          latex: (p) =>
            `q_{d,kp} = G_k + \\psi_2\\,Q_k = ${p.G_k} + ${p.psi2}\\cdot${p.q_k} = ${p.q_kp}\\ \\text{kN/m}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `M_{Ed,kp} = \\frac{q_{d,kp}\\,L^2}{8} = \\frac{${p.q_kp}\\cdot10^3\\cdot${p.L}^2}{8} = ${(p.M_Ed_kp/1e3).toFixed(1)}\\ \\text{kNm}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `$M_{Ed,kp} = ${(p.M_Ed_kp/1e3).toFixed(1)}$ kNm $> M_{cr} = ${(p.M_cr/1e3).toFixed(1)}$ kNm → tvärsnittet spricker.`,
        },
        { text: 'Fördelningskoefficient ($\\beta = 0{,}5$ för kvasi-permanent/långtidslast):' },
        {
          latex: (p) =>
            `\\zeta = 1 - 0{,}5\\left(\\frac{${(p.M_cr/1e3).toFixed(1)}}{${(p.M_Ed_kp/1e3).toFixed(1)}}\\right)^{\\!2} = ${p.zeta_kp.toFixed(2)}`,
          latexBlock: true,
        },
        { text: 'Effektiv elasticitetsmodul (krypning beaktas):' },
        {
          latex: (p) =>
            `E_{c,ef} = \\frac{E_{cm}}{1+\\varphi(\\infty,t_0)} = \\frac{${p.Ecm/1000}}{1+${p.phi_creep}} = ${p.E_c_eff.toFixed(0)}\\ \\text{MPa}`,
          latexBlock: true,
        },
        { text: 'Stadium I – osprucket tvärsnitt med krypreducerad elasticitetsmodul:' },
        {
          latex: (p) =>
            `(EI)_I = E_{c,ef}\\,I_y = ${p.E_c_eff.toFixed(0)}\\cdot10^6\\cdot${(p.Iy*1e6).toFixed(2)}\\cdot10^{-3} = ${(p.EI_I_kp/1e6).toFixed(1)}\\cdot10^6\\ \\text{Nm}^2`,
          latexBlock: true,
        },
        { text: 'Stadium II – sprucket tvärsnitt med krypreducerad modulkvot:' },
        {
          latex: (p) =>
            `\\alpha_e = \\frac{E_s}{E_{c,ef}} = \\frac{${p.Es/1000}}{${p.E_c_eff.toFixed(0)}} = ${p.alpha_e_kp.toFixed(2)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `\\xi = \\alpha_e\\,\\rho\\!\\left(\\sqrt{1+\\dfrac{2}{\\alpha_e\\,\\rho}}-1\\right) = ${p.xi_kp.toFixed(3)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `(EI)_{II} = 0{,}5\\,b\\,d^3\\,\\xi^2\\,E_{c,ef}\\!\\left(1-\\frac{\\xi}{3}\\right) = ${(p.EI_II_kp/1e6).toFixed(1)}\\cdot10^6\\ \\text{Nm}^2`,
          latexBlock: true,
        },
        { text: 'Nedböjning i stadium I respektive II:' },
        {
          latex: (p) =>
            `u_{d,I} = \\frac{5\\,q\\,L^4}{384\\,(EI)_I} = ${(p.u_I_kp*1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `u_{d,II} = \\frac{5\\,q\\,L^4}{384\\,(EI)_{II}} = ${(p.u_II_kp*1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        { text: 'Total nedböjning:' },
        {
          latex: (p) =>
            `u_d = ${p.zeta_kp.toFixed(2)}\\cdot${(p.u_II_kp*1000).toFixed(1)} + ${(1-p.zeta_kp).toFixed(2)}\\cdot${(p.u_I_kp*1000).toFixed(1)} = ${(p.u_d_kp*1000).toFixed(0)}\\ \\text{mm}`,
          latexBlock: true,
        },
      ],
    },

    // ── Steg 3: Kontinuerlig balk ──────────────────────────────────────────────
    {
      id: 'u_d_cont',
      title: 'Steg 3 (b) – Kontinuerlig balk, kvasi-permanent lastkombination',
      question: (p) =>
        'Balken görs kontinuerlig med totallängd 12 m (6 m i varje fack). ' +
        'Antag att $(EI)_{II}$ gäller längs hela balkens längd ($\\zeta = 1$). ' +
        'Beräkna den totala långtidsnedböjningen $u_d$ (mm) i det mest belastade spannet ' +
        'med balktabellens formel för tre-stöds-balk med jämnt utbredd last: ' +
        '$v_{max} = qL^4/(185\\,EI)$ vid $x = 0{,}42\\,L$.',

      answer: {
        label: 'u_d',
        unit: 'mm',
        getCorrect: (p) => parseFloat((p.u_d_cont * 1000).toFixed(1)),
        hint: (p) =>
          `Använd $(EI)_{II} = ${(p.EI_II_kp/1e6).toFixed(1)}$ MNm² (kvasi-permanent). ` +
          '$v_{max} = q\\,L^4/(185\\,EI)$.',
      },

      resultCheck: (p) => {
        const u_mm  = p.u_d_cont * 1000
        const u_lim = p.L * 1000 / p.L_lim
        const ok    = u_mm <= u_lim
        return {
          ok,
          latex:
            `u_d = ${u_mm.toFixed(1)}\\ \\text{mm} ${ok ? '\\leq' : '>'} ` +
            `\\dfrac{L}{250} = ${u_lim.toFixed(0)}\\ \\text{mm}` +
            `\\quad ${ok ? '\\Rightarrow \\textbf{OK!}' : '\\Rightarrow \\textbf{Ej OK!}'}`,
        }
      },

      solution: [
        {
          text: (p) =>
            `Antar $(EI)_{II}$ längs hela balkens längd → $\\zeta = 1$. ` +
            `Balktabellens formel för kontinuerlig balk (tre stöd, jämnt utbredd last):`,
        },
        {
          latex: () =>
            `v_{max} = \\frac{q\\,L^4}{185\\,EI} \\quad \\text{(vid } x = 0{,}42\\,L \\text{)}`,
          latexBlock: true,
        },
        {
          latex: (p) =>
            `u_d = \\frac{${p.q_kp}\\cdot10^3\\cdot${p.L}^4}{185\\cdot${(p.EI_II_kp/1e6).toFixed(2)}\\cdot10^6} = ${(p.u_d_cont*1000).toFixed(1)}\\ \\text{mm}`,
          latexBlock: true,
        },
        {
          text: (p) =>
            `Jämfört med det enkelt upplagda fallet ($u_{d,kp} = ${(p.u_d_kp*1000).toFixed(0)}$ mm) minskar nedböjningen ` +
            `till ${(p.u_d_cont*1000).toFixed(1)} mm — kontinuiteten reducerar nedböjningen avsevärt.`,
        },
      ],
    },
  ],
}
