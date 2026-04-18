import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  userMessageRequiresDataTools,
  userMessageRequiresTaskMutation,
  extractTitleSearchForCompleteIntent,
  extractTitleSearchForReopenIntent,
} from '../src/services/assistant.js'

describe('userMessageRequiresDataTools', () => {
  it('true for complete task', () => {
    assert.equal(userMessageRequiresDataTools('complete the task Buy gift for Ramya'), true)
  })
  it('true without the word task (gift / for)', () => {
    assert.equal(userMessageRequiresDataTools('Mark Buy gift for Ramya as done'), true)
  })
  it('true for verify pending', () => {
    assert.equal(userMessageRequiresDataTools(`Please verify it's still in pending`), true)
  })
  it('false for short thanks', () => {
    assert.equal(userMessageRequiresDataTools('thanks'), false)
  })
})

describe('userMessageRequiresTaskMutation', () => {
  it('true for gift title completion without task keyword', () => {
    assert.equal(userMessageRequiresTaskMutation('complete buy gift for Ramya'), true)
  })
  it('true for move this task to pending', () => {
    assert.equal(
      userMessageRequiresTaskMutation('Buy gift for Ramya move this task to pending'),
      true
    )
  })
  it('false for list-only', () => {
    assert.equal(userMessageRequiresTaskMutation('show my tasks'), false)
  })
  it('false for list all tasks', () => {
    assert.equal(userMessageRequiresTaskMutation('list all the tasks'), false)
  })
})

describe('extractTitleSearchForCompleteIntent', () => {
  it('captures title after “complete the task”', () => {
    assert.equal(
      extractTitleSearchForCompleteIntent('complete the task Buy gift for Ramya'),
      'Buy gift for Ramya'
    )
  })
})

describe('extractTitleSearchForReopenIntent', () => {
  it('captures leading title before move this task to pending', () => {
    assert.equal(
      extractTitleSearchForReopenIntent('Buy gift for Ramya move this task to pending'),
      'Buy gift for Ramya'
    )
  })
  it('captures reopen the task …', () => {
    assert.equal(
      extractTitleSearchForReopenIntent('reopen the task Buy gift for Ramya'),
      'Buy gift for Ramya'
    )
  })
})
