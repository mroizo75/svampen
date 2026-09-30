import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from './password-reset'

describe('password reset tokens', () => {
  it('creates unique 64-character hexadecimal tokens', () => {
    const firstToken = createPasswordResetToken()
    const secondToken = createPasswordResetToken()

    assert.match(firstToken, /^[a-f0-9]{64}$/)
    assert.match(secondToken, /^[a-f0-9]{64}$/)
    assert.notEqual(firstToken, secondToken)
  })

  it('hashes the same token deterministically without storing the raw token', () => {
    const token = 'a'.repeat(64)
    const firstHash = hashPasswordResetToken(token)
    const secondHash = hashPasswordResetToken(token)

    assert.equal(firstHash, secondHash)
    assert.match(firstHash, /^[a-f0-9]{64}$/)
    assert.notEqual(firstHash, token)
  })
})
