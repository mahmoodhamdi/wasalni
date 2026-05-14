import type { ApiClient } from '../client';
import type { ITransaction } from '@wasalni/shared-types';

export interface WalletSummary {
  balance: number;
  pendingPayout: number;
  recentTransactions: ITransaction[];
}

export interface WithdrawInput {
  amount: number;
  /** Optional payout method id. */
  method?: string;
}

export class WalletEndpoints {
  constructor(private readonly client: ApiClient) {}

  summary(): Promise<WalletSummary> {
    return this.client.get('/wallet');
  }

  transactions(
    page = 1,
    limit = 20,
  ): Promise<{
    items: ITransaction[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  }> {
    return this.client.get(`/wallet/transactions?page=${page}&limit=${limit}`);
  }

  withdraw(input: WithdrawInput): Promise<{ ok: true; reference: string }> {
    return this.client.post('/wallet/withdraw', input);
  }
}

export class PromosEndpoints {
  constructor(private readonly client: ApiClient) {}

  validate(code: string): Promise<{
    valid: boolean;
    code: string;
    discountPercent?: number;
    discountFixed?: number;
    description?: string;
  }> {
    return this.client.get(`/promo/validate?code=${encodeURIComponent(code)}`);
  }
}
