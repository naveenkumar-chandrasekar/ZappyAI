import 'dotenv/config'
import { buildApp } from '../src/app.js'
import UserModel from '../src/models/User.js'
import PersonModel from '../src/models/Person.js'
import TaskModel from '../src/models/Task.js'
import NoteModel from '../src/models/Note.js'
import ConversationModel from '../src/models/Conversation.js'
import OtpCodeModel from '../src/models/OtpCode.js'
import { sequelize } from '../src/db/index.js'
import { setProcessMessage, setBuildDailySummary, resetRegistry } from '../src/services/registry.js'

// ── In-memory store ───────────────────────────────────────────────────────────

export function createStore() {
  let seq = 1
  const uid = () => `00000000-0000-0000-0000-${String(seq++).padStart(12, '0')}`
  const store = {
    users: [],
    persons: [],
    tasks: [],
    notes: [],
    conversations: [],
    otp_codes: [],
  }
  return { store, uid }
}

// ── Instance factory ──────────────────────────────────────────────────────────

function makeInstance(data, storeArr) {
  const inst = { ...data }
  inst.update = async function(values) {
    Object.assign(inst, values)
    const idx = storeArr.findIndex(r => r.id === inst.id)
    if (idx !== -1) Object.assign(storeArr[idx], values)
    return inst
  }
  inst.save = async function() {
    const idx = storeArr.findIndex(r => r.id === inst.id)
    if (idx !== -1) Object.assign(storeArr[idx], inst)
    return inst
  }
  inst.destroy = async function() {
    const idx = storeArr.findIndex(r => r.id === inst.id)
    if (idx !== -1) storeArr.splice(idx, 1)
  }
  return inst
}

// ── Model stubs ───────────────────────────────────────────────────────────────

