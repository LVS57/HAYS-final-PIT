import React, { useState, useEffect } from 'react'

export default function TestPanel({ rfids = [], onPost, onRegister, onUnregister, onToggle }) {
  const [tag, setTag] = useState('')
  const [selected, setSelected] = useState('')

  useEffect(() => {
    if (!selected && rfids.length) setSelected(rfids[0].rfid_tag)
  }, [rfids, selected])

  const randomUnknown = () => {
    const t = 'UNK' + Math.floor(Math.random() * 1e9).toString().slice(0, 6)
    setTag(t)
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h3>Test Tools</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={tag}
            onChange={e => setTag(e.target.value)}
            placeholder="Enter RFID (e.g., XYZ99999)"
            style={{ flex: 1 }}
          />
          <button onClick={randomUnknown}>Random Unknown</button>
          <button onClick={() => onPost?.(tag)} disabled={!tag}>Post (simulate scan)</button>
          <button onClick={() => onRegister?.(tag)} disabled={!tag}>Register</button>
          <button onClick={() => onUnregister?.(tag)} disabled={!tag}>Unregister</button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={selected} onChange={e => setSelected(e.target.value)} style={{ flex: 1 }}>
            {rfids.map(r => <option key={r.rfid_tag} value={r.rfid_tag}>{r.rfid_tag}</option>)}
          </select>
          <button onClick={() => onToggle?.(selected)} disabled={!selected}>Toggle selected</button>
        </div>
      </div>
    </div>
  )
}