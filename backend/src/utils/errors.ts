import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public statusCode: number;
  public messageAr: string;
  public isOperational: boolean;

  constructor(
    message: string,
    messageAr: string = message,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.statusCode = statusCode;
    this.messageAr = messageAr;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = 'Bad request',
    messageAr: string = 'طلب غير صالح'
  ) {
    super(message, messageAr, StatusCodes.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = 'Unauthorized',
    messageAr: string = 'غير مصرح'
  ) {
    super(message, messageAr, StatusCodes.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = 'Forbidden',
    messageAr: string = 'ممنوع الوصول'
  ) {
    super(message, messageAr, StatusCodes.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Not found',
    messageAr: string = 'غير موجود'
  ) {
    super(message, messageAr, StatusCodes.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = 'Conflict',
    messageAr: string = 'تعارض'
  ) {
    super(message, messageAr, StatusCodes.CONFLICT);
  }
}

export class ValidationError extends AppError {
  public errors: Array<{ field: string; message: string }>;

  constructor(
    errors: Array<{ field: string; message: string }>,
    message: string = 'Validation failed',
    messageAr: string = 'فشل التحقق'
  ) {
    super(message, messageAr, StatusCodes.UNPROCESSABLE_ENTITY);
    this.errors = errors;
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message: string = 'Too many requests',
    messageAr: string = 'طلبات كثيرة جداً'
  ) {
    super(message, messageAr, StatusCodes.TOO_MANY_REQUESTS);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = 'Service unavailable',
    messageAr: string = 'الخدمة غير متاحة'
  ) {
    super(message, messageAr, StatusCodes.SERVICE_UNAVAILABLE);
  }
}

export default {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  ServiceUnavailableError,
};
