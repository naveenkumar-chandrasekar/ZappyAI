import { Reminder, Task } from '../models/index.js'
import { Op } from 'sequelize'

export default async function reminderRoutes(fastify) {
  fastify.get('/reminders', async (request, reply) => {
    const { userId } = request.user
    const reminders = await Reminder.findAll({
      where: { user_id: userId },
      include: [{ model: Task, attributes: ['title'], required: false }],
      order: [['scheduled_at', 'ASC']],
    })
    return reply.code(200).send({ reminders })
  })

  fastify.delete('/reminders/:id', async (request, reply) => {
    const { userId } = request.user
    const reminder = await Reminder.findOne({ where: { id: request.params.id, user_id: userId } })
    if (!reminder) return reply.code(404).send({ error: 'Not found' })
    await reminder.destroy()
    return reply.code(200).send({ success: true })
  })
}
