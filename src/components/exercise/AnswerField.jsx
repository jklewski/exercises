import { useState } from 'react'
import Equation from '../../math/Equation.jsx'
import InlineText from '../../math/InlineText.jsx'

export default function AnswerField({ label, unit, correctAnswer, tolerance = 0.1, hint, onCorrect }) {
  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'correct' | 'incorrect'

  function handleSubmit() {
    const submitted = parseFloat(inputValue.replace(',', '.'))
    if (isNaN(submitted)) {
      setStatus('incorrect')
      return
    }
    const isCorrect =
      correctAnswer !== 0
        ? Math.abs(submitted - correctAnswer) / Math.abs(correctAnswer) <= tolerance
        : Math.abs(submitted - correctAnswer) <= tolerance
    setStatus(isCorrect ? 'correct' : 'incorrect')
    if (isCorrect && onCorrect) onCorrect(submitted)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  const inputClass =
    status === 'correct' ? 'correct' : status === 'incorrect' ? 'incorrect' : ''

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div className="answer-field">
        <span className="answer-field-label">
          <Equation math={label} />
        </span>
        <span style={{ color: '#64748b', fontSize: '0.85rem', marginRight: '4px' }}>=</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (status !== 'idle') setStatus('idle')
          }}
          onKeyDown={handleKeyDown}
          className={inputClass}
          placeholder="Svar..."
          disabled={status === 'correct'}
        />
        <span className="answer-field-unit">{unit}</span>
        <button
          className="answer-field-submit"
          onClick={handleSubmit}
          disabled={status === 'correct' || inputValue.trim() === ''}
        >
          Kontrollera
        </button>

        {status === 'correct' && (
          <span className="answer-feedback correct">
            ✓ Rätt! ({correctAnswer} {unit})
          </span>
        )}
        {status === 'incorrect' && (
          <span className="answer-feedback incorrect">
            ✗ Fel, försök igen
          </span>
        )}
      </div>

      {hint && status === 'incorrect' && (
        <div className="hint-text">Ledtråd: <InlineText text={hint} /></div>
      )}
    </div>
  )
}
