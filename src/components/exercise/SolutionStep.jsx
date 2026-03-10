import Equation from '../../math/Equation.jsx'

export default function SolutionStep({ text, latex, latexBlock = false }) {
  return (
    <div className="solution-step">
      {text && <p>{text}</p>}
      {latex && (
        <div style={{ margin: '0.25rem 0', overflowX: 'auto' }}>
          <Equation math={latex} block={latexBlock} />
        </div>
      )}
    </div>
  )
}
