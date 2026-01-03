import { Request, Response } from 'express';
import { Types } from 'mongoose';
import adminService from '../services/admin.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendNotFound,
} from '../utils/response';
import { logger } from '../utils/logger';

// ==================== Dashboard ====================

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, { stats }, 'Dashboard stats retrieved', 'تم استرجاع إحصائيات لوحة التحكم');
  } catch (error: any) {
    logger.error(`Get dashboard stats error: ${error.message}`);
    sendError(res, 'Failed to get dashboard stats', 'فشل استرجاع الإحصائيات');
  }
};

// ==================== Passengers ====================

export const getPassengers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, search, isActive, sortBy, sortOrder } = req.query;

    const result = await adminService.getPassengers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    sendSuccess(res, result, 'Passengers retrieved', 'تم استرجاع الركاب');
  } catch (error: any) {
    logger.error(`Get passengers error: ${error.message}`);
    sendError(res, 'Failed to get passengers', 'فشل استرجاع الركاب');
  }
};

export const getPassengerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passengerId } = req.params;

    if (!Types.ObjectId.isValid(passengerId)) {
      sendBadRequest(res, 'Invalid passenger ID', 'معرف الراكب غير صالح');
      return;
    }

    const passenger = await adminService.getPassengerById(new Types.ObjectId(passengerId));

    if (!passenger) {
      sendNotFound(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    sendSuccess(res, { passenger }, 'Passenger retrieved', 'تم استرجاع بيانات الراكب');
  } catch (error: any) {
    logger.error(`Get passenger error: ${error.message}`);
    sendError(res, 'Failed to get passenger', 'فشل استرجاع بيانات الراكب');
  }
};

export const updatePassenger = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passengerId } = req.params;

    if (!Types.ObjectId.isValid(passengerId)) {
      sendBadRequest(res, 'Invalid passenger ID', 'معرف الراكب غير صالح');
      return;
    }

    const passenger = await adminService.updatePassenger(
      new Types.ObjectId(passengerId),
      req.body
    );

    if (!passenger) {
      sendNotFound(res, 'Passenger not found', 'لم يتم العثور على الراكب');
      return;
    }

    sendSuccess(res, { passenger }, 'Passenger updated', 'تم تحديث بيانات الراكب');
  } catch (error: any) {
    logger.error(`Update passenger error: ${error.message}`);
    sendError(res, 'Failed to update passenger', 'فشل تحديث بيانات الراكب');
  }
};

