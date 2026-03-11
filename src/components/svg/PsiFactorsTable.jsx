import { PSI_FACTORS } from '../../data/loads.js'

/**
 * PsiFactorsTable – reference table of ψ-factors for variable loads.
 * Source: SS-EN 1990, Tabell NA.A1.1 (Swedish NA / EKS 11).
 *
 * Used in STR-B combination rule:
 *   Ed = γ_G·Gk + γ_Q·Qk,1 + γ_Q·Σ(ψ₀,i·Qk,i)
 *
 * Props: highlight? – load string to highlight (partial match)
 */
export default function PsiFactorsTable({ highlight = null }) {
  return (
    <div className="data-card" style={{ maxWidth: 640 }}>
      <h3 className="data-card-title">
        ψ-faktorer för variabla laster (SS-EN 1990, Tab. NA.A1.1)
      </h3>
      <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 0.5rem' }}>
        STR-B: <em>E</em><sub>d</sub> = γ<sub>G</sub>·<em>G</em><sub>k</sub> +
        γ<sub>Q</sub>·<em>Q</em><sub>k,1</sub> +
        γ<sub>Q</sub>·Σ(ψ<sub>0,i</sub>·<em>Q</em><sub>k,i</sub>)
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Last</th>
            <th>ψ₀</th>
            <th>ψ₁</th>
            <th>ψ₂</th>
          </tr>
        </thead>
        <tbody>
          {PSI_FACTORS.map((row, i) => {
            const isHighlighted = highlight && row.load.toLowerCase().includes(highlight.toLowerCase())
            return (
              <tr key={i} style={isHighlighted ? { background: '#fef9c3', fontWeight: 600 } : {}}>
                <td>{row.load}</td>
                <td style={{ textAlign: 'center' }}>{row.psi0.toFixed(1)}</td>
                <td style={{ textAlign: 'center' }}>{row.psi1.toFixed(1)}</td>
                <td style={{ textAlign: 'center' }}>{row.psi2.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
