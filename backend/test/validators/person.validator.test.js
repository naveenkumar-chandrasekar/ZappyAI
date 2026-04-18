import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { validateCreatePerson, validateUpdatePerson } from '../../src/validators/person.validator.js'

describe('validateCreatePerson', () => {
  test('passes with name and birthday', () => {
    const result = validateCreatePerson({ name: 'Alice', birthday: '1990-01-01' })
    assert.equal(result.name, 'Alice')
    assert.equal(result.birthday, '1990-01-01')
  })

  test('passes with all optional fields', () => {
    const result = validateCreatePerson({ name: 'Bob', birthday: '1985-03-20', priority: 'High', custom_fields: { note: 'friend' } })
    assert.equal(result.priority, 'High')
    assert.equal(result.custom_fields.note, 'friend')
  })

  test('throws 400 when name is missing', () => {
    assert.throws(() => validateCreatePerson({ birthday: '1990-01-01' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when birthday is missing', () => {
    assert.throws(() => validateCreatePerson({ name: 'Alice' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when priority is invalid', () => {
    assert.throws(() => validateCreatePerson({ name: 'Alice', birthday: '1990-01-01', priority: 'Critical' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when name is empty string', () => {
    assert.throws(() => validateCreatePerson({ name: '', birthday: '1990-01-01' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})

describe('validateUpdatePerson', () => {
  test('passes with name only', () => {
    const result = validateUpdatePerson({ name: 'Alice' })
    assert.equal(result.name, 'Alice')
  })

  test('passes with priority only', () => {
    const result = validateUpdatePerson({ priority: 'Low' })
    assert.equal(result.priority, 'Low')
  })

  test('passes with all fields', () => {
    const result = validateUpdatePerson({ name: 'Bob', birthday: '1985-01-01', priority: 'High', custom_fields: {} })
    assert.equal(result.name, 'Bob')
  })

  test('throws 400 when no fields provided', () => {
    assert.throws(() => validateUpdatePerson({}), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when priority is invalid', () => {
    assert.throws(() => validateUpdatePerson({ priority: 'Urgent' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})
