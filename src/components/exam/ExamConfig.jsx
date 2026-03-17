import { useState } from 'react'
import { exercises } from '../../exercises/index.js'
import './exam.css'

export default function ExamConfig() {
  const allIds = Object.keys(exercises)

  const [title, setTitle] = useState('Tentamen')
  const [seed, setSeed] = useState('')
  const [count, setCount] = useState(Math.min(3, allIds.length))
  const [pool, setPool] = useState(new Set(allIds))

  function togglePool(id) {
    setPool(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    setPool(new Set(allIds))
  }

  function handleDeselectAll() {
    setPool(new Set())
  }

  function handleGenerate() {
    const poolArr = allIds.filter(id => pool.has(id))
    if (poolArr.length === 0) return
    const effectiveSeed = seed.trim() || String(Date.now())
    const effectiveCount = Math.min(count, poolArr.length)
    const params = new URLSearchParams({
      title: title.trim() || 'Tentamen',
      seed: effectiveSeed,
      count: String(effectiveCount),
      pool: poolArr.join(','),
    })
    window.location.hash = `exam?${params.toString()}`
  }

  const poolSize = pool.size
  const maxCount = poolSize

  return (
    <div className="exam-config">
      <h2 className="exam-config-heading">Skapa tentamen</h2>

      <div className="exam-config-field">
        <label>Tentamenstitel</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Tentamen"
        />
      </div>

      <div className="exam-config-field">
        <label>Seed (t.ex. "VT26-A")</label>
        <input
          type="text"
          value={seed}
          onChange={e => setSeed(e.target.value)}
          placeholder="lämna tomt för slumpmässigt"
        />
      </div>

      <div className="exam-config-field">
        <label>Antal frågor</label>
        <input
          type="number"
          min={1}
          max={maxCount}
          value={count}
          onChange={e => setCount(Math.max(1, Math.min(Number(e.target.value), maxCount)))}
        />
      </div>

      <div className="exam-config-field">
        <label>Uppgifter att inkludera i urvalet</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <button
            className="back-btn"
            style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
            onClick={handleSelectAll}
          >
            Välj alla
          </button>
          <button
            className="back-btn"
            style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
            onClick={handleDeselectAll}
          >
            Avmarkera alla
          </button>
        </div>
        <div className="exam-pool-list">
          {allIds.map(id => (
            <label key={id} className="exam-pool-item">
              <input
                type="checkbox"
                checked={pool.has(id)}
                onChange={() => togglePool(id)}
              />
              <span className="exercise-list-id">{id}</span>
              <span>{exercises[id].title}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="exam-config-actions">
        <button
          className="exam-generate-btn"
          onClick={handleGenerate}
          disabled={poolSize === 0}
        >
          Visa tentamen →
        </button>
      </div>
    </div>
  )
}
