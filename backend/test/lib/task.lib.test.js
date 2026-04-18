import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Task from '../../src/models/Task.js'

describe('task.lib', () => {
  let lib

  beforeEach(async () => {
    lib = await import('../../src/lib/task.lib.js')
  })

  describe('listTasks', () => {
    test('returns tasks for user', async () => {
      Task.findAll = async ({ where }) => {
        assert.equal(where.user_id, 'u-1')
        return [{ id: 't-1', title: 'Task 1', completed: false, Person: null }]
      }
      const result = await lib.listTasks('u-1', {})
      assert.equal(result.length, 1)
    })

    test('adds completed filter when provided', async () => {
      let capturedWhere
      Task.findAll = async ({ where }) => { capturedWhere = where; return [] }
      await lib.listTasks('u-1', { completed: true })
      assert.equal(capturedWhere.completed, true)
    })

    test('no completed filter when not provided', async () => {
      let capturedWhere
      Task.findAll = async ({ where }) => { capturedWhere = where; return [] }
      await lib.listTasks('u-1', {})
      assert.equal(capturedWhere.completed, undefined)
    })
  })

  describe('createTask', () => {
    test('creates task with correct fields', async () => {
      let created = null
      Task.create = async (data) => { created = data; return { id: 't-new', ...data } }
      await lib.createTask('u-1', { title: 'Buy milk', description: 'From store' })
      assert.equal(created.title, 'Buy milk')
      assert.equal(created.user_id, 'u-1')
    })

    test('person_id defaults to null when not provided', async () => {
      let created = null
      Task.create = async (data) => { created = data; return data }
      await lib.createTask('u-1', { title: 'Solo task' })
      assert.equal(created.person_id, null)
    })
  })

  describe('findTaskByIdAndUser', () => {
    test('returns task when found', async () => {
      Task.findOne = async ({ where }) => {
        assert.equal(where.id, 't-1')
        assert.equal(where.user_id, 'u-1')
        return { id: 't-1' }
      }
      const result = await lib.findTaskByIdAndUser('t-1', 'u-1')
      assert.ok(result)
    })

    test('returns null when not found', async () => {
      Task.findOne = async () => null
      const result = await lib.findTaskByIdAndUser('t-x', 'u-1')
      assert.equal(result, null)
    })
  })

  describe('updateTask', () => {
    test('calls update on task instance', async () => {
      let updated = null
      const task = { id: 't-1', update: async (v) => { updated = v; return task } }
      await lib.updateTask(task, { completed: true })
      assert.equal(updated.completed, true)
    })
  })

  describe('deleteTask', () => {
    test('calls destroy on task instance', async () => {
      let destroyed = false
      const task = { id: 't-1', destroy: async () => { destroyed = true } }
      await lib.deleteTask(task)
      assert.equal(destroyed, true)
    })
  })
})
