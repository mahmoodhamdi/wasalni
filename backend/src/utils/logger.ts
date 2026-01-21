import dayjs from 'dayjs';
import { config } from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown): LogMessage {
    return {
      level,
      message,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const logMessage = this.formatMessage(level, message, data);
    const prefix = `[${logMessage.timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, data ? data : '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data ? data : '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data ? data : '');
        break;
      case 'debug':
        if (config.nodeEnv === 'development') {
          console.debug(`${prefix} ${message}`, data ? data : '');
        }
        break;
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();

/**
 * Extract error message from unknown error type
 * Used for safe error handling in catch blocks
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export default logger;
