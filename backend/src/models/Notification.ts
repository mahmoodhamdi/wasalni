import mongoose, { Schema, Model, Types } from 'mongoose';

// Notification Type
type NotificationType = 'trip' | 'promo' | 'system' | 'earnings';

// Notification Interface
export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// Notification Schema
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleAr: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    bodyAr: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['trip', 'promo', 'system', 'earnings'] as NotificationType[],
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL

// Static: Create notification
notificationSchema.statics.createNotification = async function (
  userId: Types.ObjectId,
  title: string,
  titleAr: string,
  body: string,
  bodyAr: string,
  type: NotificationType,
  data?: Record<string, unknown>
): Promise<INotification> {
  return this.create({
    userId,
    title,
    titleAr,
    body,
    bodyAr,
    type,
    data,
  });
};

// Static: Get user notifications
notificationSchema.statics.getUserNotifications = function (
  userId: Types.ObjectId,
  page: number = 1,
  limit: number = 20
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static: Get unread count
notificationSchema.statics.getUnreadCount = function (
  userId: Types.ObjectId
): Promise<number> {
  return this.countDocuments({ userId, isRead: false });
};

// Static: Mark as read
notificationSchema.statics.markAsRead = async function (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<INotification | null> {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true }
  );
};

// Static: Mark all as read
notificationSchema.statics.markAllAsRead = async function (
  userId: Types.ObjectId
): Promise<void> {
  await this.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
};

// Static: Create trip notification
notificationSchema.statics.createTripNotification = async function (
  userId: Types.ObjectId,
  tripNumber: string,
  status: string,
  tripId: Types.ObjectId
): Promise<INotification> {
  const messages: Record<
    string,
    { title: string; titleAr: string; body: string; bodyAr: string }
  > = {
    driver_assigned: {
      title: 'Driver Found',
      titleAr: 'تم إيجاد سائق',
      body: `A driver has accepted your ride ${tripNumber}`,
      bodyAr: `قبل سائق رحلتك ${tripNumber}`,
    },
    driver_arriving: {
      title: 'Driver On The Way',
      titleAr: 'السائق في الطريق',
      body: 'Your driver is on the way to pick you up',
      bodyAr: 'السائق في طريقه إليك',
    },
    driver_arrived: {
      title: 'Driver Arrived',
      titleAr: 'السائق وصل',
      body: 'Your driver has arrived at the pickup location',
      bodyAr: 'السائق وصل لمكان الانتظار',
    },
    trip_started: {
      title: 'Trip Started',
      titleAr: 'الرحلة بدأت',
      body: 'Your trip has started. Enjoy your ride!',
      bodyAr: 'الرحلة بدأت. رحلة سعيدة!',
    },
    trip_completed: {
      title: 'Trip Completed',
      titleAr: 'الرحلة انتهت',
      body: `Your trip ${tripNumber} has been completed`,
      bodyAr: `تم إنهاء رحلتك ${tripNumber}`,
    },
    cancelled: {
      title: 'Trip Cancelled',
      titleAr: 'الرحلة ملغية',
      body: `Your trip ${tripNumber} has been cancelled`,
      bodyAr: `تم إلغاء رحلتك ${tripNumber}`,
    },
  };

  const msg = messages[status] || {
    title: 'Trip Update',
    titleAr: 'تحديث الرحلة',
    body: `Your trip ${tripNumber} status: ${status}`,
    bodyAr: `حالة رحلتك ${tripNumber}: ${status}`,
  };

  return (this as unknown as INotificationModel).createNotification(
    userId,
    msg.title,
    msg.titleAr,
    msg.body,
    msg.bodyAr,
    'trip',
    { tripId, tripNumber, status }
  );
};

// Interface for Notification model with statics
interface INotificationModel extends Model<INotification> {
  createNotification(
    userId: Types.ObjectId,
    title: string,
    titleAr: string,
    body: string,
    bodyAr: string,
    type: NotificationType,
    data?: Record<string, unknown>
  ): Promise<INotification>;
  getUserNotifications(
    userId: Types.ObjectId,
    page?: number,
    limit?: number
  ): Promise<INotification[]>;
  getUnreadCount(userId: Types.ObjectId): Promise<number>;
  markAsRead(
    notificationId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<INotification | null>;
  markAllAsRead(userId: Types.ObjectId): Promise<void>;
  createTripNotification(
    userId: Types.ObjectId,
    tripNumber: string,
    status: string,
    tripId: Types.ObjectId
  ): Promise<INotification>;
}

// Create and export the model
const Notification = mongoose.model<INotification, INotificationModel>(
  'Notification',
  notificationSchema
);

export default Notification;
