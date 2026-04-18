import { validateCreatePerson, validateUpdatePerson } from '../validators/person.validator.js'
import * as personLib from '../lib/person.lib.js'
import { presentPerson, presentPersonList } from '../presenters/person.presenter.js'

export async function list(request, reply) {
  const { userId } = request.user
  const persons = await personLib.listPersons(userId)
  return reply.code(200).send(presentPersonList(persons))
}

export async function create(request, reply) {
  const { userId } = request.user
  let data
  try {
    data = validateCreatePerson(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }
  const person = await personLib.createPerson(userId, data)
  return reply.code(201).send(presentPerson(person))
}

export async function update(request, reply) {
  const { userId } = request.user
  const { id } = request.params

  const existing = await personLib.findPersonByIdAndUser(id, userId)
  if (!existing) return reply.code(404).send({ error: 'Person not found' })

  let data
  try {
    data = validateUpdatePerson(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }

  const person = await personLib.updatePerson(existing, data)
  return reply.code(200).send(presentPerson(person))
}

export async function remove(request, reply) {
  const { userId } = request.user
  const { id } = request.params

  const existing = await personLib.findPersonByIdAndUser(id, userId)
  if (!existing) return reply.code(404).send({ error: 'Person not found' })

  if (existing.is_owner) {
    return reply.code(400).send({ error: 'Cannot delete your own profile' })
  }

  await personLib.deletePerson(existing)
  return reply.code(200).send({ message: 'Person deleted', id })
}
