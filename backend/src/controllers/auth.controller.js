import { validateRequestOtp, validateVerifyOtp } from '../validators/auth.validator.js'
import * as authLib from '../lib/auth.lib.js'
import { sendOTP } from '../services/whatsapp.js'

export async function requestOtp(request, reply) {
  let data
  try {
    data = validateRequestOtp(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }

  const code = await authLib.createOtp(data.mobile_number)
  const isDemoMode = process.env.APP_MODE === 'demo' || !process.env.WHATSAPP_TOKEN

  if (isDemoMode) {
    console.log(`[OTP Demo] Code for ${data.mobile_number}: ${code}`)
  } else {
    try {
      await sendOTP(data.mobile_number, code)
    } catch (err) {
      console.error('[OTP] Failed to send WhatsApp OTP:', err.message)
      return reply.code(500).send({ error: 'Failed to send OTP via WhatsApp' })
    }
  }

  const response = { message: 'OTP sent successfully' }
  if (isDemoMode) response.demo_code = code
  return reply.code(200).send(response)
}

export async function verifyOtp(request, reply) {
  let data
  try {
    data = validateVerifyOtp(request.body)
  } catch (err) {
    return reply.code(err.statusCode).send({ error: err.message })
  }

  const otp = await authLib.verifyOtp(data.mobile_number, data.code)
  if (!otp) {
    return reply.code(401).send({ error: 'Invalid or expired OTP' })
  }

  const { user, is_new_user } = await authLib.findOrCreateUser(
    data.mobile_number,
    data.name,
    data.birthday
  )

  const token = await reply.jwtSign(
    { userId: user.id, mobileNumber: user.mobile_number },
    { expiresIn: '30d' }
  )

  return reply.code(200).send({ token, userId: user.id, name: user.name, is_new_user })
}
