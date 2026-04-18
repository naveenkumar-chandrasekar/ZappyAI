import { createNoteSchema, updateNoteSchema } from '../schema/note.schema.js'

function validationError(errors) {
  return { statusCode: 400, message: errors[0].message }
}

export function validateCreateNote(body) {
  const result = createNoteSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}

export function validateUpdateNote(body) {
  const result = updateNoteSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}
