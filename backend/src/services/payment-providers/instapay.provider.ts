import type {
  PaymentChargeParams,
  PaymentChargeResult,
  PaymentProvider,
} from './types';

/**
 * InstaPay (Central Bank of Egypt instant payments network).
 * Used heavily for driver-to-platform commission settlements and
 * passenger top-ups in cities where card penetration is low.
 *
 * Integration goes through a partner bank's InstaPay API.
 */
export class InstaPayProvider implements PaymentProvider {
  id = 'instapay' as const;
  displayName = { en: 'InstaPay', ar: 'إنستا باي' };
  capabilities = {
    supportsRefund: true,
    supportsWebhook: true,
    supportsTopUp: true,
    cashOnDelivery: false,
    popularInRuralEgypt: true,
  };

  isConfigured(): boolean {
    return Boolean(process.env.INSTAPAY_PARTNER_API_KEY);
  }

  async charge(params: PaymentChargeParams): Promise<PaymentChargeResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: 'InstaPay partner bank not configured',
        messageAr: 'لم يتم تهيئة إنستا باي',
      };
    }

    const ref = `IP-${Date.now()}-${params.tripId.slice(-6)}`;
    return {
      ok: true,
      providerTransactionId: ref,
      redirectUrl: `instapay://transfer?amount=${params.amount}&ref=${ref}&recipient=wasalni`,
      message: 'InstaPay transfer pending confirmation',
      messageAr: 'في انتظار تأكيد تحويل إنستا باي',
    };
  }
}
