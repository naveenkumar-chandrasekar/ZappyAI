import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { presentTask, presentTaskList } from '../../src/presenters/task.presenter.js'

const sample = {
  id: 't-1',
  user_id: 'u-1',
  person_id: 'p-1',
  Person: { id: 'p-1', name: 'Alice', birthday: '1990-05-01', priority: 'High', is_owner: false },
  title: 'Buy milk',
  description: 'From the store',
  due_at: new Date('2026-04-10'),
  completed: false,
  created_at: new Date('2026-01-01'),
}

describe('presentTask', () => {
  test('returns correct shape', () => {
    const t = presentTask(sample)
    assert.equal(t.id, 't-1')
    assert.equal(t.user_id, 'u-1')
    assert.equal(t.person_id, 'p-1')
    assert.equal(t.person_name, 'Alice')
    assert.equal(t.person?.name, 'Alice')
    assert.equal(t.person?.id, 'p-1')
    assert.equal(t.title, 'Buy milk')
    assert.equal(t.description, 'From the store')
    assert.equal(t.completed, false)
    assert.ok(t.due_at)
    assert.ok(t.created_at)
  })

  test('person_name is null when no Person association', () => {
    const t = presentTask({ ...sample, Person: null })
    assert.equal(t.person_name, null)
    assert.equal(t.person, null)
  })

  test('maps In Progress status to Pending for Kanban', () => {
    const t = presentTask({ ...sample, status: 'In Progress', completed: false })
    assert.equal(t.status, 'Pending')
    assert.equal(t.completed, false)
  })

  test('syncs completed flag from Completed status', () => {
    const t = presentTask({ ...sample, status: 'Completed', completed: false })
    assert.equal(t.status, 'Completed')
    assert.equal(t.completed, true)
  })

  test('maps LLM typo Complete and synonyms to Completed', () => {
    assert.equal(presentTask({ ...sample, status: 'Complete', completed: false }).status, 'Completed')
    assert.equal(presentTask({ ...sample, status: 'done', completed: false }).status, 'Completed')
  })
})

describe('presentTaskList', () => {
  test('maps array correctly', () => {
    const list = presentTaskList([sample, { ...sample, id: 't-2', title: 'Other' }])
    assert.equal(list.length, 2)
    assert.equal(list[1].title, 'Other')
  })

  test('returns empty array for empty input', () => {
    assert.deepEqual(presentTaskList([]), [])
  })
})
