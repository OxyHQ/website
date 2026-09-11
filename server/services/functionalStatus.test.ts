import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { applyFunctionalSignals, statusFromAlarm, type FunctionalSignal } from './functionalStatus.js'

const signal = (state: FunctionalSignal['state']): FunctionalSignal => ({
  alarmName: 'exact-alarm',
  state,
  checkedAt: '2026-09-11T00:00:00.000Z',
})

describe('public functional status', () => {
  it('fails closed for an absent or indeterminate authoritative alarm', () => {
    assert.equal(statusFromAlarm('MISSING'), 'unknown')
    assert.equal(statusFromAlarm('INSUFFICIENT_DATA'), 'unknown')
    assert.equal(statusFromAlarm('ALARM'), 'down')
    assert.equal(statusFromAlarm('OK'), 'operational')
  })

  it('never leaves Alia green when its own alarm or a required dependency fails', () => {
    const services = [
      { id: 'alia', status: 'operational' as const },
      { id: 'oxy-api', status: 'operational' as const },
      { id: 'kaana', status: 'operational' as const },
    ]
    assert.ok(applyFunctionalSignals(services, new Map([['alia', signal('ALARM')]]))
      .some((service) => service.id === 'alia' && service.status === 'down'))
    assert.ok(applyFunctionalSignals(
      services.map((service) => service.id === 'kaana' ? { ...service, status: 'down' as const } : service),
      new Map([['alia', signal('OK')], ['kaana', signal('ALARM')]]),
    ).some((service) => service.id === 'alia' && service.status === 'down'))
  })

  it('preserves reachability status for services without a functional alarm', () => {
    assert.deepEqual(
      applyFunctionalSignals([{ id: 'mention', status: 'degraded' }], new Map()),
      [{ id: 'mention', status: 'degraded' }],
    )
  })

  it('migrates every audited public app and backend onto the board', () => {
    const migration = readFileSync(new URL('../db/migrations/0015_public_status_inventory.sql', import.meta.url), 'utf8')
    for (const productId of [
      'alia', 'allo', 'astro', 'clarity', 'codea', 'codex-extension', 'crowdsource',
      'faircoin-wallet', 'kaana', 'mercaria', 'moovo', 'nilo', 'noted', 'oxy-ai',
      'peable', 'syra', 'tnp',
    ]) assert.ok(migration.includes(`'${productId}'`), `missing public status product ${productId}`)
  })
})
