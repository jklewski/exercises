/**
 * ColumnSVG – column diagram with loads and supports.
 *
 * Props:
 *   L           – column height in metres (for dimension label)
 *   N_label     – label for axial point load at top; omit to hide
 *   q_label     – label for horizontal UDL; omit to hide
 *   e_label     – label for eccentricity dim line; omit for centred load
 *   support     – 'fixed' | 'pin' (default) at base
 *   topSupport  – 'none' (default, free end) | 'roller' (lateral roller on right side)
 *   showDim     – show height dimension line (default true)
 */
export default function ColumnSVG({
  L          = 4,
  N_label    = 'P_d',
  q_label    = 'q_d',
  e_label    = '',
  support    = 'pin',
  topSupport = 'none',
  showDim    = true,
}) {
  const W = 300
  const H = 430

  // Column body
  const colCx    = 150
  const colW     = 42
  const colLeft  = colCx - colW / 2
  const colRight = colCx + colW / 2
  const colTop   = 100
  const colBot   = 355
  const colH     = colBot - colTop

  // Axial load
  const e_offset = e_label ? 22 : 0
  const load_x   = colCx + e_offset
  const arrTop   = colTop - 50
  const arrowSz  = 9

  // UDL
  const n_udl   = 8
  const udl_len = 45
  const udl_clr = '#2563eb'

  // Dimension line – pushed right to leave room for the roller
  const dimX = colRight + 55

  // ── Pin support helper (triangle pointing down + circles + hatch) ────────
  function PinBelow({ cx, y }) {
    const triH = 20, triHW = 14
    const baseY = y + triH
    return (
      <g>
        <circle cx={cx} cy={y} r="3.5" fill="#374151" />
        <polygon
          points={`${cx},${y} ${cx - triHW},${baseY} ${cx + triHW},${baseY}`}
          fill="none" stroke="#374151" strokeWidth="1.8"
        />
        {/* ground line + hatching */}
        <line x1={cx - 18} y1={baseY + 1} x2={cx + 18} y2={baseY + 1}
          stroke="#374151" strokeWidth="1.5" />
        {[-12, -4, 4, 12].map(dx => (
          <line key={dx}
            x1={cx + dx} y1={baseY + 1}
            x2={cx + dx - 7} y2={baseY + 9}
            stroke="#374151" strokeWidth="1.2" />
        ))}
      </g>
    )
  }

  // ── Lateral roller helper (triangle pointing right + circles + wall) ─────
  // Drawn on the right face of the column at given y coordinate.
  function RollerSide({ x, y }) {
    const triW = 18, triHH = 13   // triangle width (horizontal), half-height
    const baseX = x + triW
    return (
      <g>
        <circle cx={x} cy={y} r="3.5" fill="#374151" />
        <polygon
          points={`${x},${y} ${baseX},${y - triHH} ${baseX},${y + triHH}`}
          fill="none" stroke="#374151" strokeWidth="1.8"
        />
        {/* circles (rollers) aligned vertically */}
        {[-8, 0, 8].map(dy => (
          <circle key={dy} cx={baseX + 5} cy={y + dy} r="4.5"
            fill="none" stroke="#374151" strokeWidth="1.5" />
        ))}
        {/* vertical wall line + hatching */}
        <line x1={baseX + 10} y1={y - 18} x2={baseX + 10} y2={y + 18}
          stroke="#374151" strokeWidth="1.5" />
        {[-12, -4, 4, 12].map(dy => (
          <line key={dy}
            x1={baseX + 10} y1={y + dy}
            x2={baseX + 18} y2={y + dy - 7}
            stroke="#374151" strokeWidth="1.2" />
        ))}
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ fontFamily: 'sans-serif' }}>

      {/* ── Lateral UDL arrows ─────────────────────────────────────────── */}
      {q_label && Array.from({ length: n_udl }, (_, i) => {
        const y  = colTop + (i + 0.5) * colH / n_udl
        const x1 = colLeft - udl_len
        const x2 = colLeft - 1
        return (
          <g key={i}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={udl_clr} strokeWidth="1.5" />
            <polygon points={`${x2+1},${y} ${x2-8},${y-4} ${x2-8},${y+4}`} fill={udl_clr} />
          </g>
        )
      })}
      {q_label && (
        <text x={colLeft - udl_len - 6} y={colTop + colH / 2 + 4}
          fontSize="12" fill={udl_clr} textAnchor="end" fontWeight="500">
          {q_label}
        </text>
      )}

      {/* ── Column body ────────────────────────────────────────────────── */}
      <rect x={colLeft} y={colTop} width={colW} height={colH}
        fill="#e8e8e8" stroke="#1a1a2e" strokeWidth="1.5" />

      {/* ── Top lateral roller ──────────────────────────────────────────── */}
      {topSupport === 'roller' && (
        <RollerSide x={colRight} y={colTop} />
      )}

      {/* ── Axial load ──────────────────────────────────────────────────── */}
      {N_label && (
        <>
          <line x1={load_x} y1={arrTop} x2={load_x} y2={colTop - 1}
            stroke="#dc2626" strokeWidth="2.5" />
          <polygon
            points={`${load_x},${colTop} ${load_x-arrowSz},${colTop-arrowSz*1.6} ${load_x+arrowSz},${colTop-arrowSz*1.6}`}
            fill="#dc2626"
          />
          <text x={load_x + 8} y={arrTop + 14} fontSize="12" fill="#dc2626" fontWeight="600">
            {N_label}
          </text>
          {e_label && (
            <g>
              <line x1={colCx} y1={colTop-20} x2={load_x} y2={colTop-20} stroke="#374151" strokeWidth="1" />
              <line x1={colCx}  y1={colTop-24} x2={colCx}  y2={colTop-16} stroke="#374151" strokeWidth="1" />
              <line x1={load_x} y1={colTop-24} x2={load_x} y2={colTop-16} stroke="#374151" strokeWidth="1" />
              <text x={(colCx+load_x)/2} y={colTop-25} fontSize="10" fill="#374151" textAnchor="middle">
                {e_label}
              </text>
            </g>
          )}
        </>
      )}

      {/* ── Base support ────────────────────────────────────────────────── */}
      {support === 'fixed' && (
        <g>
          {/* embedded plate */}
          <rect x={colLeft - 10} y={colBot} width={colW + 20} height={13}
            fill="#d1d5db" stroke="#374151" strokeWidth="1.5" />
          {[-22, -11, 0, 11, 22].map((dx, i) => (
            <line key={i}
              x1={colCx + dx} y1={colBot + 13}
              x2={colCx + dx - 8} y2={colBot + 22}
              stroke="#374151" strokeWidth="1.2" />
          ))}
        </g>
      )}
      {support === 'pin' && (
        <PinBelow cx={colCx} y={colBot} />
      )}

      {/* ── Height dimension line (right side) ─────────────────────────── */}
      {showDim && (
        <g>
          <line x1={dimX} y1={colTop} x2={dimX} y2={colBot} stroke="#6b7280" strokeWidth="1.2" />
          <line x1={dimX-5} y1={colTop} x2={dimX+5} y2={colTop} stroke="#6b7280" strokeWidth="1.2" />
          <line x1={dimX-5} y1={colBot} x2={dimX+5} y2={colBot} stroke="#6b7280" strokeWidth="1.2" />
          <text x={dimX+14} y={colTop+colH/2+4} fontSize="12" fill="#374151" textAnchor="middle"
            transform={`rotate(90,${dimX+14},${colTop+colH/2+4})`}>
            {L} m
          </text>
        </g>
      )}
    </svg>
  )
}
