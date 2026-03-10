/**
 * BeamSVG – generalized simply supported / cantilever beam diagram.
 *
 * Props:
 *   L        – span label (number, shown as "L = X m")
 *   supports – { left: 'pin'|'fixed'|'free', right: 'roller'|'pin'|'fixed'|'free' }
 *              Default: { left: 'pin', right: 'roller' }
 *   loads    – array of load objects:
 *
 *     UDL (distributed):
 *       { type: 'udl', label, color?, xStart?, xEnd? }
 *       xStart/xEnd: 0–1 fraction of span (default 0 and 1)
 *
 *     Point load:
 *       { type: 'point', label, x, color? }
 *       x: 0–1 fraction of span
 *
 * Layout:
 *   UDL rows stack vertically above the beam (top → bottom order).
 *   Point loads are drawn as a single arrow at the specified x position,
 *   reaching down from the top of the load area to the beam.
 */
export default function BeamSVG({
  L = 12,
  supports = { left: 'pin', right: 'roller' },
  loads = [],
}) {
  const W = 520
  const x0 = 70       // left beam end x
  const x1 = 450      // right beam end x
  const beamLen = x1 - x0

  const udlLoads   = loads.filter(l => l.type === 'udl')
  const pointLoads = loads.filter(l => l.type === 'point')

  const rowH   = 28   // height per UDL row
  const rowGap = 2
  const topPad = 18   // space above first load row
  const numUdlRows = Math.max(udlLoads.length, pointLoads.length > 0 ? 1 : 0)

  const beamY  = topPad + numUdlRows * (rowH + rowGap) + (numUdlRows > 0 ? 4 : 0)
  const loadAreaTop = topPad  // y where load arrows start

  // Total SVG height depends on support type
  const supportH = (supports.left === 'fixed' || supports.right === 'fixed') ? 35 : 45
  const H = beamY + supportH + 50  // room for dimension line

  const numArrows  = 10
  const arrowHeadSize = 6

  // ── UDL rows ───────────────────────────────────────────────────────────
  function renderUDL(row, rowIndex) {
    const topY   = topPad + rowIndex * (rowH + rowGap)
    const botY   = topY + rowH
    const color  = row.color ?? '#2563eb'
    const xStart = x0 + (row.xStart ?? 0) * beamLen
    const xEnd   = x0 + (row.xEnd   ?? 1) * beamLen
    const span   = xEnd - xStart

    const n = Math.max(2, Math.round((span / beamLen) * numArrows))
    const arrowXs = Array.from({ length: n }, (_, i) =>
      xStart + (n === 1 ? span / 2 : (i / (n - 1)) * span)
    )

    return (
      <g key={`udl-${rowIndex}`}>
        <line x1={xStart} y1={topY} x2={xEnd} y2={topY} stroke={color} strokeWidth="1.8" />
        {arrowXs.map((ax, i) => (
          <g key={i}>
            <line x1={ax} y1={topY} x2={ax} y2={botY} stroke={color} strokeWidth="1.4" />
            <polygon
              points={`${ax},${botY} ${ax - arrowHeadSize / 2},${botY - arrowHeadSize} ${ax + arrowHeadSize / 2},${botY - arrowHeadSize}`}
              fill={color}
            />
          </g>
        ))}
        {row.label && (
          <text x={xEnd + 10} y={topY + rowH / 2 + 4} fontSize="12" fill={color} fontWeight="500">
            {row.label}
          </text>
        )}
      </g>
    )
  }

  // ── Point loads ────────────────────────────────────────────────────────
  function renderPointLoad(load, idx) {
    const ax    = x0 + load.x * beamLen
    const color = load.color ?? '#dc2626'
    const arrowH = beamY - loadAreaTop
    const topY  = loadAreaTop
    const hs    = 9

    return (
      <g key={`pt-${idx}`}>
        <line x1={ax} y1={topY} x2={ax} y2={beamY} stroke={color} strokeWidth="2.5" />
        <polygon
          points={`${ax},${beamY} ${ax - hs / 2},${beamY - hs} ${ax + hs / 2},${beamY - hs}`}
          fill={color}
        />
        {load.label && (
          <text x={ax} y={topY - 4} textAnchor="middle" fontSize="12" fill={color} fontWeight="600">
            {load.label}
          </text>
        )}
      </g>
    )
  }

  // ── Support shapes ─────────────────────────────────────────────────────
  function renderSupport(type, x, side) {
    const triH = 22
    const triW = 13
    const groundW = 16

    if (type === 'pin') {
      return (
        <g>
          <polygon
            points={`${x},${beamY} ${x - triW},${beamY + triH} ${x + triW},${beamY + triH}`}
            fill="none" stroke="#374151" strokeWidth="1.8"
          />
          <circle cx={x} cy={beamY} r="3.5" fill="#374151" />
          <line x1={x - groundW} y1={beamY + triH + 1} x2={x + groundW} y2={beamY + triH + 1}
            stroke="#374151" strokeWidth="1.8" />
        </g>
      )
    }
    if (type === 'roller') {
      return (
        <g>
          <polygon
            points={`${x},${beamY} ${x - triW},${beamY + triH} ${x + triW},${beamY + triH}`}
            fill="none" stroke="#374151" strokeWidth="1.8"
          />
          <circle cx={x} cy={beamY} r="3.5" fill="#374151" />
          <circle cx={x - 7} cy={beamY + triH + 4} r="3.5" fill="none" stroke="#374151" strokeWidth="1.5" />
          <circle cx={x}     cy={beamY + triH + 4} r="3.5" fill="none" stroke="#374151" strokeWidth="1.5" />
          <circle cx={x + 7} cy={beamY + triH + 4} r="3.5" fill="none" stroke="#374151" strokeWidth="1.5" />
          <line x1={x - groundW} y1={beamY + triH + 8} x2={x + groundW} y2={beamY + triH + 8}
            stroke="#374151" strokeWidth="1.8" />
        </g>
      )
    }
    if (type === 'fixed') {
      // Wall: hatched rectangle on outer side
      const wallW = 12
      const wallH = 44
      const wallX = side === 'left' ? x - wallW : x
      const wallTop = beamY - wallH / 2

      const hatches = []
      for (let i = 0; i < 5; i++) {
        const hy = wallTop + 4 + i * (wallH - 8) / 4
        if (side === 'left') {
          hatches.push(<line key={i} x1={wallX} y1={hy} x2={wallX - 7} y2={hy + 7} stroke="#374151" strokeWidth="1.2" />)
        } else {
          hatches.push(<line key={i} x1={wallX + wallW} y1={hy} x2={wallX + wallW + 7} y2={hy + 7} stroke="#374151" strokeWidth="1.2" />)
        }
      }
      return (
        <g>
          <rect x={wallX} y={wallTop} width={wallW} height={wallH} fill="#d1d5db" stroke="#374151" strokeWidth="1.5" />
          {hatches}
        </g>
      )
    }
    // 'free' – nothing
    return null
  }

  // ── Dimension line ─────────────────────────────────────────────────────
  const dimY = beamY + (supports.left === 'fixed' ? 30 : 40)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ fontFamily: 'sans-serif' }}>

      {udlLoads.map((row, i) => renderUDL(row, i))}
      {pointLoads.map((load, i) => renderPointLoad(load, i))}

      {/* Beam */}
      <line x1={x0} y1={beamY} x2={x1} y2={beamY}
        stroke="#1a1a2e" strokeWidth="5" strokeLinecap="round" />

      {renderSupport(supports.left  ?? 'pin',    x0, 'left')}
      {renderSupport(supports.right ?? 'roller',  x1, 'right')}

      {/* Dimension line */}
      <line x1={x0} y1={dimY} x2={x1} y2={dimY} stroke="#6b7280" strokeWidth="1.2" />
      <line x1={x0} y1={dimY - 5} x2={x0} y2={dimY + 5} stroke="#6b7280" strokeWidth="1.2" />
      <line x1={x1} y1={dimY - 5} x2={x1} y2={dimY + 5} stroke="#6b7280" strokeWidth="1.2" />
      <text x={(x0 + x1) / 2} y={dimY + 14} textAnchor="middle" fontSize="12" fill="#374151">
        {L} m
      </text>
    </svg>
  )
}
