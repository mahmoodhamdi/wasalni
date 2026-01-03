import { Request, Response } from 'express';
import { Types } from 'mongoose';
import * as notificationService from '../services/notification.service';
import { sendSuccess, sendBadRequest, sendError } from '../utils/response';

// Get user notifications
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getUserNotifications(userId, page, limit);

    sendSuccess(
      res,
      result,
      'Notifications retrieved',
      'تم جلب الإشعارات'
    );
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);
    const result = await notificationService.getUserNotifications(userId, 1, 1);

    sendSuccess(
      res,
      { unreadCount: result.unreadCount },
      'Unread count retrieved',
      'تم جلب عدد الإشعارات غير المقروءة'
    );
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);
    const notificationId = new Types.ObjectId(req.params.notificationId);

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      sendBadRequest(res, 'Notification not found', 'الإشعار غير موجود');
      return;
    }

    sendSuccess(
      res,
      { notification },
      'Notification marked as read',
      'تم تحديد الإشعار كمقروء'
    );
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);

    await notificationService.markAllAsRead(userId);

    sendSuccess(
      res,
      {},
      'All notifications marked as read',
      'تم تحديد جميع الإشعارات كمقروءة'
    );
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Update FCM token
export const updateFCMToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);
    const { fcmToken } = req.body;

    if (!fcmToken) {
      sendBadRequest(res, 'FCM token is required', 'رمز FCM مطلوب');
      return;
    }

    await notificationService.updateFCMToken(userId, fcmToken);

    sendSuccess(
      res,
      {},
      'FCM token updated',
      'تم تحديث رمز الإشعارات'
    );
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Remove FCM token (logout)
export const removeFCMToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);
    const { fcmToken } = req.body;

    await notificationService.removeFCMToken(userId, fcmToken);

    sendSuccess(
      res,
      {},
      'FCM token removed',
      'تم إزالة رمز الإشعارات'
    );
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Test notification (for development)
export const sendTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = new Types.ObjectId((req as any).user.id);
    const { title, body } = req.body;

    await notificationService.sendNotification(userId, {
      title: title || 'Test Notification',
      titleAr: title || 'إشعار تجريبي',
      body: body || 'This is a test notification',
      bodyAr: body || 'هذا إشعار تجريبي',
      type: 'system',
      data: { test: true },
    });

    sendSuccess(
      res,
      {},
      'Test notification sent',
      'تم إرسال الإشعار التجريبي'
    );
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  updateFCMToken,
  removeFCMToken,
  sendTestNotification,
};
