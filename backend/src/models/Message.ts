import mongoose, { Schema, Document, Types } from 'mongoose';

// Message Type
export type MessageType = 'text' | 'image' | 'location' | 'voice' | 'system';

// Message Interface
export interface IMessage extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: MessageType;
  isRead: boolean;
  readAt?: Date;
  // For location messages
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  // For media messages
  mediaUrl?: string;
  mediaThumbnail?: string;
  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'location', 'voice', 'system'] as MessageType[],
      default: 'text',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    mediaUrl: {
      type: String,
    },
    mediaThumbnail: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

// Static: Get messages for a chat with pagination
messageSchema.statics.getMessagesForChat = function (
  chatId: Types.ObjectId,
  page: number = 1,
  limit: number = 50
) {
  return this.find({ chatId })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static: Mark messages as read
messageSchema.statics.markAsRead = async function (
  chatId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<number> {
  const result = await this.updateMany(
    { chatId, senderId: { $ne: userId }, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return result.modifiedCount;
};

// Static: Get unread count for a chat
messageSchema.statics.getUnreadCount = function (
  chatId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<number> {
  return this.countDocuments({
    chatId,
    senderId: { $ne: userId },
    isRead: false,
  });
};

// Interface for Message model with statics
interface IMessageModel extends mongoose.Model<IMessage> {
  getMessagesForChat(
    chatId: Types.ObjectId,
    page?: number,
    limit?: number
  ): Promise<IMessage[]>;
  markAsRead(chatId: Types.ObjectId, userId: Types.ObjectId): Promise<number>;
  getUnreadCount(chatId: Types.ObjectId, userId: Types.ObjectId): Promise<number>;
}

const Message = mongoose.model<IMessage, IMessageModel>('Message', messageSchema);

export default Message;
