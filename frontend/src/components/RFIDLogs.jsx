import React, { useState, useMemo } from 'react'

export default function RFIDLogs({ logs, rfids = [], showFilter = false }) {
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

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter((l) => {
      const found = rfids.find((r) => r.rfid_tag === l.rfid_tag)
      const isKnown = !!found
      const statusValue = found
        ? Number(found.status)
        : l.status === null
        ? null
        : Number(l.status)

      switch (filter) {
        case '1':
          return isKnown && statusValue === 1
        case '0':
          return isKnown && statusValue === 0
        case 'unknown':
          return !isKnown
        default:
          return true
      }
    })
  }, [logs, rfids, filter])

  return (
    <div className="card responsive">
      <div className="flex-between" style={{ alignItems: 'center' }}>
        <h2>Recent RFID Logs</h2>

        {showFilter && (
          <div className="filter-group">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === '1' ? 'active' : ''}`}
              onClick={() => setFilter('1')}
            >
              1
            </button>
            <button
              className={`filter-btn ${filter === '0' ? 'active' : ''}`}
              onClick={() => setFilter('0')}
            >
              0
            </button>
            <button
              className={`filter-btn ${filter === 'unknown' ? 'active' : ''}`}
              onClick={() => setFilter('unknown')}
            >
              Unknown
            </button>
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
            const found = rfids.find((r) => r.rfid_tag === l.rfid_tag)
            const statusValue =
              l.status !== null && l.status !== undefined ? l.status : found?.status
            const isKnown = !!found
            const isOn = Number(statusValue) === 1  
            return (
              <div
                className="table-row"
                key={l.id || `${l.rfid_tag}-${l.timestamp}`}
                style={{ gridTemplateColumns: '0.4fr 0.6fr 1fr' }}
              >
                <div className="mono">{l.rfid_tag}</div>
                <div>
                  {isKnown && (statusValue === 0 || statusValue === 1 || statusValue === '0' || statusValue === '1') ? (
                    <span className={`badge ${isOn ? 'badge-on' : 'badge-off'}`}>{isOn ? '1' : '0'}</span>
                  ) : (
                    <span className="state notfound">RFID NOT FOUND</span>
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
