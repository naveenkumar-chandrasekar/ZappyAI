import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp } from './helpers.js'

describe('API v1', () => {
  let app, cleanup

  beforeEach(async () => {
    ;({ app, cleanup } = await buildTestApp())
  })

  afterEach(() => cleanup())

  test('GET /api/v1 returns metadata', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1' })
    assert.equal(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.equal(body.name, 'zappy-api')
    assert.equal(body.version, 1)
    assert.ok(body.endpoints)
  })

  test('unknown path returns 404 JSON', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' })
    assert.equal(res.statusCode, 404)
    const body = JSON.parse(res.body)
    assert.equal(body.error, 'Not Found')
  })
})
