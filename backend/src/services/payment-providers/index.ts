import { CashPaymentProvider } from './cash.provider';
import { FawryProvider } from './fawry.provider';
import { InstaPayProvider } from './instapay.provider';
import { MobileWalletProvider } from './mobile-wallet.provider';
import { PaymobPaymentProvider } from './paymob.provider';
import type { PaymentProvider, PaymentProviderId } from './types';

const registry: Map<PaymentProviderId, PaymentProvider> = new Map();

const register = (provider: PaymentProvider): void => {
  registry.set(provider.id, provider);
};

register(new CashPaymentProvider());
register(new PaymobPaymentProvider());
register(new MobileWalletProvider('vodafone_cash'));
register(new MobileWalletProvider('orange_cash'));
register(new MobileWalletProvider('etisalat_cash'));
register(new MobileWalletProvider('we_pay'));
register(new InstaPayProvider());
register(new FawryProvider());

export const getPaymentProvider = (id: PaymentProviderId): PaymentProvider | null =>
  registry.get(id) || null;

export const listPaymentProviders = (filterConfigured = false): PaymentProvider[] => {
  const all = Array.from(registry.values());
  return filterConfigured ? all.filter((p) => p.isConfigured()) : all;
};

export const listEnabledProviderIds = (): PaymentProviderId[] => {
  const enabled = (process.env.PAYMENT_PROVIDERS_ENABLED || 'cash,paymob,vodafone_cash,instapay')
    .split(',')
    .map((s) => s.trim()) as PaymentProviderId[];
  return enabled.filter((id) => registry.has(id));
};

export * from './types';
