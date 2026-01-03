import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  messageAr?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  messageAr: string = 'تم بنجاح',
  statusCode: number = StatusCodes.OK
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    messageAr,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Created successfully',
  messageAr: string = 'تم الإنشاء بنجاح'
): Response => {
  return sendSuccess(res, data, message, messageAr, StatusCodes.CREATED);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Success',
  messageAr: string = 'تم بنجاح'
): Response => {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    messageAr,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(StatusCodes.OK).json(response);
};

export const sendError = (
  res: Response,
  message: string = 'An error occurred',
  messageAr: string = 'حدث خطأ',
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  errors?: Array<{ field: string; message: string }>
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    messageAr,
    errors,
  };
  return res.status(statusCode).json(response);
};

export const sendBadRequest = (
  res: Response,
  message: string = 'Bad request',
  messageAr: string = 'طلب غير صالح',
  errors?: Array<{ field: string; message: string }>
): Response => {
  return sendError(res, message, messageAr, StatusCodes.BAD_REQUEST, errors);
};

export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized',
  messageAr: string = 'غير مصرح'
): Response => {
  return sendError(res, message, messageAr, StatusCodes.UNAUTHORIZED);
};

export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden',
  messageAr: string = 'ممنوع الوصول'
): Response => {
  return sendError(res, message, messageAr, StatusCodes.FORBIDDEN);
};

export const sendNotFound = (
  res: Response,
  message: string = 'Not found',
  messageAr: string = 'غير موجود'
): Response => {
  return sendError(res, message, messageAr, StatusCodes.NOT_FOUND);
};

export const sendConflict = (
  res: Response,
  message: string = 'Conflict',
  messageAr: string = 'تعارض'
): Response => {
  return sendError(res, message, messageAr, StatusCodes.CONFLICT);
};

export const sendValidationError = (
  res: Response,
  errors: Array<{ field: string; message: string }>
): Response => {
  return sendError(
    res,
    'Validation failed',
    'فشل التحقق',
    StatusCodes.UNPROCESSABLE_ENTITY,
    errors
  );
};

export default {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
};
