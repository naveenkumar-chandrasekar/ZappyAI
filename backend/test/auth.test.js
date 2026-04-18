import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp, getAuthToken } from './helpers.js'

describe('POST /api/v1/auth/request-otp', () => {
  let app, store, cleanup

  beforeEach(async () => {
    ;({ app, store, cleanup } = await buildTestApp())
  })

  afterEach(() => cleanup())

  test('returns 400 when mobile_number is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/request-otp', payload: {} })
    assert.equal(res.statusCode, 400)
    assert.match(JSON.parse(res.body).error, /mobile_number|Required/)
  })

  test('returns 200 and demo_code in demo mode', async () => {
    process.env.APP_MODE = 'demo'
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/request-otp',
      payload: { mobile_number: '+19995550001' },
    })
    assert.equal(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.ok(body.demo_code)
    assert.equal(body.demo_code.length, 6)
  })

  test('stores OTP in store', async () => {
    process.env.APP_MODE = 'demo'
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/request-otp',
      payload: { mobile_number: '+19995550002' },
    })
    assert.ok(store.otp_codes.some(o => o.mobile_number === '+19995550002'))
  })
})

describe('POST /api/v1/auth/verify-otp', () => {
  let app, store, cleanup

  beforeEach(async () => {
    ;({ app, store, cleanup } = await buildTestApp())
  })

  afterEach(() => cleanup())

  test('returns 400 when code is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-otp',
      payload: { mobile_number: '+1' },
    })
    assert.equal(res.statusCode, 400)
  })

  test('returns 400 when mobile_number is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-otp',
      payload: { code: '123456' },
    })
    assert.equal(res.statusCode, 400)
  })

  test('returns 400 when code is not 6 digits', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-otp',
      payload: { mobile_number: '+1', code: '123' },
    })
    assert.equal(res.statusCode, 400)
  })

  test('returns 401 for invalid OTP', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-otp',
      payload: { mobile_number: '+19995550001', code: '000000' },
    })
    assert.equal(res.statusCode, 401)
  })

  test('returns 401 for expired OTP', async () => {
    store.otp_codes.push({
      id: 'otp-expired',
      mobile_number: '+1999',
      code: '111111',
      expires_at: new Date(Date.now() - 1000),
      used: false,
      created_at: new Date(),
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-otp',
      payload: { mobile_number: '+1999', code: '111111' },
    })
    assert.equal(res.statusCode, 401)
  })

  test('returns token and userId on valid OTP', async () => {
    const { token, userId } = await getAuthToken(app, store)
    assert.ok(token)
    assert.ok(userId)
  })

  test('creates user on first login', async () => {
    await getAuthToken(app, store, '+19990000001')
    assert.ok(store.users.some(u => u.mobile_number === '+19990000001'))
  })

  test('marks OTP as used after verify', async () => {
    await getAuthToken(app, store, '+19990000002')
    const otp = store.otp_codes.find(o => o.mobile_number === '+19990000002')
    assert.equal(otp.used, true)
  })

  test('creates owner person on first login', async () => {
    await getAuthToken(app, store, '+19990000003')
    const user = store.users.find(u => u.mobile_number === '+19990000003')
    assert.ok(store.persons.some(p => p.user_id === user.id && p.is_owner === true))
  })

  test('returns is_new_user true on first login', async () => {
    store.otp_codes.push({
      id: 'otp-new',
      mobile_number: '+19990000004',
      code: '654321',
      expires_at: new Date(Date.now() + 60_000),
      used: false,
      created_at: new Date(),
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-otp',
      payload: { mobile_number: '+19990000004', code: '654321' },
    })
    assert.equal(JSON.parse(res.body).is_new_user, true)
  })
})
