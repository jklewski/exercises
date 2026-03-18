/**
 * Exercise20PlanSVG – plan view of a two-bay timber floor system.
 *
 * Three horizontal walls (north, hjärtvägg, south) with beams running
 * continuously from the north wall to the south wall over the centre support.
 *
 * Props:
 *   span    – beam span per bay, metres (default 3.5)
 *   ccBeam  – beam c/c spacing, metres (default 0.6)
 */
export default function Exercise20PlanSVG({ span = 3.5, ccBeam = 0.6, continuous = false }) {
  const scX  = 62     // px per metre, horizontal (c/c direction)
  const scY  = 42     // px per metre, vertical (span direction)
  const wallT = 11    // wall thickness in px
  const nSpaces = 5   // number of c/c spaces to show

  const cc_px  = ccBeam * scX
  const bayH   = span * scY
  const planW  = nSpaces * cc_px

  const ML = 36, MR = 72, MT = 44, MB = 22
  const W = ML + planW + MR
  const H = MT + 2 * bayH + 3 * wallT + MB

  // Wall top-face y positions
  const wy0 = MT                              // north wall
  const wy1 = MT + wallT + bayH              // hjärtvägg (centre)
  const wy2 = MT + 2 * wallT + 2 * bayH     // south wall

  // Free-span boundaries
  const b1y0 = wy0 + wallT,  b1y1 = wy1
  const b2y0 = wy1 + wallT,  b2y1 = wy2

  // Beam x positions – aligned in both bays
  const beamXs = Array.from({ length: nSpaces + 1 }, (_, i) => ML + i * cc_px)
  const beamW  = Math.max(4.5, 0.045 * scX)  // 45 mm → exaggerated for visibility

  const overlap = 4   // px each end extends into walls

  // Continuous: one rect per beam spanning full height north→south wall
  const beam_top = b1y0 - overlap
  const beam_bot = b2y1 + overlap

  // Non-continuous: two separate rects with a visible gap at the centre wall
  const b1_top = b1y0 - overlap
  const b1_bot = b1y1 + overlap   // into centre wall
  const b2_top = b2y0 - overlap   // into centre wall
  const b2_bot = b2y1 + overlap

  function dimTick(x, y, vert = false) {
    return vert
      ? <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="#374151" strokeWidth={0.8} />
      : <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#374151" strokeWidth={0.8} />
  }

  // Floor-board suggestion: thin horizontal lines across each bay
  const boardSpacing = 7
  const nBoards1 = Math.floor(bayH / boardSpacing)
  const nBoards2 = Math.floor(bayH / boardSpacing)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W}
      style={{ fontFamily: 'sans-serif', fontSize: 10 }}>

      {/* Floor slab background */}
      <rect x={ML} y={b1y0} width={planW} height={b1y1 - b1y0} fill="#f7f6f0" />
      <rect x={ML} y={b2y0} width={planW} height={b2y1 - b2y0} fill="#f7f6f0" />

      {/* Floor boards (thin lines perpendicular to beams = horizontal) */}
      {Array.from({ length: nBoards1 }, (_, i) => (
        <line key={`fb1-${i}`}
          x1={ML} y1={b1y0 + (i + 1) * boardSpacing}
          x2={ML + planW} y2={b1y0 + (i + 1) * boardSpacing}
          stroke="#d4d0c4" strokeWidth={0.5} />
      ))}
      {Array.from({ length: nBoards2 }, (_, i) => (
        <line key={`fb2-${i}`}
          x1={ML} y1={b2y0 + (i + 1) * boardSpacing}
          x2={ML + planW} y2={b2y0 + (i + 1) * boardSpacing}
          stroke="#d4d0c4" strokeWidth={0.5} />
      ))}

      {/* Walls */}
      {[wy0, wy1, wy2].map((wy, i) => (
        <rect key={`wall-${i}`} x={ML} y={wy} width={planW} height={wallT}
          fill="#d1d5db" stroke="#374151" strokeWidth={1} />
      ))}

      {/* Beams */}
      {continuous
        ? beamXs.map((bx, i) => (
            <rect key={`beam-${i}`}
              x={bx - beamW / 2} y={beam_top}
              width={beamW} height={beam_bot - beam_top}
              fill="#374151" />
          ))
        : beamXs.map((bx, i) => (
            <g key={`beam-${i}`}>
              <rect x={bx - beamW / 2} y={b1_top} width={beamW} height={b1_bot - b1_top} fill="#374151" />
              <rect x={bx - beamW / 2} y={b2_top} width={beamW} height={b2_bot - b2_top} fill="#374151" />
            </g>
          ))
      }

      {/* Plan outline */}
      <rect x={ML} y={wy0} width={planW} height={2 * bayH + 3 * wallT}
        fill="none" stroke="#374151" strokeWidth={1.2} />

      {/* ── Dimensions ── */}

      {/* Span dim – bay 1, right side */}
      {(() => {
        const dx = ML + planW + 14
        return (
          <g>
            <line x1={dx} y1={b1y0} x2={dx} y2={b1y1} stroke="#374151" strokeWidth={0.8} />
            {dimTick(dx, b1y0, true)} {dimTick(dx, b1y1, true)}
            <text x={dx + 5} y={(b1y0 + b1y1) / 2 + 3} fontSize={10} fill="#374151">
              {span} m
            </text>
          </g>
        )
      })()}

      {/* Span dim – bay 2, right side */}
      {(() => {
        const dx = ML + planW + 14
        return (
          <g>
            <line x1={dx} y1={b2y0} x2={dx} y2={b2y1} stroke="#374151" strokeWidth={0.8} />
            {dimTick(dx, b2y0, true)} {dimTick(dx, b2y1, true)}
            <text x={dx + 5} y={(b2y0 + b2y1) / 2 + 3} fontSize={10} fill="#374151">
              {span} m
            </text>
          </g>
        )
      })()}

      {/* c/c dim – between first two bay-1 beams, at top */}
      {(() => {
        const xa = beamXs[0], xb = beamXs[1]
        const dy = wy0 - 10
        return (
          <g>
            <line x1={xa} y1={dy} x2={xb} y2={dy} stroke="#374151" strokeWidth={0.8} />
            {dimTick(xa, dy)} {dimTick(xb, dy)}
            <text x={(xa + xb) / 2} y={dy - 4} textAnchor="middle" fontSize={9} fill="#374151">
              c/c {Math.round(ccBeam * 1000)} mm
            </text>
          </g>
        )
      })()}

      {/* ── Labels ── */}

      {/* "Balk" → one of the beams, pointed at in bay 1 */}
      {(() => {
        const bx = beamXs[2], by = b1y0 + (b1y1 - b1y0) * 0.4
        const lx = ML - 12,   ly = b1y0 + (b1y1 - b1y0) * 0.3
        return (
          <g>
            <line x1={lx} y1={ly} x2={bx} y2={by} stroke="#374151" strokeWidth={0.6} />
            <circle cx={bx} cy={by} r={1.8} fill="#374151" />
            <text x={lx - 2} y={ly + 3} textAnchor="end" fontSize={10} fill="#374151">Balk</text>
          </g>
        )
      })()}

      {/* "Hjärtvägg" → centre wall */}
      {(() => {
        const tx = ML + planW + 14
        const ty = wy1 + wallT / 2
        return (
          <g>
            <line x1={tx + 4} y1={ty} x2={tx + 38} y2={ty} stroke="#374151" strokeWidth={0.6} />
            <text x={tx + 42} y={ty + 3} fontSize={10} fill="#374151">Hjärtvägg</text>
          </g>
        )
      })()}

      {/* "Golv" → floor area in bay 1 */}
      {(() => {
        const fx = ML + planW / 2, fy = b1y0 + (b1y1 - b1y0) * 0.7
        const lx = ML - 12, ly = fy
        return (
          <g>
            <line x1={lx} y1={ly} x2={fx} y2={fy} stroke="#374151" strokeWidth={0.6} />
            <circle cx={fx} cy={fy} r={1.8} fill="#374151" />
            <text x={lx - 2} y={ly + 3} textAnchor="end" fontSize={10} fill="#374151">Golv</text>
          </g>
        )
      })()}
    </svg>
  )
}
