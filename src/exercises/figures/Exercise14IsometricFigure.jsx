/**
 * Exercise14IsometricFigure – embeds the Inkscape isometric 3-D frame SVG
 * and toggles element visibility based on tag attributes.
 *
 * Tag scheme (set in Inkscape on each element):
 *   tag="a"          → revealed in step a solution
 *   tag="b"          → revealed in step b, first button (långsida)
 *   tag2="b"         → same as above (allows element to belong to both a and b)
 *   tag2="b2"        → revealed in step b, second button (kortsida)
 *
 * Props:
 *   phase  'a' | 'b' | null   (null = base only, default)
 */
import { useState, useEffect, useRef } from 'react'
import rawSvg from './exercise14.svg?raw'

// Pre-process once:
// • Set SVG to fill its container width
// • Inject a CSS rule so all tagged elements start hidden (no flash-of-content)
const svgContent = rawSvg
  .replace(/(<svg[^>]*)\swidth="[^"]*"/, '$1 width="100%"')
  .replace(/(<svg[^>]*)\sheight="[^"]*"/, '$1 height="auto"')
  .replace('</defs>', '</defs><style>[tag],[tag2]{visibility:hidden}</style>')

export default function Exercise14IsometricFigure({ phase = null }) {
  const [side, setSide] = useState('b')   // 'b' or 'b2' when phase === 'b'
  const containerRef = useRef(null)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    // All elements that carry a tag or tag2 attribute
    const tagged = root.querySelectorAll('[tag], [tag2]')

    tagged.forEach(el => {
      const tag  = el.getAttribute('tag')
      const tag2 = el.getAttribute('tag2')

      let visible = false

      if (phase === 'a') {
        visible = tag === 'a'
      } else if (phase === 'b') {
        visible = tag === side || tag2 === side
      }
      // phase === null → base only: keep all tagged elements hidden

      // Use visibility instead of display so that a child with visibility:'visible'
      // can override a parent group's visibility:'hidden'.
      el.style.visibility = visible ? 'visible' : 'hidden'
    })
  }, [phase, side])

  return (
    <div>
      <div
        ref={containerRef}
        style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {phase === 'b' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => setSide('b')}
            style={{
              padding: '0.3rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: side === 'b' ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            Kortsida
          </button>
          <button
            onClick={() => setSide('b2')}
            style={{
              padding: '0.3rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: side === 'b2' ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            Långsida
          </button>
        </div>
      )}
    </div>
  )
}