export const togglePassengerActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passengerId } = req.params;

    if (!Types.ObjectId.isValid(passengerId)) {
      sendBadRequest(res, 'Invalid passenger ID', 'معرف الراكب غير صالح');
      return;
    }

    const passenger = await adminService.togglePassengerActive(new Types.ObjectId(passengerId));
    const user = (passenger as any).user;
    const isActive = user?.isActive ?? true;

    sendSuccess(
      res,
      { passenger },
      isActive ? 'Passenger activated' : 'Passenger deactivated',
      isActive ? 'تم تفعيل الراكب' : 'تم إيقاف الراكب'
    );
  } catch (error: any) {
    logger.error(`Toggle passenger error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

// ==================== Drivers ====================

export const getDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, search, status, vehicleType, isOnline, sortBy, sortOrder } = req.query;

    const result = await adminService.getDrivers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      status: status as 'pending' | 'approved' | 'rejected' | 'suspended',
      vehicleType: vehicleType as string,
      isOnline: isOnline !== undefined ? isOnline === 'true' : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    sendSuccess(res, result, 'Drivers retrieved', 'تم استرجاع السائقين');
  } catch (error: any) {
    logger.error(`Get drivers error: ${error.message}`);
    sendError(res, 'Failed to get drivers', 'فشل استرجاع السائقين');
  }
};

export const getDriverById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;

    if (!Types.ObjectId.isValid(driverId)) {
      sendBadRequest(res, 'Invalid driver ID', 'معرف السائق غير صالح');
      return;
    }

    const driver = await adminService.getDriverById(new Types.ObjectId(driverId));

    if (!driver) {
      sendNotFound(res, 'Driver not found', 'لم يتم العثور على السائق');
      return;
    }

    sendSuccess(res, { driver }, 'Driver retrieved', 'تم استرجاع بيانات السائق');
  } catch (error: any) {
    logger.error(`Get driver error: ${error.message}`);
    sendError(res, 'Failed to get driver', 'فشل استرجاع بيانات السائق');
  }
};

export const getPendingDrivers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await adminService.getPendingDrivers();
    sendSuccess(res, { drivers, count: drivers.length }, 'Pending drivers retrieved', 'تم استرجاع السائقين المنتظرين');
  } catch (error: any) {
    logger.error(`Get pending drivers error: ${error.message}`);
    sendError(res, 'Failed to get pending drivers', 'فشل استرجاع السائقين المنتظرين');
  }
};

export const approveDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      sendBadRequest(res, 'Admin ID required', 'معرف المسؤول مطلوب');
      return;
    }

    if (!Types.ObjectId.isValid(driverId)) {
      sendBadRequest(res, 'Invalid driver ID', 'معرف السائق غير صالح');
      return;
    }

    const driver = await adminService.approveDriver(
      new Types.ObjectId(driverId),
      new Types.ObjectId(adminId)
    );

    sendSuccess(res, { driver }, 'Driver approved', 'تمت الموافقة على السائق');
  } catch (error: any) {
    logger.error(`Approve driver error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

export const rejectDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      sendBadRequest(res, 'Admin ID required', 'معرف المسؤول مطلوب');
      return;
    }

    if (!reason) {
      sendBadRequest(res, 'Rejection reason required', 'سبب الرفض مطلوب');
      return;
    }

    if (!Types.ObjectId.isValid(driverId)) {
      sendBadRequest(res, 'Invalid driver ID', 'معرف السائق غير صالح');
      return;
    }

    const driver = await adminService.rejectDriver(
      new Types.ObjectId(driverId),
      new Types.ObjectId(adminId),
      reason
    );

    sendSuccess(res, { driver }, 'Driver rejected', 'تم رفض السائق');
  } catch (error: any) {
    logger.error(`Reject driver error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

export const suspendDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      sendBadRequest(res, 'Admin ID required', 'معرف المسؤول مطلوب');
      return;
    }

    if (!reason) {
      sendBadRequest(res, 'Suspension reason required', 'سبب الإيقاف مطلوب');
      return;
    }

    if (!Types.ObjectId.isValid(driverId)) {
      sendBadRequest(res, 'Invalid driver ID', 'معرف السائق غير صالح');
      return;
    }

    const driver = await adminService.suspendDriver(
      new Types.ObjectId(driverId),
      new Types.ObjectId(adminId),
      reason
    );

    sendSuccess(res, { driver }, 'Driver suspended', 'تم إيقاف السائق');
  } catch (error: any) {
    logger.error(`Suspend driver error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

export const activateDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;

    if (!Types.ObjectId.isValid(driverId)) {
      sendBadRequest(res, 'Invalid driver ID', 'معرف السائق غير صالح');
      return;
    }

    const driver = await adminService.activateDriver(new Types.ObjectId(driverId));

    sendSuccess(res, { driver }, 'Driver activated', 'تم تفعيل السائق');
  } catch (error: any) {
    logger.error(`Activate driver error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

// ==================== Trips ====================

export const getTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, status, from, to, passengerId, driverId, sortBy, sortOrder } = req.query;

    const result = await adminService.getTrips({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      passengerId: passengerId ? new Types.ObjectId(passengerId as string) : undefined,
      driverId: driverId ? new Types.ObjectId(driverId as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    sendSuccess(res, result, 'Trips retrieved', 'تم استرجاع الرحلات');
  } catch (error: any) {
    logger.error(`Get trips error: ${error.message}`);
    sendError(res, 'Failed to get trips', 'فشل استرجاع الرحلات');
  }
};

export const getTripById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tripId } = req.params;

    if (!Types.ObjectId.isValid(tripId)) {
      sendBadRequest(res, 'Invalid trip ID', 'معرف الرحلة غير صالح');
      return;
    }

    const trip = await adminService.getTripById(new Types.ObjectId(tripId));

    if (!trip) {
      sendNotFound(res, 'Trip not found', 'لم يتم العثور على الرحلة');
      return;
    }

    sendSuccess(res, { trip }, 'Trip retrieved', 'تم استرجاع بيانات الرحلة');
  } catch (error: any) {
    logger.error(`Get trip error: ${error.message}`);
    sendError(res, 'Failed to get trip', 'فشل استرجاع بيانات الرحلة');
  }
};

export const getTripStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const stats = await adminService.getTripStats(
      from ? new Date(from as string) : undefined,
      to ? new Date(to as string) : undefined
    );

    sendSuccess(res, { stats }, 'Trip stats retrieved', 'تم استرجاع إحصائيات الرحلات');
  } catch (error: any) {
    logger.error(`Get trip stats error: ${error.message}`);
    sendError(res, 'Failed to get trip stats', 'فشل استرجاع إحصائيات الرحلات');
  }
};

export const getRecentTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const trips = await adminService.getRecentTrips(limit);

    sendSuccess(res, { trips }, 'Recent trips retrieved', 'تم استرجاع آخر الرحلات');
  } catch (error: any) {
    logger.error(`Get recent trips error: ${error.message}`);
    sendError(res, 'Failed to get recent trips', 'فشل استرجاع آخر الرحلات');
  }
};

// ==================== Finance ====================

export const getFinanceStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getFinanceStats();
    sendSuccess(res, { stats }, 'Finance stats retrieved', 'تم استرجاع الإحصائيات المالية');
  } catch (error: any) {
    logger.error(`Get finance stats error: ${error.message}`);
    sendError(res, 'Failed to get finance stats', 'فشل استرجاع الإحصائيات المالية');
  }
};

export const getRevenueChart = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const data = await adminService.getRevenueChart(days);

    sendSuccess(res, { data }, 'Revenue chart data retrieved', 'تم استرجاع بيانات الإيرادات');
  } catch (error: any) {
    logger.error(`Get revenue chart error: ${error.message}`);
    sendError(res, 'Failed to get revenue chart', 'فشل استرجاع بيانات الإيرادات');
  }
};

// ==================== Settings ====================

export const getFareSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await adminService.getFareSettings();
    sendSuccess(res, { settings }, 'Fare settings retrieved', 'تم استرجاع إعدادات الأسعار');
  } catch (error: any) {
    logger.error(`Get fare settings error: ${error.message}`);
    sendError(res, 'Failed to get fare settings', 'فشل استرجاع إعدادات الأسعار');
  }
};

export const updateFareSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fareId } = req.params;

    if (!Types.ObjectId.isValid(fareId)) {
      sendBadRequest(res, 'Invalid fare ID', 'معرف السعر غير صالح');
      return;
    }

    const setting = await adminService.updateFareSetting(new Types.ObjectId(fareId), req.body);

    if (!setting) {
      sendNotFound(res, 'Fare setting not found', 'لم يتم العثور على إعدادات السعر');
      return;
    }

    sendSuccess(res, { setting }, 'Fare setting updated', 'تم تحديث إعدادات السعر');
  } catch (error: any) {
    logger.error(`Update fare setting error: ${error.message}`);
    sendError(res, 'Failed to update fare setting', 'فشل تحديث إعدادات السعر');
  }
};

export const createFareSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const setting = await adminService.createFareSetting(req.body);
    sendCreated(res, { setting }, 'Fare setting created', 'تم إنشاء إعدادات السعر');
  } catch (error: any) {
    logger.error(`Create fare setting error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

export const getZones = async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await adminService.getZones();
    sendSuccess(res, { zones }, 'Zones retrieved', 'تم استرجاع المناطق');
  } catch (error: any) {
    logger.error(`Get zones error: ${error.message}`);
    sendError(res, 'Failed to get zones', 'فشل استرجاع المناطق');
  }
};

export const updateZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    if (!Types.ObjectId.isValid(zoneId)) {
      sendBadRequest(res, 'Invalid zone ID', 'معرف المنطقة غير صالح');
      return;
    }

    const zone = await adminService.updateZone(new Types.ObjectId(zoneId), req.body);

    if (!zone) {
      sendNotFound(res, 'Zone not found', 'لم يتم العثور على المنطقة');
      return;
    }

    sendSuccess(res, { zone }, 'Zone updated', 'تم تحديث المنطقة');
  } catch (error: any) {
    logger.error(`Update zone error: ${error.message}`);
    sendError(res, 'Failed to update zone', 'فشل تحديث المنطقة');
  }
};

