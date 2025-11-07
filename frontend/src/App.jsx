import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

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

  
}

export default App
