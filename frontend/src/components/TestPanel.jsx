import React, { useState, useEffect } from 'react'

export default function TestPanel({ rfids = [], onPost, onRegister, onUnregister, onToggle, onClearLogs }) {
  const [tag, setTag] = useState('')
  const [selected, setSelected] = useState('')

  // Ensure a valid default selection whenever rfids change
  useEffect(() => {
    if (!rfids?.length) {
      setSelected('')
      return
    }
    if (!selected || !rfids.some(r => r.rfid_tag === selected)) {
      setSelected(rfids[0].rfid_tag)
    }
  }, [rfids, selected])

  const randomUnknown = () => {
    const t = 'UNK' + Math.floor(Math.random() * 0xfffffff).toString(16).toUpperCase().padStart(6, '0')
    setTag(t)
  }

  const onInputChange = (e) => {
    const v = (e.target.value || '').toUpperCase().replace(/\s+/g, '')
    setTag(v)
  }

  const disabledNoTag = !tag

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="test-panel">
        <h3>Test Tools</h3>

        <div className="input-group">
          <input
            type="text"
            value={tag}
            onChange={onInputChange}
            placeholder="Enter RFID (e.g., XYZ99999)"
          />
          <button className="post" onClick={randomUnknown} title="Generate a random unknown tag">Random Unknown</button>
          <button className="post" onClick={() => onPost?.(tag)} disabled={disabledNoTag} title="POST to /insert.php">Post (simulate scan)</button>
          <button className="register" onClick={() => onRegister?.(tag)} disabled={disabledNoTag} title="Register tag">Register</button>
          <button className="unregister" onClick={() => onUnregister?.(tag)} disabled={disabledNoTag} title="Unregister tag">Unregister</button>
          {onClearLogs && (
            <button onClick={() => onClearLogs?.()} title="Delete all logs">Clear Logs</button>
          )}
        </div>

        <div className="select-group" style={{ alignItems: 'center' }}>
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            {rfids.map(r => (
              <option key={r.rfid_tag} value={r.rfid_tag}>{r.rfid_tag}</option>
            ))}
          </select>
          <button onClick={() => onToggle?.(selected)} disabled={!selected} title="Toggle selected tag">Toggle selected</button>
        </div>
      </div>
    </div>
  )
}