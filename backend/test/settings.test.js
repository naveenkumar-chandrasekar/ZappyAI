import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp, getAuthToken, authHeader } from './helpers.js'

describe('Settings API', () => {
  let app, store, cleanup, token

  beforeEach(async () => {
    ;({ app, store, cleanup } = await buildTestApp())
    ;({ token } = await getAuthToken(app, store))
  })

  afterEach(() => cleanup())

  describe('GET /api/v1/settings', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/settings' })
      assert.equal(res.statusCode, 401)
    })

    test('returns user settings', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/settings', headers: authHeader(token) })
      assert.equal(res.statusCode, 200)
      const body = JSON.parse(res.body)
      assert.ok('settings' in body)
      assert.ok('mobile_number' in body)
    })

    test('returns empty settings object for new user', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/settings', headers: authHeader(token) })
      assert.deepEqual(JSON.parse(res.body).settings, {})
    })
  })

  describe('PATCH /api/v1/settings', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/v1/settings', payload: { settings: {} } })
      assert.equal(res.statusCode, 401)
    })

    test('returns 400 when body is empty object', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/v1/settings', headers: authHeader(token), payload: {} })
      assert.equal(res.statusCode, 400)
    })

    test('saves summary_time setting', async () => {
      const patch = await app.inject({
        method: 'PATCH', url: '/api/v1/settings', headers: authHeader(token),
        payload: { settings: { summary_time: '09:00' } },
      })
      assert.equal(patch.statusCode, 200)
      const get = await app.inject({ method: 'GET', url: '/api/v1/settings', headers: authHeader(token) })
      assert.equal(JSON.parse(get.body).settings.summary_time, '09:00')
    })

    test('saves birthday_lead_times', async () => {
      const patch = await app.inject({
        method: 'PATCH', url: '/api/v1/settings', headers: authHeader(token),
        payload: { settings: { birthday_lead_times: { high: 14, medium: 7, low: 3 } } },
      })
      assert.equal(patch.statusCode, 200)
      const get = await app.inject({ method: 'GET', url: '/api/v1/settings', headers: authHeader(token) })
      assert.equal(JSON.parse(get.body).settings.birthday_lead_times.high, 14)
    })

    test('updates user name', async () => {
      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/settings', headers: authHeader(token),
        payload: { name: 'Naveen' },
      })
      assert.equal(res.statusCode, 200)
      assert.equal(JSON.parse(res.body).name, 'Naveen')
    })

    test('updates both name and settings together', async () => {
      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/settings', headers: authHeader(token),
        payload: { name: 'Alex', settings: { theme: 'dark' } },
      })
      assert.equal(res.statusCode, 200)
      const body = JSON.parse(res.body)
      assert.equal(body.name, 'Alex')
      assert.equal(body.settings.theme, 'dark')
    })
  })
})
