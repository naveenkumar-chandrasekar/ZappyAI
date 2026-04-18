import { User, Task } from '../models/index.js'
import { sequelize } from '../db/index.js'
import { Op } from 'sequelize'

export async function buildDailySummary(userId) {
  const user = await User.findByPk(userId, { attributes: ['name', 'settings'] })
  if (!user) return null

  const { name, settings } = user
  const leadDays = settings?.birthday_lead_days ?? 7

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const tasks = await Task.findAll({
    where: {
      user_id: userId,
      status: 'Pending',
      [Op.or]: [{ due_at: null }, { due_at: { [Op.lte]: todayEnd } }],
    },
    order: [['due_at', 'ASC NULLS LAST']],
    limit: 20,
  })

  const birthdays = await sequelize.query(
    `SELECT name, birthday,
       (DATE_TRUNC('year', CURRENT_DATE) +
        (EXTRACT(MONTH FROM birthday) - 1 || ' months')::INTERVAL +
        (EXTRACT(DAY FROM birthday) - 1 || ' days')::INTERVAL
       )::DATE AS bday_this_year
     FROM persons
     WHERE user_id = :userId
       AND birthday IS NOT NULL
       AND (
         DATE_TRUNC('year', CURRENT_DATE) +
         (EXTRACT(MONTH FROM birthday) - 1 || ' months')::INTERVAL +
         (EXTRACT(DAY FROM birthday) - 1 || ' days')::INTERVAL
       )::DATE BETWEEN CURRENT_DATE AND CURRENT_DATE + (:leadDays || ' days')::INTERVAL
     ORDER BY bday_this_year`,
    { replacements: { userId, leadDays }, type: 'SELECT' }
  )

  if (!tasks.length && !birthdays.length) return null

  const now = new Date()
  const lines = [`Good morning${name ? `, ${name}` : ''}! Here's your daily summary:`]
  lines.push('')

  if (tasks.length) {
    lines.push(`Pending Tasks (${tasks.length}):`)
    for (const task of tasks) {
      const due = task.due_at ? ` - due ${new Date(task.due_at).toLocaleDateString()}` : ''
      lines.push(`- ${task.title}${due}`)
    }
  }

  if (birthdays.length) {
    if (tasks.length) lines.push('')
    lines.push('Upcoming Birthdays:')
    for (const person of birthdays) {
      const bdayThisYear = new Date(person.bday_this_year + 'T00:00:00')
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const daysUntil = Math.round((bdayThisYear - todayMidnight) / (1000 * 60 * 60 * 24))
      const when = daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`
      lines.push(`- ${person.name}: ${when}`)
    }
  }

  return lines.join('\n')
}
