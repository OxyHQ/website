import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  applyFunctionalSignals,
  authoritativeProbeUrl,
  statusFromAlarm,
  type FunctionalSignal,
} from './functionalStatus.js'

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

  it('never treats a landing page as an authoritative probe', () => {
    for (const productId of ['mention', 'inbox', 'homiio', 'accounts', 'faircoin', 'oxyos']) {
      assert.equal(authoritativeProbeUrl(productId), null)
    }
    assert.equal(authoritativeProbeUrl('nilo'), 'https://api.nilo.so/health/ready')
    assert.equal(authoritativeProbeUrl('website-api'), 'https://website-api.oxy.so/api/ready')
  })

  it('propagates shared platform failure without improving an unknown app', () => {
    const services = [
      { id: 'mention', status: 'unknown' as const },
      { id: 'oxy-api', status: 'down' as const },
    ]
    assert.deepEqual(applyFunctionalSignals(services, new Map()), [
      { id: 'mention', status: 'down' },
      { id: 'oxy-api', status: 'down' },
    ])
  })

  it('migrates every audited public app and backend onto the board', () => {
    const migration = readFileSync(new URL('../db/migrations/0015_public_status_inventory.sql', import.meta.url), 'utf8')
    const audited = [
      'alia', 'allo', 'astro', 'clarity', 'codea', 'codex-extension', 'crowdsource',
      'faircoin', 'faircoin-bridge', 'faircoin-buy', 'faircoin-explorer',
      'faircoin-wallet', 'homiio', 'inbox', 'kaana', 'mention', 'mercaria', 'moovo',
      'nilo', 'noted', 'oxy-ai', 'oxy-api', 'oxyos', 'peable', 'syra', 'tnp',
      'website-api', 'accounts',
    ].sort()
    const inventory = migration.match(/VALUES\n([\s\S]+?)\nON CONFLICT \("product_id"\)/)?.[1] ?? ''
    const declared = [...inventory.matchAll(/^\s*\('[a-f0-9]{24}', '([a-z0-9-]+)'/gm)]
      .map((match) => match[1])
      .sort()
    assert.deepEqual(declared, audited)
    assert.match(migration, /"show_on_status" = true/)
    assert.match(migration, /RAISE EXCEPTION 'public status inventory has % canonical rows, expected 28'/)
  })
})
