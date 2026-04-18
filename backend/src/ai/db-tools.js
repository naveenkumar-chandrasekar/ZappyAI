import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const SCHEMA = `
Tables available to you. The current user's id is always passed as the first param ($1).

tasks
  id           UUID PK
  user_id      UUID FK → users
  person_id    UUID FK → persons (nullable)
  title        TEXT NOT NULL
  description  TEXT
  due_at       TIMESTAMPTZ
  status       TEXT  ('Pending' | 'Completed')
  completed    BOOLEAN  (mirrors status — set status only)
  created_at   TIMESTAMPTZ

notes
  id           UUID PK
  user_id      UUID FK → users
  content      TEXT NOT NULL
  keywords     TEXT[]
  created_at   TIMESTAMPTZ

persons
  id           UUID PK
  user_id      UUID FK → users
  name         TEXT NOT NULL
  birthday     DATE (nullable)
  priority     TEXT  ('High' | 'Medium' | 'Low')
  custom_fields JSONB
  is_owner     BOOLEAN  (true = the account owner, false = contacts)
  created_at   TIMESTAMPTZ

reminders
  id           UUID PK
  user_id      UUID FK → users
  task_id      UUID FK → tasks (nullable)
  type         TEXT NOT NULL  (short label, e.g. "Call dentist")
  scheduled_at TIMESTAMPTZ NOT NULL
  sent         BOOLEAN DEFAULT false
  created_at   TIMESTAMPTZ

users
  id           UUID PK
  name         TEXT
  mobile_number TEXT UNIQUE
  settings     JSONB

RULES:
- Always filter by user_id = $1 (the first param is always the current user id).
- Never query otp_codes.
- For tasks: when updating status use 'Pending' or 'Completed'. Do not set completed manually.
- For persons: is_owner = false means contacts. is_owner = true is the user's own profile row.
- Use $1, $2 … positional params. Pass them in the params array in order.
- Use RETURNING * on INSERT and UPDATE statements to get the affected row back.
- gen_random_uuid() generates a new UUID — use it for id columns on INSERT.
`.trim()

const DDL = /^\s*(DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|VACUUM|COPY)\b/i
const WRITE = /^\s*(INSERT|UPDATE|DELETE)\b/i
const READ = /^\s*SELECT\b/i
const DENIED = ['otp_codes']

function assertSafe(sql, mode) {
  if (typeof sql !== 'string' || !sql.trim()) throw new Error('sql must be a non-empty string.')
  if (DDL.test(sql)) throw new Error('DDL statements are not allowed.')
  if (mode === 'read' && !READ.test(sql)) throw new Error('Only SELECT allowed in read mode.')
  if (mode === 'write' && !WRITE.test(sql)) throw new Error('Only INSERT/UPDATE/DELETE allowed in write mode.')
  for (const t of DENIED) {
    if (new RegExp(`\\b${t}\\b`, 'i').test(sql)) throw new Error(`Table "${t}" is not accessible.`)
  }
  const core = sql.trim().replace(/;+\s*$/, '')
  if (/;/.test(core)) throw new Error('Only one statement at a time.')
}

export const TOOLS_OPENAI = [
  {
    type: 'function',
    function: {
      name: 'get_schema',
      description: 'Returns the database schema and rules. Call this first if you are unsure about table structure.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_db',
      description: 'Run a SELECT query to read data. Always pass the current user id as $1.',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'Parameterized SELECT statement. Use $1 for user_id.' },
          params: { type: 'array', items: { type: 'string' }, description: 'Pass "<userId>" as first param for user_id.' },
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mutate_db',
      description: 'Run an INSERT, UPDATE, or DELETE statement. Always include user_id = $1.',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'Parameterized INSERT/UPDATE/DELETE. Use $1 for user_id.' },
          params: { type: 'array', items: { type: 'string' }, description: 'Pass "<userId>" as first param for user_id.' },
        },
        required: ['sql'],
      },
    },
  },
]

export const TOOLS = [
  {
    name: 'get_schema',
    description: 'Returns the database schema and rules. Call this first if you are unsure about table structure.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'query_db',
    description: 'Run a SELECT query to read data. Always pass the current user id as $1.',
    input_schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'Parameterized SELECT statement. Use $1 for user_id, $2… for other values.' },
        params: { type: 'array', items: {}, description: 'Query parameters. First param ($1) must be "<userId>".' },
      },
      required: ['sql'],
    },
  },
  {
    name: 'mutate_db',
    description: 'Run an INSERT, UPDATE, or DELETE statement. Always include user_id = $1 in the WHERE or VALUES.',
    input_schema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'Parameterized INSERT/UPDATE/DELETE. Use $1 for user_id.' },
        params: { type: 'array', items: {}, description: 'Parameters in order. Pass "<userId>" as the user_id placeholder.' },
      },
      required: ['sql'],
    },
  },
]

const USER_ID_PLACEHOLDER = /^(<userId>|USER_ID_HERE|<user_id>)$/i
const USER_ID_IN_SQL = /'?<userId>'?|'?USER_ID_HERE'?|'?<user_id>'?/gi

function resolveParams(rawParams, userId) {
  if (!Array.isArray(rawParams)) return []
  return rawParams.map(p =>
    typeof p === 'string' && USER_ID_PLACEHOLDER.test(p.trim()) ? userId : p
  )
}

function resolveSql(sql, userId) {
  return sql.replace(USER_ID_IN_SQL, `'${userId}'`)
}

export async function executeTool(name, input, userId) {
  try {
    switch (name) {

      case 'get_schema':
        return { schema: SCHEMA }

      case 'query_db': {
        const { sql: rawSql, params: rawParams = [] } = input
        assertSafe(rawSql, 'read')
        const sql = resolveSql(rawSql, userId)
        const params = resolveParams(rawParams, userId)

        const hasUserInSql = sql.includes(userId)
        const hasUserInParams = params.some(p => String(p) === userId)
        if (!hasUserInSql && !hasUserInParams) {
          return { error: `Query must be scoped to the current user. Pass "<userId>" as $1.` }
        }

        const rows = await sequelize.query(sql, { bind: params.length ? params : undefined, type: QueryTypes.SELECT })
        return { rows: Array.isArray(rows) ? rows : [], count: Array.isArray(rows) ? rows.length : 0 }
      }

      case 'mutate_db': {
        const { sql: rawSql, params: rawParams = [] } = input
        assertSafe(rawSql, 'write')
        const sql = resolveSql(rawSql, userId)
        const params = resolveParams(rawParams, userId)

        const hasUserInSql = sql.includes(userId)
        const hasUserInParams = params.some(p => String(p) === userId)
        if (!hasUserInSql && !hasUserInParams) {
          return { error: `Mutation must include the current user_id for safety. Pass "<userId>" as $1.` }
        }

        const [rows, meta] = await sequelize.query(sql, { bind: params.length ? params : undefined })

        if (/\btasks\b/i.test(sql)) {
          await sequelize.query(
            `UPDATE tasks SET completed = (status = 'Completed') WHERE user_id = $1`,
            { bind: [userId] }
          )
        }

        return {
          success: true,
          affected: meta?.rowCount ?? (Array.isArray(rows) ? rows.length : 0),
          rows: Array.isArray(rows) ? rows : [],
        }
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    console.error(`[Tool:${name}]`, err.message)
    return { error: err.message }
  }
}
