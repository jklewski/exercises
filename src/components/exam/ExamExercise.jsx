import FigureRenderer from '../svg/FigureRenderer.jsx'
import Equation from '../../math/Equation.jsx'
import InlineText from '../../math/InlineText.jsx'

export default function ExamExercise({ exercise, index }) {
  const { problem, steps } = exercise
  // Strip "Uppgift XX – " prefix so only the topic description remains
  const topic = exercise.title.replace(/^Uppgift\s+\S+\s*[–-]\s*/i, '')

  const params = exercise.derive
    ? { ...exercise.params, ...exercise.derive(exercise.params) }
    : exercise.params

  const figures = typeof problem.figures === 'function'
    ? problem.figures(params)
    : (problem.figures ?? [])

  const descRaw = typeof problem.description === 'function'
    ? problem.description(params)
    : problem.description
  const descLines = Array.isArray(descRaw) ? descRaw : [descRaw]

  return (
    <div className="exam-exercise">
      <div className="exam-exercise-header">
        <h2 className="exam-exercise-title">Uppgift {index + 1} – {topic}</h2>
      </div>

      <div className="exam-problem">
        {descLines.map((line, i) => (
          <p key={i} className="problem-description">
            <InlineText text={line} />
          </p>
        ))}

        {figures.length > 0 && (
          <div className="problem-figures">
            {figures.map((fig, i) => (
              <div key={i} className="svg-container">
                <FigureRenderer figure={fig} />
              </div>
            ))}
          </div>
        )}

        {problem.givenData && (
          <div className="data-card" style={{ marginTop: '1rem' }}>
            <h3 className="data-card-title">Givna data</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Storhet</th>
                  <th>Beteckning</th>
                  <th>Värde</th>
                  <th>Enhet</th>
                </tr>
              </thead>
              <tbody>
                {problem.givenData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td><Equation math={row.symbol} /></td>
                    <td>{row.value}</td>
                    <td>{row.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="exam-steps">
        {steps.map((step, i) => (
          <div key={step.id} className="exam-step">
            <div className="step-module-header">
              <span className="step-number">{i + 1}</span>
              <h3 className="step-title"><InlineText text={step.title} /></h3>
            </div>

            <p className="step-question"><InlineText text={step.question} /></p>

            {step.answer && (
              <div className="exam-answer-field">
                <span className="exam-answer-label">
                  <Equation math={step.answer.label} />
                  &nbsp;=&nbsp;
                </span>
                <span className="exam-answer-box" />
                {step.answer.unit && (
                  <span className="exam-answer-unit">{step.answer.unit}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
