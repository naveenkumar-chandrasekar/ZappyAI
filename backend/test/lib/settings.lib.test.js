import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import User from '../../src/models/User.js'
import Person from '../../src/models/Person.js'

describe('settings.lib', () => {
  let lib

  beforeEach(async () => {
    lib = await import('../../src/lib/settings.lib.js')
  })

  describe('getUserSettings', () => {
    test('calls findByPk with correct attributes', async () => {
      User.findByPk = async (id, opts) => {
        assert.equal(id, 'u-1')
        assert.ok(opts.attributes.includes('settings'))
        assert.ok(opts.attributes.includes('name'))
        return { id, settings: {}, name: 'Alice', mobile_number: '+1', created_at: new Date() }
      }
      const result = await lib.getUserSettings('u-1')
      assert.ok(result)
    })

    test('returns null when user not found', async () => {
      User.findByPk = async () => null
      const result = await lib.getUserSettings('u-x')
      assert.equal(result, null)
    })
  })

  describe('updateUserSettings', () => {
    test('returns null when user not found', async () => {
      User.findByPk = async () => null
      const result = await lib.updateUserSettings('u-x', { name: 'Test' })
      assert.equal(result, null)
    })

    test('updates name on user', async () => {
      const user = { id: 'u-1', name: null, settings: {}, save: async function() { return this } }
      User.findByPk = async () => user
      Person.update = async () => [1]
      await lib.updateUserSettings('u-1', { name: 'Alice' })
      assert.equal(user.name, 'Alice')
    })

    test('merges settings', async () => {
      const user = { id: 'u-1', name: 'Bob', settings: { theme: 'light' }, save: async function() { return this } }
      User.findByPk = async () => user
      Person.update = async () => [1]
      await lib.updateUserSettings('u-1', { settings: { summary_time: '09:00' } })
      assert.equal(user.settings.theme, 'light')
      assert.equal(user.settings.summary_time, '09:00')
    })

    test('updates owner person name when name changes', async () => {
      let personUpdateCalled = false
      const user = { id: 'u-1', name: null, settings: {}, save: async function() { return this } }
      User.findByPk = async () => user
      Person.update = async (values, { where }) => {
        assert.equal(values.name, 'Carol')
        assert.equal(where.is_owner, true)
        personUpdateCalled = true
        return [1]
      }
      await lib.updateUserSettings('u-1', { name: 'Carol' })
      assert.equal(personUpdateCalled, true)
    })

    test('does not call Person.update when only settings change', async () => {
      let personUpdateCalled = false
      const user = { id: 'u-1', name: 'Bob', settings: {}, save: async function() { return this } }
      User.findByPk = async () => user
      Person.update = async () => { personUpdateCalled = true; return [1] }
      await lib.updateUserSettings('u-1', { settings: { theme: 'dark' } })
      assert.equal(personUpdateCalled, false)
    })
  })
})
