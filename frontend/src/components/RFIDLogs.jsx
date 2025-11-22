import React from 'react'

export default function RFIDLogs({ logs = [] }) {
  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return String(ts)
    return d.toLocaleString(undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  return (
    <div className="card responsive">
      <div className="flex-between" style={{ alignItems: 'center' }}>
        <h2>Recent RFID Logs</h2>
      </div>

      <div className="table centered">
        <div className="table-row table-header" style={{ gridTemplateColumns: '0.4fr 0.6fr 1fr' }}>
          <div>RFID</div>
          <div>Status</div>
          <div>Stamp</div>
        </div>

        {logs?.length ? (
          logs.map((l) => {
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
                    <span className={`badge ${isOn ? 'badge-on' : 'badge-off'}`}>
                      {isOn ? '1' : isOff ? '0' : ''}
                    </span>
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
