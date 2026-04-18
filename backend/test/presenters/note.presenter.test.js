import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { presentNote, presentNoteList } from '../../src/presenters/note.presenter.js'

const sample = {
  id: 'n-1',
  user_id: 'u-1',
  content: 'Important note',
  keywords: ['important', 'note'],
  created_at: new Date('2026-01-01'),
}

describe('presentNote', () => {
  test('returns correct shape', () => {
    const n = presentNote(sample)
    assert.equal(n.id, 'n-1')
    assert.equal(n.user_id, 'u-1')
    assert.equal(n.content, 'Important note')
    assert.deepEqual(n.keywords, ['important', 'note'])
    assert.ok(n.created_at)
  })

  test('handles empty keywords', () => {
    const n = presentNote({ ...sample, keywords: [] })
    assert.deepEqual(n.keywords, [])
  })
})

describe('presentNoteList', () => {
  test('maps array correctly', () => {
    const list = presentNoteList([sample, { ...sample, id: 'n-2', content: 'Other' }])
    assert.equal(list.length, 2)
    assert.equal(list[1].content, 'Other')
  })

  test('returns empty array for empty input', () => {
    assert.deepEqual(presentNoteList([]), [])
  })
})
