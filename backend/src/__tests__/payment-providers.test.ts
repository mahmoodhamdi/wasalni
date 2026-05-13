import {
  getPaymentProvider,
  listPaymentProviders,
  listEnabledProviderIds,
} from '../services/payment-providers';

describe('Payment Provider Registry', () => {
  it('registers all 8 providers (cash, paymob, 4 wallets, instapay, fawry)', () => {
    const all = listPaymentProviders(false);
    expect(all.length).toBe(8);
    const ids = all.map((p) => p.id).sort();
    expect(ids).toEqual([
      'cash',
      'etisalat_cash',
      'fawry',
      'instapay',
      'orange_cash',
      'paymob',
      'vodafone_cash',
      'we_pay',
    ]);
  });

  it('cash provider is always configured and supports COD', async () => {
    const cash = getPaymentProvider('cash');
    expect(cash).not.toBeNull();
    expect(cash!.isConfigured()).toBe(true);
    expect(cash!.capabilities.cashOnDelivery).toBe(true);
    const res = await cash!.charge({
      tripId: '650000000000000000000001',
      userId: '650000000000000000000002',
      amount: 25,
      currency: 'EGP',
      description: 'Test',
      customerPhone: '+201111111111',
      customerName: 'Test User',
    });
    expect(res.ok).toBe(true);
    expect(res.cashCollectionExpected).toBe(true);
  });

  it('wallet provider reports correct display names per Egyptian carrier', () => {
    const v = getPaymentProvider('vodafone_cash');
    const o = getPaymentProvider('orange_cash');
    expect(v?.displayName.en).toBe('Vodafone Cash');
    expect(o?.displayName.en).toBe('Orange Money');
  });

  it('paymob reports correct capabilities for cards', () => {
    const p = getPaymentProvider('paymob');
    expect(p?.capabilities.supportsRefund).toBe(true);
    expect(p?.capabilities.supportsWebhook).toBe(true);
  });

  it('listEnabledProviderIds honors PAYMENT_PROVIDERS_ENABLED env var', () => {
    const oldEnv = process.env.PAYMENT_PROVIDERS_ENABLED;
    process.env.PAYMENT_PROVIDERS_ENABLED = 'cash,fawry';
    const enabled = listEnabledProviderIds();
    expect(enabled).toEqual(['cash', 'fawry']);
    if (oldEnv !== undefined) {
      process.env.PAYMENT_PROVIDERS_ENABLED = oldEnv;
    } else {
      delete process.env.PAYMENT_PROVIDERS_ENABLED;
    }
  });

  it('rural-Egypt providers include cash, wallets, instapay, fawry', () => {
    const rural = listPaymentProviders(false).filter((p) => p.capabilities.popularInRuralEgypt);
    const ids = rural.map((p) => p.id).sort();
    expect(ids).toContain('cash');
    expect(ids).toContain('vodafone_cash');
    expect(ids).toContain('instapay');
    expect(ids).toContain('fawry');
  });
});
