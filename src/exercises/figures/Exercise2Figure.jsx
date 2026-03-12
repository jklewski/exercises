/**
 * Exercise2Figure – roof structure diagram for Uppgift 2.
 * Top: elevation (section) of portal frame.
 * Bottom: plan view of roof grid (beams + purlins).
 *
 * Props:
 *   span       – beam span in metres (default 20)
 *   sPurlin    – purlin centre-to-centre spacing in metres (default 2.5)
 *   sBeam      – beam centre-to-centre spacing in metres (default 6)
 *   nBeams     – number of beams (default 6 → 5 bays)
 *   colHeight  – column height in metres (default 6)
 *   beamDepth  – beam depth in metres shown in elevation (default 1)
 */
export default function Exercise2Figure({
  span      = 20,
  sPurlin   = 2.5,
  sBeam     = 6,
  nBeams    = 6,
  colHeight = 6,
  beamDepth = 1,
}) {
  const W = 500

  const nBays = nBeams - 1
  const nPurl = Math.round(span / sPurlin) + 1   // e.g. 20/2.5 + 1 = 9

  // ── Elevation ──────────────────────────────────────────────────────────────
  const sc     = 13          // px per metre
  const ex0    = 95          // left column x
  const ex1    = ex0 + span * sc
  const colW   = 12
  const beamY  = 42
  const beamH  = 12
  const colH   = colHeight * sc
  const colY   = beamY + beamH
  const colBot = colY + colH

  // ── Plan ───────────────────────────────────────────────────────────────────
  const ps     = 8           // px per metre
  const planW  = nBays * sBeam * ps
  const planH  = span * ps
  const px0    = (W - planW) / 2
  const px1    = px0 + planW
  const py0    = colBot + 65
  const py1    = py0 + planH

  const beamXs   = Array.from({ length: nBeams }, (_, i) => px0 + i * sBeam * ps)
  const purlinYs = Array.from({ length: nPurl },  (_, i) => py0 + i * planH / (nPurl - 1))

  const totalH = py1 + 55

  // helper: small tick mark on a dimension line
  function tick(x, y, vertical = false) {
    return vertical
      ? <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#374151" strokeWidth={0.8} />
      : <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#374151" strokeWidth={0.8} />
  }

  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} width={W} style={{ fontFamily: 'sans-serif', fontSize: 10 }}>

      {/* ── ELEVATION ── */}

      {/* Beam */}
      <rect x={ex0 - 4} y={beamY} width={ex1 - ex0 + 8} height={beamH}
        fill="#d1d5db" stroke="#374151" strokeWidth={1.5} />

      {/* Left column */}
      <rect x={ex0} y={colY} width={colW} height={colH}
        fill="#9ca3af" stroke="#374151" strokeWidth={1.2} />

      {/* Right column */}
      <rect x={ex1 - colW} y={colY} width={colW} height={colH}
        fill="#9ca3af" stroke="#374151" strokeWidth={1.2} />

      {/* Label: Takbalk */}
      <line x1={(ex0 + ex1) / 2 + 10} y1={beamY + 3}
            x2={(ex0 + ex1) / 2 + 55} y2={beamY - 14}
            stroke="#374151" strokeWidth={0.8} />
      <text x={(ex0 + ex1) / 2 + 58} y={beamY - 13} fontSize={10} fill="#374151">Takbalk</text>

      {/* Label: Pelare */}
      <line x1={ex1 - colW / 2} y1={colY + 20} x2={ex1 + 30} y2={colY + 5}
            stroke="#374151" strokeWidth={0.8} />
      <text x={ex1 + 34} y={colY + 5} fontSize={10} fill="#374151">Pelare</text>

      {/* Dim: span 20 m */}
      <line x1={ex0} y1={colBot + 16} x2={ex1} y2={colBot + 16} stroke="#374151" strokeWidth={0.8} />
      {tick(ex0, colBot + 16)}
      {tick(ex1, colBot + 16)}
      <text x={(ex0 + ex1) / 2} y={colBot + 30} textAnchor="middle" fontSize={10} fill="#374151">
        {`Spännvidd takbalk ${span} m`}
      </text>

      {/* Dim: column height */}
      <line x1={ex0 - 20} y1={colY} x2={ex0 - 20} y2={colBot} stroke="#374151" strokeWidth={0.8} />
      {tick(ex0 - 20, colY, true)}
      {tick(ex0 - 20, colBot, true)}
      <text x={ex0 - 24} y={(colY + colBot) / 2 + 4} textAnchor="end" fontSize={10} fill="#374151">{colHeight} m</text>

      {/* Dim: beam depth */}
      <line x1={ex1 + 16} y1={beamY} x2={ex1 + 16} y2={colY} stroke="#374151" strokeWidth={0.8} />
      {tick(ex1 + 16, beamY, true)}
      {tick(ex1 + 16, colY, true)}
      <text x={ex1 + 20} y={(beamY + colY) / 2 + 4} fontSize={10} fill="#374151">{beamDepth} m</text>

      {/* ── PLAN ── */}

      {/* Purlins: horizontal lines (dashed except outer edges) */}
      {purlinYs.map((y, i) => (
        <line key={`pur-${i}`} x1={px0} y1={y} x2={px1} y2={y}
          stroke="#374151"
          strokeWidth={i === 0 || i === nPurl - 1 ? 1.5 : 0.9}
          strokeDasharray={i === 0 || i === nPurl - 1 ? undefined : '5,3'} />
      ))}

      {/* Beams: solid vertical lines */}
      {beamXs.map((x, i) => (
        <line key={`bm-${i}`} x1={x} y1={py0} x2={x} y2={py1}
          stroke="#374151" strokeWidth={1.5} />
      ))}

      {/* Columns: filled squares at beam × edge intersections */}
      {beamXs.map((x, i) =>
        [py0, py1].map((y, j) => (
          <rect key={`col-${i}-${j}`}
            x={x - 4} y={y - 4} width={8} height={8}
            fill="#374151" />
        ))
      )}

      {/* Plan labels with leader lines */}
      <line x1={beamXs[1]} y1={py0 - 2} x2={beamXs[1] - 10} y2={py0 - 16}
            stroke="#374151" strokeWidth={0.8} />
      <text x={beamXs[1] - 13} y={py0 - 16} textAnchor="end" fontSize={10} fill="#374151">Takbalk</text>

      <line x1={beamXs[2]} y1={py0 - 2} x2={beamXs[2] + 10} y2={py0 - 16}
            stroke="#374151" strokeWidth={0.8} />
      <text x={beamXs[2] + 14} y={py0 - 16} fontSize={10} fill="#374151">Pelare</text>

      {/* Dim: bay widths at bottom */}
      {Array.from({ length: nBays }, (_, i) => {
        const x0 = beamXs[i], x1 = beamXs[i + 1], y = py1 + 14
        return (
          <g key={`dim-${i}`}>
            <line x1={x0} y1={y} x2={x1} y2={y} stroke="#374151" strokeWidth={0.8} />
            {tick(x0, y)}
            {tick(x1, y)}
            <text x={(x0 + x1) / 2} y={y + 12} textAnchor="middle" fontSize={9} fill="#374151">{sBeam} m</text>
          </g>
        )
      })}
      <text x={(px0 + px1) / 2} y={py1 + 40} textAnchor="middle" fontSize={10} fill="#374151">
        {`Takbalkar s ${sBeam} m`}
      </text>

      {/* Dim: span 20 m on right */}
      <line x1={px1 + 16} y1={py0} x2={px1 + 16} y2={py1} stroke="#374151" strokeWidth={0.8} />
      {tick(px1 + 16, py0, true)}
      {tick(px1 + 16, py1, true)}
      <text
        x={px1 + 20} y={(py0 + py1) / 2}
        fontSize={10} fill="#374151" textAnchor="middle"
        transform={`rotate(-90, ${px1 + 26}, ${(py0 + py1) / 2})`}
      >
        {`Spännvidd takbalk ${span} m`}
      </text>

      {/* Purlin spacing label */}
      <text
        x={px1 + 44} y={(py0 + py1) / 2}
        fontSize={9} fill="#6b7280" textAnchor="middle"
        transform={`rotate(-90, ${px1 + 50}, ${(py0 + py1) / 2})`}
      >
        {`Takåsar s ${sPurlin} m (${nPurl} st)`}
      </text>

    </svg>
  )
}