export function stubModels(store, uid) {
  const patches = []

  function patch(obj, method, impl) {
    const original = obj[method]
    obj[method] = impl
    patches.push(() => { obj[method] = original })
  }

  // ── OtpCode ──────────────────────────────────────────────────────────────
  patch(OtpCodeModel, 'create', async (data) => {
    const row = { id: uid(), ...data, created_at: new Date() }
    store.otp_codes.push(row)
    return makeInstance(row, store.otp_codes)
  })
  patch(OtpCodeModel, 'findOne', async ({ where }) => {
    const { mobile_number, code, used, expires_at } = where
    // Op.gt is a Symbol with description 'gt' — find it dynamically
    let gtDate = new Date(0)
    if (expires_at && typeof expires_at === 'object') {
      const gtSym = Object.getOwnPropertySymbols(expires_at).find(s => s.description === 'gt')
      if (gtSym) gtDate = expires_at[gtSym]
    }
    const row = store.otp_codes.slice().reverse().find(o =>
      o.mobile_number === mobile_number &&
      o.code === code &&
      o.used === (used ?? false) &&
      new Date(o.expires_at) > gtDate
    )
    return row ? makeInstance(row, store.otp_codes) : null
  })

  // ── User ──────────────────────────────────────────────────────────────────
  patch(UserModel, 'create', async (data) => {
    const row = { id: uid(), settings: {}, created_at: new Date(), ...data }
    store.users.push(row)
    return makeInstance(row, store.users)
  })
  patch(UserModel, 'findOne', async ({ where }) => {
    const row = store.users.find(u =>
      Object.entries(where).every(([k, v]) => u[k] === v)
    )
    return row ? makeInstance(row, store.users) : null
  })
  patch(UserModel, 'findByPk', async (id, opts) => {
    const row = store.users.find(u => u.id === id)
    if (!row) return null
    const attrs = opts?.attributes
    if (attrs) {
      const picked = {}
      for (const k of attrs) picked[k] = row[k]
      return makeInstance(picked, store.users)
    }
    return makeInstance(row, store.users)
  })
  patch(UserModel, 'update', async (values, { where }) => {
    store.users.forEach(u => {
      if (Object.entries(where).every(([k, v]) => u[k] === v)) Object.assign(u, values)
    })
    return [1]
  })
  patch(UserModel, 'findAll', async ({ attributes } = {}) => {
    return store.users.map(u => {
      if (attributes) {
        const picked = {}
        for (const k of attributes) picked[k] = u[k]
        return makeInstance(picked, store.users)
      }
      return makeInstance(u, store.users)
    })
  })

  // ── Person ────────────────────────────────────────────────────────────────
  patch(PersonModel, 'create', async (data) => {
    const row = { id: uid(), custom_fields: {}, is_owner: false, created_at: new Date(), ...data }
    store.persons.push(row)
    return makeInstance(row, store.persons)
  })
  patch(PersonModel, 'findAll', async ({ where, order } = {}) => {
    let rows = store.persons.filter(p => {
      if (!where) return true
      return Object.entries(where).every(([k, v]) => p[k] === v)
    })
    if (order) {
      rows = [...rows].sort((a, b) => {
        const [field, dir] = order[0]
        if (a[field] < b[field]) return dir === 'ASC' ? -1 : 1
        if (a[field] > b[field]) return dir === 'ASC' ? 1 : -1
        return 0
      })
    }
    return rows.map(r => makeInstance(r, store.persons))
  })
  patch(PersonModel, 'findOne', async ({ where }) => {
    const row = store.persons.find(p =>
      Object.entries(where).every(([k, v]) => p[k] === v)
    )
    return row ? makeInstance(row, store.persons) : null
  })
  patch(PersonModel, 'update', async (values, { where }) => {
    store.persons.forEach(p => {
      if (Object.entries(where).every(([k, v]) => p[k] === v)) Object.assign(p, values)
    })
    return [1]
  })
  patch(PersonModel, 'findOrCreate', async ({ where, defaults }) => {
    let row = store.persons.find(p => Object.entries(where).every(([k, v]) => p[k] === v))
    if (row) return [makeInstance(row, store.persons), false]
    row = { id: uid(), created_at: new Date(), ...where, ...defaults }
    store.persons.push(row)
    return [makeInstance(row, store.persons), true]
  })

  // ── Task ──────────────────────────────────────────────────────────────────
  patch(TaskModel, 'create', async (data) => {
    const row = { id: uid(), completed: false, created_at: new Date(), ...data }
    store.tasks.push(row)
    return makeInstance(row, store.tasks)
  })
  patch(TaskModel, 'findAll', async ({ where, include } = {}) => {
    let rows = store.tasks.filter(t => {
      if (!where) return true
      for (const [k, v] of Object.entries(where)) {
        if (k === 'completed' && t[k] !== v) return false
        if (k === 'user_id' && t[k] !== v) return false
      }
      return true
    })
    return rows.map(t => {
      const inst = makeInstance(t, store.tasks)
      if (include) {
        const person = store.persons.find(p => p.id === t.person_id)
        inst.Person = person
          ? {
              id: person.id,
              name: person.name,
              birthday: person.birthday,
              priority: person.priority,
              is_owner: person.is_owner,
            }
          : null
      }
      return inst
    })
  })
  patch(TaskModel, 'findOne', async ({ where, include } = {}) => {
    const row = store.tasks.find(t =>
      Object.entries(where).every(([k, v]) => t[k] === v)
    )
    if (!row) return null
    const inst = makeInstance(row, store.tasks)
    if (include) {
      const person = store.persons.find(p => p.id === row.person_id)
      inst.Person = person
        ? {
            id: person.id,
            name: person.name,
            birthday: person.birthday,
            priority: person.priority,
            is_owner: person.is_owner,
          }
        : null
    }
    return inst
  })

  // ── Note ──────────────────────────────────────────────────────────────────
  patch(NoteModel, 'create', async (data) => {
    const row = { id: uid(), keywords: [], created_at: new Date(), ...data }
    store.notes.push(row)
    return makeInstance(row, store.notes)
  })
  patch(NoteModel, 'findAll', async ({ where, order } = {}) => {
    let rows = store.notes
    if (where?.user_id) rows = rows.filter(n => n.user_id === where.user_id)
    if (where?._keyword) {
      const needle = where._keyword
      rows = rows.filter(n =>
        n.content.toLowerCase().includes(needle) ||
        (n.keywords || []).some(k => k.includes(needle))
      )
    }
    return rows.map(r => makeInstance(r, store.notes))
  })
  patch(NoteModel, 'findOne', async ({ where }) => {
    const row = store.notes.find(n =>
      Object.entries(where).every(([k, v]) => n[k] === v)
    )
    return row ? makeInstance(row, store.notes) : null
  })

  // ── Conversation ──────────────────────────────────────────────────────────
  function conversationRowMatches(c, where) {
    if (!where) return true
    if (where.user_id !== undefined && c.user_id !== where.user_id) return false
    if (where.created_at && typeof where.created_at === 'object') {
      for (const sym of Object.getOwnPropertySymbols(where.created_at)) {
        const val = where.created_at[sym]
        const t = new Date(c.created_at).getTime()
        if (sym.description === 'lt' && !(t < new Date(val).getTime())) return false
        if (sym.description === 'lte' && !(t <= new Date(val).getTime())) return false
        if (sym.description === 'gt' && !(t > new Date(val).getTime())) return false
        if (sym.description === 'gte' && !(t >= new Date(val).getTime())) return false
      }
    }
    return Object.entries(where).every(([k, v]) => {
      if (k === 'created_at' && v && typeof v === 'object') return true
      return c[k] === v
    })
  }

  patch(ConversationModel, 'create', async (data) => {
    const row = { id: uid(), created_at: new Date(), ...data }
    store.conversations.push(row)
    return makeInstance(row, store.conversations)
  })
  patch(ConversationModel, 'findAll', async ({ where, limit, offset, order } = {}) => {
    let rows = store.conversations.filter(c => conversationRowMatches(c, where))
    if (order) {
      rows = [...rows].sort((a, b) => {
        const [field, dir] = order[0]
        const aVal = new Date(a[field])
        const bVal = new Date(b[field])
        return dir === 'ASC' ? aVal - bVal : bVal - aVal
      })
    }
    if (offset !== undefined) rows = rows.slice(offset)
    if (limit !== undefined) rows = rows.slice(0, limit)
    return rows.map(r => makeInstance(r, store.conversations))
  })
  patch(ConversationModel, 'count', async ({ where } = {}) => {
    return store.conversations.filter(c => conversationRowMatches(c, where)).length
  })

  return () => patches.forEach(r => r())
}

