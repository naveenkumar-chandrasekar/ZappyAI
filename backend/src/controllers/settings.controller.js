import { validateUpdateSettings } from '../validators/settings.validator.js'
import * as settingsLib from '../lib/settings.lib.js'

export async function getSettings(request, reply) {
  const { userId } = request.user
  const user = await settingsLib.getUserSettings(userId)
  if (!user) return reply.code(404).send({ error: 'User not found' })
  return reply.code(200).send({
    settings: user.settings,
    name: user.name,
    mobile_number: user.mobile_number,
    created_at: user.created_at,
  })
}

export async function updateSettings(request, reply) {
  const { userId } = request.user
  let data
  try {
    data = validateUpdateSettings(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }

  const user = await settingsLib.updateUserSettings(userId, data)
  if (!user) return reply.code(404).send({ error: 'User not found' })

  return reply.code(200).send({
    settings: user.settings,
    name: user.name,
    mobile_number: user.mobile_number,
  })
}
