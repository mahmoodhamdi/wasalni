import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { validationResult } from 'express-validator';
import safetyService from '../services/safety.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Get emergency contacts
 * GET /api/v1/safety/emergency-contacts
 */
export const getEmergencyContacts = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      return res.status(400).json(
        errorResponse('Passenger ID not found', 'لم يتم العثور على معرف الراكب')
      );
    }

    const contacts = await safetyService.getEmergencyContacts(new Types.ObjectId(passengerId));

    return res.status(200).json(
      successResponse(contacts, 'Emergency contacts retrieved', 'تم جلب جهات الاتصال الطارئة')
    );
  } catch (error: any) {
    logger.error(`Get emergency contacts error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في جلب جهات الاتصال')
    );
  }
};

/**
 * Add emergency contact
 * POST /api/v1/safety/emergency-contacts
 */
export const addEmergencyContact = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array()));
    }

    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      return res.status(400).json(
        errorResponse('Passenger ID not found', 'لم يتم العثور على معرف الراكب')
      );
    }

    const { name, phone, relationship, notifyOnTrip, notifyOnSOS } = req.body;

    const contacts = await safetyService.addEmergencyContact(new Types.ObjectId(passengerId), {
      name,
      phone,
      relationship,
      notifyOnTrip: notifyOnTrip ?? true,
      notifyOnSOS: notifyOnSOS ?? true,
    });

    return res.status(201).json(
      successResponse(contacts, 'Emergency contact added', 'تمت إضافة جهة الاتصال الطارئة')
    );
  } catch (error: any) {
    logger.error(`Add emergency contact error: ${error.message}`);

    if (error.message.includes('Maximum')) {
      return res.status(400).json(
        errorResponse(error.message, 'الحد الأقصى 5 جهات اتصال')
      );
    }
    if (error.message.includes('duplicate')) {
      return res.status(400).json(
        errorResponse(error.message, 'جهة الاتصال موجودة بالفعل')
      );
    }

    return res.status(500).json(
      errorResponse(error.message, 'فشل في إضافة جهة الاتصال')
    );
  }
};

/**
 * Update emergency contact
 * PUT /api/v1/safety/emergency-contacts/:contactId
 */
export const updateEmergencyContact = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array()));
    }

    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      return res.status(400).json(
        errorResponse('Passenger ID not found', 'لم يتم العثور على معرف الراكب')
      );
    }

    const { contactId } = req.params;
    const updates = req.body;

    const contacts = await safetyService.updateEmergencyContact(
      new Types.ObjectId(passengerId),
      new Types.ObjectId(contactId),
      updates
    );

    return res.status(200).json(
      successResponse(contacts, 'Emergency contact updated', 'تم تحديث جهة الاتصال')
    );
  } catch (error: any) {
    logger.error(`Update emergency contact error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في تحديث جهة الاتصال')
    );
  }
};

/**
 * Remove emergency contact
 * DELETE /api/v1/safety/emergency-contacts/:contactId
 */
export const removeEmergencyContact = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      return res.status(400).json(
        errorResponse('Passenger ID not found', 'لم يتم العثور على معرف الراكب')
      );
    }

    const { contactId } = req.params;

    const contacts = await safetyService.removeEmergencyContact(
      new Types.ObjectId(passengerId),
      new Types.ObjectId(contactId)
    );

    return res.status(200).json(
      successResponse(contacts, 'Emergency contact removed', 'تم حذف جهة الاتصال')
    );
  } catch (error: any) {
    logger.error(`Remove emergency contact error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في حذف جهة الاتصال')
    );
  }
};

/**
 * Get safety preferences
 * GET /api/v1/safety/preferences
 */
export const getSafetyPreferences = async (req: Request, res: Response) => {
  try {
    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      return res.status(400).json(
        errorResponse('Passenger ID not found', 'لم يتم العثور على معرف الراكب')
      );
    }

    const preferences = await safetyService.getSafetyPreferences(new Types.ObjectId(passengerId));

    return res.status(200).json(
      successResponse(preferences, 'Safety preferences retrieved', 'تم جلب إعدادات الأمان')
    );
  } catch (error: any) {
    logger.error(`Get safety preferences error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في جلب إعدادات الأمان')
    );
  }
};

/**
 * Update safety preferences
 * PUT /api/v1/safety/preferences
 */
export const updateSafetyPreferences = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errorResponse('Validation failed', 'فشل التحقق من البيانات', errors.array()));
    }

    const passengerId = req.user?.passengerId;
    if (!passengerId) {
      return res.status(400).json(
        errorResponse('Passenger ID not found', 'لم يتم العثور على معرف الراكب')
      );
    }

    const preferences = await safetyService.updateSafetyPreferences(new Types.ObjectId(passengerId), req.body);

    return res.status(200).json(
      successResponse(preferences, 'Safety preferences updated', 'تم تحديث إعدادات الأمان')
    );
  } catch (error: any) {
    logger.error(`Update safety preferences error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في تحديث إعدادات الأمان')
    );
  }
};

/**
 * Generate trip share link
 * POST /api/v1/safety/trips/:tripId/share
 */
export const generateTripShareLink = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { expirationHours } = req.body;

    const shareLink = await safetyService.generateTripShareLink(
      new Types.ObjectId(tripId),
      expirationHours || 24
    );

    return res.status(200).json(
      successResponse(shareLink, 'Share link generated', 'تم إنشاء رابط المشاركة')
    );
  } catch (error: any) {
    logger.error(`Generate share link error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في إنشاء رابط المشاركة')
    );
  }
};

