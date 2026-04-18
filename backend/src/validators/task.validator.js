import { createTaskSchema, updateTaskSchema } from '../schema/task.schema.js'

function validationError(errors) {
  return { statusCode: 400, message: errors[0].message }
}

export function validateCreateTask(body) {
  const result = createTaskSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}

export function validateUpdateTask(body) {
  const result = updateTaskSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}
