import React from 'react'

export default function RFIDStatusTable({ items, onToggle }) {
  return (
    <div className="card responsive status-table">
      <h2>Registered RFIDs</h2>

      <div className="table">
        <div
          className="table-row table-header"
          style={{ gridTemplateColumns: '1fr 0.6fr' }}
        >
          <div>RFID</div>
          <div>Status</div>
        </div>

        <div className="rfids-scroll">
          {items?.length ? (
            items.map((row) => {
              const isOn = Number(row.status) === 1
              return (
                <div
                  className="table-row"
                  key={row.rfid_tag}
                  style={{ gridTemplateColumns: '1fr 0.6fr' }}
                >
                  <div className="mono">{row.rfid_tag}</div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => onToggle && onToggle(row.rfid_tag)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="table-row" style={{ gridTemplateColumns: '1fr' }}>
              <div className="muted">No registered RFIDs</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}