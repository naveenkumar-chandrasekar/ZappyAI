import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp, getAuthToken, authHeader } from './helpers.js'

describe('Notes API', () => {
  let app, store, cleanup, token

  beforeEach(async () => {
    ;({ app, store, cleanup } = await buildTestApp())
    ;({ token } = await getAuthToken(app, store))
  })

  afterEach(() => cleanup())

  describe('GET /api/v1/notes', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/notes' })
      assert.equal(res.statusCode, 401)
    })

    test('returns empty array initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/notes', headers: authHeader(token) })
      assert.equal(res.statusCode, 200)
      assert.deepEqual(JSON.parse(res.body), [])
    })

    test('returns all notes when no keyword', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/notes', headers: authHeader(token), payload: { content: 'Note 1' } })
      await app.inject({ method: 'POST', url: '/api/v1/notes', headers: authHeader(token), payload: { content: 'Note 2' } })
      const res = await app.inject({ method: 'GET', url: '/api/v1/notes', headers: authHeader(token) })
      assert.equal(JSON.parse(res.body).length, 2)
    })

    test('keyword search hits content match', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/notes', headers: authHeader(token), payload: { content: 'Buy milk tomorrow' } })
      await app.inject({ method: 'POST', url: '/api/v1/notes', headers: authHeader(token), payload: { content: 'Meeting at 3pm' } })
      const res = await app.inject({ method: 'GET', url: '/api/v1/notes?keyword=milk', headers: authHeader(token) })
      const notes = JSON.parse(res.body)
      assert.equal(notes.length, 1)
      assert.match(notes[0].content, /milk/)
    })

    test('keyword search hits keyword array match', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/notes', headers: authHeader(token), payload: { content: 'Some note', keywords: ['project'] } })
      await app.inject({ method: 'POST', url: '/api/v1/notes', headers: authHeader(token), payload: { content: 'Other note', keywords: ['personal'] } })
      const res = await app.inject({ method: 'GET', url: '/api/v1/notes?keyword=project', headers: authHeader(token) })
      const notes = JSON.parse(res.body)
      assert.ok(notes.some(n => (n.keywords || []).includes('project')))
    })
  })

  describe('POST /api/v1/notes', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/notes', payload: { content: 'x' } })
      assert.equal(res.statusCode, 401)
    })

    test('returns 400 when content missing', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/notes', headers: authHeader(token), payload: {} })
      assert.equal(res.statusCode, 400)
    })

    test('creates note with explicit keywords', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/notes', headers: authHeader(token),
        payload: { content: 'Project idea: build Zappy', keywords: ['project', 'zappy'] },
      })
      assert.equal(res.statusCode, 201)
      const body = JSON.parse(res.body)
      assert.equal(body.content, 'Project idea: build Zappy')
      assert.deepEqual(body.keywords, ['project', 'zappy'])
    })

    test('creates note and auto-extracts keywords when none provided', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/notes', headers: authHeader(token),
        payload: { content: 'Meeting with client about project deadline' },
      })
      assert.equal(res.statusCode, 201)
      const body = JSON.parse(res.body)
      assert.ok(Array.isArray(body.keywords))
      assert.ok(body.keywords.length > 0)
    })
  })

  describe('DELETE /api/v1/notes/:id', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/v1/notes/fake' })
      assert.equal(res.statusCode, 401)
    })

    test('deletes note and removes from list', async () => {
      const create = await app.inject({
        method: 'POST', url: '/api/v1/notes', headers: authHeader(token),
        payload: { content: 'Delete this note' },
      })
      const { id } = JSON.parse(create.body)
      const del = await app.inject({ method: 'DELETE', url: `/api/v1/notes/${id}`, headers: authHeader(token) })
      assert.equal(del.statusCode, 200)
      const list = await app.inject({ method: 'GET', url: '/api/v1/notes', headers: authHeader(token) })
      assert.ok(!JSON.parse(list.body).some(n => n.id === id))
    })

    test('returns 404 for non-existent note', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/v1/notes/no-such-id', headers: authHeader(token) })
      assert.equal(res.statusCode, 404)
    })
  })
})
