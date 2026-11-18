import './SuiteStatus.css'

const statuses = {
  ready: { label: 'Ready', description: 'The test suite is ready to start a test.', tone: 'success' },
  running: { label: 'Running', description: 'A test is in progress.', tone: 'info' },
  completed: { label: 'Completed', description: 'The test has finished.', tone: 'success' },
  error: { label: 'Error', description: 'The test suite needs attention.', tone: 'danger' },
  disconnected: { label: 'Disconnected', description: 'No test-suite connection.', tone: 'neutral' },
} as const

export type TestSuiteStatus = keyof typeof statuses

type SuiteStatusProps = {
  status: TestSuiteStatus
  message?: string
}

export function SuiteStatus({ status, message }: SuiteStatusProps) {
  const { label, description, tone } = statuses[status]
  return (
    <div className="suite-status" data-tone={tone} role="status" aria-live="polite" aria-atomic="true" title={message ?? description}>
      <span className="suite-status__dot" aria-hidden="true" />
      <span className="suite-status__sr-only">Test suite status: </span>
      <span>{label}</span>
      <span className="suite-status__sr-only">. {message ?? description}</span>
    </div>
  )
}
