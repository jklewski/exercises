/**
 * Exercise16BraceGeoSVG – illustration for step d (brace force S₁).
 *
 * Left panel:  gable bay rectangle (ccCol × buildingH) with diagonal and angle α.
 * Right panel: force diagram showing horizontal reaction V_d and strut force P_d.
 *
 * Props: ccCol, buildingH, V_d, P_d, alpha_deg
 */
export default function Exercise16BraceGeoSVG({ ccCol, buildingH, V_d, P_d, alpha_deg }) {
  const alpha = alpha_deg * Math.PI / 180

  /* ── Left panel: bay geometry ── */
  const sc   = Math.min(72 / ccCol, 96 / buildingH)   // px per metre
  const rW   = ccCol * sc
  const rH   = buildingH * sc
  const gML  = 26, gMT = 18, gMR = 12, gMB = 10
  const lpW  = gML + rW + gMR
  const lpH  = gMT + rH + gMB
  const rx   = gML, ry = gMT

  /* ── Right panel: force diagram ── */
  const hLeg = 50                          // horizontal leg length (px)
  const vLeg = hLeg * Math.tan(alpha)      // vertical leg (= hLeg * h/ccCol)
  const gap  = 22
  const rpML = 60                          // space left of origin (for V_d arrow + label)
  const rpMR = 65                          // space right of origin (P_d arrow + label)
  const rpMT = 18
  const rpMB = 12
  const rpX0 = lpW + gap                   // left edge of right panel
  const ox   = rpX0 + rpML                // origin x (force junction point)
  const oy   = rpMT + 5                   // origin y

  const W = rpX0 + rpML + hLeg + rpMR
  const H = Math.max(lpH, rpMT + vLeg + rpMB + 10)

  /* Angle arc helper */
  const arcR = 12

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.round(W)}
      style={{ fontFamily: 'sans-serif', fontSize: 10 }}>
      <defs>
        <marker id="bg16-arr" markerWidth="6" markerHeight="5"
          refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L6,2.5 L0,5 Z" fill="#374151" />
        </marker>
      </defs>

      {/* ── Bay rectangle ── */}
      <rect x={rx} y={ry} width={rW} height={rH}
        fill="none" stroke="#374151" strokeWidth={1.5} />

      {/* Diagonal: bottom-left → top-right */}
      <line x1={rx} y1={ry + rH} x2={rx + rW} y2={ry}
        stroke="#374151" strokeWidth={1.2} />

      {/* Angle arc at bottom-left corner */}
      <path
        d={`M ${rx + arcR},${ry + rH} A ${arcR},${arcR} 0 0,0 ${rx + arcR * Math.sin(alpha)},${ry + rH - arcR * Math.cos(alpha)}`}
        fill="none" stroke="#374151" strokeWidth={0.8} />
      <text x={rx + 17} y={ry + rH - 6}
        fontSize={9} fontStyle="italic" fill="#374151">α</text>

      {/* Width dim */}
      <line x1={rx} y1={ry - 6} x2={rx + rW} y2={ry - 6}
        stroke="#374151" strokeWidth={0.7} />
      <line x1={rx}      y1={ry - 8} x2={rx}      y2={ry - 4} stroke="#374151" strokeWidth={0.7} />
      <line x1={rx + rW} y1={ry - 8} x2={rx + rW} y2={ry - 4} stroke="#374151" strokeWidth={0.7} />
      <text x={rx + rW / 2} y={ry - 9}
        textAnchor="middle" fontSize={10} fill="#374151">{ccCol}</text>

      {/* Height dim */}
      <line x1={rx - 6} y1={ry} x2={rx - 6} y2={ry + rH}
        stroke="#374151" strokeWidth={0.7} />
      <line x1={rx - 8} y1={ry}      x2={rx - 4} y2={ry}      stroke="#374151" strokeWidth={0.7} />
      <line x1={rx - 8} y1={ry + rH} x2={rx - 4} y2={ry + rH} stroke="#374151" strokeWidth={0.7} />
      <text x={rx - 10} y={ry + rH / 2 + 4}
        textAnchor="end" fontSize={10} fill="#374151">{buildingH}</text>

      {/* ── Force diagram ── */}

      {/* Junction dot */}
      <circle cx={ox} cy={oy} r={2.5} fill="#374151" />

      {/* V_d: arrow going LEFT */}
      <line x1={ox} y1={oy} x2={ox - hLeg} y2={oy}
        stroke="#374151" strokeWidth={1.4} markerEnd="url(#bg16-arr)" />
      <text x={ox - hLeg / 2} y={oy - 6}
        textAnchor="middle" fontSize={10} fill="#374151">{V_d.toFixed(1)} kN</text>

      {/* P_d: arrow going LEFT and DOWN along strut axis */}
      <line x1={ox} y1={oy} x2={ox - hLeg} y2={oy + vLeg}
        stroke="#374151" strokeWidth={1.4} markerEnd="url(#bg16-arr)" />

      {/* P_d label: to the right of the diagonal midpoint */}
      <text x={ox - hLeg / 2 + 8} y={oy + vLeg / 2}
        textAnchor="start" fontSize={10} fontStyle="italic" fill="#374151">P_d</text>
      <text x={ox - hLeg / 2 + 8} y={oy + vLeg / 2 + 13}
        textAnchor="start" fontSize={10} fill="#374151">= {P_d.toFixed(1)} kN</text>

      {/* Angle arc at origin (between leftward horizontal and P_d direction) */}
      <path
        d={`M ${ox - arcR},${oy} A ${arcR},${arcR} 0 0,0 ${ox - arcR * Math.cos(alpha)},${oy + arcR * Math.sin(alpha)}`}
        fill="none" stroke="#374151" strokeWidth={0.8} />
      <text x={ox - arcR - 14} y={oy + 13}
        fontSize={9} fontStyle="italic" fill="#374151">α</text>
    </svg>
  )
}
