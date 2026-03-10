/**
 * IPESection – draws an I-beam (IPE / HEA / HEB) cross-section with dimension labels.
 *
 * Props: h, b, tf (flange thickness), tw (web thickness)
 * All values in mm (used only for labels; shape is scaled to fit).
 */
export default function IPESection({ h = 360, b = 170, tf = 12.7, tw = 8 }) {
  const svgW = 220
  const svgH = 260
  const pad  = 40

  const scale   = Math.min((svgH - pad * 2) / h, (svgW - pad * 2) / b)
  const sH      = h  * scale
  const sB      = b  * scale
  const sTf     = tf * scale
  const sTw     = tw * scale

  const cx       = svgW / 2
  const topY     = (svgH - sH) / 2
  const flangeX  = cx - sB / 2
  const webX     = cx - sTw / 2
  const botFlangeY = topY + sH - sTf

  const color    = '#1e3a5f'
  const dimColor = '#6b7280'
  const fs       = 10

  function Arr({ x1, y1, x2, y2 }) {
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.hypot(dx, dy)
    if (len < 1) return null
    const ux = dx / len, uy = dy / len, hs = 5
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dimColor} strokeWidth="1" />
        <polygon
          points={`${x2},${y2} ${x2-ux*hs-uy*hs*.5},${y2-uy*hs+ux*hs*.5} ${x2-ux*hs+uy*hs*.5},${y2-uy*hs-ux*hs*.5}`}
          fill={dimColor}
        />
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ fontFamily: 'sans-serif' }}>

      {/* Top flange */}
      <rect x={flangeX} y={topY}          width={sB}  height={sTf}  fill={color} />
      {/* Web */}
      <rect x={webX}    y={topY + sTf}    width={sTw} height={sH - 2 * sTf} fill={color} />
      {/* Bottom flange */}
      <rect x={flangeX} y={botFlangeY}    width={sB}  height={sTf}  fill={color} />

      {/* h – left side */}
      <line x1={flangeX-10} y1={topY} x2={flangeX-10} y2={topY+sH} stroke={dimColor} strokeWidth=".8" strokeDasharray="3,2" />
      <Arr x1={flangeX-10} y1={topY+sH/2+8} x2={flangeX-10} y2={topY+sH} />
      <Arr x1={flangeX-10} y1={topY+sH/2-8} x2={flangeX-10} y2={topY} />
      <text x={flangeX-22} y={topY+sH/2+4} textAnchor="middle" fontSize={fs} fill={dimColor}
        transform={`rotate(-90,${flangeX-22},${topY+sH/2+4})`}>h={h}</text>

      {/* b – top */}
      <line x1={flangeX} y1={topY-10} x2={flangeX+sB} y2={topY-10} stroke={dimColor} strokeWidth=".8" strokeDasharray="3,2" />
      <Arr x1={cx-15} y1={topY-10} x2={flangeX}    y2={topY-10} />
      <Arr x1={cx+15} y1={topY-10} x2={flangeX+sB} y2={topY-10} />
      <text x={cx} y={topY-15} textAnchor="middle" fontSize={fs} fill={dimColor}>b={b}</text>

      {/* tf – right side */}
      <line x1={flangeX+sB+8} y1={topY} x2={flangeX+sB+8} y2={topY+sTf} stroke={dimColor} strokeWidth=".8" />
      <Arr x1={flangeX+sB+8} y1={topY+sTf/2+5} x2={flangeX+sB+8} y2={topY+sTf} />
      <Arr x1={flangeX+sB+8} y1={topY+sTf/2-5} x2={flangeX+sB+8} y2={topY} />
      <text x={flangeX+sB+18} y={topY+sTf/2+4} textAnchor="start" fontSize={fs} fill={dimColor}>tf={tf}</text>

      {/* tw – bottom */}
      <line x1={webX} y1={topY+sH+10} x2={webX+sTw} y2={topY+sH+10} stroke={dimColor} strokeWidth=".8" />
      <Arr x1={cx-5} y1={topY+sH+10} x2={webX}     y2={topY+sH+10} />
      <Arr x1={cx+5} y1={topY+sH+10} x2={webX+sTw} y2={topY+sH+10} />
      <text x={cx} y={topY+sH+22} textAnchor="middle" fontSize={fs} fill={dimColor}>tw={tw}</text>
    </svg>
  )
}
