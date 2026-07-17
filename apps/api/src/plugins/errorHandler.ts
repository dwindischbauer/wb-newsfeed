import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../services/logger.service.js';

export function setupErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    logger.error(
      {
        err: error,
        url: request.raw.url,
        method: request.raw.method,
      },
      'Unhandled request error',
    );

    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.errors,
      });
    }

    const statusCode = (error as FastifyError).statusCode || 500;
    return reply.status(statusCode).send({
      statusCode,
      error: (error as FastifyError).name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    });
  });
}
