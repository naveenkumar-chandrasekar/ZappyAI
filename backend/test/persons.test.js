import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp, getAuthToken, authHeader } from './helpers.js'

describe('Persons API', () => {
  let app, store, cleanup, token

  beforeEach(async () => {
    ;({ app, store, cleanup } = await buildTestApp())
    ;({ token } = await getAuthToken(app, store))
  })

  afterEach(() => cleanup())

  describe('GET /api/v1/persons', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/persons' })
      assert.equal(res.statusCode, 401)
    })

    test('returns only owner person initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/persons', headers: authHeader(token) })
      assert.equal(res.statusCode, 200)
      const body = JSON.parse(res.body)
      assert.equal(body.length, 1)
      assert.equal(body[0].is_owner, true)
    })

    test('returns only current user contacts', async () => {
      store.persons.push({
        id: 'p-other', user_id: 'other-user', name: 'Stranger',
        birthday: '1990-01-01', priority: 'Low', is_owner: false,
        custom_fields: {}, created_at: new Date(),
      })
      const res = await app.inject({ method: 'GET', url: '/api/v1/persons', headers: authHeader(token) })
      const body = JSON.parse(res.body)
      assert.ok(body.every(p => p.user_id !== 'other-user'))
    })
  })

  describe('POST /api/v1/persons', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/persons', payload: { name: 'Alice', birthday: '1990-01-01' } })
      assert.equal(res.statusCode, 401)
    })

    test('returns 400 when name missing', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/persons', headers: authHeader(token), payload: { birthday: '1990-01-01' } })
      assert.equal(res.statusCode, 400)
    })

    test('returns 400 when birthday missing', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/persons', headers: authHeader(token), payload: { name: 'Alice' } })
      assert.equal(res.statusCode, 400)
    })

    test('creates contact with default Medium priority', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/persons', headers: authHeader(token),
        payload: { name: 'Alice', birthday: '1990-05-15' },
      })
      assert.equal(res.statusCode, 201)
      const body = JSON.parse(res.body)
      assert.equal(body.name, 'Alice')
      assert.equal(body.priority, 'Medium')
    })

    test('creates contact with explicit priority', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/persons', headers: authHeader(token),
        payload: { name: 'Bob', birthday: '1985-03-20', priority: 'High' },
      })
      assert.equal(res.statusCode, 201)
      assert.equal(JSON.parse(res.body).priority, 'High')
    })

    test('creates contact with custom fields', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/persons', headers: authHeader(token),
        payload: { name: 'Carol', birthday: '1992-07-10', custom_fields: { email: 'carol@example.com' } },
      })
      assert.equal(res.statusCode, 201)
      assert.equal(JSON.parse(res.body).custom_fields.email, 'carol@example.com')
    })

    test('returns 400 for invalid priority', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/persons', headers: authHeader(token),
        payload: { name: 'Dave', birthday: '1980-01-01', priority: 'Critical' },
      })
      assert.equal(res.statusCode, 400)
    })
  })

  describe('PATCH /api/v1/persons/:id', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/v1/persons/fake' })
      assert.equal(res.statusCode, 401)
    })

    test('updates contact name', async () => {
      const create = await app.inject({
        method: 'POST', url: '/api/v1/persons', headers: authHeader(token),
        payload: { name: 'Dave', birthday: '1980-01-01' },
      })
      const { id } = JSON.parse(create.body)
      const res = await app.inject({
        method: 'PATCH', url: `/api/v1/persons/${id}`, headers: authHeader(token),
        payload: { name: 'David' },
      })
      assert.equal(res.statusCode, 200)
      assert.equal(JSON.parse(res.body).name, 'David')
    })

    test('returns 404 for non-existent contact', async () => {
      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/persons/00000000-0000-0000-0000-000000000099',
        headers: authHeader(token), payload: { name: 'Ghost' },
      })
      assert.equal(res.statusCode, 404)
    })

    test('returns 400 with no fields to update', async () => {
      const create = await app.inject({
        method: 'POST', url: '/api/v1/persons', headers: authHeader(token),
        payload: { name: 'Eve', birthday: '1990-01-01' },
      })
      const { id } = JSON.parse(create.body)
      const res = await app.inject({
        method: 'PATCH', url: `/api/v1/persons/${id}`, headers: authHeader(token),
        payload: {},
      })
      assert.equal(res.statusCode, 400)
    })
  })

  describe('DELETE /api/v1/persons/:id', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/v1/persons/fake' })
      assert.equal(res.statusCode, 401)
    })

    test('deletes contact successfully', async () => {
      const create = await app.inject({
        method: 'POST', url: '/api/v1/persons', headers: authHeader(token),
        payload: { name: 'Eve', birthday: '1995-09-01' },
      })
      const { id } = JSON.parse(create.body)
      const del = await app.inject({ method: 'DELETE', url: `/api/v1/persons/${id}`, headers: authHeader(token) })
      assert.equal(del.statusCode, 200)
      const list = await app.inject({ method: 'GET', url: '/api/v1/persons', headers: authHeader(token) })
      assert.ok(!JSON.parse(list.body).some(p => p.id === id))
    })

    test('returns 404 for non-existent contact', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/v1/persons/no-such-id', headers: authHeader(token) })
      assert.equal(res.statusCode, 404)
    })

    test('returns 400 when deleting own profile', async () => {
      const list = await app.inject({ method: 'GET', url: '/api/v1/persons', headers: authHeader(token) })
      const owner = JSON.parse(list.body).find(p => p.is_owner)
      const res = await app.inject({ method: 'DELETE', url: `/api/v1/persons/${owner.id}`, headers: authHeader(token) })
      assert.equal(res.statusCode, 400)
      assert.match(JSON.parse(res.body).error, /own profile/)
    })
  })
})
