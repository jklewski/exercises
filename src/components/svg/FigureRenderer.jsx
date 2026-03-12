/**
 * FigureRenderer – maps a figure spec { type, props } to the right SVG component.
 *
 * Supported types:
 *   'beam'         → BeamSVG        { L, supports, loads }
 *   'ipe-section'  → IPESection     { h, b, tf, tw }
 *   'rect-section' → RectSection    { b, h, rebars?, rebarDia?, fillColor? }
 */
import BeamSVG           from './BeamSVG.jsx'
import IPESection        from './IPESection.jsx'
import RectSection       from './RectSection.jsx'
import GlulamSection     from './GlulamSection.jsx'
import MomentDiagramSVG from './MomentDiagramSVG.jsx'
import PsiFactorsTable   from './PsiFactorsTable.jsx'
import LiveLoadTable     from './LiveLoadTable.jsx'
import Exercise2Figure   from '../../exercises/figures/Exercise2Figure.jsx'

const REGISTRY = {
  'beam':             BeamSVG,
  'ipe-section':      IPESection,
  'rect-section':     RectSection,
  'glulam-section':   GlulamSection,
  'moment-diagram':   MomentDiagramSVG,
  'psi-factors':      PsiFactorsTable,
  'live-loads':       LiveLoadTable,
  'ex2-roof':         Exercise2Figure,
}

export default function FigureRenderer({ figure }) {
  const Component = REGISTRY[figure.type]
  if (!Component) {
    return (
      <div style={{ color: '#dc2626', fontSize: '0.85rem', padding: '0.5rem' }}>
        Unknown figure type: <code>{figure.type}</code>
      </div>
    )
  }
  return <Component {...figure.props} />
}
