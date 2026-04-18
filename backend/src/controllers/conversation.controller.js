import { Conversation } from '../models/index.js'
import { processMessage } from '../services/registry.js'
import { Op } from 'sequelize'

const MAX_LIMIT = 50
const DEFAULT_LIMIT = 30

export async function list(request, reply) {
  const { userId } = request.user
  const limit = Math.min(parseInt(request.query.limit ?? DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, MAX_LIMIT)
  const before = request.query.before

  const where = { user_id: userId }
  if (before) {
    const ts = new Date(before)
    if (!isNaN(ts.getTime())) where.created_at = { [Op.lt]: ts }
  }

  const rows = await Conversation.findAll({
    where,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    limit: limit + 1,
  })

  const has_more = rows.length > limit
  const data = rows.slice(0, limit).reverse()

  return reply.code(200).send({ data, has_more })
}

export async function clearHistory(request, reply) {
  const { userId } = request.user
  await Conversation.destroy({ where: { user_id: userId } })
  return reply.code(200).send({ ok: true })
}

export async function sendMessage(request, reply) {
  const { userId } = request.user
  const message = request.body?.message?.trim()

  if (!message) return reply.code(400).send({ error: 'message is required' })

  // Save AFTER processMessage so history loaded inside doesn't include this message yet
  const replyText = await processMessage(userId, message)

  // Sequential saves to guarantee created_at ordering (Promise.all gives same timestamp)
  const userRow = await Conversation.create({ user_id: userId, role: 'user', message })
  const assistantRow = await Conversation.create({ user_id: userId, role: 'assistant', message: replyText })

  return reply.code(200).send({ messages: [userRow, assistantRow] })
}
