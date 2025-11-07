import React, { useState, useEffect, useCallback, useMemo } from 'react'
import './App.css'
import './index.css'
import RFIDStatusTable from './components/RFIDStatusTable'


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