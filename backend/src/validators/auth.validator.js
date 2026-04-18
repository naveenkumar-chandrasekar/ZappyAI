import { requestOtpSchema, verifyOtpSchema } from '../schema/auth.schema.js'

function validationError(errors) {
  return { statusCode: 400, message: errors[0].message }
}

export function validateRequestOtp(body) {
  const result = requestOtpSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}

export function validateVerifyOtp(body) {
  const result = verifyOtpSchema.safeParse(body)
  if (!result.success) throw validationError(result.error.errors)
  return result.data
}
