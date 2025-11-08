import React, { useState, useMemo } from 'react'

export default function RFIDLogs({ logs = [], rfids = [], showFilter = false }) {
  const [filter, setFilter] = useState('all')

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return String(ts)
    return d.toLocaleString(undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  // Filter strictly by the historical log status
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter((l) => {
      const s = l.status === null ? null : Number(l.status)
      if (filter === '1') return s === 1
      if (filter === '0') return s === 0
      if (filter === 'unknown') return s === null
      return true
    })
  }, [logs, filter])

  return (
    <div className="card responsive">
      <div className="flex-between" style={{ alignItems: 'center' }}>
        <h2>Recent RFID Logs</h2>

        {showFilter && (
          <div className="filter-group">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`filter-btn ${filter === '1' ? 'active' : ''}`} onClick={() => setFilter('1')}>1</button>
            <button className={`filter-btn ${filter === '0' ? 'active' : ''}`} onClick={() => setFilter('0')}>0</button>
            <button className={`filter-btn ${filter === 'unknown' ? 'active' : ''}`} onClick={() => setFilter('unknown')}>Unknown</button>
          </div>
        )}
      </div>

      <div className="table centered">
        <div className="table-row table-header" style={{ gridTemplateColumns: '0.4fr 0.6fr 1fr' }}>
          <div>RFID</div>
          <div>Status</div>
          <div>Stamp</div>
        </div>

        {filteredLogs?.length ? (
          filteredLogs.map((l) => {
            const s = l.status === null ? null : Number(l.status)
            const isUnknown = s === null
            const isOn = s === 1
            const isOff = s === 0
            return (
              <div
                className="table-row"
                key={l.id ?? `${l.rfid_tag}-${l.timestamp}`}
                style={{ gridTemplateColumns: '0.4fr 0.6fr 1fr' }}
              >
                <div className="mono">{l.rfid_tag}</div>
                <div>
                  {isUnknown ? (
                    <span className="state notfound">RFID NOT FOUND</span>
                  ) : (
                    <span className={`badge ${isOn ? 'badge-on' : 'badge-off'}`}>{isOn ? '1' : isOff ? '0' : ''}</span>
                  )}
                </div>
                <div className="time">{formatDate(l.timestamp)}</div>
              </div>
            )
          })
        ) : (
          <div className="table-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="muted">No logs yet</div>
          </div>
        )}
      </div>
    </div>
  )
}
