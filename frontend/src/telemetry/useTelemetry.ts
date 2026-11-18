import { useEffect, useState } from 'react'
import type { TestSuiteStatus } from '../components/SuiteStatus'
import { appendSample, parseTelemetry } from './model'
import type { Sample } from './model'

type LiveState = {
  status: TestSuiteStatus
  samples: Sample[]
  testId: string | null
  message?: string
}

export function useTelemetry() {
  const [state, setState] = useState<LiveState>({ status: 'disconnected', samples: [], testId: null })

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let request: AbortController | undefined

    async function poll() {
      request = new AbortController()
      const timeout = setTimeout(() => request?.abort(), 3000)
      let delay = 250
      try {
        const response = await fetch('/api/telemetry', { signal: request.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Telemetry unavailable')
        const data = parseTelemetry(await response.json())
        if (!data) throw new Error('Invalid telemetry')
        if (stopped) return
        setState(previous => {
          const samples = previous.testId === data.testId ? previous.samples : []
          // Ignore older snapshots without changing the current test state.
          if (samples.length && data.elapsedMs < samples[samples.length - 1].elapsedMs) return previous
          return {
            testId: data.testId,
            status: data.status,
            samples: data.status === 'ready' || data.status === 'error' ? samples : appendSample(samples, data),
            message: data.message,
          }
        })
      } catch {
        delay = 1000
        if (!stopped) setState(previous => ({ ...previous, status: 'disconnected', message: 'Waiting for the device telemetry connection.' }))
      } finally {
        clearTimeout(timeout)
        if (!stopped) timer = setTimeout(poll, delay)
      }
    }
    void poll()
    return () => { stopped = true; clearTimeout(timer); request?.abort() }
  }, [])

  return state
}
