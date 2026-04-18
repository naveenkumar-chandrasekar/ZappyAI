import authRoutes from './auth.js'
import taskRoutes from './tasks.js'
import noteRoutes from './notes.js'
import personRoutes from './persons.js'
import conversationRoutes from './conversations.js'
import summaryRoutes from './summary.js'
import settingsRoutes from './settings.js'
import webhookRoutes from './webhooks.js'

export default async function apiV1Routes(fastify) {
  fastify.get('/', async () => ({
    name: 'zappy-api',
    version: 1,
    endpoints: {
      auth: ['POST /auth/request-otp', 'POST /auth/verify-otp'],
      tasks: ['GET/POST /tasks', 'GET /tasks/:id', 'PATCH/DELETE /tasks/:id'],
      notes: ['GET/POST /notes', 'DELETE /notes/:id'],
      persons: ['GET/POST /persons', 'PATCH/DELETE /persons/:id'],
      summary: ['GET /summary'],
      settings: ['GET/PATCH /settings'],
      webhooks: ['GET/POST /webhooks/whatsapp'],
    },
  }))

  await fastify.register(authRoutes)
  await fastify.register(taskRoutes)
  await fastify.register(noteRoutes)
  await fastify.register(personRoutes)
  await fastify.register(conversationRoutes)
  await fastify.register(summaryRoutes)
  await fastify.register(settingsRoutes)
  await fastify.register(webhookRoutes)
}
