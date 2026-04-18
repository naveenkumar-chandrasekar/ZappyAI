import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { validateCreateNote } from '../../src/validators/note.validator.js'

describe('validateCreateNote', () => {
  test('passes with content only', () => {
    const result = validateCreateNote({ content: 'Some note' })
    assert.equal(result.content, 'Some note')
  })

  test('passes with optional keywords array', () => {
    const result = validateCreateNote({ content: 'Note', keywords: ['tag1', 'tag2'] })
    assert.deepEqual(result.keywords, ['tag1', 'tag2'])
  })

  test('throws 400 when content is missing', () => {
    assert.throws(() => validateCreateNote({}), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when content is empty string', () => {
    assert.throws(() => validateCreateNote({ content: '' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })

  test('throws 400 when keywords is not an array', () => {
    assert.throws(() => validateCreateNote({ content: 'Note', keywords: 'bad' }), err => {
      assert.equal(err.statusCode, 400)
      return true
    })
  })
})
