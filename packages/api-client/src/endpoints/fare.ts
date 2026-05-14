import type { FareEstimateInput } from '@wasalni/schemas';
import type { IFareBreakdown, VehicleType } from '@wasalni/shared-types';
import type { ApiClient } from '../client';

export interface FareEstimate {
  /** Breakdown for the chosen ride type. */
  breakdown: IFareBreakdown;
  /** Estimated trip distance in km. */
  distance: number;
  /** Estimated duration in minutes. */
  duration: number;
  /** Polyline (encoded) of the suggested route. */
  polyline?: string;
  /** Surge multiplier in effect. */
  surgeMultiplier: number;
}

export interface FareEstimateResponse {
  /** Estimates per vehicle type. */
  options: Array<{
    rideType: VehicleType;
    estimate: FareEstimate;
  }>;
}

export class FareEndpoints {
  constructor(private readonly client: ApiClient) {}

  estimate(input: FareEstimateInput): Promise<FareEstimateResponse> {
    return this.client.post('/fare/estimate', input);
  }
}
