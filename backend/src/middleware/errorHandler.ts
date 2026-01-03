import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

interface ErrorResponse {
  success: false;
  message: string;
  messageAr: string;
  errors?: Array<{ field: string; message: string }>;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    name: err.name,
  });

  // Default error response
  const response: ErrorResponse = {
    success: false,
    message: 'Internal server error',
    messageAr: 'خطأ في الخادم',
  };

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  // Handle our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.message = err.message;
    response.messageAr = err.messageAr;

    // Handle validation errors
    if (err instanceof ValidationError) {
      response.errors = err.errors;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    response.message = 'Validation failed';
    response.messageAr = 'فشل التحقق من البيانات';

    // Extract mongoose validation errors
    const mongooseError = err as unknown as {
      errors: Record<string, { message: string }>;
    };
    if (mongooseError.errors) {
      response.errors = Object.keys(mongooseError.errors).map((field) => ({
        field,
        message: mongooseError.errors[field].message,
      }));
    }
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = StatusCodes.BAD_REQUEST;
    response.message = 'Invalid ID format';
    response.messageAr = 'صيغة المعرف غير صالحة';
  }

  // Handle Mongoose duplicate key error
  if ((err as { code?: number }).code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    response.message = 'Duplicate field value';
    response.messageAr = 'قيمة مكررة';

    // Extract the duplicate field
    const mongoError = err as unknown as { keyValue?: Record<string, unknown> };
    if (mongoError.keyValue) {
      const field = Object.keys(mongoError.keyValue)[0];
      response.message = `${field} already exists`;
      response.messageAr = `${field} موجود بالفعل`;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    response.message = 'Invalid token';
    response.messageAr = 'رمز غير صالح';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    response.message = 'Token expired';
    response.messageAr = 'انتهت صلاحية الرمز';
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

// 404 handler for undefined routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    messageAr: `المسار ${req.originalUrl} غير موجود`,
  });
};

export default { errorHandler, notFoundHandler };
