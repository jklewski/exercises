/**
 * Exercise14Figure – plan view of single-storey industrial building.
 *
 * phase 0 – bare column grid
 * phase 1 – add roof-plane krysstag in end bays (answer to a)
 * phase 2 – add wind arrow + load-path highlights (answer to b)
 *
 * Props: nLong, nShort, s (column spacing m), h (storey height m)
 */
import { useState } from 'react'

export default function Exercise14Figure({
  nLong  = 5,   // columns along long side  (4 bays = 24 m)
  nShort = 4,   // columns along short side (3 bays = 18 m)
  s      = 6,   // column c/c spacing [m]
  h      = 5,   // storey height [m]
}) {
  const [phase, setPhase] = useState(0)

  const W   = 500
  const sc  = 9            // px per metre
  const bW  = (nLong  - 1) * s * sc   // plan width  in px
  const bH  = (nShort - 1) * s * sc   // plan height in px
  const x0  = (W - bW) / 2
  const y0  = 60
  const x1  = x0 + bW
  const y1  = y0 + bH
  const bay = s * sc

  // column x/y positions
  const colXs = Array.from({ length: nLong  }, (_, i) => x0 + i * bay)
  const colYs = Array.from({ length: nShort }, (_, j) => y0 + j * bay)

  const totalH = y1 + 75

  // ── colours ────────────────────────────────────────────────────────────────
  const C_FRAME    = '#374151'
  const C_STRUT    = '#1d4ed8'   // blue  – krysstag
  const C_COMPRESS = '#dc2626'   // red   – compression
  const C_TENSION  = '#2563eb'   // blue  – tension
  const C_WIND     = '#059669'   // green – wind arrow

  // ── helpers ────────────────────────────────────────────────────────────────
  function arrowHead(x, y, dir) {
    // dir: 'right' | 'up' | 'down'
    const sz = 7
    if (dir === 'right') return <polygon points={`${x},${y} ${x-sz},${y-sz/2} ${x-sz},${y+sz/2}`} fill={C_WIND} />
    if (dir === 'up')    return <polygon points={`${x},${y} ${x-sz/2},${y+sz} ${x+sz/2},${y+sz}`} fill={C_WIND} />
    if (dir === 'down')  return <polygon points={`${x},${y} ${x-sz/2},${y-sz} ${x+sz/2},${y-sz}`} fill={C_WIND} />
    return null
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${totalH}`}
        width={W}
        style={{ fontFamily: 'sans-serif', fontSize: 10, display: 'block' }}
      >
        {/* ── TITLE ── */}
        <text x={W / 2} y={20} textAnchor="middle" fontSize={11} fontWeight="bold" fill={C_FRAME}>
          TAKPLAN (plan view)
        </text>

        {/* ── SIDE LABELS ── */}
        <text x={x0 + bW / 2} y={y0 - 18} textAnchor="middle" fontSize={10} fill={C_FRAME}>LÅNGSIDA</text>
        <text x={x0 + bW / 2} y={y1 + 20} textAnchor="middle" fontSize={10} fill={C_FRAME}>LÅNGSIDA</text>
        <text
          x={x0 - 28} y={y0 + bH / 2}
          textAnchor="middle" fontSize={10} fill={C_FRAME}
          transform={`rotate(-90,${x0 - 28},${y0 + bH / 2})`}
        >GAVEL</text>
        <text
          x={x1 + 28} y={y0 + bH / 2}
          textAnchor="middle" fontSize={10} fill={C_FRAME}
          transform={`rotate(-90,${x1 + 28},${y0 + bH / 2})`}
        >GAVEL</text>

        {/* ── BEAMS along long direction ── */}
        {colYs.map((y, j) => (
          <line key={`lr-${j}`} x1={x0} y1={y} x2={x1} y2={y}
            stroke={C_FRAME} strokeWidth={j === 0 || j === nShort - 1 ? 2 : 1} />
        ))}

        {/* ── BEAMS along short direction (gavlar + internal) ── */}
        {colXs.map((x, i) => (
          <line key={`tb-${i}`} x1={x} y1={y0} x2={x} y2={y1}
            stroke={C_FRAME} strokeWidth={i === 0 || i === nLong - 1 ? 2 : 1} />
        ))}

        {/* ── COLUMNS ── */}
        {colXs.map((cx, i) =>
          colYs.map((cy, j) => (
            <rect key={`col-${i}-${j}`} x={cx - 4} y={cy - 4} width={8} height={8} fill={C_FRAME} />
          ))
        )}

        {/* ── PHASE 1 & 2: krysstag in first and last bay of roof plane ── */}
        {phase >= 1 && (() => {
          const strutsRoof = [
            // first bay (i=0 → i=1), full height diagonals
            [x0,       y0, x0 + bay, y1],
            [x0 + bay, y0, x0,       y1],
            // last bay (i=nLong-2 → i=nLong-1)
            [x1 - bay, y0, x1,       y1],
            [x1,       y0, x1 - bay, y1],
          ]
          return strutsRoof.map(([ax, ay, bx, by], k) => (
            <line key={`rs-${k}`} x1={ax} y1={ay} x2={bx} y2={by}
              stroke={C_STRUT} strokeWidth={1.8} strokeDasharray="6,3" />
          ))
        })()}

        {/* ── PHASE 2: wind arrow + load-path ── */}
        {phase >= 2 && (() => {
          const arrowY  = y1 + 45
          const arrowX0 = x0 + 20
          const arrowX1 = x1 - 20

          // Wind arrows pointing upward (onto bottom LÅNGSIDA)
          const windArrows = Array.from({ length: nLong }, (_, i) => colXs[i])

          // Force along top beam: red compression in beam, dashed blue in struts
          // Top beam highlighted
          return (
            <>
              {/* Wind direction label */}
              <text x={W / 2} y={arrowY - 8} textAnchor="middle" fontSize={9} fill={C_WIND}>VINDRIKTING</text>
              {/* Arrow line */}
              <line x1={arrowX0} y1={arrowY} x2={arrowX1} y2={arrowY} stroke={C_WIND} strokeWidth={1.5} />
              {arrowHead(arrowX1, arrowY, 'right')}

              {/* Arrows from long side into the frame */}
              {windArrows.map((wx, i) => (
                <g key={`wa-${i}`}>
                  <line x1={wx} y1={y1 + 4} x2={wx} y2={y1 + 20} stroke={C_WIND} strokeWidth={1.2} />
                  {arrowHead(wx, y1 + 4, 'up')}
                </g>
              ))}

              {/* Top beam highlighted – force travels LEFT along top beam to gavel */}
              <line x1={x0} y1={y0} x2={x1} y2={y0}
                stroke={C_COMPRESS} strokeWidth={3} />

              {/* Bottom beam highlighted – equal and opposite */}
              <line x1={x0} y1={y1} x2={x1} y2={y1}
                stroke={C_COMPRESS} strokeWidth={3} />

              {/* Active krysstag diagonals (tension) – override phase-1 ones */}
              {/* First bay: diagonal going top-right to bottom-left is in tension */}
              <line x1={x0 + bay} y1={y0} x2={x0} y2={y1}
                stroke={C_TENSION} strokeWidth={2.5} />
              <line x1={x1 - bay} y1={y0} x2={x1} y2={y1}
                stroke={C_TENSION} strokeWidth={2.5} />

              {/* Force into gavel: vertical lines at left/right edge */}
              <line x1={x0} y1={y0} x2={x0} y2={y1}
                stroke={C_COMPRESS} strokeWidth={3} />
              <line x1={x1} y1={y0} x2={x1} y2={y1}
                stroke={C_COMPRESS} strokeWidth={3} />

              {/* Legend */}
              <line x1={x0} y1={y1 + 36} x2={x0 + 20} y2={y1 + 36} stroke={C_COMPRESS} strokeWidth={2.5} />
              <text x={x0 + 24} y={y1 + 40} fontSize={9} fill={C_COMPRESS}>Tryck</text>
              <line x1={x0 + 70} y1={y1 + 36} x2={x0 + 90} y2={y1 + 36} stroke={C_TENSION} strokeWidth={2.5} strokeDasharray="4,2" />
              <text x={x0 + 94} y={y1 + 40} fontSize={9} fill={C_TENSION}>Drag</text>
            </>
          )
        })()}
      </svg>

      {/* ── BUTTONS ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={() => setPhase(p => Math.max(0, p - 1))}
          disabled={phase === 0}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', cursor: phase === 0 ? 'default' : 'pointer' }}
        >
          ← Föregående
        </button>
        <button
          onClick={() => setPhase(p => Math.min(2, p + 1))}
          disabled={phase === 2}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', cursor: phase === 2 ? 'default' : 'pointer' }}
        >
          {phase === 0 ? 'a) Visa strävor' : 'b) Visa lastväg'} →
        </button>
      </div>
    </div>
  )
}
