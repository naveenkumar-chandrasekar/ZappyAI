import * as conversationController from '../controllers/conversation.controller.js'

export default async function conversationRoutes(fastify) {
  fastify.get('/conversations', { preHandler: fastify.authenticate }, conversationController.list)
  fastify.post('/conversations/messages', { preHandler: fastify.authenticate }, conversationController.sendMessage)
  fastify.delete('/conversations', { preHandler: fastify.authenticate }, conversationController.clearHistory)
}
