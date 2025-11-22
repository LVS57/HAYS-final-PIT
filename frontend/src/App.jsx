import React, { useState, useEffect, useCallback } from 'react'
import './App.css'
import './index.css'
import RFIDStatusTable from './components/RFIDStatusTable'
import RFIDLogs from './components/RFIDLogs'

function App() {
  const [rfids, setRfids] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [error, setError] = useState(null)

  const REG_URL = '/api/insert.php?list=registered'
  const LOGS_URL = '/api/insert.php?list=logs'
  const INSERT_URL = '/api/insert.php'

  const safeJson = async (res) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch (e) {
      throw new Error(`Invalid JSON from ${res.url}: ${text.slice(0, 120)}...`)
    }
  }

  const fetchData = useCallback(async (opts = { background: false }) => {
    if (!navigator.onLine) return

    if (opts.background) {
      setBackgroundLoading(true)
    } else {
      setLoading(true)
    }

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
      if (opts.background) {
        setBackgroundLoading(false)
      } else {
        setLoading(false)
      }
    }
  }, [])


  useEffect(() => { fetchData({ background: false }) }, [fetchData])


  useEffect(() => {
    const id = setInterval(() => fetchData({ background: true }), 5000)
    return () => clearInterval(id)
  }, [fetchData])

  return (
    <div className="container" style={{ paddingTop: 16, position: 'relative' }}>
      {error && <div className="card" style={{ color: '#ef4444' }}>Error: {error}</div>}
      {loading && <div className="card muted">Loading...</div>}

      {backgroundLoading && !loading && (
        <div
          className="muted"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 12,
            opacity: 0.6,
          }}
        >
          refreshing...
        </div>
      )}
     <div style={{ padding: '16px', borderBottom: '1px solid #ccc' }}>
        <h1 style={{ margin: 0 }}>Team Hays</h1>
      </div>
      <div className="grid two-col">
        <RFIDStatusTable items={rfids} />
        <RFIDLogs logs={logs} rfids={rfids} showFilter={false} />
      </div>
    </div>
  )
}

export default App
