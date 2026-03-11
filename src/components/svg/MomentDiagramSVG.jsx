/**
 * MomentDiagramSVG – computes and renders M(x) (and optionally V(x)) for a
 * statically determinate beam.
 *
 * Props
 *   L          – span in metres
 *   supports   – { left, right } where each is 'pin' | 'roller' | 'fixed' | 'free'
 *                Default: { left: 'pin', right: 'roller' } (simply supported)
 *                'fixed' = wall (provides moment reaction)
 *                'pin' | 'roller' | 'free' = no moment reaction
 *   udl        – [{ q, xStart?, xEnd? }]  kN/m; defaults xStart=0, xEnd=L
 *   pointLoads – [{ P, x }]               kN, metres from left support
 *   divisions  – [d1, d2, ...]            optional panel lengths in metres for tick marks
 *   showShear  – show shear-force diagram below the moment diagram (default false)
 *
 * Sign convention:
 *   Positive M = sagging → plots downward (tension side for SS beam)
 *   Negative M = hogging → plots upward  (tension side for cantilever)
 */
export default function MomentDiagramSVG({
  L,
  supports = { left: 'pin', right: 'roller' },
  udl = [],
  pointLoads = [],
  divisions = null,
  showShear = false,
}) {
  // ── Reactions ─────────────────────────────────────────────────────────────
  let totalLoad = 0
  let momentAboutA = 0
  for (const { q, xStart = 0, xEnd = L } of udl) {
    const a = xEnd - xStart
    totalLoad      += q * a
    momentAboutA   += q * a * (xStart + a / 2)
  }
  for (const { P, x } of pointLoads) {
    totalLoad    += P
    momentAboutA += P * x
  }

  const leftFixed  = supports?.left  === 'fixed'
  const rightFixed = supports?.right === 'fixed'

  let R_A, M_A
  if (leftFixed) {
    // Cantilever: wall at x=0, free at x=L
    R_A = totalLoad
    M_A = -momentAboutA          // hogging (negative) at the fixed end
  } else if (rightFixed) {
    // Cantilever: free at x=0, wall at x=L
    R_A = 0
    M_A = 0                      // formula works naturally from the free end
  } else {
    // Simply supported (pin/roller on both sides)
    R_A = totalLoad - momentAboutA / L
    M_A = 0
  }

  // ── M(x) and V(x) ────────────────────────────────────────────────────────
  function M_at(x) {
    let M = M_A + R_A * x
    for (const { q, xStart = 0, xEnd = L } of udl) {
      if (x > xStart) {
        const a = Math.min(x, xEnd) - xStart
        M -= q * a * (x - xStart - a / 2)
      }
    }
    for (const { P, x: xP } of pointLoads) {
      if (x > xP) M -= P * (x - xP)
    }
    return M
  }

  function V_at(x) {
    let V = R_A
    for (const { q, xStart = 0, xEnd = L } of udl) {
      if (x > xStart) V -= q * (Math.min(x, xEnd) - xStart)
    }
    for (const { P, x: xP } of pointLoads) {
      if (x > xP) V -= P
    }
    return V
  }

  // ── Sample points ─────────────────────────────────────────────────────────
  const N    = 100
  const grid = Array.from({ length: N + 1 }, (_, i) => (i / N) * L)
  const keyXs = [0, L, ...pointLoads.map(pl => pl.x)]
  if (divisions) {
    let cx = 0
    divisions.forEach(d => { cx += d; keyXs.push(cx) })
  }
  const mXs = [...new Set([...grid, ...keyXs])].sort((a, b) => a - b)

  const eps    = 1e-6
  const vXs    = [...new Set([
    ...mXs,
    ...pointLoads.flatMap(({ x: xP }) => [xP - eps, xP + eps]),
  ])].sort((a, b) => a - b)

  const mVals = mXs.map(M_at)
  const vVals = vXs.map(V_at)

  // ── Moment range → dynamic geometry ──────────────────────────────────────
  const M_pos   = Math.max(0, ...mVals)  // max sagging (≥ 0)
  const M_neg   = Math.min(0, ...mVals)  // max hogging (≤ 0, negative)
  const M_range = (M_pos - M_neg) || 1

  const mH      = 110                                // total budget for M diagram
  const M_scale = mH / M_range
  const mAboveH = (-M_neg) * M_scale                 // pixels above beam for hogging
  const mBelowH = M_pos   * M_scale                  // pixels below beam for sagging

  const W          = 520
  const x0 = 70, x1 = 450, beamLen = x1 - x0
  const topPad     = 8
  const divLabelH  = divisions ? 18 : 0
  const beamY      = topPad + divLabelH + mAboveH    // shifts down when there's hogging

  const gap        = 36
  const vH         = 80
  const shearBaseY = beamY + mBelowH + gap + vH / 2
  const H = showShear
    ? shearBaseY + vH / 2 + 22
    : beamY + mBelowH + 30

  const toSvgX  = x  => x0 + (x / L) * beamLen
  const toSvgY  = M  => beamY + M * M_scale          // pos → down, neg → up

  // ── SVG paths ─────────────────────────────────────────────────────────────
  const mPath = [
    `M ${x0},${beamY}`,
    ...mXs.map((x, i) => `L ${toSvgX(x).toFixed(1)},${toSvgY(mVals[i]).toFixed(1)}`),
    `L ${x1},${beamY} Z`,
  ].join(' ')

  const vPath = [
    `M ${x0},${shearBaseY}`,
    ...vXs.map((x, i) => `L ${toSvgX(x).toFixed(1)},${(shearBaseY - vVals[i] * (vH / 2) / (Math.max(...vVals.map(Math.abs)) || 1)).toFixed(1)}`),
    `L ${x1},${shearBaseY} Z`,
  ].join(' ')

  // ── Peak annotation (largest absolute moment) ─────────────────────────────
  const M_abs_max = Math.max(...mVals.map(Math.abs))
  const M_peak_i  = mVals.findIndex(m => Math.abs(m) === M_abs_max)
  const M_peak    = mVals[M_peak_i]
  const M_peak_sx = toSvgX(mXs[M_peak_i])
  const M_peak_sy = toSvgY(M_peak)
  // Label offset: below curve for sagging, above for hogging
  const labelOffset = M_peak >= 0 ? 24 : -14
  const labelAnchorY = M_peak_sy + labelOffset

  // ── Shear extremes ────────────────────────────────────────────────────────
  const V_abs  = Math.max(...vVals.map(Math.abs)) || 1
  const V_scale = (vH / 2) / V_abs
  const V_max_i = vVals.indexOf(Math.max(...vVals))
  const V_min_i = vVals.indexOf(Math.min(...vVals))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ fontFamily: 'sans-serif' }}>

      {/* ── Division tick marks (at beam reference line) ── */}
      {divisions && (() => {
        const elems = []
        let cx = 0
        elems.push(<line key="tk0" x1={x0} y1={beamY - 5} x2={x0} y2={beamY + 3} stroke="#9ca3af" strokeWidth="1" />)
        divisions.forEach((d, i) => {
          const midSx = toSvgX(cx + d / 2)
          elems.push(
            <text key={`tl${i}`} x={midSx} y={beamY - divLabelH + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {d} m
            </text>
          )
          cx += d
          const ex = toSvgX(cx)
          elems.push(<line key={`tk${i}`} x1={ex} y1={beamY - 5} x2={ex} y2={beamY + 3} stroke="#9ca3af" strokeWidth="1" />)
        })
        return elems
      })()}

      {/* ── Beam reference line ── */}
      <line x1={x0} y1={beamY} x2={x1} y2={beamY} stroke="#374151" strokeWidth="2" />
      <text x={x0 - 6} y={beamY + 4} textAnchor="end" fontSize="10" fill="#374151">M</text>

      {/* ── Zero line (only shown when both sagging and hogging are present) ── */}
      {M_pos > 0 && M_neg < 0 && (
        <line x1={x0} y1={beamY} x2={x1} y2={beamY}
          stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,3" />
      )}

      {/* ── Moment diagram ── */}
      <path d={mPath} fill="#bfdbfe" stroke="#2563eb" strokeWidth="1.5"
        fillRule="evenodd" opacity="0.92" />

      {/* ── Peak annotation ── */}
      <line
        x1={M_peak_sx} y1={M_peak_sy}
        x2={M_peak_sx} y2={M_peak_sy + (M_peak >= 0 ? 12 : -12)}
        stroke="#1d4ed8" strokeWidth="1" strokeDasharray="3,2"
      />
      <text
        x={M_peak_sx} y={labelAnchorY}
        textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="600"
      >
        {M_peak.toFixed(1)} kNm
      </text>

      {/* ── Shear diagram (optional) ── */}
      {showShear && (
        <g>
          <line
            x1={x0} y1={shearBaseY} x2={x1} y2={shearBaseY}
            stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,3"
          />
          <text x={x0 - 6} y={shearBaseY + 4}  textAnchor="end" fontSize="10" fill="#9ca3af">0</text>
          <text x={x0 - 6} y={shearBaseY - 26} textAnchor="end" fontSize="10" fill="#374151">V</text>

          <path
            d={vPath}
            fill="#fef3c7" stroke="#d97706" strokeWidth="1.5"
            fillRule="evenodd" opacity="0.92"
          />

          <text
            x={toSvgX(vXs[V_max_i])} y={shearBaseY - vVals[V_max_i] * V_scale - 5}
            textAnchor="middle" fontSize="11" fill="#b45309" fontWeight="600"
          >
            {vVals[V_max_i].toFixed(0)} kN
          </text>
          <text
            x={toSvgX(vXs[V_min_i])} y={shearBaseY - vVals[V_min_i] * V_scale + 15}
            textAnchor="middle" fontSize="11" fill="#b45309" fontWeight="600"
          >
            {vVals[V_min_i].toFixed(0)} kN
          </text>
        </g>
      )}
    </svg>
  )
}
