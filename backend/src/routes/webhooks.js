import * as webhookController from '../controllers/webhook.controller.js'

export default async function webhookRoutes(fastify) {
  fastify.get('/webhooks/whatsapp', webhookController.verifyWebhook)
  fastify.post('/webhooks/whatsapp', webhookController.handleWebhook)
}
