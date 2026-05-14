import type { PlaceSearchInput } from '@wasalni/schemas';
import type { ApiClient } from '../client';

export interface PlaceSearchResult {
  id: string;
  name: string;
  description?: string;
  longitude: number;
  latitude: number;
}

export class PlacesEndpoints {
  constructor(private readonly client: ApiClient) {}

  search(input: PlaceSearchInput): Promise<PlaceSearchResult[]> {
    const params = new URLSearchParams({
      q: input.query,
      limit: String(input.limit ?? 8),
    });
    if (input.near) {
      params.set('lat', String(input.near.latitude));
      params.set('lng', String(input.near.longitude));
    }
    return this.client.get(`/location/search?${params.toString()}`);
  }
}
