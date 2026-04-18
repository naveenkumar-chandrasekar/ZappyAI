import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { presentPerson, presentPersonList } from '../../src/presenters/person.presenter.js'

const sample = {
  id: 'p-1',
  user_id: 'u-1',
  name: 'Alice',
  birthday: '1990-05-15',
  priority: 'High',
  custom_fields: { email: 'alice@example.com' },
  is_owner: false,
  created_at: new Date('2026-01-01'),
  dataValues: { extra: 'stripped' },
  _previousDataValues: {},
}

describe('presentPerson', () => {
  test('returns correct shape', () => {
    const p = presentPerson(sample)
    assert.equal(p.id, 'p-1')
    assert.equal(p.user_id, 'u-1')
    assert.equal(p.name, 'Alice')
    assert.equal(p.birthday, '1990-05-15')
    assert.equal(p.priority, 'High')
    assert.deepEqual(p.custom_fields, { email: 'alice@example.com' })
    assert.equal(p.is_owner, false)
    assert.ok(p.created_at)
  })

  test('does not include Sequelize internals', () => {
    const p = presentPerson(sample)
    assert.equal(p.dataValues, undefined)
    assert.equal(p._previousDataValues, undefined)
  })
})

describe('presentPersonList', () => {
  test('maps array correctly', () => {
    const list = presentPersonList([sample, { ...sample, id: 'p-2', name: 'Bob' }])
    assert.equal(list.length, 2)
    assert.equal(list[1].name, 'Bob')
  })

  test('returns empty array for empty input', () => {
    assert.deepEqual(presentPersonList([]), [])
  })
})
