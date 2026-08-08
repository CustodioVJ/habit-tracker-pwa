import pino from 'pino';
import { env } from '../config/env';

/**
 * Application logger. Uses pino for structured, low-overhead logging.
 * In test mode, logging is silenced to keep test output clean.
 */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        }
      : undefined,
});
