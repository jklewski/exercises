import { useState, useEffect } from 'react'
import './App.css'
import ExerciseShell from './components/exercise/ExerciseShell.jsx'
import ExamConfig from './components/exam/ExamConfig.jsx'
import ExamShell from './components/exam/ExamShell.jsx'
import LandingPage from './components/LandingPage.jsx'
import { exercises } from './exercises/index.js'

export default function App() {
  const [hash, setHash] = useState(window.location.hash.slice(1))

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash.slice(1))
    }
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function navigate(id) {
    window.location.hash = id ?? ''
  }

  const route = hash.split('?')[0]

  // Exam routes
  if (route === 'exam') {
    const hasParams = hash.includes('?') && hash.split('?')[1].length > 0
    if (hasParams) {
      return <ExamShell hash={hash} />
    }
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem' }}>
        <button className="back-btn" onClick={() => navigate(null)}>
          ← Alla uppgifter
        </button>
        <ExamConfig />
      </div>
    )
  }

  const exercise = exercises[route] ?? null

  if (!exercise) {
    return <LandingPage onNavigate={navigate} />
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem' }}>
      <button className="back-btn" onClick={() => navigate(null)}>
        ← Alla uppgifter
      </button>
      <ExerciseShell exercise={exercise} />
    </div>
  )
}
