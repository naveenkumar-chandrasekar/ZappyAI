import Fastify from 'fastify'
import cors from '@fastify/cors'
import authPlugin from './plugins/auth.js'
import errorHandlerPlugin from './plugins/error-handler.js'
import apiV1Routes from './routes/api-v1.js'
import { sequelize } from './db/index.js'

export async function buildApp(opts = {}) {
  const fastify = Fastify({ logger: opts.logger ?? false })

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await fastify.register(authPlugin)
  await fastify.register(errorHandlerPlugin)

  await fastify.register(apiV1Routes, { prefix: '/api/v1' })

  fastify.get('/health', async () => {
    try {
      await sequelize.query('SELECT 1')
      return { status: 'ok', db: 'connected', timestamp: new Date().toISOString() }
    } catch (err) {
      return { status: 'degraded', db: 'disconnected', error: err.message }
    }
  })

  return fastify
}
