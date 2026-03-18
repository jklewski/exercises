/**
 * Exercise16SektionSVG – gable frame section (sektion) of a warehouse.
 *
 * The inclined gable beam is drawn as a V-shaped thick gray band (left eave → ridge → right eave).
 * Columns rise from the base to where they meet the underside of the gable beam.
 * Purlin ticks (takåsar) stick up from the beam line at equal horizontal spacing.
 * S₁ diagonals run from the top of each inner column to the base of the adjacent outer column.
 *
 * Props:
 *   span        – building width (truss span), metres (default 18)
 *   nGableBays  – number of column bays across the gable (default 3)
 *   buildingH   – wall height from ground to eave, metres (default 8)
 *   ridgeH      – extra height from eave to ridge, metres (default 3)
 *   nPurlSpaces – number of purlin spaces across the span (default 8)
 */
export default function Exercise16SektionSVG({
  span        = 18,
  nGableBays  = 3,
  buildingH   = 8,
  ridgeH      = 3,
  nPurlSpaces = 8,
}) {
  const ccCol = span / nGableBays
  const nCols = nGableBays + 1

  const ML = 75, MR = 55, MT = 28, MB = 52
  const frameW = 320
  const sc = frameW / span            // px per metre

  // SVG y: increases downward. Higher altitude = smaller SVG y.
  const baseY = MT + (buildingH + ridgeH) * sc   // ground level
  const W = ML + frameW + MR
  const H = baseY + MB

  function svgX(xm) { return ML + xm * sc }

  // Height of the gable beam (V-shape) at horizontal position xm
  function beamH(xm) {
    return buildingH + ridgeH * (1 - Math.abs(xm - span / 2) / (span / 2))
  }

  function svgY(hm) { return baseY - hm * sc }

  // Column positions and tops (where they meet the beam underside)
  const colXs   = Array.from({ length: nCols }, (_, i) => svgX(i * ccCol))
  const colTops = Array.from({ length: nCols }, (_, i) => svgY(beamH(i * ccCol)))

  // Gable beam V-shape: left eave → ridge apex → right eave
  const beamPts = [
    [svgX(0),        svgY(buildingH)],
    [svgX(span / 2), svgY(buildingH + ridgeH)],
    [svgX(span),     svgY(buildingH)],
  ]
  const beamPolyline = beamPts.map(([x, y]) => `${x},${y}`).join(' ')

  // Purlin tick positions (evenly spaced along span)
  const purlXs  = Array.from({ length: nPurlSpaces + 1 }, (_, i) => i * span / nPurlSpaces)
  const tickLen  = 10                        // purlin height above top of beam (px)
  const halfBeam = 8                         // half of gray band strokeWidth (16 / 2)

  // Annotation reference point on the left slope (~25% of span)
  const aXm   = span * 0.25
  const aX    = svgX(aXm)
  const aBcY  = svgY(beamH(aXm))       // beam centre y
  const aTopY   = aBcY - halfBeam         // top edge of gray band = sheeting y

  // Gavelbalk points midway between left edge and first purlin (avoids crossing purlins)
  const aGbXm = (span / nPurlSpaces) / 2
  const aGbX  = svgX(aGbXm)
  const aGbY  = svgY(beamH(aGbXm))

  // Snap to nearest actual purlin for the Takåsar leader line
  const nearestPurlXm = purlXs.reduce((best, xm) =>
    Math.abs(xm - aXm) < Math.abs(best - aXm) ? xm : best)
  const aPurlX  = svgX(nearestPurlXm)
  const aPurlBeamT = svgY(beamH(nearestPurlXm)) - halfBeam
  const aPurlY  = aPurlBeamT + tickLen / 2   // midpoint of that purlin tick
  const lblX    = ML - 12                // label right-anchor x (left of figure)
  const lShY    = aTopY - 2             // Takplåt label y (just above sheeting)
  const lTkY    = lShY + 14             // Takåsar label y
  const lGbY    = lTkY + 14             // Gavelbalk label y

  function dimTick(x, y, vert = false) {
    return vert
      ? <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="#374151" strokeWidth={0.8} />
      : <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#374151" strokeWidth={0.8} />
  }

  function pinSymbol(cx, y) {
    const pw = 7, ph = 10
    return (
      <g>
        <polygon points={`${cx},${y} ${cx - pw},${y + ph} ${cx + pw},${y + ph}`}
          fill="none" stroke="#374151" strokeWidth={1.2} />
        <line x1={cx - pw - 3} y1={y + ph + 3} x2={cx + pw + 3} y2={y + ph + 3}
          stroke="#374151" strokeWidth={1} />
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W}
      style={{ fontFamily: 'sans-serif', fontSize: 10 }}>

      {/* Gable beam – thick semi-transparent gray band (center line = beamPolyline) */}
      <polyline points={beamPolyline}
        fill="none" stroke="#9ca3af" strokeWidth={16} strokeOpacity={0.45}
        strokeLinejoin="round" />

      {/* Purlin ticks (takåsar): rise from inside the beam up to the top edge */}
      {purlXs.map((xm, i) => {
        const x     = svgX(xm)
        const beamT = svgY(beamH(xm)) - halfBeam   // top edge of gray band
        return (
          <line key={`pt${i}`} x1={x} y1={beamT + tickLen} x2={x} y2={beamT}
            stroke="#374151" strokeWidth={3} />
        )
      })}

      {/* Roof sheeting – thin line at the top edge of the beam (resting on purlin tops) */}
      <polyline
        points={beamPts.map(([x, y]) => `${x},${y - halfBeam}`).join(' ')}
        fill="none" stroke="#374151" strokeWidth={2.5} strokeLinejoin="round" />

      {/* Columns */}
      {colXs.map((x, i) => (
        <line key={`col${i}`} x1={x} y1={colTops[i]} x2={x} y2={baseY}
          stroke="#374151" strokeWidth={3} />
      ))}

      {/* Pinned bases */}
      {colXs.map((x, i) => (
        <g key={`pin${i}`}>{pinSymbol(x, baseY)}</g>
      ))}

      {/* S₁ – single diagonal per outer bay:
            left bay:  top of col[1]       → base of col[0]
            right bay: top of col[nCols-2] → base of col[nCols-1]  */}
      <line x1={colXs[1]} y1={colTops[1]} x2={colXs[0]} y2={baseY}
        stroke="#374151" strokeWidth={1.2} strokeDasharray="5,2" />
      <text
        x={(colXs[0] + colXs[1]) / 2 - 8}
        y={(colTops[1] + baseY) / 2 + 4}
        fontSize={10} fontStyle="italic" fontWeight="600" fill="#374151">S₁</text>

      <line x1={colXs[nCols - 2]} y1={colTops[nCols - 2]} x2={colXs[nCols - 1]} y2={baseY}
        stroke="#374151" strokeWidth={1.2} strokeDasharray="5,2" />
      <text
        x={(colXs[nCols - 2] + colXs[nCols - 1]) / 2 + 4}
        y={(colTops[nCols - 2] + baseY) / 2 + 4}
        fontSize={10} fontStyle="italic" fontWeight="600" fill="#374151">S₁</text>

      {/* Annotations with leader lines */}
      <line x1={lblX} y1={lShY} x2={aX} y2={aTopY} stroke="#374151" strokeWidth={0.7} />
      <circle cx={aX} cy={aTopY} r={2} fill="#374151" />
      <text x={lblX - 3} y={lShY + 3} textAnchor="end" fontSize={10} fill="#374151">Takplåt</text>

      <line x1={lblX} y1={lTkY} x2={aPurlX} y2={aPurlY} stroke="#374151" strokeWidth={0.7} />
      <circle cx={aPurlX} cy={aPurlY} r={2} fill="#374151" />
      <text x={lblX - 3} y={lTkY + 3} textAnchor="end" fontSize={10} fill="#374151">Takåsar</text>

      <line x1={lblX} y1={lGbY} x2={aGbX} y2={aGbY} stroke="#374151" strokeWidth={0.7} />
      <circle cx={aGbX} cy={aGbY} r={2} fill="#374151" />
      <text x={lblX - 3} y={lGbY + 3} textAnchor="end" fontSize={10} fill="#374151">Gavelbalk</text>

      {/* Dimension: column bay widths at bottom */}
      {Array.from({ length: nGableBays }, (_, i) => {
        const xa = colXs[i], xb = colXs[i + 1]
        const dy = baseY + 22
        return (
          <g key={`dim${i}`}>
            <line x1={xa} y1={dy} x2={xb} y2={dy} stroke="#374151" strokeWidth={0.8} />
            {dimTick(xa, dy)} {dimTick(xb, dy)}
            <text x={(xa + xb) / 2} y={dy + 11} textAnchor="middle" fontSize={10} fill="#374151">
              {ccCol % 1 === 0 ? ccCol : ccCol.toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* Dimension: wall height on right side */}
      {(() => {
        const dx = svgX(span) + 22
        const ytop = svgY(buildingH)
        return (
          <g>
            <line x1={dx} y1={ytop} x2={dx} y2={baseY} stroke="#374151" strokeWidth={0.8} />
            {dimTick(dx, ytop, true)} {dimTick(dx, baseY, true)}
            <text x={dx + 5} y={(ytop + baseY) / 2 + 3} fontSize={10} fill="#374151">
              {buildingH}
            </text>
          </g>
        )
      })()}

    </svg>
  )
}
