import { useId } from 'react'
import type { Sample } from '../telemetry/model'
import type { TestSuiteStatus } from './SuiteStatus'
import './RpmChart.css'

const WIDTH = 480
const HEIGHT = 160
const LEFT = 56
const RIGHT = 16
const TOP = 20
const BOTTOM = 40
const WINDOW_MS = 60_000
const format = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })

export function RpmChart({ samples, status }: { samples: Sample[]; status: TestSuiteStatus }) {
  const titleId = useId()
  const latest = samples.at(-1)
  const end = Math.max(WINDOW_MS, latest?.elapsedMs ?? 0)
  const start = end - WINDOW_MS
  // Include one preceding sample so the line reaches the left edge smoothly.
  const firstVisible = samples.findIndex(sample => sample.elapsedMs >= start)
  const visible = firstVisible < 0 ? [] : samples.slice(Math.max(0, firstVisible - 1))
  const maxRpm = Math.max(1000, Math.ceil(Math.max(...visible.map(sample => sample.rpm), 0) / 1000) * 1000)
  const x = (time: number) => LEFT + (time - start) / WINDOW_MS * (WIDTH - LEFT - RIGHT)
  const y = (rpm: number) => HEIGHT - BOTTOM - rpm / maxRpm * (HEIGHT - TOP - BOTTOM)
  const points = visible.map(sample => `${x(sample.elapsedMs)},${y(sample.rpm)}`).join(' ')
  const clipId = useId()

  return (
    <section className="rpm-chart" aria-labelledby={titleId}>
      <div className="rpm-chart__header">
        <div>
          <h1 id={titleId}>Motor speed</h1>
          <p>RPM over time · Last 60 seconds</p>
        </div>
        <div className="rpm-chart__reading">
          <strong>{latest ? format.format(latest.rpm) : '—'}</strong> <span>RPM</span>
          {latest && status === 'disconnected' && <small>Last received</small>}
        </div>
      </div>
      <div className="rpm-chart__plot">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={latest ? `Motor speed over elapsed test time. Latest sample: ${format.format(latest.rpm)} RPM at ${(latest.elapsedMs / 1000).toFixed(1)} seconds.` : 'RPM versus elapsed test time. Waiting for measurements.'}>
          <defs><clipPath id={clipId}><rect x={LEFT} y={TOP} width={WIDTH - LEFT - RIGHT} height={HEIGHT - TOP - BOTTOM} /></clipPath></defs>
          {[0, 1, 2].map(index => {
            const rpm = maxRpm * index / 2
            return <g key={index}>
              <line className="rpm-chart__grid" x1={LEFT} x2={WIDTH - RIGHT} y1={y(rpm)} y2={y(rpm)} />
              <text x={LEFT - 12} y={y(rpm) + 4} textAnchor="end">{format.format(rpm)}</text>
            </g>
          })}
          {[0, 1, 2, 3].map(index => {
            const time = start + WINDOW_MS * index / 3
            return <text key={index} x={x(time)} y={HEIGHT - 25} textAnchor="middle">{Math.round(time / 1000)}s</text>
          })}
          <text x={LEFT} y={14}>RPM</text>
          <text x={(LEFT + WIDTH - RIGHT) / 2} y={HEIGHT - 3} textAnchor="middle">Elapsed test time (s)</text>
          <g clipPath={`url(#${clipId})`}>
            <polyline className="rpm-chart__line" points={points} />
            {latest && <circle cx={x(latest.elapsedMs)} cy={y(latest.rpm)} r={4} className="rpm-chart__point" />}
          </g>
        </svg>
        {!latest && <div className="rpm-chart__empty">Waiting for data</div>}
      </div>
      <p className="rpm-chart__caption" role="status">
        {status === 'running' ? 'Collecting live measurements' : status === 'disconnected' ? 'Device disconnected · Waiting for live measurements' : status === 'completed' ? 'Test complete · Final measurements shown' : status === 'error' ? 'Test error · Collection interrupted' : 'Ready · Waiting for the test to start'}
      </p>
    </section>
  )
}
