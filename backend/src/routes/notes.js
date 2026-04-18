import * as noteController from '../controllers/note.controller.js'

export default async function noteRoutes(fastify) {
  fastify.get('/notes', { preHandler: fastify.authenticate }, noteController.list)
  fastify.post('/notes', { preHandler: fastify.authenticate }, noteController.create)
  fastify.patch('/notes/:id', { preHandler: fastify.authenticate }, noteController.update)
  fastify.delete('/notes/:id', { preHandler: fastify.authenticate }, noteController.remove)
}
