import { describe, it } from 'node:test'
import assert from 'node:assert'
import { isStructuredTool, invokeStructuredTool } from '../src/services/assistant/tools/index.js'

describe('structured tools registry', () => {
  it('recognizes task tools', () => {
    assert.equal(isStructuredTool('tasks_complete'), true)
    assert.equal(isStructuredTool('tasks_list'), true)
    assert.equal(isStructuredTool('query_db'), false)
  })

  it('returns error for unknown tool', async () => {
    const r = await invokeStructuredTool('unknown_x', {}, '00000000-0000-0000-0000-000000000000')
    assert.ok(r.error)
  })
})
