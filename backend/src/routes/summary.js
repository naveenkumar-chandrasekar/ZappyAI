import { buildDailySummary } from '../services/registry.js'

export default async function summaryRoutes(fastify) {
  fastify.get('/summary', { preHandler: fastify.authenticate }, async (request, reply) => {
    const { userId } = request.user
    const summary = await buildDailySummary(userId)
    return reply.code(200).send({
      summary: summary ?? 'Nothing to report — no pending tasks or upcoming birthdays.',
    })
  })
}
