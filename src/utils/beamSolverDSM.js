/**
 * beamSolverDSM – Direct Stiffness Method solver for Euler-Bernoulli beams.
 * Pure JS, no external dependencies. Handles statically indeterminate beams
 * (continuous spans, fixed supports, interior supports).
 *
 * @param {object}           opts
 * @param {number[]}         opts.spans       Span lengths in metres [L0, L1, ...]
 * @param {string[]}         opts.supports    'pin'|'fixed'|'free' per node (n+1 entries)
 * @param {number[]}         [opts.udls]      UDL in kN/m per span, positive = downward
 * @param {{x,P}[]}          [opts.pointLoads] Point loads: x = global pos (m), P = kN downward
 * @param {number|number[]}  [opts.EI]        Flexural stiffness in kNm², scalar or per span.
 *                                            If omitted the solver uses EI=1 (normalised) and
 *                                            deflection output is suppressed.
 *
 * @returns {{
 *   nodes:     number[],        node x-coordinates (m)
 *   reactions: {x,Fy,M}[],     reactions at each node (kN upward, kNm CCW)
 *   Ltot:      number,          total beam length (m)
 *   mXs:       number[],        x positions for moment diagram
 *   mVals:     number[],        M values (kNm), sagging = positive
 *   vXs:       number[],        x positions for shear diagram (eps-pairs at point loads)
 *   vVals:     number[],        V values (kN)
 *   deflXs:    number[]|null,   x positions for deflection (null if EI omitted)
 *   deflVals:  number[]|null,   v values (m), downward = positive (null if EI omitted)
 *   peaks:     {Vmax,Mmax,vmax}
 * }}
 */
