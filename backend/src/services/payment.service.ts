import axios from 'axios';
import crypto from 'crypto';
import { Types } from 'mongoose';
import Payment, { IPayment, PaymentStatus } from '../models/Payment';
import User from '../models/User';
import Trip from '../models/Trip';
import Transaction from '../models/Transaction';
import Driver from '../models/Driver';
import { logger } from '../utils/logger';
import { config } from '../config';

// Paymob API base URL
const PAYMOB_API_URL = 'https://accept.paymob.com/api';

// Paymob Config Interface
interface PaymobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  hmacSecret: string;
  walletIntegrationId?: string;
}

// Paymob Webhook Data Interface
interface PaymobWebhookData {
  id: number;
  pending: boolean;
  amount_cents: number;
  success: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  is_refunded: boolean;
  is_3d_secure: boolean;
  integration_id: number;
  has_parent_transaction: boolean;
  created_at: string;
  currency: string;
  error_occured: boolean;
  owner: number;
  order: {
    id: number;
    created_at: string;
    delivery_needed: boolean;
    merchant: { id: number };
    collector: null;
    amount_cents: number;
    shipping_data: Record<string, unknown>;
    currency: string;
  };
  source_data: {
    type: string;
    pan: string;
    sub_type: string;
  };
  data?: {
    message?: string;
    txn_response_code?: string;
  };
}