/**
 * Get trip for public tracking
 * GET /api/v1/safety/track/:tripId
 */
export const getTripForTracking = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json(
        errorResponse('Token is required', 'الرمز مطلوب')
      );
    }

    const trip = await safetyService.getTripForTracking(
      new Types.ObjectId(tripId),
      token
    );

    return res.status(200).json(
      successResponse(trip, 'Trip data retrieved', 'تم جلب بيانات الرحلة')
    );
  } catch (error: any) {
    logger.error(`Get trip for tracking error: ${error.message}`);

    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json(
        errorResponse(error.message, 'رابط غير صالح أو منتهي الصلاحية')
      );
    }

    return res.status(500).json(
      errorResponse(error.message, 'فشل في جلب بيانات الرحلة')
    );
  }
};

/**
 * Trigger SOS
 * POST /api/v1/safety/trips/:tripId/sos
 */
export const triggerSOS = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json(
        errorResponse('Unauthorized', 'غير مصرح')
      );
    }

    const triggeredBy = userRole === 'driver' ? 'driver' : 'passenger';

    const sosEvent = await safetyService.triggerEnhancedSOS(
      new Types.ObjectId(tripId),
      triggeredBy,
      new Types.ObjectId(userId),
      { latitude, longitude }
    );

    return res.status(200).json(
      successResponse(sosEvent, 'SOS triggered - help is on the way', 'تم تفعيل الطوارئ - المساعدة في الطريق')
    );
  } catch (error: any) {
    logger.error(`Trigger SOS error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في تفعيل الطوارئ')
    );
  }
};

/**
 * Resolve SOS (admin only)
 * POST /api/v1/safety/trips/:tripId/sos/resolve
 */
export const resolveSOS = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { notes } = req.body;
    const adminId = req.user?.userId;

    if (!adminId || req.user?.role !== 'admin') {
      return res.status(403).json(
        errorResponse('Admin access required', 'يتطلب صلاحيات المسؤول')
      );
    }

    await safetyService.resolveSOS(
      new Types.ObjectId(tripId),
      new Types.ObjectId(adminId),
      notes
    );

    return res.status(200).json(
      successResponse(null, 'SOS resolved', 'تم حل حالة الطوارئ')
    );
  } catch (error: any) {
    logger.error(`Resolve SOS error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في حل حالة الطوارئ')
    );
  }
};

/**
 * Verify driver for trip
 * GET /api/v1/safety/verify-driver/:driverId
 */
export const verifyDriver = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    const verification = await safetyService.verifyDriverForTrip(
      new Types.ObjectId(driverId)
    );

    return res.status(200).json(
      successResponse(verification, 'Driver verification complete', 'تم التحقق من السائق')
    );
  } catch (error: any) {
    logger.error(`Verify driver error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في التحقق من السائق')
    );
  }
};

/**
 * Get safety tips
 * GET /api/v1/safety/tips
 */
export const getSafetyTips = async (req: Request, res: Response) => {
  try {
    const { isNewDriver, isLongTrip } = req.query;

    const tips = safetyService.getSafetyTips({
      isNight: safetyService.isNightMode(),
      isNewDriver: isNewDriver === 'true',
      isLongTrip: isLongTrip === 'true',
    });

    return res.status(200).json(
      successResponse(tips, 'Safety tips retrieved', 'تم جلب نصائح الأمان')
    );
  } catch (error: any) {
    logger.error(`Get safety tips error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في جلب نصائح الأمان')
    );
  }
};

/**
 * Respond to safety check
 * POST /api/v1/safety/trips/:tripId/safety-check
 */
export const respondToSafetyCheck = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { response } = req.body;

    if (!['safe', 'need_help'].includes(response)) {
      return res.status(400).json(
        errorResponse('Invalid response', 'استجابة غير صالحة')
      );
    }

    await safetyService.respondToSafetyCheck(
      new Types.ObjectId(tripId),
      response
    );

    return res.status(200).json(
      successResponse(null, 'Response recorded', 'تم تسجيل الاستجابة')
    );
  } catch (error: any) {
    logger.error(`Respond to safety check error: ${error.message}`);
    return res.status(500).json(
      errorResponse(error.message, 'فشل في تسجيل الاستجابة')
    );
  }
};

export default {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  removeEmergencyContact,
  getSafetyPreferences,
  updateSafetyPreferences,
  generateTripShareLink,
  getTripForTracking,
  triggerSOS,
  resolveSOS,
  verifyDriver,
  getSafetyTips,
  respondToSafetyCheck,
};
