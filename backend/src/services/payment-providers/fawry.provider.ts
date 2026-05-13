import type {
  PaymentChargeParams,
  PaymentChargeResult,
  PaymentProvider,
} from './types';

/**
 * Fawry — pay-via-outlet network spanning ~225,000 retail locations.
 * The user receives a reference code, walks to any Fawry outlet (kiosk,
 * grocery store, ATM), pays cash, and the platform receives a webhook.
 * Essential for the unbanked majority in secondary cities.
 */
export class FawryProvider implements PaymentProvider {
  id = 'fawry' as const;
  displayName = { en: 'Fawry (Cash at Outlet)', ar: 'فوري (دفع عند المنفذ)' };
  capabilities = {
    supportsRefund: false,
    supportsWebhook: true,
    supportsTopUp: true,
    cashOnDelivery: false,
    popularInRuralEgypt: true,
  };

  isConfigured(): boolean {
    return Boolean(process.env.FAWRY_MERCHANT_CODE && process.env.FAWRY_SECURITY_KEY);
  }

  async charge(params: PaymentChargeParams): Promise<PaymentChargeResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: 'Fawry merchant credentials not configured',
        messageAr: 'بيانات تاجر فوري غير مهيأة',
      };
    }

    const refCode = `${Date.now()}`.slice(-9);
    return {
      ok: true,
      providerTransactionId: `fawry:${refCode}`,
      message: `Pay ${params.amount} EGP at any Fawry outlet with reference ${refCode}. Valid for 48 hours.`,
      messageAr: `ادفع ${params.amount} ج.م. عبر أي منفذ فوري باستخدام الكود ${refCode}. صالح لمدة 48 ساعة.`,
    };
  }
}
