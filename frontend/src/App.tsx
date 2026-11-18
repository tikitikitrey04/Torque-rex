import { RpmChart } from './components/RpmChart'
import { useTelemetry } from './telemetry/useTelemetry'
import { SuiteStatus } from './components/SuiteStatus'
import { ThemeProvider } from './theme/ThemeProvider'
import { useTheme } from './theme/useTheme'
import './App.css'

function Workspace() {
  const { preference, setPreference } = useTheme()
  const telemetry = useTelemetry()
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#main">Torque<span>-rex</span></a>
        <SuiteStatus status={telemetry.status} message={telemetry.message} />
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
        <RpmChart samples={telemetry.samples} status={telemetry.status} />
      </main>
    </div>
  )
}

export default function App() {
  return <ThemeProvider><Workspace /></ThemeProvider>
}
