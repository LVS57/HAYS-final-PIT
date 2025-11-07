import React, { useState, useEffect, useCallback, useMemo } from 'react'
import './App.css'
import './index.css'
import RFIDStatusTable from './components/RFIDStatusTable'

function RFIDLogs({ logs, rfids = [], showFilter }) {
  const [filter, setFilter] = React.useState('all')

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return String(ts)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true
    const found = rfids.find((r) => r.rfid_tag === l.rfid_tag)
    const statusValue = found ? found.status : l.status
    if (filter === '1') return Number(statusValue) === 1
    if (filter === '0') return Number(statusValue) === 0
    if (filter === 'unknown') return !found
    return true
  })

  return (
    <div className="card responsive">
      <div className="flex-between">
        <h2>Recent RFID Logs</h2>
        {showFilter && (
          <div className="filter-group">
            {['all', '1', '0', 'unknown'].map((type) => (
              <button
                key={type}
                className={`filter-btn ${filter === type ? 'active' : ''}`}
                onClick={() => setFilter(type)}
              >
                {type === 'all'
                  ? 'All'
                  : type === '1'
                  ? '1'
                  : type === '0'
                  ? '0'
                  : 'Unknown'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="table centered"
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        <div
          className="table-row table-header"
          style={{ gridTemplateColumns: '0.4fr 0.6fr 1fr' }}
        >
          <div>RFID</div>
          <div>Status</div>
          <div>Stamp</div>
        </div>
        {filteredLogs.length ? (
          filteredLogs.map((l) => {
            const found = rfids.find((r) => r.rfid_tag === l.rfid_tag)
            const statusValue = found ? found.status : l.status
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
                  {isKnown &&
                  (statusValue === 0 ||
                    statusValue === 1 ||
                    statusValue === '0' ||
                    statusValue === '1') ? (
                    <span
                      className={`badge ${isOn ? 'badge-on' : 'badge-off'}`}
                    >
                      {isOn ? '1' : '0'}
                    </span>
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

function App() {
  const [rfids, setRfids] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const REG_URL = '/api/insert.php?list=registered'
  const LOGS_URL = '/api/insert.php?list=logs'
  const INSERT_URL = '/api/insert.php'

  const safeJson = async (res) => {
    const text = await res.text()
    try { return JSON.parse(text) } catch (e) {
      throw new Error(`Invalid JSON from ${res.url}: ${text.slice(0,120)}...`)
    }
  }

  const fetchData = useCallback(async () => {
    if (!navigator.onLine) return
    setLoading(true)
    setError(null)
    try {
      const [regRes, logRes] = await Promise.all([
        fetch(REG_URL, { cache: 'no-store' }),
        fetch(LOGS_URL, { cache: 'no-store' }),
      ])
      if (!regRes.ok) throw new Error(`Registered fetch failed (${regRes.status})`)
      if (!logRes.ok) throw new Error(`Logs fetch failed (${logRes.status})`)
      const regJson = await safeJson(regRes)
      const logJson = await safeJson(logRes)
      setRfids(Array.isArray(regJson.rfids) ? regJson.rfids : [])
      setLogs(Array.isArray(logJson.logs) ? logJson.logs : [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [REG_URL, LOGS_URL])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const id = setInterval(() => { fetchData() }, 5000)
    return () => clearInterval(id)
  }, [fetchData])

  const updateStatus = useCallback(async (rfid_tag) => {
    try {
      const res = await fetch(INSERT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid_data: rfid_tag }),
      })
      if (!res.ok) throw new Error(`Insert failed (${res.status})`)
      await safeJson(res)
      fetchData()
    } catch (e) {
      console.error(e)
      setError(String(e.message || e))
    }
  }, [INSERT_URL, fetchData])

  const routes = useMemo(() => [
    { path: '#/status', label: 'Status' },
    { path: '#/logs', label: 'Logs' },
  ], [])

  const [hash, setHash] = useState(window.location.hash || '#/status')
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#/status')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-inner container">
          <div className="brand">IT414 Final PIT</div>
          <div className="nav">
            {routes.map((r) => (
              <a key={r.path} href={r.path} className={hash === r.path ? 'active' : ''}>{r.label}</a>
            ))}
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: 16 }}>
        {error && <div className="card" style={{ color: '#ef4444' }}>Error: {error}</div>}
        {loading && <div className="card muted">Loading...</div>}
        {hash === '#/status' && (
          <div className="grid two-col">
            <RFIDStatusTable items={rfids} />
            <RFIDLogs logs={logs} rfids={rfids} showFilter={false} />
          </div>
        )}

        {hash === '#/logs' && (
          <div className="grid">
            <RFIDLogs logs={logs} rfids={rfids} showFilter={true} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App