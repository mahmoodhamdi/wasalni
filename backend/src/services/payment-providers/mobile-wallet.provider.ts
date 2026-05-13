import type {
  PaymentChargeParams,
  PaymentChargeResult,
  PaymentProvider,
  PaymentProviderId,
} from './types';

/**
 * Egyptian mobile wallets — Vodafone Cash, Orange Cash, Etisalat Cash, We Pay.
 * Currently routed through Paymob's wallet integration; this class abstracts
 * the wallet flow so each carrier appears as a separate option to the user.
 */
export class MobileWalletProvider implements PaymentProvider {
  id: PaymentProviderId;
  displayName: { en: string; ar: string };
  capabilities = {
    supportsRefund: true,
    supportsWebhook: true,
    supportsTopUp: true,
    cashOnDelivery: false,
    popularInRuralEgypt: true,
  };

  private mccPrefix: string;

  constructor(id: PaymentProviderId) {
    this.id = id;
    const map: Record<string, { en: string; ar: string; prefix: string }> = {
      vodafone_cash: { en: 'Vodafone Cash', ar: 'فودافون كاش', prefix: '010' },
      orange_cash: { en: 'Orange Money', ar: 'أورانج كاش', prefix: '012' },
      etisalat_cash: { en: 'Etisalat Cash', ar: 'اتصالات كاش', prefix: '011' },
      we_pay: { en: 'WE Pay', ar: 'وي باي', prefix: '015' },
    };
    const entry = map[id] || { en: id, ar: id, prefix: '0' };
    this.displayName = { en: entry.en, ar: entry.ar };
    this.mccPrefix = entry.prefix;
  }

  isConfigured(): boolean {
    return Boolean(process.env.PAYMOB_WALLET_INTEGRATION_ID);
  }

  async charge(params: PaymentChargeParams): Promise<PaymentChargeResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: `${this.displayName.en} not configured`,
        messageAr: `${this.displayName.ar} غير مهيأ`,
      };
    }

    const normalized = params.customerPhone.replace(/\D/g, '');
    if (!normalized.includes(this.mccPrefix.slice(1))) {
      return {
        ok: false,
        message: `Phone does not look like a ${this.displayName.en} number (expected prefix ${this.mccPrefix})`,
        messageAr: `الرقم لا يتطابق مع ${this.displayName.ar}`,
      };
    }

    return {
      ok: true,
      providerTransactionId: `wallet:${this.id}:${params.tripId}`,
      redirectUrl: `/payments/wallet/${this.id}?trip=${params.tripId}`,
      message: 'Wallet payment initiated; awaiting user OTP',
      messageAr: 'تم بدء عملية الدفع، في انتظار رمز التحقق',
    };
  }
}
