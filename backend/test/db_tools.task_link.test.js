import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getTaskLinkTokens } from '../src/services/db_tools.js'

describe('getTaskLinkTokens', () => {
  it('gift-for + last clause', () => {
    assert.deepStrictEqual(
      getTaskLinkTokens('create a task for buying the gift for Ramya C'),
      ['Ramya']
    )
  })
  it('gift for Alex J', () => {
    assert.deepStrictEqual(getTaskLinkTokens('buying the gift for Alex J'), ['Alex'])
  })
  it('for my friend Sarah', () => {
    assert.deepStrictEqual(getTaskLinkTokens('add task for my friend Sarah'), ['friend', 'Sarah'])
  })
})
