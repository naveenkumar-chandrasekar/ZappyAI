import 'dotenv/config'
import { buildApp } from './app.js'
import { startScheduler } from './services/scheduler.js'
import { sequelize } from './db/index.js'

const fastify = await buildApp({ logger: { level: process.env.LOG_LEVEL || 'info' } })

const PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

try {
  await fastify.listen({ port: PORT, host: HOST })
  fastify.log.info(`Server listening on ${HOST}:${PORT}`)
  fastify.log.info(`LLM provider: ${process.env.LLM_PROVIDER || 'ollama'}`)
  fastify.log.info(`App mode: ${process.env.APP_MODE || 'production'}`)

  startScheduler()
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

async function shutdown() {
  try {
    await fastify.close()
  } catch (e) {
    fastify.log.error(e)
  }
  try {
    await sequelize.close()
  } catch {}
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
if (process.platform !== 'win32') {
  process.on('SIGUSR2', shutdown)
}