// ── Build test app ────────────────────────────────────────────────────────────

export async function buildTestApp() {
  const { store, uid } = createStore()
  const restoreModels = stubModels(store, uid)

  // Stub sequelize.query so health check doesn't need a real DB
  const origQuery = sequelize.query.bind(sequelize)
  sequelize.query = async () => [[{ '?column?': 1 }]]

  // Inject stubs via registry (avoids ESM read-only export mutation)
  setProcessMessage(async () => ({
    reply: 'I can help you with tasks, notes, and contacts.',
  }))
  setBuildDailySummary(async () => null)

  const app = await buildApp({ logger: false })
  await app.ready()

  const cleanup = () => {
    restoreModels()
    sequelize.query = origQuery
    resetRegistry()
  }

  return { app, store, cleanup }
}

export async function getAuthToken(app, store, mobile = '+19995550001') {
  const expires = new Date(Date.now() + 60_000)
  const uid = () => `00000000-0000-0000-0000-${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`
  store.otp_codes.push({
    id: uid(),
    mobile_number: mobile,
    code: '123456',
    expires_at: expires,
    used: false,
    created_at: new Date(),
  })

  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/verify-otp',
    payload: { mobile_number: mobile, code: '123456' },
  })

  const body = JSON.parse(res.body)
  return { token: body.token, userId: body.userId }
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` }
}
