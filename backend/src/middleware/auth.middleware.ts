import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import Driver from '../models/Driver';
import Passenger from '../models/Passenger';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    logger.debug(`[Auth] Path: ${req.path}, Method: ${req.method}`);
    logger.debug(`[Auth] Authorization header: ${authHeader ? 'present' : 'MISSING'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug(`[Auth] FAILED: Token required or invalid format`);
      throw new UnauthorizedError('التوكن مطلوب');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    logger.debug(`[Auth] Payload: ${payload ? 'valid' : 'INVALID'}`);

    if (!payload) {
      logger.debug(`[Auth] FAILED: Token invalid or expired`);
      throw new UnauthorizedError('توكن غير صالح أو منتهي الصلاحية');
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('isActive role');
    logger.debug(`[Auth] User found: ${user ? `yes (role: ${user.role}, active: ${user.isActive})` : 'NO'}`);
    if (!user) {
      logger.debug(`[Auth] FAILED: User not found`);
      throw new UnauthorizedError('المستخدم غير موجود');
    }

    // Allow drivers even if inactive (they may be pending approval)
    // Only block inactive passengers and admins
    if (!user.isActive && user.role !== 'driver') {
      logger.debug(`[Auth] FAILED: User not active`);
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
  _res: Response,
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
  } catch {
    // Don't fail on optional auth errors
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: Array<'passenger' | 'driver' | 'admin'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    logger.debug(`[Authorize] Checking roles: ${allowedRoles.join(', ')}, User role: ${req.user?.role || 'none'}`);
    if (!req.user) {
      logger.debug(`[Authorize] FAILED: No user on request`);
      return next(new UnauthorizedError('غير مصرح'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.debug(`[Authorize] FAILED: Role ${req.user.role} not in allowed roles`);
      return next(new ForbiddenError('غير مسموح لك بهذا الإجراء'));
    }

    logger.debug(`[Authorize] PASSED`);
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