class PaymentService {
  private config: PaymobConfig;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.PAYMOB_API_KEY || '',
      integrationId: process.env.PAYMOB_INTEGRATION_ID || '',
      iframeId: process.env.PAYMOB_IFRAME_ID || '',
      hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
      walletIntegrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID,
    };
  }

  /**
   * Check if Paymob is configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.integrationId && this.config.iframeId);
  }

  /**
   * Step 1: Get authentication token from Paymob
   */
  async getAuthToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.authToken;
    }

    try {
      const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
        api_key: this.config.apiKey,
      });

      this.authToken = response.data.token;
      // Token expires in 1 hour, set expiry to 55 minutes for safety
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

      logger.info('Paymob auth token obtained');
      return this.authToken as string;
    } catch (error: any) {
      logger.error(`Failed to get Paymob auth token: ${error.message}`);
      throw new Error('فشل الاتصال ببوابة الدفع');
    }
  }

  /**
   * Step 2: Create an order in Paymob
   */
  async createOrder(
    amount: number,
    currency: string = 'EGP',
    merchantOrderId?: string
  ): Promise<number> {
    const authToken = await this.getAuthToken();

    try {
      const response = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency,
        merchant_order_id: merchantOrderId,
        items: [],
      });

      logger.info(`Paymob order created: ${response.data.id}`);
      return response.data.id;
    } catch (error: any) {
      logger.error(`Failed to create Paymob order: ${error.message}`);
      throw new Error('فشل إنشاء طلب الدفع');
    }
  }

  /**
   * Step 3: Get payment key for the payment form
   */
  async getPaymentKey(params: {
    orderId: number;
    amount: number;
    currency?: string;
    user: { email: string; name: string; phone?: string };
    billingData?: Record<string, string>;
    integrationId?: string;
  }): Promise<string> {
    const authToken = await this.getAuthToken();
    if (!authToken) {
      throw new Error('Failed to get auth token');
    }

    const nameParts = params.user.name.split(' ');
    const firstName = nameParts[0] || 'N/A';
    const lastName = nameParts.slice(1).join(' ') || 'N/A';

    const billingData = params.billingData || {
      email: params.user.email,
      first_name: firstName,
      last_name: lastName,
      phone_number: params.user.phone || '+201000000000',
      street: 'N/A',
      building: 'N/A',
      floor: 'N/A',
      apartment: 'N/A',
      city: 'Bagour',
      country: 'EG',
      state: 'Monufia',
      postal_code: '00000',
      shipping_method: 'N/A',
    };

    try {
      const response = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: Math.round(params.amount * 100),
        expiration: 3600, // 1 hour
        order_id: params.orderId,
        billing_data: billingData,
        currency: params.currency || 'EGP',
        integration_id: parseInt(params.integrationId || this.config.integrationId),
        lock_order_when_paid: true,
      });

      logger.info(`Paymob payment key generated for order ${params.orderId}`);
      return response.data.token;
    } catch (error: any) {
      logger.error(`Failed to get Paymob payment key: ${error.message}`);
      throw new Error('فشل إنشاء مفتاح الدفع');
    }
  }

  /**
   * Get complete payment URL for redirect
   */
  async getPaymentUrl(params: {
    amount: number;
    userId: Types.ObjectId;
    tripId?: Types.ObjectId;
    type: 'trip_payment' | 'wallet_topup';
    currency?: string;
  }): Promise<{ paymentUrl: string; paymentId: Types.ObjectId; orderId: number }> {
    const user = await User.findById(params.userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    // Create order in Paymob
    const merchantOrderId = `${params.type}_${params.userId}_${Date.now()}`;
    const orderId = await this.createOrder(params.amount, params.currency, merchantOrderId);

    // Get payment key
    const paymentKey = await this.getPaymentKey({
      orderId,
      amount: params.amount,
      currency: params.currency,
      user: {
        email: user.email,
        name: user.name,
        phone: (user as any).phone,
      },
    });

    // Create payment record
    const payment = await Payment.create({
      userId: params.userId,
      tripId: params.tripId,
      type: params.type,
      amount: params.amount,
      currency: params.currency || 'EGP',
      status: 'pending',
      paymentMethod: 'card',
      paymobOrderId: orderId,
      paymobPaymentKey: paymentKey,
    });

    // Build payment URL
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`;

    logger.info(`Payment URL generated for user ${params.userId}, payment ${payment._id}`);

    return {
      paymentUrl,
      paymentId: payment._id,
      orderId,
    };
  }

  /**
   * Verify Paymob webhook HMAC signature
   */
  verifyWebhookSignature(data: PaymobWebhookData, receivedHmac: string): boolean {
    // Concatenate fields in specific order for HMAC calculation
    const concatenated = [
      data.amount_cents,
      data.created_at,
      data.currency,
      data.error_occured,
      data.has_parent_transaction,
      data.id,
      data.integration_id,
      data.is_3d_secure,
      data.is_auth,
      data.is_capture,
      data.is_refunded,
      data.is_standalone_payment,
      data.is_voided,
      data.order?.id,
      data.owner,
      data.pending,
      data.source_data?.pan,
      data.source_data?.sub_type,
      data.source_data?.type,
      data.success,
    ].join('');

    const calculatedHmac = crypto
      .createHmac('sha512', this.config.hmacSecret)
      .update(concatenated)
      .digest('hex');

    return calculatedHmac === receivedHmac;
  }

  /**
   * Process Paymob webhook callback
   */
  async processWebhook(data: PaymobWebhookData, hmac: string): Promise<IPayment | null> {
    // Verify HMAC
    if (!this.verifyWebhookSignature(data, hmac)) {
      logger.warn('Invalid Paymob webhook HMAC');
      throw new Error('Invalid HMAC signature');
    }

    // Find payment by order ID
    const payment = await Payment.findOne({ paymobOrderId: data.order?.id });
    if (!payment) {
      logger.warn(`Payment not found for Paymob order ${data.order?.id}`);
      return null;
    }

    // Update payment status based on webhook data
    const newStatus: PaymentStatus = data.success ? 'completed' : 'failed';

    payment.status = newStatus;
    payment.paymobTransactionId = data.id.toString();

    if (data.source_data) {
      payment.cardLastFour = data.source_data.pan;
      payment.cardBrand = data.source_data.sub_type;
    }

    if (!data.success && data.data) {
      payment.errorCode = data.data.txn_response_code;
      payment.errorMessage = data.data.message;
    }

    await payment.save();

    // Process successful payment
    if (data.success) {
      await this.processSuccessfulPayment(payment);
    }

    logger.info(`Payment ${payment._id} updated to ${newStatus}`);
    return payment;
  }

  /**
   * Process successful payment (update wallet, trip, etc.)
   */
  private async processSuccessfulPayment(payment: IPayment): Promise<void> {
    const userId = payment.userId;

    if (payment.type === 'wallet_topup') {
      // Credit wallet
      await User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.balance': payment.amount },
      });

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'wallet_topup',
        amount: payment.amount,
        description: 'شحن المحفظة عبر البطاقة',
        descriptionAr: 'شحن المحفظة عبر البطاقة',
        referenceId: payment._id,
        referenceType: 'Payment',
      });

      logger.info(`Wallet topped up for user ${userId}: +${payment.amount} EGP`);
    } else if (payment.type === 'trip_payment' && payment.tripId) {
      // Update trip payment status
      await Trip.findByIdAndUpdate(payment.tripId, {
        paymentStatus: 'paid',
        paymentMethod: 'card',
        paymentId: payment._id,
      });

      logger.info(`Trip ${payment.tripId} marked as paid`);
    }
  }

  /**
   * Pay for a trip using card
   */
  async payForTrip(
    tripId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<{ paymentUrl: string; paymentId: Types.ObjectId }> {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error('الرحلة غير موجودة');
    }

    if ((trip as any).paymentStatus === 'paid') {
      throw new Error('تم دفع هذه الرحلة مسبقاً');
    }

    const amount = (trip as any).fare?.total || 0;
    if (amount <= 0) {
      throw new Error('مبلغ الرحلة غير صالح');
    }

    const result = await this.getPaymentUrl({
      amount,
      userId,
      tripId,
      type: 'trip_payment',
    });

    return {
      paymentUrl: result.paymentUrl,
      paymentId: result.paymentId,
    };
  }

  /**
   * Top up wallet using card
   */
  async topUpWallet(
    userId: Types.ObjectId,
    amount: number
  ): Promise<{ paymentUrl: string; paymentId: Types.ObjectId }> {
    if (amount < 10) {
      throw new Error('الحد الأدنى لشحن المحفظة هو 10 جنيه');
    }

    if (amount > 5000) {
      throw new Error('الحد الأقصى لشحن المحفظة هو 5000 جنيه');
    }

    const result = await this.getPaymentUrl({
      amount,
      userId,
      type: 'wallet_topup',
    });

    return {
      paymentUrl: result.paymentUrl,
      paymentId: result.paymentId,
    };
  }

  /**
   * Pay for trip using wallet balance
   */
  async payWithWallet(tripId: Types.ObjectId, userId: Types.ObjectId): Promise<IPayment> {
    const [trip, user] = await Promise.all([
      Trip.findById(tripId),
      User.findById(userId),
    ]);

    if (!trip) {
      throw new Error('الرحلة غير موجودة');
    }

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if ((trip as any).paymentStatus === 'paid') {
      throw new Error('تم دفع هذه الرحلة مسبقاً');
    }

    const amount = (trip as any).fare?.total || 0;
    const walletBalance = (user as any).wallet?.balance || 0;

    if (walletBalance < amount) {
      throw new Error('رصيد المحفظة غير كافي');
    }

    // Deduct from wallet
    await User.findByIdAndUpdate(userId, {
      $inc: { 'wallet.balance': -amount },
    });

    // Create payment record
    const payment = await Payment.create({
      userId,
      tripId,
      type: 'trip_payment',
      amount,
      status: 'completed',
      paymentMethod: 'wallet',
    });

    // Update trip
    await Trip.findByIdAndUpdate(tripId, {
      paymentStatus: 'paid',
      paymentMethod: 'wallet',
      paymentId: payment._id,
    });

    // Create transaction record
    await Transaction.create({
      userId,
      type: 'trip_payment',
      amount: -amount,
      description: `دفع رحلة #${(trip as any).tripNumber}`,
      descriptionAr: `دفع رحلة #${(trip as any).tripNumber}`,
      referenceId: tripId,
      referenceType: 'Trip',
    });

    logger.info(`Trip ${tripId} paid with wallet by user ${userId}`);
    return payment;
  }

  /**
   * Process driver payout
   */
  async processDriverPayout(
    driverId: Types.ObjectId,
    amount: number,
    adminUserId?: Types.ObjectId
  ): Promise<IPayment> {
    const driver = await Driver.findById(driverId).populate('userId');
    if (!driver) {
      throw new Error('السائق غير موجود');
    }

    const driverWallet = (driver as any).wallet || 0;
    if (driverWallet < amount) {
      throw new Error('رصيد السائق غير كافي');
    }

    // Deduct from driver wallet
    await Driver.findByIdAndUpdate(driverId, {
      $inc: { wallet: -amount },
    });

    // Create payout record
    const payment = await Payment.create({
      userId: driver.userId,
      type: 'driver_payout',
      amount,
      status: 'completed',
      paymentMethod: 'cash', // Or bank transfer
      metadata: {
        processedBy: adminUserId,
        driverId,
      },
    });

    // Create transaction record
    await Transaction.create({
      userId: driver.userId,
      type: 'driver_withdrawal',
      amount: -amount,
      description: 'سحب أرباح',
      descriptionAr: 'سحب أرباح',
      referenceId: payment._id,
      referenceType: 'Payment',
    });

    logger.info(`Driver payout processed: ${driverId} - ${amount} EGP`);
    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: Types.ObjectId): Promise<IPayment | null> {
    return Payment.findById(paymentId);
  }

  /**
   * Get user payment history
   */
  async getPaymentHistory(
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
  ): Promise<{ payments: IPayment[]; total: number; pages: number }> {
    const [payments, total] = await Promise.all([
      Payment.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('tripId', 'tripNumber pickup dropoff'),
      Payment.countDocuments({ userId }),
    ]);

    return {
      payments,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: Types.ObjectId): Promise<number> {
    const user = await User.findById(userId).select('wallet');
    return (user as any)?.wallet?.balance || 0;
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: Types.ObjectId,
    reason?: string
  ): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('الدفعة غير موجودة');
    }

    if (payment.status !== 'completed') {
      throw new Error('لا يمكن استرداد هذه الدفعة');
    }

    // For card payments, we would need to call Paymob refund API
    // For wallet payments, credit back to wallet
    if (payment.paymentMethod === 'wallet') {
      await User.findByIdAndUpdate(payment.userId, {
        $inc: { 'wallet.balance': payment.amount },
      });
    }

    // Update payment status
    payment.status = 'refunded';
    payment.metadata = {
      ...payment.metadata,
      refundReason: reason,
      refundedAt: new Date(),
    };
    await payment.save();

    // Create refund transaction record
    await Transaction.create({
      userId: payment.userId,
      type: 'refund',
      amount: payment.amount,
      description: reason || 'استرداد دفعة',
      descriptionAr: reason || 'استرداد دفعة',
      referenceId: payment._id,
      referenceType: 'Payment',
    });

    logger.info(`Payment ${paymentId} refunded`);
    return payment;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
