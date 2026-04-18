import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeAssistantReply } from '../src/services/assistant.js'

describe('sanitizeAssistantReply', () => {
  test('strips markdown bold', () => {
    const out = sanitizeAssistantReply('Done. **Title:** Buy milk')
    assert.ok(!out.includes('**'))
    assert.match(out, /Title:/)
  })

  test('removes task id, field lines, and completed', () => {
    const raw = `I've created a task for you:

**Task ID:** 12345678
**Title:** Buy gift
**Due At:** 2026-04-03T12:00:00.000Z
**Completed:** FALSE

Enjoy.`
    const out = sanitizeAssistantReply(raw)
    assert.ok(!out.includes('12345678'))
    assert.ok(!out.includes('FALSE'))
    assert.ok(!out.includes('2026-04-03'))
    assert.ok(!out.includes('Buy gift'))
    assert.match(out, /Enjoy/)
  })

  test('person dump still collapses to friendly sentence', () => {
    const out = sanitizeAssistantReply(
      'Here: 1. id: b7b460c0-aff5-414a-892e-2ecd84d08afa, name: Jane, birthday: null'
    )
    assert.ok(!out.includes('b7b460c0'))
    assert.match(out, /Jane/)
  })

  test('replaces leaked SQL/tool lecture with a plain question', () => {
    const raw = `To create a task, I'll need to use the \`mutate_db\` tool. Here's the SQL statement:
\`\`\`json
{"tool": "mutate_db", "sql": "INSERT INTO tasks (user_id, title) VALUES ($1, $2)", "params": ["USER_ID_HERE", "Call dentist"]}
\`\`\`
Please provide the required parameters:
1. \`USER_ID_HERE\`: The current user's UUID
`
    const out = sanitizeAssistantReply(raw)
    assert.ok(!out.includes('mutate_db'))
    assert.ok(!out.includes('INSERT'))
    assert.ok(!out.includes('USER_ID_HERE'))
    assert.match(out, /What would you like to call this task/i)
  })
})
