/**
 * Exercise16StomplanSVG – plan view (stomplan) of a warehouse roof.
 *
 * Orientation: long axis horizontal. A=top-left, B=bottom-left, C=top-right, D=bottom-right.
 * Vertical lines  = truss beams (takbalkar) spanning the building width.
 * Horizontal lines = purlins (takåsar) spanning between beams.
 * Column positions shown as tick marks at every beam/purlin intersection on the gable edges,
 * and as filled squares at interior beam / outer-purlin intersections.
 *
 * Props:
 *   span        – truss span / building width, metres (default 18)
 *   ccBeam      – truss centre-to-centre along building length, metres (default 7)
 *   nBeamBays   – number of bays (nBeams = nBeamBays + 1) (default 5)
 *   ccPurlin    – purlin centre-to-centre, metres (default 2.25)
 *   nGableBays  – number of column bays on each gable end (default 3)
 */
export default function Exercise16StomplanSVG({
  span       = 18,
  ccBeam     = 7,
  nBeamBays  = 5,
  ccPurlin   = 2.25,
  nGableBays = 3,
}) {
  const nBeams      = nBeamBays + 1
  const buildingLen = nBeamBays * ccBeam
  const nPurlSpaces = Math.round(span / ccPurlin)
  const nPurlins    = nPurlSpaces + 1

  // Layout
  const ML = 32, MR = 62, MT = 72, MB = 44
  const planW = 390
  const sc    = planW / buildingLen
  const planH = span * sc

  const ox = ML, oy = MT
  const W  = ML + planW + MR
  const H  = MT + planH + MB

  const beamXs   = Array.from({ length: nBeams  }, (_, i) => ox + i * ccBeam * sc)
  const purlinYs = Array.from({ length: nPurlins }, (_, i) => oy + i * (span / nPurlSpaces) * sc)

  const x0 = beamXs[0],   xN = beamXs[nBeams - 1]
  const y0 = purlinYs[0], yN = purlinYs[nPurlins - 1]

  function dimTick(x, y, vert = false) {
    return vert
      ? <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="#374151" strokeWidth={0.8} />
      : <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#374151" strokeWidth={0.8} />
  }

  // Large filled block arrow pointing downward
  const windX   = (x0 + xN) / 2
  const arrowSW = 18   // shaft half-width
  const arrowHW = 32   // head half-width
  const arrowT  = oy - 10   // arrow tip y (just touches grid top)
  const arrowHH = 22   // head height
  const arrowSH = 24   // shaft height
  const arrowTop = arrowT - arrowHH - arrowSH

  const arrowPts = [
    `${windX - arrowSW},${arrowTop}`,
    `${windX + arrowSW},${arrowTop}`,
    `${windX + arrowSW},${arrowT - arrowHH}`,
    `${windX + arrowHW},${arrowT - arrowHH}`,
    `${windX},${arrowT}`,
    `${windX - arrowHW},${arrowT - arrowHH}`,
    `${windX - arrowSW},${arrowT - arrowHH}`,
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W}
      style={{ fontFamily: 'sans-serif', fontSize: 10 }}>

      {/* Wind arrow (block arrow) */}
      <text x={windX} y={arrowTop - 5} textAnchor="middle" fontSize={11} fill="#374151">vind</text>
      <polygon points={arrowPts} fill="#6b7280" stroke="#374151" strokeWidth={0.8} />

      {/* Corner labels: A top-left, B bot-left, C top-right, D bot-right */}
      {[['A', x0, y0, -1], ['B', x0, yN, -1], ['C', xN, y0, 1], ['D', xN, yN, 1]].map(
        ([lbl, x, y, side]) => (
          <text key={lbl}
            x={x + side * 12} y={y + 4}
            textAnchor="middle" fontSize={12} fontWeight="bold" fill="#374151"
          >{lbl}</text>
        )
      )}

      {/* Purlins – dashed horizontals, solid outer edges */}
      {purlinYs.map((y, i) => (
        <line key={`p${i}`} x1={x0} y1={y} x2={xN} y2={y}
          stroke="#374151"
          strokeWidth={i === 0 || i === nPurlins - 1 ? 1.6 : 0.8}
          strokeDasharray={i === 0 || i === nPurlins - 1 ? undefined : '5,3'} />
      ))}

      {/* Beams – solid vertical lines */}
      {beamXs.map((x, i) => (
        <line key={`b${i}`} x1={x} y1={y0} x2={x} y2={yN}
          stroke="#374151"
          strokeWidth={i === 0 || i === nBeams - 1 ? 2 : 1.4} />
      ))}

      {/* Column positions on gable beams: filled squares at gable column spacing */}
      {[x0, xN].map(x =>
        Array.from({ length: nGableBays + 1 }, (_, i) => {
          const y = oy + (i / nGableBays) * planH
          return (
            <rect key={`gc-${x}-${i}`}
              x={x - 5} y={y - 5} width={10} height={10}
              fill="#374151" />
          )
        })
      )}

      {/* Column positions at interior beam / outer-purlin crossings: filled squares */}
      {beamXs.slice(1, -1).map((x, i) =>
        [y0, yN].map((y, j) => (
          <rect key={`sq-${i}-${j}`}
            x={x - 4} y={y - 4} width={8} height={8}
            fill="#374151" />
        ))
      )}

      {/* Beam-spacing dims at bottom */}
      {Array.from({ length: nBeamBays }, (_, i) => {
        const xa = beamXs[i], xb = beamXs[i + 1], dy = yN + 14
        return (
          <g key={`db${i}`}>
            <line x1={xa} y1={dy} x2={xb} y2={dy} stroke="#374151" strokeWidth={0.8} />
            {dimTick(xa, dy)} {dimTick(xb, dy)}
            <text x={(xa + xb) / 2} y={dy + 11} textAnchor="middle" fontSize={10} fill="#374151">
              {ccBeam}
            </text>
          </g>
        )
      })}
      <text x={(x0 + xN) / 2} y={yN + 38} textAnchor="middle" fontSize={11} fill="#374151">
        takbalkar
      </text>

      {/* Purlin-spacing dims on right */}
      {Array.from({ length: nPurlSpaces }, (_, i) => {
        const ya = purlinYs[i], yb = purlinYs[i + 1], dx = xN + 14
        return (
          <g key={`dp${i}`}>
            <line x1={dx} y1={ya} x2={dx} y2={yb} stroke="#374151" strokeWidth={0.8} />
            {dimTick(dx, ya, true)} {dimTick(dx, yb, true)}
            <text x={dx + 4} y={(ya + yb) / 2 + 3} fontSize={9} fill="#374151">{ccPurlin}</text>
          </g>
        )
      })}
      <text
        x={xN + 56} y={(y0 + yN) / 2}
        textAnchor="middle" fontSize={11} fill="#374151"
        transform={`rotate(-90,${xN + 56},${(y0 + yN) / 2})`}
      >
        takåsar
      </text>

    </svg>
  )
}
