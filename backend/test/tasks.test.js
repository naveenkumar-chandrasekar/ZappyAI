import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp, getAuthToken, authHeader } from './helpers.js'

describe('Tasks API', () => {
  let app, store, cleanup, token

  beforeEach(async () => {
    ;({ app, store, cleanup } = await buildTestApp())
    ;({ token } = await getAuthToken(app, store))
  })

  afterEach(() => cleanup())

  describe('GET /api/v1/tasks', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/tasks' })
      assert.equal(res.statusCode, 401)
    })

    test('returns empty array initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/tasks', headers: authHeader(token) })
      assert.equal(res.statusCode, 200)
      assert.deepEqual(JSON.parse(res.body), [])
    })

    test('GET /tasks/:id returns task with 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/tasks/00000000-0000-0000-0000-000000000099',
        headers: authHeader(token),
      })
      assert.equal(res.statusCode, 404)
    })

    test('returns only current user tasks', async () => {
      store.tasks.push({ id: 'other-task', user_id: 'other-user', title: 'Not mine', completed: false, created_at: new Date() })
      const res = await app.inject({ method: 'GET', url: '/api/v1/tasks', headers: authHeader(token) })
      assert.deepEqual(JSON.parse(res.body), [])
    })

    test('filters by completed=true', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/tasks', headers: authHeader(token), payload: { title: 'Done task' } })
      const { id } = JSON.parse((await app.inject({ method: 'GET', url: '/api/v1/tasks', headers: authHeader(token) })).body)[0]
      await app.inject({ method: 'PATCH', url: `/api/v1/tasks/${id}`, headers: authHeader(token), payload: { completed: true } })

      const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?completed=true', headers: authHeader(token) })
      const tasks = JSON.parse(res.body)
      assert.ok(tasks.every(t => t.completed === true))
    })

    test('filters by completed=false', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/tasks', headers: authHeader(token), payload: { title: 'Pending task' } })
      const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?completed=false', headers: authHeader(token) })
      const tasks = JSON.parse(res.body)
      assert.ok(tasks.length > 0)
      assert.ok(tasks.every(t => t.completed === false))
    })
  })

  describe('POST /api/v1/tasks', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/tasks', payload: { title: 'Task' } })
      assert.equal(res.statusCode, 401)
    })

    test('returns 400 when title missing', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/v1/tasks', headers: authHeader(token), payload: {} })
      assert.equal(res.statusCode, 400)
    })

    test('creates task and returns it', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/v1/tasks', headers: authHeader(token),
        payload: { title: 'Buy groceries', description: 'Milk and eggs' },
      })
      assert.equal(res.statusCode, 201)
      const body = JSON.parse(res.body)
      assert.equal(body.title, 'Buy groceries')
      assert.equal(body.completed, false)
    })

    test('task appears in GET /tasks after creation', async () => {
      await app.inject({ method: 'POST', url: '/api/v1/tasks', headers: authHeader(token), payload: { title: 'Read book' } })
      const res = await app.inject({ method: 'GET', url: '/api/v1/tasks', headers: authHeader(token) })
      const tasks = JSON.parse(res.body)
      assert.ok(tasks.some(t => t.title === 'Read book'))
    })

    test('GET /tasks/:id returns one task', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/api/v1/tasks',
        headers: authHeader(token),
        payload: { title: 'Single fetch' },
      })
      const { id } = JSON.parse(create.body)
      const res = await app.inject({ method: 'GET', url: `/api/v1/tasks/${id}`, headers: authHeader(token) })
      assert.equal(res.statusCode, 200)
      const body = JSON.parse(res.body)
      assert.equal(body.title, 'Single fetch')
      assert.ok('person' in body)
    })
  })

  describe('PATCH /api/v1/tasks/:id', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/v1/tasks/fake-id' })
      assert.equal(res.statusCode, 401)
    })

    test('marks task as completed', async () => {
      const create = await app.inject({
        method: 'POST', url: '/api/v1/tasks', headers: authHeader(token),
        payload: { title: 'Exercise' },
      })
      const { id } = JSON.parse(create.body)
      const res = await app.inject({
        method: 'PATCH', url: `/api/v1/tasks/${id}`, headers: authHeader(token),
        payload: { completed: true },
      })
      assert.equal(res.statusCode, 200)
      assert.equal(JSON.parse(res.body).completed, true)
    })

    test('returns 404 for non-existent task', async () => {
      const res = await app.inject({
        method: 'PATCH', url: '/api/v1/tasks/00000000-0000-0000-0000-000000000099',
        headers: authHeader(token), payload: { completed: true },
      })
      assert.equal(res.statusCode, 404)
    })

    test('returns 400 with no fields to update', async () => {
      const create = await app.inject({
        method: 'POST', url: '/api/v1/tasks', headers: authHeader(token),
        payload: { title: 'Some task' },
      })
      const { id } = JSON.parse(create.body)
      const res = await app.inject({
        method: 'PATCH', url: `/api/v1/tasks/${id}`, headers: authHeader(token),
        payload: {},
      })
      assert.equal(res.statusCode, 400)
    })
  })

  describe('DELETE /api/v1/tasks/:id', () => {
    test('returns 401 without token', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/v1/tasks/fake' })
      assert.equal(res.statusCode, 401)
    })

    test('deletes task successfully', async () => {
      const create = await app.inject({
        method: 'POST', url: '/api/v1/tasks', headers: authHeader(token),
        payload: { title: 'Delete me' },
      })
      const { id } = JSON.parse(create.body)
      const del = await app.inject({ method: 'DELETE', url: `/api/v1/tasks/${id}`, headers: authHeader(token) })
      assert.equal(del.statusCode, 200)
      const list = await app.inject({ method: 'GET', url: '/api/v1/tasks', headers: authHeader(token) })
      assert.ok(!JSON.parse(list.body).some(t => t.id === id))
    })

    test('returns 404 for non-existent task', async () => {
      const res = await app.inject({
        method: 'DELETE', url: '/api/v1/tasks/00000000-0000-0000-0000-000000000099',
        headers: authHeader(token),
      })
      assert.equal(res.statusCode, 404)
    })
  })
})
