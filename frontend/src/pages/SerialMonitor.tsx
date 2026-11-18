import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import './SerialMonitor.css'

export function SerialMonitor() {
  const [output, setOutput] = useState('')
  const [paused, setPaused] = useState(false)
  const [connected, setConnected] = useState(false)
  const [follow, setFollow] = useState(true)
  const view = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (paused) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let request: AbortController | undefined
    async function poll() {
      request = new AbortController()
      const timeout = setTimeout(() => request?.abort(), 3000)
      try {
        const response = await fetch('/api/serial', { signal: request.signal, cache: 'no-store' })
        if (!response.ok || !response.headers.get('content-type')?.includes('text/plain')) {
          throw new Error('Serial log unavailable')
        }
        const text = await response.text()
        if (!stopped) {
          setOutput(text)
          setConnected(true)
        }
      } catch {
        if (!stopped) setConnected(false)
      } finally {
        clearTimeout(timeout)
        if (!stopped) timer = setTimeout(poll, 500)
      }
    }
    void poll()
    return () => { stopped = true; clearTimeout(timer); request?.abort() }
  }, [paused])

  useEffect(() => {
    if (follow && view.current) view.current.scrollTop = view.current.scrollHeight
  }, [output, follow])

  return (
    <section className="serial-monitor" aria-labelledby="serial-title">
      <div className="serial-monitor__header">
        <div>
          <h1 id="serial-title">Serial output</h1>
          <p role="status">{paused ? 'Paused' : connected ? 'Live · Refreshing every 0.5 seconds' : 'Disconnected · Retrying connection'}</p>
        </div>
        <div className="serial-monitor__controls">
          <label><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} /> Follow output</label>
          <Button variant="secondary" onClick={() => setPaused(value => !value)}>{paused ? 'Resume' : 'Pause'}</Button>
        </div>
      </div>
      <pre ref={view} className="serial-monitor__output" tabIndex={0} aria-label="Device serial output">{output || (connected ? 'No serial output yet.' : 'Waiting for device serial output…')}</pre>
      <p className="serial-monitor__note">Recent application logs · Latest 16 KiB retained on the device. Logs reset when the device restarts.</p>
    </section>
  )
}
