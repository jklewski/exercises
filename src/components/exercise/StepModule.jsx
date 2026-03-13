import { useState } from 'react'
import AnswerField from './AnswerField.jsx'
import SolutionPanel from './SolutionPanel.jsx'
import Equation from '../../math/Equation.jsx'
import InlineText from '../../math/InlineText.jsx'

export default function StepModule({ step, params, answers, onAnswer, index }) {
  const [submitted, setSubmitted] = useState(false)

  const result = submitted && step.resultCheck
    ? step.resultCheck(params, answers)
    : null

  return (
    <div className="step-module">
      <div className="step-module-header">
        <span className="step-number">{index + 1}</span>
        <h2 className="step-title"><InlineText text={step.title} /></h2>
      </div>

      <p className="step-question"><InlineText text={step.question} /></p>

      {step.answer && (
        <div className="step-answer-row">
          <AnswerField
            label={step.answer.label}
            unit={step.answer.unit}
            correctAnswer={step.answer.getCorrect(params, answers)}
            hint={step.answer.hint}
            onCorrect={(value) => {
              setSubmitted(true)
              onAnswer(step.id, value)
            }}
          />
        </div>
      )}

      {result && (
        <div className={`result-badge ${result.ok ? 'ok' : 'not-ok'}`}>
          <Equation math={result.latex} block={false} />
        </div>
      )}

      <SolutionPanel steps={step.solution} params={params} />
    </div>
  )
}
