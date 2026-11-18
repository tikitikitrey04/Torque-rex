import { useEffect, useState } from 'react'
import { SerialMonitor } from './pages/SerialMonitor'
import { RpmChart } from './components/RpmChart'
import { useTelemetry } from './telemetry/useTelemetry'
import { SuiteStatus } from './components/SuiteStatus'
import { ThemeProvider } from './theme/ThemeProvider'
import { useTheme } from './theme/useTheme'
import './App.css'

function Workspace() {
  const { preference, setPreference } = useTheme()
  const telemetry = useTelemetry()
  const [serialPage, setSerialPage] = useState(() => window.location.hash === '#/serial')
  useEffect(() => {
    const update = () => setSerialPage(window.location.hash === '#/serial')
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#/">Torque<span>-rex</span></a>
        <SuiteStatus status={telemetry.status} message={telemetry.message} />
        <nav className="page-nav" aria-label="Pages">
          <a href="#/" aria-current={!serialPage ? 'page' : undefined}>Test suite</a>
          <a href="#/serial" aria-current={serialPage ? 'page' : undefined}>Serial output</a>
        </nav>
        <label className="theme-control">
          Appearance
          <select value={preference} onChange={(event) => setPreference(event.target.value)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </header>
      <main id="main" className="workspace">
        {serialPage ? <SerialMonitor /> : <RpmChart samples={telemetry.samples} status={telemetry.status} />}
      </main>
    </div>
  )
}

export default function App() {
  return <ThemeProvider><Workspace /></ThemeProvider>
}
