import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { validateUpdateSettings } from '../../src/validators/settings.validator.js'

describe('validateUpdateSettings', () => {
  test('passes with name only', () => {
    const result = validateUpdateSettings({ name: 'Alice' })
    assert.equal(result.name, 'Alice')
  })

  test('passes with settings only', () => {
    const result = validateUpdateSettings({ settings: { summary_time: '08:00' } })
    assert.equal(result.settings.summary_time, '08:00')
  })

  test('passes with both name and settings', () => {
    const result = validateUpdateSettings({ name: 'Bob', settings: { theme: 'dark' } })
    assert.equal(result.name, 'Bob')
    assert.equal(result.settings.theme, 'dark')
  })

  test('throws 400 when body is null', () => {
    assert.throws(() => validateUpdateSettings(null), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when body is not an object', () => {
    assert.throws(() => validateUpdateSettings('string'), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when body is empty (neither name nor settings)', () => {
    assert.throws(() => validateUpdateSettings({}), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when name is empty string', () => {
    assert.throws(() => validateUpdateSettings({ name: '' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})
