import { describe, expect, it } from 'vitest';
import {
  requestOtpSchema,
  verifyOtpSchema,
  passengerRegisterSchema,
  driverRegisterSchema,
} from '../src/auth';

describe('requestOtpSchema', () => {
  it('accepts valid EG phone and normalises to E.164', () => {
    const r = requestOtpSchema.parse({ phone: '01012345678' });
    expect(r.phone).toBe('+201012345678');
  });
  it('rejects invalid phone', () => {
    expect(() => requestOtpSchema.parse({ phone: '123' })).toThrow();
  });
});

describe('verifyOtpSchema', () => {
  it('accepts a 4-6 digit OTP', () => {
    expect(verifyOtpSchema.parse({ phone: '01012345678', otp: '123456' }).otp).toBe('123456');
  });
  it('rejects non-numeric OTP', () => {
    expect(() => verifyOtpSchema.parse({ phone: '01012345678', otp: 'abcd' })).toThrow();
  });
  it('rejects OTP of wrong length', () => {
    expect(() => verifyOtpSchema.parse({ phone: '01012345678', otp: '12' })).toThrow();
    expect(() => verifyOtpSchema.parse({ phone: '01012345678', otp: '1234567' })).toThrow();
  });
});

describe('passengerRegisterSchema', () => {
  it('accepts minimal passenger registration', () => {
    const r = passengerRegisterSchema.parse({ phone: '01012345678', name: 'Ali' });
    expect(r.name).toBe('Ali');
    expect(r.phone).toBe('+201012345678');
  });
  it('rejects too-short name', () => {
    expect(() => passengerRegisterSchema.parse({ phone: '01012345678', name: 'a' })).toThrow();
  });
  it('accepts empty email string', () => {
    const r = passengerRegisterSchema.parse({
      phone: '01012345678',
      name: 'Ali',
      email: '',
    });
    expect(r.email === '' || r.email === undefined).toBe(true);
  });
  it('rejects malformed email', () => {
    expect(() =>
      passengerRegisterSchema.parse({
        phone: '01012345678',
        name: 'Ali',
        email: 'not-an-email',
      }),
    ).toThrow();
  });
});

describe('driverRegisterSchema', () => {
  const valid = {
    phone: '01012345678',
    name: 'Mohamed',
    gender: 'male' as const,
    nationalId: '12345678901234',
    vehicleType: 'economy' as const,
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'White',
      plateNumber: 'AAA 123',
    },
  };
  it('accepts a full driver payload', () => {
    expect(() => driverRegisterSchema.parse(valid)).not.toThrow();
  });
  it('rejects 13-digit national id', () => {
    expect(() => driverRegisterSchema.parse({ ...valid, nationalId: '1234567890123' })).toThrow();
  });
  it('rejects vehicle year before 1990', () => {
    expect(() =>
      driverRegisterSchema.parse({ ...valid, vehicle: { ...valid.vehicle, year: 1989 } }),
    ).toThrow();
  });
});
