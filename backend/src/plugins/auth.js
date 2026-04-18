import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

async function authPlugin(fastify, opts) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'changeme-use-a-real-secret',
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
      request.user = {
        userId: request.user.userId,
        mobileNumber: request.user.mobileNumber,
      };
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' });
    }
  });
}

export default fp(authPlugin, { name: 'auth' });
