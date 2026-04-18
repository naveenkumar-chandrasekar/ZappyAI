import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Note from '../../src/models/Note.js'

describe('note.lib', () => {
  let lib

  beforeEach(async () => {
    lib = await import('../../src/lib/note.lib.js')
  })

  describe('listNotes', () => {
    test('returns all notes without keyword', async () => {
      Note.findAll = async ({ where }) => {
        assert.equal(where.user_id, 'u-1')
        return [{ id: 'n-1', content: 'Note' }]
      }
      const result = await lib.listNotes('u-1', undefined)
      assert.equal(result.length, 1)
    })

    test('uses Op.or when keyword provided', async () => {
      let calledWith = null
      Note.findAll = async (opts) => { calledWith = opts; return [] }
      await lib.listNotes('u-1', 'milk')
      assert.ok(calledWith.where)
    })
  })

  describe('createNote', () => {
    test('uses provided keywords lowercased', async () => {
      let created = null
      Note.create = async (data) => { created = data; return data }
      await lib.createNote('u-1', { content: 'Note', keywords: ['Project', 'Zappy'] })
      assert.deepEqual(created.keywords, ['project', 'zappy'])
    })

    test('auto-extracts keywords when none provided', async () => {
      let created = null
      Note.create = async (data) => { created = data; return data }
      await lib.createNote('u-1', { content: 'Meeting with client about project deadline' })
      assert.ok(Array.isArray(created.keywords))
      assert.ok(created.keywords.length > 0)
    })

    test('auto-extracts keywords when empty array provided', async () => {
      let created = null
      Note.create = async (data) => { created = data; return data }
      await lib.createNote('u-1', { content: 'Building something amazing today', keywords: [] })
      assert.ok(created.keywords.length > 0)
    })
  })

  describe('findNoteByIdAndUser', () => {
    test('returns note when found', async () => {
      Note.findOne = async ({ where }) => {
        assert.equal(where.id, 'n-1')
        assert.equal(where.user_id, 'u-1')
        return { id: 'n-1' }
      }
      const result = await lib.findNoteByIdAndUser('n-1', 'u-1')
      assert.ok(result)
    })

    test('returns null when not found', async () => {
      Note.findOne = async () => null
      const result = await lib.findNoteByIdAndUser('n-x', 'u-1')
      assert.equal(result, null)
    })
  })

  describe('deleteNote', () => {
    test('calls destroy on note instance', async () => {
      let destroyed = false
      const note = { id: 'n-1', destroy: async () => { destroyed = true } }
      await lib.deleteNote(note)
      assert.equal(destroyed, true)
    })
  })
})
