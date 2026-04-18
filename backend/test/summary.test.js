import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp, getAuthToken, authHeader } from './helpers.js'

describe('GET /api/v1/summary', () => {
  let app, store, cleanup, token

  beforeEach(async () => {
    ;({ app, store, cleanup } = await buildTestApp())
    ;({ token } = await getAuthToken(app, store))
  })

  afterEach(() => cleanup())

  test('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/summary' })
    assert.equal(res.statusCode, 401)
  })

  test('returns summary key in response', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/summary', headers: authHeader(token) })
    assert.equal(res.statusCode, 200)
    assert.ok('summary' in JSON.parse(res.body))
  })

  test('returns string summary', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/summary', headers: authHeader(token) })
    assert.equal(typeof JSON.parse(res.body).summary, 'string')
  })

  test('returns default message when no tasks or birthdays', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/summary', headers: authHeader(token) })
    assert.match(JSON.parse(res.body).summary, /Nothing to report/)
  })
})
