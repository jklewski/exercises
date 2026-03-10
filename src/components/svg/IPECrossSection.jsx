export default function IPECrossSection({
  h = 360,
  b = 170,
  tf = 12.7,
  tw = 8,
}) {
  // Scale to fit in 220x260 SVG with padding
  const svgW = 220
  const svgH = 260
  const padding = 40

  const availH = svgH - padding * 2
  const availW = svgW - padding * 2

  const scale = Math.min(availH / h, availW / b)

  const scaledH = h * scale
  const scaledB = b * scale
  const scaledTf = tf * scale
  const scaledTw = tw * scale

  // Center the cross-section
  const cx = svgW / 2
  const topY = (svgH - scaledH) / 2

  // Flange top
  const topFlangeY = topY
  // Web
  const webY = topY + scaledTf
  const webH = scaledH - 2 * scaledTf
  // Bottom flange
  const botFlangeY = topY + scaledH - scaledTf

  const flangeX = cx - scaledB / 2
  const webX = cx - scaledTw / 2

  const dimColor = '#6b7280'
  const shapeColor = '#1e3a5f'
  const dimFontSize = 10

  // Arrow helper
  const Arrow = ({ x1, y1, x2, y2 }) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return null
    const ux = dx / len
    const uy = dy / len
    const hs = 5
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dimColor} strokeWidth="1" />
        <polygon
          points={`${x2},${y2} ${x2 - ux * hs - uy * hs * 0.5},${y2 - uy * hs + ux * hs * 0.5} ${x2 - ux * hs + uy * hs * 0.5},${y2 - uy * hs - ux * hs * 0.5}`}
          fill={dimColor}
        />
      </g>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width={svgW}
      height={svgH}
      style={{ fontFamily: 'sans-serif' }}
    >
      {/* Top flange */}
      <rect
        x={flangeX} y={topFlangeY}
        width={scaledB} height={scaledTf}
        fill={shapeColor} stroke={shapeColor} strokeWidth="0.5"
      />
      {/* Web */}
      <rect
        x={webX} y={webY}
        width={scaledTw} height={webH}
        fill={shapeColor} stroke={shapeColor} strokeWidth="0.5"
      />
      {/* Bottom flange */}
      <rect
        x={flangeX} y={botFlangeY}
        width={scaledB} height={scaledTf}
        fill={shapeColor} stroke={shapeColor} strokeWidth="0.5"
      />

      {/* Dimension: h (left side) */}
      <line
        x1={flangeX - 10} y1={topFlangeY}
        x2={flangeX - 10} y2={topFlangeY + scaledH}
        stroke={dimColor} strokeWidth="0.8"
        strokeDasharray="3,2"
      />
      <Arrow x1={flangeX - 10} y1={topFlangeY + scaledH / 2 + 8} x2={flangeX - 10} y2={topFlangeY + scaledH} />
      <Arrow x1={flangeX - 10} y1={topFlangeY + scaledH / 2 - 8} x2={flangeX - 10} y2={topFlangeY} />
      <text
        x={flangeX - 22}
        y={topFlangeY + scaledH / 2 + 4}
        textAnchor="middle"
        fontSize={dimFontSize}
        fill={dimColor}
        transform={`rotate(-90, ${flangeX - 22}, ${topFlangeY + scaledH / 2 + 4})`}
      >
        h={h}
      </text>

      {/* Dimension: b (top) */}
      <line
        x1={flangeX} y1={topFlangeY - 10}
        x2={flangeX + scaledB} y2={topFlangeY - 10}
        stroke={dimColor} strokeWidth="0.8"
        strokeDasharray="3,2"
      />
      <Arrow x1={cx - 15} y1={topFlangeY - 10} x2={flangeX} y2={topFlangeY - 10} />
      <Arrow x1={cx + 15} y1={topFlangeY - 10} x2={flangeX + scaledB} y2={topFlangeY - 10} />
      <text
        x={cx}
        y={topFlangeY - 15}
        textAnchor="middle"
        fontSize={dimFontSize}
        fill={dimColor}
      >
        b={b}
      </text>

      {/* Dimension: tf (right side, top flange) */}
      <line
        x1={flangeX + scaledB + 8} y1={topFlangeY}
        x2={flangeX + scaledB + 8} y2={topFlangeY + scaledTf}
        stroke={dimColor} strokeWidth="0.8"
      />
      <Arrow x1={flangeX + scaledB + 8} y1={topFlangeY + scaledTf / 2 + 5} x2={flangeX + scaledB + 8} y2={topFlangeY + scaledTf} />
      <Arrow x1={flangeX + scaledB + 8} y1={topFlangeY + scaledTf / 2 - 5} x2={flangeX + scaledB + 8} y2={topFlangeY} />
      <text
        x={flangeX + scaledB + 18}
        y={topFlangeY + scaledTf / 2 + 4}
        textAnchor="start"
        fontSize={dimFontSize}
        fill={dimColor}
      >
        t&#8339;={tf}
      </text>

      {/* Dimension: tw (bottom, web) */}
      <line
        x1={webX} y1={topFlangeY + scaledH + 10}
        x2={webX + scaledTw} y2={topFlangeY + scaledH + 10}
        stroke={dimColor} strokeWidth="0.8"
      />
      <Arrow x1={cx - 5} y1={topFlangeY + scaledH + 10} x2={webX} y2={topFlangeY + scaledH + 10} />
      <Arrow x1={cx + 5} y1={topFlangeY + scaledH + 10} x2={webX + scaledTw} y2={topFlangeY + scaledH + 10} />
      <text
        x={cx}
        y={topFlangeY + scaledH + 22}
        textAnchor="middle"
        fontSize={dimFontSize}
        fill={dimColor}
      >
        t&#7453;={tw}
      </text>
    </svg>
  )
}
