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
import MomentDiagramSVG    from './MomentDiagramSVG.jsx'
import WeldedISectionSVG   from './WeldedISectionSVG.jsx'
import PsiFactorsTable   from './PsiFactorsTable.jsx'
import LiveLoadTable     from './LiveLoadTable.jsx'
import Exercise2Figure            from '../../exercises/figures/Exercise2Figure.jsx'
import Exercise14Figure           from '../../exercises/figures/Exercise14Figure.jsx'
import Exercise14IsometricFigure  from '../../exercises/figures/Exercise14IsometricFigure.jsx'
import Exercise16StomplanSVG      from '../../exercises/figures/Exercise16StomplanSVG.jsx'
import Exercise16SektionSVG       from '../../exercises/figures/Exercise16SektionSVG.jsx'
import Exercise16DetaljSVG        from '../../exercises/figures/Exercise16DetaljSVG.jsx'
import Exercise16BraceGeoSVG      from '../../exercises/figures/Exercise16BraceGeoSVG.jsx'
import Exercise16DiaphragmSVG    from '../../exercises/figures/Exercise16DiaphragmSVG.jsx'
import Exercise20PlanSVG         from '../../exercises/figures/Exercise20PlanSVG.jsx'
import ConcreteULSSVG    from './ConcreteULSSVG.jsx'

const REGISTRY = {
  'beam':             BeamSVG,
  'ipe-section':      IPESection,
  'rect-section':     RectSection,
  'glulam-section':   GlulamSection,
  'moment-diagram':   MomentDiagramSVG,
  'welded-i-section': WeldedISectionSVG,
  'psi-factors':      PsiFactorsTable,
  'live-loads':       LiveLoadTable,
  'ex2-roof':         Exercise2Figure,
  'ex14-frame':       Exercise14Figure,
  'ex14-isometric':   Exercise14IsometricFigure,
  'ex16-stomplan':    Exercise16StomplanSVG,
  'ex16-sektion':     Exercise16SektionSVG,
  'ex16-detalj':      Exercise16DetaljSVG,
  'ex16-brace-geo':   Exercise16BraceGeoSVG,
  'ex16-diaphragm':   Exercise16DiaphragmSVG,
  'ex20-plan':        Exercise20PlanSVG,
  'concrete-uls':     ConcreteULSSVG,
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
