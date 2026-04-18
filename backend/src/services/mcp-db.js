import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { executeTool } from '../ai/db-tools.js'

function toMcpPayload(result) {
  if (result.error) {
    return { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true }
  }
  if (result.schema !== undefined) {
    return { content: [{ type: 'text', text: result.schema }] }
  }
  if (result.rows !== undefined) {
    return { content: [{ type: 'text', text: JSON.stringify({ rows: result.rows, count: result.count }) }] }
  }
  if (result.success) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            affected: result.affected,
            rows: result.rows,
          }),
        },
      ],
    }
  }
  return { content: [{ type: 'text', text: JSON.stringify(result) }] }
}

export function createDbMcpServer(userId) {
  const getSchema = tool(
    'get_schema',
    'Returns the database schema and rules. Call this first if unsure about table structure.',
    {},
    async () => {
      const result = await executeTool('get_schema', {}, userId)
      return toMcpPayload(result)
    },
    { annotations: { readOnlyHint: true, idempotentHint: true } }
  )

  const queryDb = tool(
    'query_db',
    'Run a SELECT query to read data. Always pass "<userId>" as the first param for user_id filtering.',
    {
      sql: z.string().describe('Parameterized SELECT. Use $1 for user_id, $2+ for other values.'),
      params: z
        .array(z.unknown())
        .optional()
        .default([])
        .describe('Params in order. Pass "<userId>" as first element for user_id.'),
    },
    async (args) => {
      const result = await executeTool(
        'query_db',
        { sql: args.sql, params: args.params ?? [] },
        userId
      )
      if (result.error) {
        console.error('[MCP:query_db]', result.error)
      } else {
        console.log(`[MCP:query_db] ${result.count} rows`)
      }
      return toMcpPayload(result)
    },
    { annotations: { readOnlyHint: true } }
  )

  const mutateDb = tool(
    'mutate_db',
    'Run an INSERT, UPDATE, or DELETE. Always include user_id = $1 in WHERE or VALUES.',
    {
      sql: z.string().describe('Parameterized INSERT/UPDATE/DELETE. Use $1 for user_id.'),
      params: z
        .array(z.unknown())
        .optional()
        .default([])
        .describe('Params in order. Pass "<userId>" as first element for user_id.'),
    },
    async (args) => {
      const result = await executeTool(
        'mutate_db',
        { sql: args.sql, params: args.params ?? [] },
        userId
      )
      if (result.error) {
        console.error('[MCP:mutate_db]', result.error)
      } else if (result.success) {
        console.log(`[MCP:mutate_db] affected=${result.affected}`)
      }
      return toMcpPayload(result)
    }
  )

  return createSdkMcpServer({
    name: 'zappy-db',
    version: '1.0.0',
    tools: [getSchema, queryDb, mutateDb],
  })
}
