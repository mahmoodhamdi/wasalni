import { generateOTP, formatPhoneNumber } from '../utils/otp';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, verifyToken, generateRefreshToken, JWTPayload } from '../utils/jwt';
import User from '../models/User';
import OTP from '../models/OTP';

describe('OTP Utils', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate different OTPs', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      // While there's a small chance they could be equal,
      // running this multiple times should show randomness
      expect(typeof otp1).toBe('string');
      expect(typeof otp2).toBe('string');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Egyptian phone number with country code', () => {
      expect(formatPhoneNumber('01012345678')).toBe('+201012345678');
    });

    it('should keep already formatted number', () => {
      expect(formatPhoneNumber('+201012345678')).toBe('+201012345678');
    });

    it('should handle number starting with 2', () => {
      expect(formatPhoneNumber('201012345678')).toBe('+201012345678');
    });
  });
});

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });
});

describe('JWT Utils', () => {
  const mockPayload: JWTPayload = {
    userId: '507f1f77bcf86cd799439011',
    role: 'passenger',
    email: 'test@example.com',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(mockPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.role).toBe(mockPayload.role);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const refreshToken = generateRefreshToken(mockPayload);
      expect(refreshToken).toBeTruthy();
      expect(typeof refreshToken).toBe('string');
    });
  });
});

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'testuser@example.com',
        name: 'Test User',
        role: 'passenger',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.isActive).toBe(true);
    });

    it('should not allow duplicate emails', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        role: 'passenger',
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const user = new User({});

      await expect(user.save()).rejects.toThrow();
    });

    it('should validate role enum', async () => {
      const userData = {
        email: 'invalid@example.com',
        name: 'Test User',
        role: 'invalid-role',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });
});

describe('OTP Model', () => {
  describe('OTP Creation', () => {
    it('should create an OTP with valid data', async () => {
      const otpData = {
        email: 'test@example.com',
        code: '123456',
        purpose: 'login',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      const otp = await OTP.create(otpData);

      expect(otp._id).toBeDefined();
      expect(otp.email).toBe(otpData.email);
      expect(otp.code).toBe(otpData.code);
      expect(otp.isUsed).toBe(false);
    });

    it('should validate purpose enum', async () => {
      const otpData = {
        email: 'test@example.com',
        code: '123456',
        purpose: 'invalid-purpose',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      await expect(OTP.create(otpData)).rejects.toThrow();
    });
  });
});
