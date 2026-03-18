/**
 * Exercise16DiaphragmSVG – roof diaphragm modelled as a simply-supported deep beam.
 *
 * Shows: UDL q_d,tak on top, pin supports, reactions V_d at each gable end,
 *        dimension labels l (building length) and b (building width = beam depth).
 *
 * Props: buildingLen, span, q_d_tak, V_d
 */
export default function Exercise16DiaphragmSVG({ buildingLen, span, q_d_tak, V_d }) {
  const ML = 48, MR = 90, MT = 55, MB = 65
  const dW = 250, dH = 60   // diaphragm rectangle in px

  const W = ML + dW + MR
  const H = MT + dH + MB

  const x0 = ML, x1 = ML + dW
  const y0 = MT, y1 = MT + dH

  /* UDL arrows */
  const nArrows = 9
  const arrowLen = 18

  /* Pin symbol */
  function pin(cx, y, roller = false) {
    const pw = 7, ph = 9
    return (
      <g>
        <polygon points={`${cx},${y} ${cx - pw},${y + ph} ${cx + pw},${y + ph}`}
          fill="none" stroke="#374151" strokeWidth={1.2} />
        {roller
          ? <circle cx={cx} cy={y + ph + 4} r={3} fill="none" stroke="#374151" strokeWidth={1} />
          : null}
        <line x1={cx - pw - 2} y1={y + ph + (roller ? 9 : 3)} x2={cx + pw + 2} y2={y + ph + (roller ? 9 : 3)}
          stroke="#374151" strokeWidth={1} />
      </g>
    )
  }

  function dimTick(x, y, vert = false) {
    return vert
      ? <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="#374151" strokeWidth={0.8} />
      : <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#374151" strokeWidth={0.8} />
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W}
      style={{ fontFamily: 'sans-serif', fontSize: 10 }}>
      <defs>
        <marker id="diag16-arr" markerWidth="6" markerHeight="5"
          refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L6,2.5 L0,5 Z" fill="#374151" />
        </marker>
      </defs>

      {/* Diaphragm rectangle */}
      <rect x={x0} y={y0} width={dW} height={dH}
        fill="#f3f4f6" stroke="#374151" strokeWidth={1.5} />

      {/* UDL baseline */}
      <line x1={x0} y1={y0 - arrowLen} x2={x1} y2={y0 - arrowLen}
        stroke="#374151" strokeWidth={1} />

      {/* UDL arrows (pointing down) */}
      {Array.from({ length: nArrows + 1 }, (_, i) => {
        const ax = x0 + i * dW / nArrows
        return (
          <line key={i} x1={ax} y1={y0 - arrowLen} x2={ax} y2={y0}
            stroke="#374151" strokeWidth={1} markerEnd="url(#diag16-arr)" />
        )
      })}

      {/* q label */}
      <text x={x1 + 6} y={y0 - arrowLen / 2 + 3}
        fontSize={10} fill="#374151">
        q<tspan fontSize={8} dy={2}>d,tak</tspan>
        <tspan dy={-2}> = {q_d_tak.toFixed(2)} kN/m</tspan>
      </text>

      {/* Pin supports */}
      {pin(x0, y1)}
      {pin(x1, y1, true)}

      {/* Reaction arrows pointing up */}
      <line x1={x0} y1={y1 + 22} x2={x0} y2={y1 + 2}
        stroke="#374151" strokeWidth={1.4} markerEnd="url(#diag16-arr)" />
      <text x={x0} y={y1 + 36} textAnchor="middle" fontSize={10} fill="#374151">
        {V_d.toFixed(1)} kN
      </text>

      <line x1={x1} y1={y1 + 22} x2={x1} y2={y1 + 2}
        stroke="#374151" strokeWidth={1.4} markerEnd="url(#diag16-arr)" />
      <text x={x1} y={y1 + 36} textAnchor="middle" fontSize={10} fill="#374151">
        {V_d.toFixed(1)} kN
      </text>

      {/* Dimension: l (building length) at bottom */}
      {(() => {
        const dy = y1 + 46
        return (
          <g>
            <line x1={x0} y1={dy} x2={x1} y2={dy} stroke="#374151" strokeWidth={0.8} />
            {dimTick(x0, dy)} {dimTick(x1, dy)}
            <text x={(x0 + x1) / 2} y={dy + 12} textAnchor="middle" fontSize={10} fill="#374151">
              l = {buildingLen} m
            </text>
          </g>
        )
      })()}

      {/* Dimension: b (beam depth = building width) on right */}
      {(() => {
        const dx = x1 + 32
        return (
          <g>
            <line x1={dx} y1={y0} x2={dx} y2={y1} stroke="#374151" strokeWidth={0.8} />
            {dimTick(dx, y0, true)} {dimTick(dx, y1, true)}
            <text x={dx + 5} y={(y0 + y1) / 2 + 3} fontSize={10} fill="#374151">
              b = {span} m
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
