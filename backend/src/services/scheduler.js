import cron from 'node-cron'
import { sendMessage } from './whatsapp.js'
import { User } from '../models/index.js'
import { sequelize } from '../db/index.js'
import { buildDailySummary } from './registry.js'

export function startScheduler() {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    console.log('[Scheduler] Disabled (DISABLE_SCHEDULER=true).')
    return
  }

  cron.schedule('* * * * *', async () => {
    try {
      await processReminders()
    } catch (err) {
      console.error('[Scheduler] Error processing reminders:', err.message)
    }
    try {
      await processDailySummaries()
    } catch (err) {
      console.error('[Scheduler] Error processing daily summaries:', err.message)
    }
  })

  console.log('[Scheduler] Started (1/min tick: reminders + daily summary check).')
}

async function processReminders() {
  const reminders = await sequelize.query(
    `SELECT r.id, r.user_id, r.type, r.task_id, r.scheduled_at,
            u.mobile_number,
            t.title AS task_title
     FROM reminders r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN tasks t ON t.id = r.task_id
     WHERE r.sent = FALSE
       AND r.scheduled_at <= NOW()`,
    { type: 'SELECT' }
  )

  for (const reminder of reminders) {
    try {
      const text = reminder.task_title
        ? `Reminder: "${reminder.task_title}" is due now.`
        : `Reminder: ${reminder.type}`
      await sendMessage(reminder.mobile_number, text)
      await sequelize.query('UPDATE reminders SET sent = TRUE WHERE id = :id', {
        replacements: { id: reminder.id },
      })
    } catch (err) {
      console.error(`[Scheduler] Failed to process reminder ${reminder.id}:`, err.message)
    }
  }
}

async function processDailySummaries() {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const users = await User.findAll({ attributes: ['id', 'mobile_number', 'settings'] })

  for (const user of users) {
    const summaryTime = user.settings?.summary_time || '08:00'
    if (summaryTime !== currentTime) continue

    try {
      const summary = await buildDailySummary(user.id)
      if (summary) await sendMessage(user.mobile_number, summary)
    } catch (err) {
      console.error(`[Scheduler] Failed to send daily summary to user ${user.id}:`, err.message)
    }
  }
}
