import { LIVE_LOADS } from '../../data/loads.js'

/**
 * LiveLoadTable – reference table of characteristic imposed loads by category.
 * Source: SS-EN 1991-1-1, Tabell 6.1–6.2.
 *
 * Props: highlight? – category string to highlight (e.g. 'B', 'C1')
 */
export default function LiveLoadTable({ highlight = null }) {
  return (
    <div className="data-card" style={{ maxWidth: 640 }}>
      <h3 className="data-card-title">
        Karakteristiska nyttiga laster (SS-EN 1991-1-1, Tab. 6.1–6.2)
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Kat.</th>
            <th style={{ textAlign: 'left' }}>Användning</th>
            <th>q<sub>k</sub> (kN/m²)</th>
            <th>Q<sub>k</sub> (kN)</th>
          </tr>
        </thead>
        <tbody>
          {LIVE_LOADS.map((row, i) => {
            const isHighlighted = highlight && row.category === highlight
            return (
              <tr key={i} style={isHighlighted ? { background: '#fef9c3', fontWeight: 600 } : {}}>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.category}</td>
                <td>{row.description}</td>
                <td style={{ textAlign: 'center' }}>{row.qk}</td>
                <td style={{ textAlign: 'center' }}>{row.Qk}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
