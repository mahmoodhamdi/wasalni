import type {
  RequestOtpInput,
  VerifyOtpInput,
  PassengerRegisterInput,
  DriverRegisterInput,
} from '@wasalni/schemas';
import type { IPassenger, IDriver } from '@wasalni/shared-types';
import type { ApiClient } from '../client';

export interface AuthSession {
  token: string;
  user: IPassenger | IDriver;
}

export interface OtpRequestResponse {
  /** Seconds before the user can request another OTP. */
  retryAfter: number;
  /** True iff the backend masked the OTP in dev mode. */
  testMode?: boolean;
}

/**
 * Auth endpoint group. The web apps call these via the Next.js Route Handler
 * proxy (which sets the cookie); the proxy itself calls the backend via the
 * server-side ApiClient with no cookie.
 */
export class AuthEndpoints {
  constructor(private readonly client: ApiClient) {}

  requestOtp(input: RequestOtpInput): Promise<OtpRequestResponse> {
    return this.client.post('/auth/otp/request', input);
  }

  verifyOtp(input: VerifyOtpInput): Promise<AuthSession> {
    return this.client.post('/auth/otp/verify', input);
  }

  registerPassenger(input: PassengerRegisterInput): Promise<AuthSession> {
    return this.client.post('/auth/register/passenger', input);
  }

  registerDriver(input: DriverRegisterInput): Promise<AuthSession> {
    return this.client.post('/auth/register/driver', input);
  }

  me(): Promise<IPassenger | IDriver> {
    return this.client.get('/auth/me');
  }

  logout(): Promise<void> {
    return this.client.post('/auth/logout');
  }

  updateProfile(input: {
    name?: string;
    email?: string;
    gender?: 'male' | 'female';
    avatar?: string;
  }): Promise<IPassenger | IDriver> {
    return this.client.patch('/auth/profile', input);
  }

  registerFcmToken(token: string, platform: 'web' | 'android' | 'ios' = 'web'): Promise<void> {
    return this.client.post('/auth/fcm-token', { token, platform });
  }
}
