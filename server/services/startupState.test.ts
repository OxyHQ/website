import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { isBootstrapComplete, markBootstrapComplete, resetBootstrapState } from './startupState.js'

describe('startup state', () => {
  afterEach(resetBootstrapState)

  test('fails closed until database bootstrap completes', () => {
    assert.equal(isBootstrapComplete(), false)
    markBootstrapComplete()
    assert.equal(isBootstrapComplete(), true)
  })
})
