import { updateSettingsSchema } from '../schema/settings.schema.js'

function validationError(errors) {
  return { statusCode: 400, message: errors[0].message }
}

export function validateUpdateSettings(body) {
  if (!body || typeof body !== 'object') {
    throw { statusCode: 400, message: 'Request body must be an object' }
  }
  const result = updateSettingsSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}
