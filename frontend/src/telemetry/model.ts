export type SuiteState = 'ready' | 'running' | 'completed' | 'error'
export type Sample = { elapsedMs: number; rpm: number }
export type Telemetry = Sample & { testId: string; status: SuiteState; message?: string }
export const MAX_SAMPLES = 1200

export function parseTelemetry(value: unknown): Telemetry | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Record<string, unknown>
  if ((data.message !== undefined && typeof data.message !== 'string') ||
    typeof data.testId !== 'string' || !data.testId.trim() ||
    !['ready', 'running', 'completed', 'error'].includes(String(data.status)) ||
    typeof data.elapsedMs !== 'number' || !Number.isFinite(data.elapsedMs) || data.elapsedMs < 0 ||
    typeof data.rpm !== 'number' || !Number.isFinite(data.rpm) || data.rpm < 0) return null
  return data as Telemetry
}

export function appendSample(samples: Sample[], sample: Sample): Sample[] {
  if (samples.length && sample.elapsedMs <= samples[samples.length - 1].elapsedMs) return samples
  return [...samples.slice(-(MAX_SAMPLES - 1)), { elapsedMs: sample.elapsedMs, rpm: sample.rpm }]
}
