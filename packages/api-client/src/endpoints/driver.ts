import type { ApiClient } from '../client';
import type { DriverOnlineStatus } from '@wasalni/shared-types';

export interface DriverEarningsSummary {
  today: number;
  week: number;
  month: number;
  pendingPayout: number;
  totalTrips: number;
}

export class DriverEndpoints {
  constructor(private readonly client: ApiClient) {}

  setStatus(status: DriverOnlineStatus): Promise<{ status: DriverOnlineStatus }> {
    return this.client.post('/driver/status', { status });
  }

  earningsSummary(): Promise<DriverEarningsSummary> {
    return this.client.get('/driver/earnings/summary');
  }
}
