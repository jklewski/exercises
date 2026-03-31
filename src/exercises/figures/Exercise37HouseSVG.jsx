/**
 * Exercise37HouseSVG – house cross-section with characteristic loads.
 * 27° pitched roof, 9 m span. Shows snow, dead load, wind on roof and walls.
 */
export default function Exercise37HouseSVG() {
  const W = 580, H = 390

  // ── House geometry ─────────────────────────────────────────────────────────
  const lx = 110, rx = 450    // left / right wall x  (340 px = 9 m → ~38 px/m)
  const mx = (lx + rx) / 2   // 280 = ridge x
  const gy = 355              // ground y
  const wt = 270              // wall top y
  // Roof: 27°, half-span = 170 px
  const roofRise = 170 * Math.tan(27 * Math.PI / 180)  // ≈ 87 px
  const ridy = Math.round(wt - roofRise)                // ≈ 183

  // ── Perpendicular directions (inward = load pressing into roof) ────────────
  // Left roof direction: (170, -(roofRise)), length = sqrt(170²+87²)
  const rlen = Math.sqrt(170 * 170 + roofRise * roofRise)
  // Inward normal of left roof (rotated 90° CW in screen coords = (dy, -dx)/len):
  const linx =  roofRise / rlen   // ≈ 0.454
  const liny =  170      / rlen   // ≈ 0.891  (positive y = downward in screen = into roof ✓)
  // Inward normal of right roof: mirror x
  const rinx = -linx, riny = liny

  // ── Colors ────────────────────────────────────────────────────────────────
  const cs = '#1a1a2e'   // structure
  const cd = '#4b5563'   // dead load (gray)
  const csn = '#3b82f6'  // snow (blue)
  const cw = '#d97706'   // wind (amber)
  const cdim = '#6b7280' // dimension lines

  // ── Arrow component ────────────────────────────────────────────────────────
  function Arr({ x1, y1, x2, y2, color, sw = 1.6 }) {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return null
    const ux = dx / len, uy = dy / len
    const sz = 5.5
    const hx = x2 - ux * sz, hy = y2 - uy * sz
    const px = -uy * sz * 0.5, py = ux * sz * 0.5
    return (
      <g>
        <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={sw} />
        <polygon points={`${x2},${y2} ${hx + px},${hy + py} ${hx - px},${hy - py}`} fill={color} />
      </g>
    )
  }

  // ── Helpers: evenly spaced arrows along a roof half ───────────────────────
  // roofFn(t) returns {x, y} on the roof surface for t ∈ [0,1]
  const leftRoof  = t => ({ x: lx + t * (mx - lx), y: wt  + t * (ridy - wt) })
  const rightRoof = t => ({ x: mx + t * (rx - mx), y: ridy + t * (wt - ridy) })

  function roofPressArrows(roofFn, nx, ny, color, n = 4, alen = 22) {
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n
      const p = roofFn(t)
      return <Arr key={i} x1={p.x - nx * alen} y1={p.y - ny * alen} x2={p.x} y2={p.y} color={color} sw={1.5} />
    })
  }

  function roofSuctionArrows(roofFn, nx, ny, color, n = 4, alen = 20) {
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n
      const p = roofFn(t)
      return <Arr key={i} x1={p.x} y1={p.y} x2={p.x + nx * alen} y2={p.y + ny * alen} color={color} sw={1.5} />
    })
  }

  function vertArrows(roofFn, color, n = 4, alen = 20) {
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n
      const p = roofFn(t)
      return <Arr key={i} x1={p.x} y1={p.y - alen} x2={p.x} y2={p.y} color={color} sw={1.5} />
    })
  }

  // ── Wall wind arrows ───────────────────────────────────────────────────────
  const wallYs = [wt + 18, wt + 45, wt + 72]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
      style={{ fontFamily: 'sans-serif', overflow: 'visible' }}>

      {/* ── Ground ──────────────────────────────────────────────────────── */}
      <line x1={lx - 25} y1={gy} x2={rx + 25} y2={gy} stroke={cs} strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i}
          x1={lx - 18 + i * 38} y1={gy}
          x2={lx - 26 + i * 38} y2={gy + 9}
          stroke={cs} strokeWidth="1.2" />
      ))}

      {/* ── House walls ─────────────────────────────────────────────────── */}
      <line x1={lx} y1={wt} x2={lx} y2={gy} stroke={cs} strokeWidth="2" />
      <line x1={rx} y1={wt} x2={rx} y2={gy} stroke={cs} strokeWidth="2" />

      {/* ── Roof outline ────────────────────────────────────────────────── */}
      <polyline points={`${lx},${wt} ${mx},${ridy} ${rx},${wt}`}
        fill="none" stroke={cs} strokeWidth="2.5" />

      {/* ── Dead load on left roof (gray, perp) ─────────────────────────── */}
      {roofPressArrows(leftRoof, linx, liny, cd, 3, 16)}

      {/* ── Dead load on right roof (gray, perp) ────────────────────────── */}
      {roofPressArrows(rightRoof, rinx, riny, cd, 3, 16)}

      {/* ── Snow on left roof (blue, vertical) ──────────────────────────── */}
      {vertArrows(leftRoof, csn, 4, 24)}

      {/* ── Snow on right roof (blue, vertical) ─────────────────────────── */}
      {vertArrows(rightRoof, csn, 4, 24)}

      {/* ── Wind pressure on left roof (amber, perp in) ─────────────────── */}
      {roofPressArrows(leftRoof, linx, liny, cw, 3, 30)}

      {/* ── Wind suction on right roof (amber, perp out) ────────────────── */}
      {roofSuctionArrows(rightRoof, -rinx, riny, cw, 3, 26)}

      {/* ── Wind on left wall (→ into building) ─────────────────────────── */}
      {wallYs.map((y, i) => (
        <Arr key={i} x1={lx - 40} y1={y} x2={lx} y2={y} color={cw} sw={1.6} />
      ))}

      {/* ── Wind on right wall (→ into building from right) ─────────────── */}
      {wallYs.map((y, i) => (
        <Arr key={i} x1={rx + 40} y1={y} x2={rx} y2={y} color={cw} sw={1.6} />
      ))}

      {/* ── Load labels ─────────────────────────────────────────────────── */}
      {/* Snow left */}
      <text x={lx + 60} y={ridy - 28} fontSize="11" fill={csn} textAnchor="middle" fontWeight="500">
        snö 0,9 kN/m²
      </text>
      {/* Snow right */}
      <text x={rx - 60} y={ridy - 28} fontSize="11" fill={csn} textAnchor="middle" fontWeight="500">
        snö 0,8 kN/m²
      </text>
      {/* Dead load */}
      <text x={mx} y={ridy - 4} fontSize="10" fill={cd} textAnchor="middle">
        g = 0,6 kN/m²
      </text>

      {/* Wind on left roof (lovart) */}
      <text x={lx + 42} y={wt + 42} fontSize="10" fill={cw} textAnchor="middle">
        vind 0,5
      </text>
      {/* Wind suction on right roof (läsida) */}
      <text x={rx - 42} y={wt + 42} fontSize="10" fill={cw} textAnchor="middle">
        vind −0,35
      </text>
      <text x={lx + 42} y={wt + 54} fontSize="10" fill={cw} textAnchor="middle">kN/m²</text>
      <text x={rx - 42} y={wt + 54} fontSize="10" fill={cw} textAnchor="middle">kN/m²</text>

      {/* Wind on left wall */}
      <text x={lx - 42} y={wt + 35} fontSize="10" fill={cw} textAnchor="middle">0,5</text>
      <text x={lx - 42} y={wt + 47} fontSize="10" fill={cw} textAnchor="middle">kN/m²</text>
      {/* Wind on right wall */}
      <text x={rx + 42} y={wt + 35} fontSize="10" fill={cw} textAnchor="middle">0,2</text>
      <text x={rx + 42} y={wt + 47} fontSize="10" fill={cw} textAnchor="middle">kN/m²</text>

      {/* ── Angle label ─────────────────────────────────────────────────── */}
      <text x={lx + 26} y={wt + 20} fontSize="11" fill={cs} fontStyle="italic">27°</text>

      {/* ── Dimension: 9 m ──────────────────────────────────────────────── */}
      <line x1={lx} y1={gy + 18} x2={rx} y2={gy + 18} stroke={cdim} strokeWidth="1" />
      <line x1={lx} y1={gy + 13} x2={lx} y2={gy + 23} stroke={cdim} strokeWidth="1" />
      <line x1={rx} y1={gy + 13} x2={rx} y2={gy + 23} stroke={cdim} strokeWidth="1" />
      <text x={mx} y={gy + 33} fontSize="12" fill={cdim} textAnchor="middle">9 m</text>
    </svg>
  )
}
