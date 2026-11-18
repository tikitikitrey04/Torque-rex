import test from 'node:test'
import assert from 'node:assert/strict'
import { parseTelemetry, appendSample, MAX_SAMPLES } from '../src/telemetry/model.ts'

const valid = { testId: 'test-1', status: 'running', elapsedMs: 250, rpm: 3200 }
test('accepts telemetry including zero RPM, rejects malformed measurements', () => {
  assert.deepEqual(parseTelemetry(valid), valid)
  assert.ok(parseTelemetry({ ...valid, elapsedMs: 0, rpm: 0 }))
  for (const change of [{ rpm: -1 }, { rpm: Infinity }, { elapsedMs: NaN }, { elapsedMs: -1 }, { status: 'unknown' }, { testId: '' }, { rpm: '3200' }]) {
    assert.equal(parseTelemetry({ ...valid, ...change }), null)
  }
  assert.equal(parseTelemetry(null), null)
})
test('ignores duplicate and out-of-order samples', () => {
  const samples = [{ elapsedMs: 250, rpm: 3200 }]
  assert.equal(appendSample(samples, { elapsedMs: 250, rpm: 3300 }), samples)
  assert.equal(appendSample(samples, { elapsedMs: 100, rpm: 3300 }), samples)
  assert.equal(appendSample(samples, { elapsedMs: 500, rpm: 3300 }).length, 2)
})
test('bounds retained samples and preserves the latest reading', () => {
  let samples = []
  for (let i = 0; i < MAX_SAMPLES + 10; i++) samples = appendSample(samples, { elapsedMs: i, rpm: i })
  assert.equal(samples.length, MAX_SAMPLES)
  assert.equal(samples[0].elapsedMs, 10)
  assert.equal(samples.at(-1).elapsedMs, MAX_SAMPLES + 9)
})
