import { Button } from './components/ui/Button'
import { ThemeProvider } from './theme/ThemeProvider'
import { useTheme } from './theme/useTheme'
import './App.css'

function Workspace() {
  const { preference, resolvedTheme, setPreference } = useTheme()
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#main">Torque<span>-rex</span></a>
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
        <p className="eyebrow">Motor testing workspace</p>
        <h1>A fresh start.</h1>
        <p className="intro">A home for your motor tests, measurements, and results.</p>
        <section className="panel" aria-labelledby="workspace-title">
          <div className="panel-mark" aria-hidden="true">T</div>
          <h2 id="workspace-title">Ready to build</h2>
          <p>The workspace is taking shape. Device connections and test controls will arrive here as they’re built.</p>
          <Button onClick={() => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')}>
            Try {resolvedTheme === 'dark' ? 'light' : 'dark'} appearance
          </Button>
        </section>
        <p className="workspace-note">Torque-rex · Electric machines test suite</p>
      </main>
    </div>
  )
}

export default function App() {
  return <ThemeProvider><Workspace /></ThemeProvider>
}
