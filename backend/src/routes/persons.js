import * as personController from '../controllers/person.controller.js'

export default async function personRoutes(fastify) {
  fastify.get('/persons', { preHandler: fastify.authenticate }, personController.list)
  fastify.post('/persons', { preHandler: fastify.authenticate }, personController.create)
  fastify.patch('/persons/:id', { preHandler: fastify.authenticate }, personController.update)
  fastify.delete('/persons/:id', { preHandler: fastify.authenticate }, personController.remove)
}
