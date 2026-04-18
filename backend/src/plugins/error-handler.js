import fp from 'fastify-plugin'

async function errorHandlerPlugin(fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    if (reply.sent) return

    if (error.validation) {
      return reply.code(400).send({
        error: 'Invalid request',
        details: error.validation,
      })
    }

    const code = typeof error.statusCode === 'number' ? error.statusCode : 500
    if (code >= 400 && code < 500) {
      const msg = error.message || 'Bad Request'
      return reply.code(code).send({ error: msg })
    }

    fastify.log.error(error)
    const isProd = process.env.NODE_ENV === 'production'
    return reply.code(500).send({
      error: 'Internal Server Error',
      ...(!isProd && { message: error.message }),
    })
  })

  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: 'Not Found', path: request.url })
  })
}

export default fp(errorHandlerPlugin)
