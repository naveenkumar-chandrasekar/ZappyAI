import * as authController from '../controllers/auth.controller.js'

export default async function authRoutes(fastify) {
  fastify.post('/auth/request-otp', authController.requestOtp)
  fastify.post('/auth/verify-otp', authController.verifyOtp)
}
