import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { paymentService } from '../services/payment.service';
import { logger, getErrorMessage } from '../utils/logger';

/**
 * Get payment URL for trip
 */
export const payForTrip = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const userId = new Types.ObjectId(req.user!.userId);

    const result = await paymentService.payForTrip(new Types.ObjectId(tripId), userId);

    res.json({
      success: true,
      message: 'Payment URL generated',
      messageAr: 'تم إنشاء رابط الدفع',
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Pay for trip using wallet
 */
export const payWithWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params as Record<string, string>;
    const userId = new Types.ObjectId(req.user!.userId);

    const payment = await paymentService.payWithWallet(new Types.ObjectId(tripId), userId);

    res.json({
      success: true,
      message: 'Payment successful',
      messageAr: 'تم الدفع بنجاح',
      data: { payment },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Top up wallet
 */
export const topUpWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount } = req.body;
    const userId = new Types.ObjectId(req.user!.userId);

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid amount',
        messageAr: 'المبلغ غير صالح',
      });
      return;
    }

    const result = await paymentService.topUpWallet(userId, amount);

    res.json({
      success: true,
      message: 'Payment URL generated for wallet top-up',
      messageAr: 'تم إنشاء رابط شحن المحفظة',
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const balance = await paymentService.getWalletBalance(userId);

    res.json({
      success: true,
      message: 'Wallet balance retrieved',
      messageAr: 'تم جلب رصيد المحفظة',
      data: { balance, currency: 'EGP' },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await paymentService.getPaymentHistory(userId, page, limit);

    res.json({
      success: true,
      message: 'Payment history retrieved',
      messageAr: 'تم جلب سجل المدفوعات',
      data: result.payments,
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
 * Get payment details
 */
export const getPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params as Record<string, string>;
    const payment = await paymentService.getPayment(new Types.ObjectId(paymentId));

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found',
        messageAr: 'الدفعة غير موجودة',
      });
      return;
    }

    // Check if payment belongs to user
    if (payment.userId.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
        messageAr: 'غير مصرح',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Payment retrieved',
      messageAr: 'تم جلب بيانات الدفعة',
      data: { payment },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Paymob webhook callback
 */
export const paymobWebhook = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const { obj, hmac } = req.body;

    if (!obj || !hmac) {
      res.status(400).json({
        success: false,
        message: 'Invalid webhook data',
      });
      return;
    }

    logger.info(`Paymob webhook received: order=${obj.order?.id}, success=${obj.success}`);

    const payment = await paymentService.processWebhook(obj, hmac);

    if (payment) {
      // Emit socket event for real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${payment.userId}`).emit('payment:update', {
          paymentId: payment._id,
          status: payment.status,
          tripId: payment.tripId,
        });
      }
    }

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error(`Paymob webhook error: ${getErrorMessage(error)}`);
    // Return 200 to acknowledge receipt even on error
    res.json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Paymob callback (redirect after payment)
 */
export const paymobCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { success, order } = req.query as Record<string, string | undefined>;

    // Redirect to mobile app or frontend with status
    const appScheme = process.env.APP_SCHEME || 'wasalni';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Check if request is from mobile app
    const isMobileApp = req.headers['user-agent']?.includes('Mobile');

    if (isMobileApp) {
      // Deep link to mobile app
      res.redirect(`${appScheme}://payment-result?success=${success}&order=${order}`);
    } else {
      // Redirect to frontend
      res.redirect(`${frontendUrl}/payment-result?success=${success}&order=${order}`);
    }
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Admin: Process driver payout
 */
export const processDriverPayout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { driverId } = req.params as Record<string, string>;
    const { amount } = req.body;
    const adminUserId = new Types.ObjectId(req.user!.userId);

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid amount',
        messageAr: 'المبلغ غير صالح',
      });
      return;
    }

    const payment = await paymentService.processDriverPayout(
      new Types.ObjectId(driverId),
      amount,
      adminUserId
    );

    res.json({
      success: true,
      message: 'Payout processed successfully',
      messageAr: 'تم تحويل الأرباح بنجاح',
      data: { payment },
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * Admin: Refund payment
 */
export const refundPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params as Record<string, string>;
    const { reason } = req.body;

    const payment = await paymentService.refundPayment(
      new Types.ObjectId(paymentId),
      reason
    );

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      messageAr: 'تم استرداد الدفعة بنجاح',
      data: { payment },
    });
  } catch (error: unknown) {
    next(error);
  }
};

export default {
  payForTrip,
  payWithWallet,
  topUpWallet,
  getWalletBalance,
  getPaymentHistory,
  getPayment,
  paymobWebhook,
  paymobCallback,
  processDriverPayout,
  refundPayment,
};
