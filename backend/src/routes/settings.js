import * as settingsController from '../controllers/settings.controller.js'

export default async function settingsRoutes(fastify) {
  fastify.get('/settings', { preHandler: fastify.authenticate }, settingsController.getSettings)
  fastify.patch('/settings', { preHandler: fastify.authenticate }, settingsController.updateSettings)
}
