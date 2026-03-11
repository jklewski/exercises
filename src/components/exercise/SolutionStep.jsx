import Equation        from '../../math/Equation.jsx'
import InlineText      from '../../math/InlineText.jsx'
import FigureRenderer  from '../svg/FigureRenderer.jsx'

export default function SolutionStep({ text, latex, latexBlock = false, figure, params }) {
  // text and latex can be plain strings or functions (p) => string
  const resolvedText  = typeof text  === 'function' ? text(params)  : text
  const resolvedLatex = typeof latex === 'function' ? latex(params) : latex

  return (
    <div className="solution-step">
      {resolvedText && <p><InlineText text={resolvedText} /></p>}
      {resolvedLatex && (
        <div style={{ margin: '0.25rem 0', overflowX: 'auto' }}>
          <Equation math={resolvedLatex} block={latexBlock} />
        </div>
      )}
      {figure && (
        <div style={{ margin: '0.5rem 0' }}>
          <FigureRenderer figure={figure} />
        </div>
      )}
    </div>
  )
}
