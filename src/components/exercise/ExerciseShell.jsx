import { useState } from 'react'
import StepModule from './StepModule.jsx'
import FigureRenderer from '../svg/FigureRenderer.jsx'
import Equation from '../../math/Equation.jsx'

export default function ExerciseShell({ exercise }) {
  const { title, params, problem, steps } = exercise
  const [answers, setAnswers] = useState({})
  function onAnswer(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  // problem.figures can be an array or a function of params
  const figures = typeof problem.figures === 'function'
    ? problem.figures(params)
    : (problem.figures ?? [])

  return (
    <div className="exercise-shell">

      <div className="exercise-header">
        <h1>{title}</h1>
      </div>

      <div className="problem-statement">
        <p className="problem-description">{problem.description}</p>

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

      <div className="steps-container">
        {steps.map((step, i) => (
          <StepModule key={step.id} step={step} params={params} answers={answers} onAnswer={onAnswer} index={i} />
        ))}
      </div>

    </div>
  )
}
