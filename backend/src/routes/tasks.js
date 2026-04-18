import * as taskController from '../controllers/task.controller.js'

export default async function taskRoutes(fastify) {
  fastify.get('/tasks', { preHandler: fastify.authenticate }, taskController.list)
  fastify.get('/tasks/:id', { preHandler: fastify.authenticate }, taskController.getById)
  fastify.post('/tasks', { preHandler: fastify.authenticate }, taskController.create)
  fastify.patch('/tasks/:id', { preHandler: fastify.authenticate }, taskController.update)
  fastify.delete('/tasks/:id', { preHandler: fastify.authenticate }, taskController.remove)
}
