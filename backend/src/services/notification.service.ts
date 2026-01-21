import { Types } from 'mongoose';
import Notification from '../models/Notification';
import User from '../models/User';
import { sendMultiplePushNotifications } from '../config/firebase';
import { logger } from '../utils/logger';

// Notification types
type NotificationType = 'trip' | 'promo' | 'system' | 'earnings';

interface NotificationPayload {
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

// Send notification to a single user (push + store)
export const sendNotification = async (
  userId: Types.ObjectId,
  payload: NotificationPayload
): Promise<void> => {
  try {
    // Store notification in database
    await (Notification as any).createNotification(
      userId,
      payload.title,
      payload.titleAr,
      payload.body,
      payload.bodyAr,
      payload.type,
      payload.data
    );

    // Get user's FCM tokens
    const user = await User.findById(userId).select('fcmTokens language');
    if (user?.fcmTokens && user.fcmTokens.length > 0) {
      // Use Arabic or English based on user preference
      const title = user.language === 'ar' ? payload.titleAr : payload.title;
      const body = user.language === 'ar' ? payload.bodyAr : payload.body;
      const dataStr = payload.data ? stringifyData(payload.data) : undefined;

      // Send to all user's devices
      await sendMultiplePushNotifications(user.fcmTokens, title, body, dataStr);
    }
  } catch (error) {
    logger.error(`Failed to send notification: ${error}`);
  }
};

// Send notification to multiple users
export const sendNotificationToMany = async (
  userIds: Types.ObjectId[],
  payload: NotificationPayload
): Promise<void> => {
  try {
    // Store notifications in database for all users
    await Promise.all(
      userIds.map((userId) =>
        (Notification as any).createNotification(
          userId,
          payload.title,
          payload.titleAr,
          payload.body,
          payload.bodyAr,
          payload.type,
          payload.data
        )
      )
    );

    // Get FCM tokens for all users
    const users = await User.find({
      _id: { $in: userIds },
      fcmTokens: { $exists: true, $not: { $size: 0 } }
    }).select('fcmTokens language');

    if (users.length > 0) {
      // Group by language for appropriate messaging
      const arTokens: string[] = [];
      const enTokens: string[] = [];

      users.forEach((user) => {
        if (user.fcmTokens && user.fcmTokens.length > 0) {
          if (user.language === 'ar') {
            arTokens.push(...user.fcmTokens);
          } else {
            enTokens.push(...user.fcmTokens);
          }
        }
      });

      const dataStr = payload.data ? stringifyData(payload.data) : undefined;

      // Send to Arabic users
      if (arTokens.length > 0) {
        await sendMultiplePushNotifications(arTokens, payload.titleAr, payload.bodyAr, dataStr);
      }

      // Send to English users
      if (enTokens.length > 0) {
        await sendMultiplePushNotifications(enTokens, payload.title, payload.body, dataStr);
      }
    }
  } catch (error) {
    logger.error(`Failed to send notifications to multiple users: ${error}`);
  }
};

// Trip notification templates
export const sendTripNotification = async (
  userId: Types.ObjectId,
  tripId: Types.ObjectId,
  tripNumber: string,
  event: string
): Promise<void> => {
  const notifications: Record<string, NotificationPayload> = {
    driver_found: {
      title: 'Driver Found!',
      titleAr: 'تم إيجاد سائق!',
      body: 'A driver has accepted your ride request',
      bodyAr: 'قبل سائق طلب رحلتك',
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    driver_arriving: {
      title: 'Driver On The Way',
      titleAr: 'السائق في الطريق',
      body: 'Your driver is coming to pick you up',
      bodyAr: 'السائق في طريقه إليك',
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    driver_arrived: {
      title: 'Driver Arrived',
      titleAr: 'السائق وصل',
      body: 'Your driver has arrived at the pickup location',
      bodyAr: 'السائق وصل لمكان الانتظار',
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    trip_started: {
      title: 'Trip Started',
      titleAr: 'بدأت الرحلة',
      body: 'Your trip has started. Enjoy your ride!',
      bodyAr: 'بدأت رحلتك. رحلة سعيدة!',
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    trip_completed: {
      title: 'Trip Completed',
      titleAr: 'اكتملت الرحلة',
      body: `Your trip #${tripNumber} has been completed. Rate your driver!`,
      bodyAr: `اكتملت رحلتك #${tripNumber}. قيّم سائقك!`,
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    trip_cancelled_by_driver: {
      title: 'Trip Cancelled',
      titleAr: 'تم إلغاء الرحلة',
      body: 'Your driver has cancelled the trip. We are searching for another driver.',
      bodyAr: 'ألغى السائق الرحلة. نبحث لك عن سائق آخر.',
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    trip_cancelled_by_passenger: {
      title: 'Trip Cancelled',
      titleAr: 'تم إلغاء الرحلة',
      body: `Trip #${tripNumber} has been cancelled by passenger`,
      bodyAr: `تم إلغاء الرحلة #${tripNumber} من قبل الراكب`,
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    new_trip_request: {
      title: 'New Trip Request!',
      titleAr: 'طلب رحلة جديد!',
      body: 'You have a new trip request nearby',
      bodyAr: 'لديك طلب رحلة جديد بالقرب منك',
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
    trip_rating: {
      title: 'Rate Your Trip',
      titleAr: 'قيّم رحلتك',
      body: 'How was your experience? Your feedback helps us improve.',
      bodyAr: 'كيف كانت تجربتك؟ تعليقك يساعدنا على التحسين.',
      type: 'trip',
      data: { tripId: tripId.toString(), tripNumber, event },
    },
  };

  const notification = notifications[event];
  if (notification) {
    await sendNotification(userId, notification);
  }
};

// Driver notification templates
export const sendDriverNotification = async (
  driverId: Types.ObjectId,
  event: string,
  data?: Record<string, unknown>
): Promise<void> => {
  const notifications: Record<string, NotificationPayload> = {
    approved: {
      title: 'Account Approved!',
      titleAr: 'تم تفعيل حسابك!',
      body: 'Congratulations! Your driver account has been approved. Start earning now!',
      bodyAr: 'مبروك! تم تفعيل حسابك كسائق. ابدأ في جمع الأرباح الآن!',
      type: 'system',
      data,
    },
    rejected: {
      title: 'Application Rejected',
      titleAr: 'تم رفض الطلب',
      body: 'Your driver application has been rejected. Please contact support.',
      bodyAr: 'تم رفض طلب التسجيل كسائق. يرجى التواصل مع الدعم.',
      type: 'system',
      data,
    },
    suspended: {
      title: 'Account Suspended',
      titleAr: 'تم إيقاف الحساب',
      body: 'Your account has been temporarily suspended. Contact support for more info.',
      bodyAr: 'تم إيقاف حسابك مؤقتاً. تواصل مع الدعم لمزيد من المعلومات.',
      type: 'system',
      data,
    },
    activated: {
      title: 'Account Reactivated',
      titleAr: 'تم تفعيل الحساب',
      body: 'Your account has been reactivated. You can start accepting rides again!',
      bodyAr: 'تم تفعيل حسابك مرة أخرى. يمكنك البدء في قبول الرحلات!',
      type: 'system',
      data,
    },
    payout_processed: {
      title: 'Payout Processed',
      titleAr: 'تم تحويل الأرباح',
      body: `Your payout of ${data?.amount || ''} EGP has been processed`,
      bodyAr: `تم تحويل أرباحك بمبلغ ${data?.amount || ''} ج.م`,
      type: 'earnings',
      data,
    },
    weekly_summary: {
      title: 'Weekly Earnings Summary',
      titleAr: 'ملخص الأرباح الأسبوعي',
      body: `You earned ${data?.earnings || ''} EGP from ${data?.trips || ''} trips this week`,
      bodyAr: `ربحت ${data?.earnings || ''} ج.م من ${data?.trips || ''} رحلة هذا الأسبوع`,
      type: 'earnings',
      data,
    },
  };

  const notification = notifications[event];
  if (notification) {
    await sendNotification(driverId, notification);
  }
};

// Promo notification
export const sendPromoNotification = async (
  userIds: Types.ObjectId[],
  promoCode: string,
  discount: string,
  description: string,
  descriptionAr: string
): Promise<void> => {
  await sendNotificationToMany(userIds, {
    title: `New Promo: ${promoCode}`,
    titleAr: `عرض جديد: ${promoCode}`,
    body: `${description} - Use code ${promoCode} to get ${discount} off!`,
    bodyAr: `${descriptionAr} - استخدم الكود ${promoCode} للحصول على خصم ${discount}!`,
    type: 'promo',
    data: { promoCode, discount },
  });
};

// System notifications
export const sendSystemNotification = async (
  userIds: Types.ObjectId[],
  title: string,
  titleAr: string,
  body: string,
  bodyAr: string,
  data?: Record<string, unknown>
): Promise<void> => {
  await sendNotificationToMany(userIds, {
    title,
    titleAr,
    body,
    bodyAr,
    type: 'system',
    data,
  });
};

// SOS Alert notification
export const sendSOSAlert = async (
  adminUserIds: Types.ObjectId[],
  tripId: Types.ObjectId,
  passengerName: string,
  location: string
): Promise<void> => {
  await sendNotificationToMany(adminUserIds, {
    title: 'SOS ALERT!',
    titleAr: '!تنبيه طوارئ',
    body: `Emergency SOS from ${passengerName} at ${location}`,
    bodyAr: `طلب طوارئ من ${passengerName} في ${location}`,
    type: 'system',
    data: { tripId: tripId.toString(), emergency: true },
  });
};

// Get user notifications
export const getUserNotifications = async (
  userId: Types.ObjectId,
  page: number = 1,
  limit: number = 20
) => {
  const notifications = await (Notification as any).getUserNotifications(userId, page, limit);
  const unreadCount = await (Notification as any).getUnreadCount(userId);
  const total = await Notification.countDocuments({ userId });

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Mark notification as read
export const markAsRead = async (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
) => {
  return (Notification as any).markAsRead(notificationId, userId);
};

// Mark all notifications as read
export const markAllAsRead = async (userId: Types.ObjectId) => {
  return (Notification as any).markAllAsRead(userId);
};

// Update FCM token (add to array if not exists)
export const updateFCMToken = async (
  userId: Types.ObjectId,
  fcmToken: string
): Promise<void> => {
  await User.findByIdAndUpdate(userId, { $addToSet: { fcmTokens: fcmToken } });
};

// Remove FCM token (on logout from specific device)
export const removeFCMToken = async (
  userId: Types.ObjectId,
  fcmToken?: string
): Promise<void> => {
  if (fcmToken) {
    // Remove specific token
    await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: fcmToken } });
  } else {
    // Remove all tokens (logout from all devices)
    await User.findByIdAndUpdate(userId, { fcmTokens: [] });
  }
};

// Helper: Convert data to string values for FCM
const stringifyData = (data: Record<string, unknown>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = String(value);
  }
  return result;
};

export default {
  sendNotification,
  sendNotificationToMany,
  sendTripNotification,
  sendDriverNotification,
  sendPromoNotification,
  sendSystemNotification,
  sendSOSAlert,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  updateFCMToken,
  removeFCMToken,
};
