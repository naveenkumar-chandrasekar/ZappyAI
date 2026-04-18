import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { isVagueTaskCreationMessage, executeTool } from '../src/services/db_tools.js'

const uid = '11111111-1111-1111-1111-111111111111'

describe('isVagueTaskCreationMessage', () => {
  test('true when no title given', () => {
    assert.equal(isVagueTaskCreationMessage('create a task'), true)
    assert.equal(isVagueTaskCreationMessage('Create a task.'), true)
    assert.equal(isVagueTaskCreationMessage('new task'), true)
    assert.equal(isVagueTaskCreationMessage('add a task please'), true)
    assert.equal(isVagueTaskCreationMessage('make a task…'), true)
  })

  test('false when user gave a subject', () => {
    assert.equal(isVagueTaskCreationMessage('create a task buy milk'), false)
    assert.equal(isVagueTaskCreationMessage('create a task to call mom'), false)
  })
})

describe('executeTool denied tables', () => {
  test('rejects otp_codes', async () => {
    const r = await executeTool(
      { tool: 'query_db', sql: 'SELECT id FROM otp_codes LIMIT 1', params: [] },
      uid
    )
    assert.ok(r.error)
    assert.match(String(r.error), /otp_codes|cannot be accessed/i)
  })
})

describe('executeTool INSERT tasks + vague message', () => {
  test('returns error without hitting DB', async () => {
    const r = await executeTool(
      {
        tool: 'mutate_db',
        sql:
          "INSERT INTO tasks (user_id, title, description, due_at, status, completed) VALUES ($1, $2, $3, $4, 'Pending', false)",
        params: [uid, 'Buy birthday gift', null, null],
      },
      uid,
      { lastUserMessage: 'create a task' }
    )
    assert.ok(r.error)
    assert.match(r.error, /MISSING_TASK_TITLE/)
  })
})
