import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as chatService from '../services/chat.service';
import Trip from '../models/Trip';

/**
 * Get user's chats
 */
export const getChats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await chatService.getUserChats(userId, page, limit);

    res.json({
      success: true,
      message: 'Chats retrieved successfully',
      messageAr: 'تم جلب المحادثات بنجاح',
      data: result.chats,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Get chat by ID
 */
export const getChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatId } = req.params as Record<string, string>;
    const userId = new Types.ObjectId(req.user!.userId);

    const chat = await chatService.getChatById(new Types.ObjectId(chatId), userId);

    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
        messageAr: 'المحادثة غير موجودة',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Chat retrieved successfully',
      messageAr: 'تم جلب المحادثة بنجاح',
      data: { chat },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Get or create chat for a trip
 */
export const getTripChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const userId = new Types.ObjectId(req.user!.userId);

    const trip = await Trip.findById(tripId);
    if (!trip) {
      res.status(404).json({
        success: false,
        message: 'Trip not found',
        messageAr: 'الرحلة غير موجودة',
      });
      return;
    }

    // Verify user is part of the trip
    const passengerId = trip.passengerId?.toString();
    const driverId = (trip as any).driverId?.toString();

    if (userId.toString() !== passengerId && userId.toString() !== driverId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
        messageAr: 'غير مصرح',
      });
      return;
    }

    if (!driverId) {
      res.status(400).json({
        success: false,
        message: 'No driver assigned to this trip yet',
        messageAr: 'لم يتم تعيين سائق لهذه الرحلة بعد',
      });
      return;
    }

    const chat = await chatService.getOrCreateTripChat(
      new Types.ObjectId(tripId),
      new Types.ObjectId(passengerId!),
      new Types.ObjectId(driverId)
    );

    // Populate participants
    await chat.populate('participants', 'name avatar phone');

    res.json({
      success: true,
      message: 'Chat retrieved successfully',
      messageAr: 'تم جلب المحادثة بنجاح',
      data: { chat },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Get messages for a chat
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatId } = req.params as Record<string, string>;
    const userId = new Types.ObjectId(req.user!.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify user has access to this chat
    const chat = await chatService.getChatById(new Types.ObjectId(chatId), userId);
    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
        messageAr: 'المحادثة غير موجودة',
      });
      return;
    }

    const result = await chatService.getMessages(new Types.ObjectId(chatId), page, limit);

    res.json({
      success: true,
      message: 'Messages retrieved successfully',
      messageAr: 'تم جلب الرسائل بنجاح',
      data: result.messages,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatId } = req.params as Record<string, string>;
    const userId = new Types.ObjectId(req.user!.userId);
    const { content, type, location, mediaUrl } = req.body;

    if (!content || content.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Message content is required',
        messageAr: 'محتوى الرسالة مطلوب',
      });
      return;
    }

    // Verify user has access to this chat
    const chat = await chatService.getChatById(new Types.ObjectId(chatId), userId);
    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
        messageAr: 'المحادثة غير موجودة',
      });
      return;
    }

    if (!chat.isActive) {
      res.status(400).json({
        success: false,
        message: 'This chat has been closed',
        messageAr: 'تم إغلاق هذه المحادثة',
      });
      return;
    }

    const message = await chatService.sendMessage({
      chatId: new Types.ObjectId(chatId),
      senderId: userId,
      content,
      type,
      location,
      mediaUrl,
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
      messageAr: 'تم إرسال الرسالة بنجاح',
      data: { message },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatId } = req.params as Record<string, string>;
    const userId = new Types.ObjectId(req.user!.userId);

    // Verify user has access to this chat
    const chat = await chatService.getChatById(new Types.ObjectId(chatId), userId);
    if (!chat) {
      res.status(404).json({
        success: false,
        message: 'Chat not found',
        messageAr: 'المحادثة غير موجودة',
      });
      return;
    }

    const count = await chatService.markMessagesAsRead(new Types.ObjectId(chatId), userId);

    res.json({
      success: true,
      message: `${count} messages marked as read`,
      messageAr: `تم تحديد ${count} رسالة كمقروءة`,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Get total unread messages count
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const count = await chatService.getTotalUnreadCount(userId);

    res.json({
      success: true,
      message: 'Unread count retrieved',
      messageAr: 'تم جلب عدد الرسائل غير المقروءة',
      data: { count },
    });
  } catch (error: unknown) {
    next(error);
  }
};

export default {
  getChats,
  getChat,
  getTripChat,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
