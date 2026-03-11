import { useState } from 'react'
import SolutionStep from './SolutionStep.jsx'

export default function SolutionPanel({ steps = [], params }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="solution-panel">
      <button
        className="solution-toggle-btn"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? 'Dölj lösning' : 'Visa lösning'}
      </button>

      {visible && (
        <div className="solution-steps">
          {steps.map((step, i) => (
            <SolutionStep
              key={i}
              text={step.text}
              latex={step.latex}
              latexBlock={step.latexBlock}
              figure={step.figure}
              params={params}
            />
          ))}
        </div>
      )}
    </div>
  )
}
