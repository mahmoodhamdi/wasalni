import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import Driver from '../models/Driver';
import Passenger from '../models/Passenger';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'passenger' | 'driver' | 'admin';
        email: string;
        driverId?: string;
        passengerId?: string;
      };
    }
  }
}

/**
 * Authentication middleware - requires valid JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('التوكن مطلوب');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      throw new UnauthorizedError('توكن غير صالح أو منتهي الصلاحية');
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('isActive role');
    if (!user) {
      throw new UnauthorizedError('المستخدم غير موجود');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('الحساب غير مفعل');
    }

    // Attach user to request
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };

    // Add role-specific IDs
    if (payload.role === 'driver') {
      const driver = await Driver.findOne({ userId: payload.userId }).select('_id');
      if (driver) {
        req.user.driverId = driver._id.toString();
      }
    } else if (payload.role === 'passenger') {
      const passenger = await Passenger.findOne({ userId: payload.userId }).select('_id');
      if (passenger) {
        req.user.passengerId = passenger._id.toString();
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);

      if (payload) {
        const user = await User.findById(payload.userId).select('isActive');
        if (user && user.isActive) {
          req.user = {
            userId: payload.userId,
            role: payload.role,
            email: payload.email,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: Array<'passenger' | 'driver' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('غير مصرح'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('غير مسموح لك بهذا الإجراء'));
    }

    next();
  };
};

/**
 * Passenger only middleware
 */
export const passengerOnly = authorize('passenger');

/**
 * Driver only middleware
 */
export const driverOnly = authorize('driver');

/**
 * Admin only middleware
 */
export const adminOnly = authorize('admin');

/**
 * Driver or Admin middleware
 */
export const driverOrAdmin = authorize('driver', 'admin');

/**
 * Any authenticated user middleware
 */
export const anyRole = authorize('passenger', 'driver', 'admin');

/**
 * Alias for authorize - require specific role
 */
export const requireRole = authorize;
