import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { validateRequestOtp, validateVerifyOtp } from '../../src/validators/auth.validator.js'

describe('validateRequestOtp', () => {
  test('passes with valid mobile_number', () => {
    const result = validateRequestOtp({ mobile_number: '+1234567890' })
    assert.equal(result.mobile_number, '+1234567890')
  })

  test('throws 400 when mobile_number is missing', () => {
    assert.throws(() => validateRequestOtp({}), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when mobile_number is empty string', () => {
    assert.throws(() => validateRequestOtp({ mobile_number: '' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when body is null', () => {
    assert.throws(() => validateRequestOtp(null), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})

describe('validateVerifyOtp', () => {
  test('passes with mobile_number and 6-digit code', () => {
    const result = validateVerifyOtp({ mobile_number: '+1', code: '123456' })
    assert.equal(result.code, '123456')
  })

  test('passes with optional name', () => {
    const result = validateVerifyOtp({ mobile_number: '+1', code: '123456', name: 'Alice' })
    assert.equal(result.name, 'Alice')
  })

  test('passes with optional birthday', () => {
    const result = validateVerifyOtp({ mobile_number: '+1', code: '123456', birthday: '1990-01-01' })
    assert.equal(result.birthday, '1990-01-01')
  })

  test('throws 400 when code is missing', () => {
    assert.throws(() => validateVerifyOtp({ mobile_number: '+1' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when code is not 6 chars', () => {
    assert.throws(() => validateVerifyOtp({ mobile_number: '+1', code: '123' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when mobile_number is missing', () => {
    assert.throws(() => validateVerifyOtp({ code: '123456' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})
