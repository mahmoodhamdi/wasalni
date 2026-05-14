import type {
  RequestOtpInput,
  VerifyOtpInput,
  PassengerRegisterInput,
  DriverRegisterInput,
} from '@wasalni/schemas';
import type { IPassenger, IDriver } from '@wasalni/shared-types';
import type { ApiClient } from '../client';
import { ApiError } from '../errors';

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

// Backend response shapes (email-OTP API the backend exposes today).
interface BackendTokens {
  accessToken: string;
  refreshToken: string;
}
interface BackendVerifyResp {
  user: IPassenger | IDriver;
  tokens: BackendTokens;
}
interface BackendRegisterResp {
  user: IPassenger | IDriver;
  tokens: BackendTokens;
  isNewDriver?: boolean;
}
interface BackendSendOtpResp {
  expiresIn: number;
}

/**
 * The web apps speak phone+OTP, but the backend currently exposes an
 * email-based OTP flow. This adapter maps every phone-based call to its
 * email-based equivalent by synthesising a deterministic pseudo-email
 * (`<digits>@phone.wasalni.local`) and a derived password used only for
 * the backend account record. The end user never sees either.
 */
function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}
function synthEmail(phone: string): string {
  return `${digitsOnly(phone)}@phone.wasalni.local`;
}
function synthPassword(phone: string): string {
  // The backend stores this; user never types it. Deterministic from the
  // phone so re-registration is idempotent in dev.
  return `phone-${digitsOnly(phone)}-otpauth`;
}

/**
 * Auth endpoint group. The web apps call these via the Next.js Route Handler
 * proxy (which sets the cookie); the proxy itself calls the backend via the
 * server-side ApiClient with no cookie.
 */
export class AuthEndpoints {
  constructor(private readonly client: ApiClient) {}

  async requestOtp(input: RequestOtpInput): Promise<OtpRequestResponse> {
    const email = synthEmail(input.phone);
    // Try login OTP first (existing user). If backend says "no account",
    // fall back to a registration OTP so the user can sign up.
    try {
      const r = await this.client.post<BackendSendOtpResp>('/auth/send-otp', {
        email,
        purpose: 'login',
      });
      return { retryAfter: r.expiresIn ?? 60 };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        const r = await this.client.post<BackendSendOtpResp>('/auth/send-otp', {
          email,
          purpose: 'registration',
        });
        return { retryAfter: r.expiresIn ?? 60 };
      }
      throw err;
    }
  }

  async verifyOtp(input: VerifyOtpInput): Promise<AuthSession> {
    const email = synthEmail(input.phone);
    // Try login verification first. If the user doesn't exist yet the
    // backend's verifyLoginOTP throws NotFound (404) — translate that to
    // a 404 the proxy forwards (signal: "go register"). If the OTP itself
    // is wrong the backend throws 400, which surfaces as a 400 to the UI.
    try {
      const r = await this.client.post<BackendVerifyResp>('/auth/verify-otp', {
        email,
        otp: input.otp,
      });
      return { token: r.tokens.accessToken, user: r.user };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Confirm the OTP is valid against the registration purpose so a
        // bad OTP can't sneak past as a "new-user" signal.
        await this.client.post('/auth/verify-registration-otp', {
          email,
          otp: input.otp,
        });
        // Re-throw 404 to tell the proxy: valid OTP, but no account yet.
        throw err;
      }
      throw err;
    }
  }

  async registerPassenger(input: PassengerRegisterInput): Promise<AuthSession> {
    const email = input.email && input.email.length > 0 ? input.email : synthEmail(input.phone);
    const r = await this.client.post<BackendRegisterResp>('/auth/register/passenger', {
      email,
      password: synthPassword(input.phone),
      name: input.name,
      phone: input.phone,
      gender: input.gender,
    });
    return { token: r.tokens.accessToken, user: r.user };
  }

  async registerDriver(input: DriverRegisterInput): Promise<AuthSession> {
    const email = input.email && input.email.length > 0 ? input.email : synthEmail(input.phone);
    const r = await this.client.post<BackendRegisterResp>('/auth/register/driver', {
      email,
      password: synthPassword(input.phone),
      name: input.name,
      phone: input.phone,
      nationalId: input.nationalId,
      vehicleType: input.vehicleType === 'tuktuk' || input.vehicleType === 'motorcycle'
        ? input.vehicleType
        : 'car',
      vehicleCategory: input.vehicleType === 'tuktuk' || input.vehicleType === 'motorcycle'
        ? 'economy'
        : input.vehicleType,
      vehicle: input.vehicle,
    });
    return { token: r.tokens.accessToken, user: r.user };
  }

  me(): Promise<IPassenger | IDriver> {
    // Backend exposes the current user at /auth/profile.
    return this.client.get('/auth/profile');
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
    // Backend uses PUT for profile updates.
    return this.client.put('/auth/profile', input);
  }

  registerFcmToken(token: string, _platform: 'web' | 'android' | 'ios' = 'web'): Promise<void> {
    // Backend uses PUT for fcm-token updates. Platform is recorded server-side.
    return this.client.put('/auth/fcm-token', { fcmToken: token });
  }
}
