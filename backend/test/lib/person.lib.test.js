import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Person from '../../src/models/Person.js'

describe('person.lib', () => {
  let lib

  beforeEach(async () => {
    lib = await import('../../src/lib/person.lib.js')
  })

  describe('listPersons', () => {
    test('calls findAll with user_id and name order', async () => {
      const rows = [{ id: 'p-1', name: 'Alice' }]
      Person.findAll = async ({ where, order }) => {
        assert.equal(where.user_id, 'u-1')
        assert.deepEqual(order, [['name', 'ASC']])
        return rows
      }
      const result = await lib.listPersons('u-1')
      assert.equal(result.length, 1)
    })
  })

  describe('createPerson', () => {
    test('creates person with defaults', async () => {
      let created = null
      Person.create = async (data) => { created = data; return { id: 'p-new', ...data } }
      await lib.createPerson('u-1', { name: 'Bob', birthday: '1990-01-01' })
      assert.equal(created.priority, 'Medium')
      assert.deepEqual(created.custom_fields, {})
    })

    test('uses provided priority', async () => {
      let created = null
      Person.create = async (data) => { created = data; return data }
      await lib.createPerson('u-1', { name: 'Carol', birthday: '1990-01-01', priority: 'High' })
      assert.equal(created.priority, 'High')
    })
  })

  describe('findPersonByIdAndUser', () => {
    test('calls findOne with id and user_id', async () => {
      Person.findOne = async ({ where }) => {
        assert.equal(where.id, 'p-1')
        assert.equal(where.user_id, 'u-1')
        return { id: 'p-1' }
      }
      const result = await lib.findPersonByIdAndUser('p-1', 'u-1')
      assert.ok(result)
    })

    test('returns null when not found', async () => {
      Person.findOne = async () => null
      const result = await lib.findPersonByIdAndUser('p-x', 'u-1')
      assert.equal(result, null)
    })
  })

  describe('updatePerson', () => {
    test('calls update on the person instance', async () => {
      let updated = null
      const person = { id: 'p-1', update: async (v) => { updated = v; return { ...person, ...v } } }
      await lib.updatePerson(person, { name: 'Dave' })
      assert.equal(updated.name, 'Dave')
    })
  })

  describe('deletePerson', () => {
    test('calls destroy on the person instance', async () => {
      let destroyed = false
      const person = { id: 'p-1', destroy: async () => { destroyed = true } }
      await lib.deletePerson(person)
      assert.equal(destroyed, true)
    })
  })
})
