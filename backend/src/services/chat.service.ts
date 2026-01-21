import { Types } from 'mongoose';
import Chat, { IChat } from '../models/Chat';
import Message, { IMessage, MessageType } from '../models/Message';
import { logger } from '../utils/logger';
import { sendNotification } from './notification.service';
import { emitToUser } from '../config/socket';

interface SendMessageParams {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type?: MessageType;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get or create chat for a trip
 */
export const getOrCreateTripChat = async (
  tripId: Types.ObjectId,
  passengerId: Types.ObjectId,
  driverId: Types.ObjectId
): Promise<IChat> => {
  try {
    let chat = await Chat.findOne({ tripId });

    if (!chat) {
      chat = await Chat.create({
        tripId,
        participants: [passengerId, driverId],
        type: 'trip',
      });
      logger.info(`Created new chat for trip ${tripId}`);
    }

    return chat;
  } catch (error) {
    logger.error(`Failed to get/create trip chat: ${error}`);
    throw error;
  }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (params: SendMessageParams): Promise<IMessage> => {
  try {
    const message = await Message.create({
      chatId: params.chatId,
      senderId: params.senderId,
      content: params.content,
      type: params.type || 'text',
      location: params.location,
      mediaUrl: params.mediaUrl,
      metadata: params.metadata,
    });

    // Populate sender info
    await message.populate('senderId', 'name avatar');

    // Update chat's last message
    await Chat.findByIdAndUpdate(params.chatId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    // Get chat to find the other participant
    const chat = await Chat.findById(params.chatId);
    if (chat) {
      const receiverId = chat.participants.find(
        (p) => p.toString() !== params.senderId.toString()
      );

      if (receiverId) {
        // Emit socket event to receiver
        emitToUser(receiverId.toString(), 'chat:message', {
          chatId: params.chatId,
          message: message.toJSON(),
        });

        // Send push notification
        await sendNotification(receiverId, {
          title: 'رسالة جديدة',
          titleAr: 'رسالة جديدة',
          body: params.type === 'text' ? params.content.substring(0, 50) : 'رسالة جديدة',
          bodyAr: params.type === 'text' ? params.content.substring(0, 50) : 'رسالة جديدة',
          type: 'trip',
          data: {
            type: 'new_message',
            chatId: params.chatId.toString(),
            messageId: message._id.toString(),
          },
        });
      }
    }

    logger.info(`Message sent in chat ${params.chatId}`);
    return message;
  } catch (error) {
    logger.error(`Failed to send message: ${error}`);
    throw error;
  }
};

/**
 * Get messages for a chat
 */
export const getMessages = async (
  chatId: Types.ObjectId,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: IMessage[]; total: number; pages: number }> => {
  try {
    const [messages, total] = await Promise.all([
      (Message as any).getMessagesForChat(chatId, page, limit),
      Message.countDocuments({ chatId }),
    ]);

    return {
      messages,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error(`Failed to get messages: ${error}`);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  chatId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<number> => {
  try {
    const count = await (Message as any).markAsRead(chatId, userId);

    // Emit read receipt to other participant
    const chat = await Chat.findById(chatId);
    if (chat) {
      const otherUserId = chat.participants.find(
        (p) => p.toString() !== userId.toString()
      );

      if (otherUserId) {
        emitToUser(otherUserId.toString(), 'chat:read', {
          chatId,
          readBy: userId,
          readAt: new Date(),
        });
      }
    }

    logger.info(`Marked ${count} messages as read in chat ${chatId}`);
    return count;
  } catch (error) {
    logger.error(`Failed to mark messages as read: ${error}`);
    throw error;
  }
};

/**
 * Get user's chats
 */
export const getUserChats = async (
  userId: Types.ObjectId,
  page: number = 1,
  limit: number = 20
): Promise<{ chats: IChat[]; total: number }> => {
  try {
    const [chats, total] = await Promise.all([
      Chat.find({ participants: userId, isActive: true })
        .populate('participants', 'name avatar')
        .populate({
          path: 'lastMessage',
          select: 'content type createdAt senderId isRead',
        })
        .populate({
          path: 'tripId',
          select: 'tripNumber status pickup dropoff',
        })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Chat.countDocuments({ participants: userId, isActive: true }),
    ]);

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await (Message as any).getUnreadCount(chat._id, userId);
        return {
          ...chat.toJSON(),
          unreadCount,
        };
      })
    );

    return { chats: chatsWithUnread as any, total };
  } catch (error) {
    logger.error(`Failed to get user chats: ${error}`);
    throw error;
  }
};

/**
 * Get chat by ID
 */
export const getChatById = async (
  chatId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<IChat | null> => {
  try {
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    })
      .populate('participants', 'name avatar phone')
      .populate({
        path: 'tripId',
        select: 'tripNumber status pickup dropoff fare',
      });

    return chat;
  } catch (error) {
    logger.error(`Failed to get chat: ${error}`);
    throw error;
  }
};

/**
 * Get chat for a trip
 */
export const getChatForTrip = async (
  tripId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<IChat | null> => {
  try {
    const chat = await Chat.findOne({
      tripId,
      participants: userId,
    })
      .populate('participants', 'name avatar phone')
      .populate({
        path: 'lastMessage',
        select: 'content type createdAt senderId isRead',
      });

    return chat;
  } catch (error) {
    logger.error(`Failed to get chat for trip: ${error}`);
    throw error;
  }
};

/**
 * Send system message in a chat
 */
export const sendSystemMessage = async (
  chatId: Types.ObjectId,
  content: string
): Promise<IMessage> => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const message = await Message.create({
      chatId,
      senderId: chat.participants[0], // Use first participant as sender for system
      content,
      type: 'system',
    });

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    // Notify all participants via socket
    for (const participantId of chat.participants) {
      emitToUser(participantId.toString(), 'chat:message', {
        chatId,
        message: message.toJSON(),
      });
    }

    logger.info(`System message sent in chat ${chatId}`);
    return message;
  } catch (error) {
    logger.error(`Failed to send system message: ${error}`);
    throw error;
  }
};

/**
 * Close chat (end of trip)
 */
export const closeChat = async (chatId: Types.ObjectId): Promise<void> => {
  try {
    await Chat.findByIdAndUpdate(chatId, { isActive: false });
    await sendSystemMessage(chatId, 'تم إنهاء المحادثة مع انتهاء الرحلة');
    logger.info(`Chat ${chatId} closed`);
  } catch (error) {
    logger.error(`Failed to close chat: ${error}`);
    throw error;
  }
};

/**
 * Get total unread messages count for a user
 */
export const getTotalUnreadCount = async (userId: Types.ObjectId): Promise<number> => {
  try {
    const chats = await Chat.find({ participants: userId, isActive: true }).select('_id');
    const chatIds = chats.map((c) => c._id);

    const unreadCount = await Message.countDocuments({
      chatId: { $in: chatIds },
      senderId: { $ne: userId },
      isRead: false,
    });

    return unreadCount;
  } catch (error) {
    logger.error(`Failed to get total unread count: ${error}`);
    throw error;
  }
};

export default {
  getOrCreateTripChat,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getUserChats,
  getChatById,
  getChatForTrip,
  sendSystemMessage,
  closeChat,
  getTotalUnreadCount,
};
