import { validateCreateNote, validateUpdateNote } from '../validators/note.validator.js'
import * as noteLib from '../lib/note.lib.js'
import { presentNote, presentNoteList } from '../presenters/note.presenter.js'

export async function list(request, reply) {
  const { userId } = request.user
  const { keyword } = request.query
  const notes = await noteLib.listNotes(userId, keyword)
  return reply.code(200).send(presentNoteList(notes))
}

export async function create(request, reply) {
  const { userId } = request.user
  let data
  try {
    data = validateCreateNote(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }
  const note = await noteLib.createNote(userId, data)
  return reply.code(201).send(presentNote(note))
}

export async function update(request, reply) {
  const { userId } = request.user
  const { id } = request.params
  let data
  try {
    data = validateUpdateNote(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }
  const existing = await noteLib.findNoteByIdAndUser(id, userId)
  if (!existing) return reply.code(404).send({ error: 'Note not found' })
  const note = await noteLib.updateNote(existing, data.content)
  return reply.code(200).send(presentNote(note))
}

export async function remove(request, reply) {
  const { userId } = request.user
  const { id } = request.params

  const existing = await noteLib.findNoteByIdAndUser(id, userId)
  if (!existing) return reply.code(404).send({ error: 'Note not found' })

  await noteLib.deleteNote(existing)
  return reply.code(200).send({ message: 'Note deleted', id })
}
