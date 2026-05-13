import paymentService from '../payment.service';
import { Types } from 'mongoose';
import type {
  PaymentChargeParams,
  PaymentChargeResult,
  PaymentProvider,
  PaymentWebhookResult,
} from './types';

/**
 * Paymob adapter — wraps the existing PaymentService to expose
 * the standard PaymentProvider interface so other providers can be added.
 */
export class PaymobPaymentProvider implements PaymentProvider {
  id = 'paymob' as const;
  displayName = { en: 'Card (Paymob)', ar: 'بطاقة (بايموب)' };
  capabilities = {
    supportsRefund: true,
    supportsWebhook: true,
    supportsTopUp: true,
    cashOnDelivery: false,
    popularInRuralEgypt: false,
  };

  isConfigured(): boolean {
    return paymentService.isConfigured();
  }

  async charge(params: PaymentChargeParams): Promise<PaymentChargeResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: 'Paymob not configured for this deployment',
        messageAr: 'بايموب غير مهيأ في هذا التطبيق',
      };
    }

    try {
      const result = await paymentService.getPaymentUrl({
        tripId: new Types.ObjectId(params.tripId),
        userId: new Types.ObjectId(params.userId),
        amount: params.amount,
        type: 'trip_payment',
        currency: params.currency,
      });
      return {
        ok: true,
        redirectUrl: result.paymentUrl,
        providerTransactionId: String(result.orderId),
        message: 'Redirect customer to Paymob iframe',
        messageAr: 'أعد توجيه العميل إلى صفحة الدفع',
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Paymob charge failed',
        messageAr: 'فشل تنفيذ الدفع عبر بايموب',
      };
    }
  }

  parseWebhook(payload: unknown): PaymentWebhookResult {
    const data = payload as { obj?: { id?: number; success?: boolean; amount_cents?: number } };
    const obj = data?.obj;
    return {
      matched: Boolean(obj?.id),
      providerTransactionId: obj?.id ? String(obj.id) : undefined,
      status: obj?.success ? 'succeeded' : 'failed',
      amount: obj?.amount_cents ? obj.amount_cents / 100 : undefined,
      raw: payload,
    };
  }
}
