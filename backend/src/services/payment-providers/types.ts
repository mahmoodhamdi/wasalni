export type PaymentProviderId =
  | 'cash'
  | 'paymob'
  | 'vodafone_cash'
  | 'orange_cash'
  | 'etisalat_cash'
  | 'we_pay'
  | 'instapay'
  | 'fawry';

export interface PaymentChargeParams {
  tripId: string;
  userId: string;
  amount: number; // EGP
  currency: 'EGP';
  description: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentChargeResult {
  ok: boolean;
  providerTransactionId?: string;
  redirectUrl?: string;
  cashCollectionExpected?: boolean;
  message?: string;
  messageAr?: string;
}

export interface PaymentRefundParams {
  providerTransactionId: string;
  amount: number;
  reason?: string;
}

export interface PaymentRefundResult {
  ok: boolean;
  refundId?: string;
  message?: string;
}

export interface PaymentWebhookResult {
  matched: boolean;
  providerTransactionId?: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  amount?: number;
  raw?: unknown;
}

export interface PaymentProviderCapabilities {
  supportsRefund: boolean;
  supportsWebhook: boolean;
  supportsTopUp: boolean;
  cashOnDelivery: boolean;
  popularInRuralEgypt: boolean;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  displayName: { en: string; ar: string };
  capabilities: PaymentProviderCapabilities;
  isConfigured(): boolean;
  charge(params: PaymentChargeParams): Promise<PaymentChargeResult>;
  verifyWebhook?(rawBody: string | Buffer, signature: string): boolean;
  parseWebhook?(payload: unknown): PaymentWebhookResult;
  refund?(params: PaymentRefundParams): Promise<PaymentRefundResult>;
}