export const createZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await adminService.createZone(req.body);
    sendCreated(res, { zone }, 'Zone created', 'تم إنشاء المنطقة');
  } catch (error: any) {
    logger.error(`Create zone error: ${error.message}`);
    sendBadRequest(res, error.message, error.message);
  }
};

export const deleteZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId } = req.params;

    if (!Types.ObjectId.isValid(zoneId)) {
      sendBadRequest(res, 'Invalid zone ID', 'معرف المنطقة غير صالح');
      return;
    }

    await adminService.deleteZone(new Types.ObjectId(zoneId));

    sendSuccess(res, null, 'Zone deleted', 'تم حذف المنطقة');
  } catch (error: any) {
    logger.error(`Delete zone error: ${error.message}`);
    sendError(res, 'Failed to delete zone', 'فشل حذف المنطقة');
  }
};

export default {
  getDashboardStats,
  getPassengers,
  getPassengerById,
  updatePassenger,
  togglePassengerActive,
  getDrivers,
  getDriverById,
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  suspendDriver,
  activateDriver,
  getTrips,
  getTripById,
  getTripStats,
  getRecentTrips,
  getFinanceStats,
  getRevenueChart,
  getFareSettings,
  updateFareSetting,
  createFareSetting,
  getZones,
  updateZone,
  createZone,
  deleteZone,
};
