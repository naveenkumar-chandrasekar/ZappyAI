import { Person } from '../models/index.js'

export async function listPersons(userId) {
  return Person.findAll({
    where: { user_id: userId },
    order: [['name', 'ASC']],
  })
}

export async function createPerson(userId, data) {
  const { name, birthday, priority, custom_fields } = data
  return Person.create({
    user_id: userId,
    name,
    birthday,
    priority: priority || 'Medium',
    custom_fields: custom_fields || {},
  })
}

export async function findPersonByIdAndUser(id, userId) {
  return Person.findOne({ where: { id, user_id: userId } })
}

export async function updatePerson(person, data) {
  return person.update(data)
}

export async function deletePerson(person) {
  await person.destroy()
}