export function beamSolverDSM({ spans, supports, udls, pointLoads = [], EI = null }) {
  // ── Setup ──────────────────────────────────────────────────────────────────
  const nEl    = spans.length
  const nNodes = nEl + 1
  const nDOF   = 2 * nNodes

  const nodes = [0]
  for (let i = 0; i < nEl; i++) nodes.push(nodes[i] + spans[i])
  const Ltot = nodes[nNodes - 1]

  const q = (udls && udls.length === nEl) ? [...udls] : new Array(nEl).fill(0)

  const hasEI = EI !== null
  const EIe   = !hasEI           ? new Array(nEl).fill(1)
              : Array.isArray(EI) ? EI
              :                    new Array(nEl).fill(Number(EI))

  // ── Global stiffness matrix ────────────────────────────────────────────────
  const K = Array.from({ length: nDOF }, () => new Array(nDOF).fill(0))
  for (let e = 0; e < nEl; e++) {
    const L = spans[e], ei = EIe[e]
    const L2 = L * L, L3 = L2 * L
    const ke = [
      [ 12/L3,   6/L2, -12/L3,   6/L2],
      [  6/L2,   4/L,   -6/L2,   2/L ],
      [-12/L3,  -6/L2,  12/L3,  -6/L2],
      [  6/L2,   2/L,   -6/L2,   4/L ],
    ]
    const d = [2*e, 2*e+1, 2*e+2, 2*e+3]
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        K[d[i]][d[j]] += ei * ke[i][j]
  }

  // ── Equivalent nodal load vector ───────────────────────────────────────────
  const F = new Array(nDOF).fill(0)

  // UDL consistent load vector
  for (let e = 0; e < nEl; e++) {
    const L = spans[e], qi = q[e]
    if (!qi) continue
    const L2 = L * L
    F[2*e]     -= qi * L  / 2
    F[2*e+1]   -= qi * L2 / 12
    F[2*e+2]   -= qi * L  / 2
    F[2*e+3]   += qi * L2 / 12
  }

  // Point load fixed-end forces
  for (const { x: xP, P } of pointLoads) {
    let e = nEl - 1
    for (let i = 0; i < nEl; i++) {
      if (xP <= nodes[i + 1] + 1e-12) { e = i; break }
    }
    const a = xP - nodes[e]
    const b = nodes[e + 1] - xP
    const L = spans[e], L2 = L * L, L3 = L2 * L
    F[2*e]     -= P * b * b * (3*a + b) / L3
    F[2*e+1]   -= P * a * b * b          / L2
    F[2*e+2]   -= P * a * a * (3*b + a) / L3
    F[2*e+3]   += P * a * a * b          / L2
  }

  // ── Boundary conditions & solve ────────────────────────────────────────────
  const constrained = new Set()
  for (let i = 0; i < nNodes; i++) {
    const s = supports[i]
    if (s === 'pin'   || s === 'fixed') constrained.add(2 * i)
    if (s === 'fixed')                  constrained.add(2 * i + 1)
  }

  const freeDOFs = []
  for (let i = 0; i < nDOF; i++) if (!constrained.has(i)) freeDOFs.push(i)

  const u = new Array(nDOF).fill(0)
  if (freeDOFs.length > 0) {
    const Kff = freeDOFs.map(i => freeDOFs.map(j => K[i][j]))
    const Ff  = freeDOFs.map(i => F[i])
    const uf  = gaussSolve(Kff, Ff)
    freeDOFs.forEach((dof, k) => { u[dof] = uf[k] })
  }

  // Reactions: R = K·u − F
  const R = new Array(nDOF).fill(0)
  for (let i = 0; i < nDOF; i++) {
    for (let j = 0; j < nDOF; j++) R[i] += K[i][j] * u[j]
    R[i] -= F[i]
  }

  // ── Precompute element left-boundary values (equilibrium from left) ─────────
  const V_left = new Array(nEl)  // shear at left end of each element
  const M_left = new Array(nEl)  // moment at left end of each element

  V_left[0] = R[0]
  M_left[0] = -R[1]  // moment reaction at left node opposes internal moment

  for (let e = 1; e < nEl; e++) {
    // Cumulative upward forces minus loads left of element e
    let V = R[0]
    for (let k = 1; k <= e; k++) V += R[2 * k]
    for (let k = 0; k < e; k++)  V -= q[k] * spans[k]
    for (const { x: xP, P } of pointLoads) if (xP < nodes[e]) V -= P
    V_left[e] = V

    // M_left[e] = M at right end of element e-1 (continuity)
    const Le  = spans[e - 1]
    let M = M_left[e - 1] + V_left[e - 1] * Le - q[e - 1] * Le * Le / 2
    for (const { x: xP, P } of pointLoads) {
      if (xP > nodes[e - 1] && xP < nodes[e]) M -= P * (Le - (xP - nodes[e - 1]))
    }
    M_left[e] = M
  }

  // ── M(x) and V(x) via equilibrium ──────────────────────────────────────────
  function getElem(x) {
    for (let e = 0; e < nEl; e++) if (x <= nodes[e + 1] + 1e-12) return e
    return nEl - 1
  }

  function M_at(x) {
    const e  = getElem(x)
    const xi = x - nodes[e]
    let M = M_left[e] + V_left[e] * xi - q[e] * xi * xi / 2
    for (const { x: xP, P } of pointLoads)
      if (xP > nodes[e] && xP < x) M -= P * (xi - (xP - nodes[e]))
    return M
  }

  function V_at(x) {
    const e  = getElem(x)
    const xi = x - nodes[e]
    let V = V_left[e] - q[e] * xi
    for (const { x: xP, P } of pointLoads)
      if (xP > nodes[e] && xP < x) V -= P
    return V
  }

  // ── Build output sample arrays ─────────────────────────────────────────────
  const PTS = 60   // points per span
  const eps = 1e-9

  // Uniform grid across all spans + node positions
  const base = []
  for (let e = 0; e < nEl; e++)
    for (let k = 0; k <= PTS; k++)
      base.push(+(nodes[e] + (k / PTS) * spans[e]).toFixed(9))

  const mXs  = [...new Set(base)].sort((a, b) => a - b)
  const mVals = mXs.map(M_at)

  // vXs: add eps-pairs at point load positions for shear discontinuities
  const plXs = pointLoads.map(pl => pl.x)
  const vXs  = [...new Set([
    ...mXs,
    ...plXs.flatMap(xP => [+(xP - eps).toFixed(9), +(xP + eps).toFixed(9)]),
  ])].sort((a, b) => a - b)
  const vVals = vXs.map(V_at)

  // ── Deflection via trapezoid double-integration of M/EI ───────────────────
  // Uses nodal displacements from FEM as initial conditions → correct for any BCs.
  let deflXs = null, deflVals = null
  if (hasEI) {
    const DPTS = 80
    deflXs  = []
    deflVals = []
    for (let e = 0; e < nEl; e++) {
      const L  = spans[e]
      const ei = EIe[e]
      const dx = L / DPTS
      let a = u[2 * e + 1]   // initial slope (rad) from FEM
      let v = u[2 * e]       // initial deflection (m) from FEM
      deflXs.push(nodes[e])
      deflVals.push(-v)       // negate: downward positive for display
      for (let k = 0; k < DPTS; k++) {
        const x0 = nodes[e] + k * dx
        const x1 = x0 + dx
        const M0 = M_at(x0)
        const M1 = M_at(x1)
        const a1 = a + dx * (M0 + M1) / (2 * ei)   // trapezoid
        v = v + dx * (a + a1) / 2                   // trapezoid
        a = a1
        deflXs.push(x1)
        deflVals.push(-v)
      }
    }
  }

  // ── Reactions output ────────────────────────────────────────────────────────
  const reactions = nodes.map((x, i) => ({ x, Fy: R[2 * i], M: R[2 * i + 1] }))

  const peaks = {
    Vmax: Math.max(...vVals.map(Math.abs)),
    Mmax: Math.max(...mVals.map(Math.abs)),
    vmax: deflVals ? Math.max(...deflVals.map(Math.abs)) : null,
  }

  return { nodes, reactions, Ltot, mXs, mVals, vXs, vVals, deflXs, deflVals, peaks }
}

// ── Gaussian elimination with partial pivoting ────────────────────────────────
function gaussSolve(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col
    for (let row = col + 1; row < n; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row
    ;[M[col], M[maxRow]] = [M[maxRow], M[col]]
    if (Math.abs(M[col][col]) < 1e-14) continue  // singular column — skip
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col]
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n]
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j]
    x[i] /= M[i][i]
  }
  return x
}
