import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { validateCreateTask, validateUpdateTask } from '../../src/validators/task.validator.js'

describe('validateCreateTask', () => {
  test('passes with title only', () => {
    const result = validateCreateTask({ title: 'Buy milk' })
    assert.equal(result.title, 'Buy milk')
  })

  test('passes with all optional fields', () => {
    const result = validateCreateTask({
      title: 'Meeting',
      description: 'Team sync',
      due_at: '2026-04-10T10:00:00',
      person_id: '00000000-0000-0000-0000-000000000001',
    })
    assert.equal(result.description, 'Team sync')
    assert.equal(result.due_at, '2026-04-10T10:00:00')
  })

  test('throws 400 when title is missing', () => {
    assert.throws(() => validateCreateTask({}), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when title is empty', () => {
    assert.throws(() => validateCreateTask({ title: '' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when person_id is not a UUID', () => {
    assert.throws(() => validateCreateTask({ title: 'Task', person_id: 'not-a-uuid' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})

describe('validateUpdateTask', () => {
  test('passes with title only', () => {
    const result = validateUpdateTask({ title: 'New title' })
    assert.equal(result.title, 'New title')
  })

  test('passes with completed only', () => {
    const result = validateUpdateTask({ completed: true })
    assert.equal(result.completed, true)
  })

  test('passes with all fields', () => {
    const result = validateUpdateTask({ title: 'x', description: 'y', due_at: 'z', completed: false })
    assert.equal(result.description, 'y')
  })

  test('throws 400 when no fields provided', () => {
    assert.throws(() => validateUpdateTask({}), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when completed is not boolean', () => {
    assert.throws(() => validateUpdateTask({ completed: 'yes' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})
