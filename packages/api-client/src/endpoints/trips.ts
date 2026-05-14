import type { BookTripInput, CancelTripInput, RatingInput } from '@wasalni/schemas';
import type { ITrip } from '@wasalni/shared-types';
import type { ApiClient } from '../client';

export interface TripPage {
  items: ITrip[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export class TripsEndpoints {
  constructor(private readonly client: ApiClient) {}

  book(input: BookTripInput): Promise<ITrip> {
    return this.client.post('/trips', input);
  }

  byId(tripId: string): Promise<ITrip> {
    return this.client.get(`/trips/${tripId}`);
  }

  list(page = 1, limit = 20): Promise<TripPage> {
    return this.client.get(`/trips?page=${page}&limit=${limit}`);
  }

  cancel(input: CancelTripInput): Promise<ITrip> {
    return this.client.post(`/trips/${input.tripId}/cancel`, input);
  }

  rate(input: RatingInput): Promise<ITrip> {
    return this.client.post(`/trips/${input.tripId}/rate`, input);
  }
}
