import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

// We test the pure logic of auth.lib by stubbing OtpCode/User/Person model methods.
// Since ESM module graph is shared, we patch the model exports in place.

import OtpCode from '../../src/models/OtpCode.js'
import User from '../../src/models/User.js'
import Person from '../../src/models/Person.js'

describe('auth.lib — createOtp', () => {
  let created = []

  beforeEach(() => {
    created = []
    OtpCode.create = async (data) => {
      created.push(data)
      return { id: 'otp-1', ...data }
    }
  })

  test('creates an OTP with 6-digit code', async () => {
    const { createOtp } = await import('../../src/lib/auth.lib.js')
    const code = await createOtp('+1234567890')
    assert.equal(code.length, 6)
    assert.match(code, /^\d{6}$/)
  })

  test('stores OTP with correct mobile_number', async () => {
    const { createOtp } = await import('../../src/lib/auth.lib.js')
    await createOtp('+9999999999')
    assert.equal(created[0].mobile_number, '+9999999999')
  })

  test('OTP expires in ~10 minutes', async () => {
    const { createOtp } = await import('../../src/lib/auth.lib.js')
    const before = Date.now()
    await createOtp('+1')
    const expiresAt = created[0].expires_at
    const diff = expiresAt - before
    assert.ok(diff > 9 * 60 * 1000)
    assert.ok(diff <= 10 * 60 * 1000 + 100)
  })
})

describe('auth.lib — verifyOtp', () => {
  beforeEach(() => {
    OtpCode.findOne = async () => null
  })

  test('returns null when OTP not found', async () => {
    const { verifyOtp } = await import('../../src/lib/auth.lib.js')
    const result = await verifyOtp('+1', '000000')
    assert.equal(result, null)
  })

  test('marks OTP as used and returns it', async () => {
    let updated = false
    const fakeOtp = {
      id: 'otp-1',
      mobile_number: '+1',
      code: '123456',
      update: async (v) => { updated = true; Object.assign(fakeOtp, v) },
    }
    OtpCode.findOne = async () => fakeOtp
    const { verifyOtp } = await import('../../src/lib/auth.lib.js')
    const result = await verifyOtp('+1', '123456')
    assert.ok(result)
    assert.equal(updated, true)
  })
})

describe('auth.lib — findOrCreateUser', () => {
  beforeEach(() => {
    User.findOne = async () => null
    User.create = async (data) => ({ id: 'u-1', ...data, settings: {} })
    User.update = async () => [1]
    Person.create = async (data) => ({ id: 'p-1', ...data })
    Person.update = async () => [1]
  })

  test('creates new user and owner person on first login', async () => {
    let personCreated = null
    Person.create = async (data) => { personCreated = data; return { id: 'p-1', ...data } }
    const { findOrCreateUser } = await import('../../src/lib/auth.lib.js')
    const { user, is_new_user } = await findOrCreateUser('+1', 'Alice', null)
    assert.equal(is_new_user, true)
    assert.ok(personCreated)
    assert.equal(personCreated.is_owner, true)
  })

  test('returns existing user on second login', async () => {
    const existing = { id: 'u-existing', mobile_number: '+1', name: 'Alice', settings: {} }
    User.findOne = async () => ({ ...existing, update: async () => {}, name: 'Alice' })
    const { findOrCreateUser } = await import('../../src/lib/auth.lib.js')
    const { user, is_new_user } = await findOrCreateUser('+1', null, null)
    assert.equal(is_new_user, false)
    assert.equal(user.id, 'u-existing')
  })

  test('updates name when existing user has no name', async () => {
    let nameUpdated = null
    const existing = {
      id: 'u-2', mobile_number: '+2', name: null, settings: {},
      update: async (v) => { nameUpdated = v.name; Object.assign(existing, v) },
    }
    User.findOne = async () => existing
    Person.update = async (values) => { nameUpdated = values.name; return [1] }
    const { findOrCreateUser } = await import('../../src/lib/auth.lib.js')
    await findOrCreateUser('+2', 'Bob', null)
    assert.equal(nameUpdated, 'Bob')
  })
})
