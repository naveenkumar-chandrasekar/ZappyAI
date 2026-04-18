import { createPersonSchema, updatePersonSchema } from '../schema/person.schema.js'

function validationError(errors) {
  return { statusCode: 400, message: errors[0].message }
}

export function validateCreatePerson(body) {
  const result = createPersonSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}

export function validateUpdatePerson(body) {
  const result = updatePersonSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}
