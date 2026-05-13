import type {
  PaymentChargeParams,
  PaymentChargeResult,
  PaymentProvider,
} from './types';

/**
 * Cash provider — first-class.
 * 70%+ of rides in Egyptian secondary cities settle in cash.
 * The driver collects from passenger; the platform accrues commission debt
 * against the driver's wallet (settled weekly via Instapay/Fawry).
 */
export class CashPaymentProvider implements PaymentProvider {
  id = 'cash' as const;
  displayName = { en: 'Cash', ar: 'كاش' };
  capabilities = {
    supportsRefund: false,
    supportsWebhook: false,
    supportsTopUp: false,
    cashOnDelivery: true,
    popularInRuralEgypt: true,
  };

  isConfigured(): boolean {
    return true;
  }

  async charge(params: PaymentChargeParams): Promise<PaymentChargeResult> {
    return {
      ok: true,
      providerTransactionId: `cash:${params.tripId}`,
      cashCollectionExpected: true,
      message: 'Cash collection required from passenger by driver',
      messageAr: 'يجب تحصيل المبلغ نقداً من الراكب بواسطة السائق',
    };
  }
}
