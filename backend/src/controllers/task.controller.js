import { validateCreateTask, validateUpdateTask } from '../validators/task.validator.js'
import * as taskLib from '../lib/task.lib.js'
import { presentTask, presentTaskList } from '../presenters/task.presenter.js'

export async function list(request, reply) {
  const { userId } = request.user
  const { completed } = request.query
  const filter = {}
  if (completed !== undefined) filter.completed = completed === 'true'
  const tasks = await taskLib.listTasks(userId, filter)
  return reply.code(200).send(presentTaskList(tasks))
}

export async function getById(request, reply) {
  const { userId } = request.user
  const { id } = request.params
  const task = await taskLib.getTaskByIdForUser(id, userId)
  if (!task) return reply.code(404).send({ error: 'Task not found' })
  return reply.code(200).send(presentTask(task))
}

export async function create(request, reply) {
  const { userId } = request.user
  let data
  try {
    data = validateCreateTask(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }
  const created = await taskLib.createTask(userId, data)
  const task = await taskLib.getTaskByIdForUser(created.id, userId)
  return reply.code(201).send(presentTask(task))
}

export async function update(request, reply) {
  const { userId } = request.user
  const { id } = request.params

  const existing = await taskLib.findTaskByIdAndUser(id, userId)
  if (!existing) return reply.code(404).send({ error: 'Task not found' })

  let data
  try {
    data = validateUpdateTask(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }

  await taskLib.updateTask(existing, data)
  const task = await taskLib.getTaskByIdForUser(id, userId)
  return reply.code(200).send(presentTask(task))
}

export async function remove(request, reply) {
  const { userId } = request.user
  const { id } = request.params

  const existing = await taskLib.findTaskByIdAndUser(id, userId)
  if (!existing) return reply.code(404).send({ error: 'Task not found' })

  await taskLib.deleteTask(existing)
  return reply.code(200).send({ message: 'Task deleted', id })
}
