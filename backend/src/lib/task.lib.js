import { Task, Person } from '../models/index.js'

export async function listTasks(userId, filter = {}) {
  const where = { user_id: userId }
  if (filter.completed !== undefined) {
    where.completed = filter.completed
  }
  return Task.findAll({
    where,
    include: [{ model: Person, attributes: ['id', 'name', 'birthday', 'priority'], required: false }],
    order: [['due_at', 'ASC NULLS LAST'], ['created_at', 'DESC']],
  })
}

export async function getTaskByIdForUser(id, userId) {
  return Task.findOne({
    where: { id, user_id: userId },
    include: [{ model: Person, attributes: ['id', 'name', 'birthday', 'priority', 'is_owner'], required: false }],
  })
}

export async function createTask(userId, data) {
  const { title, description, due_at, person_id } = data
  return Task.create({
    user_id: userId,
    person_id: person_id || null,
    title,
    description: description || null,
    due_at: due_at || null,
    status: 'Pending',
  })
}

export async function findTaskByIdAndUser(id, userId) {
  return Task.findOne({ where: { id, user_id: userId } })
}

export async function updateTask(task, data) {
  return task.update(data)
}

export async function deleteTask(task) {
  await task.destroy()
}
