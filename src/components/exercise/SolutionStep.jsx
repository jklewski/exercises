import Equation        from '../../math/Equation.jsx'
import InlineText      from '../../math/InlineText.jsx'
import FigureRenderer  from '../svg/FigureRenderer.jsx'

export default function SolutionStep({ text, latex, latexBlock = false, figure, params }) {
  // text, latex, and figure can be plain values or functions (p) => value
  const resolvedText   = typeof text   === 'function' ? text(params)   : text
  const resolvedLatex  = typeof latex  === 'function' ? latex(params)  : latex
  const resolvedFigure = typeof figure === 'function' ? figure(params) : figure
  const latexLines = resolvedLatex
    ? (Array.isArray(resolvedLatex) ? resolvedLatex : [resolvedLatex])
    : []

  return (
    <div className="solution-step">
      {resolvedText && <p><InlineText text={resolvedText} /></p>}
      {latexLines.map((line, i) => (
        <div key={i} style={{ margin: '0.05rem 0', overflowX: 'auto' }}>
          <Equation math={line} block={latexBlock} />
        </div>
      ))}
      {resolvedFigure && (
        <div style={{ margin: '0.5rem 0' }}>
          <FigureRenderer figure={resolvedFigure} />
        </div>
      )}
    </div>
  )
}
