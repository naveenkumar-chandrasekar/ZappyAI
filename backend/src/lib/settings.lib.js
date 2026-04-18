import { sequelize } from '../db/index.js'
import { User, Person } from '../models/index.js'

export async function getUserSettings(userId) {
  return User.findByPk(userId, {
    attributes: ['settings', 'name', 'mobile_number', 'created_at'],
  })
}

export async function updateUserSettings(userId, data) {
  const { name, settings } = data
  const user = await User.findByPk(userId)
  if (!user) return null

  if (name !== undefined) {
    user.name = name
  }
  if (settings !== undefined && typeof settings === 'object') {
    user.settings = { ...user.settings, ...settings }
  }
  await user.save()

  if (name !== undefined) {
    await Person.update({ name }, { where: { user_id: userId, is_owner: true } })
  }

  return user
}
