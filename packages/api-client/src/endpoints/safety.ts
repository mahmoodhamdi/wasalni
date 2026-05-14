import type { EmergencyContactInput, SosTriggerInput } from '@wasalni/schemas';
import type { IEmergencyContact } from '@wasalni/shared-types';
import type { ApiClient } from '../client';

export class SafetyEndpoints {
  constructor(private readonly client: ApiClient) {}

  sos(input: SosTriggerInput): Promise<{ ok: true; alertId: string }> {
    return this.client.post('/safety/sos', input);
  }

  listContacts(): Promise<IEmergencyContact[]> {
    return this.client.get('/safety/contacts');
  }

  addContact(input: EmergencyContactInput): Promise<IEmergencyContact> {
    return this.client.post('/safety/contacts', input);
  }

  updateContact(id: string, input: EmergencyContactInput): Promise<IEmergencyContact> {
    return this.client.put(`/safety/contacts/${id}`, input);
  }

  deleteContact(id: string): Promise<{ ok: true }> {
    return this.client.delete(`/safety/contacts/${id}`);
  }
}
