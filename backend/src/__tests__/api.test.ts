import request from 'supertest';
import express from 'express';
import User from '../models/User';
import OTP from '../models/OTP';
import { generateAccessToken, JWTPayload } from '../utils/jwt';

// Create a minimal test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Mock auth endpoints for testing (email-based)
  app.post('/api/v1/auth/send-otp', async (req, res): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
        messageAr: 'البريد الإلكتروني مطلوب',
      });
      return;
    }

    // Create OTP
    const code = '123456'; // Fixed for testing
    await OTP.create({
      email,
      code,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      messageAr: 'تم إرسال رمز التحقق بنجاح',
    });
  });

  app.post('/api/v1/auth/verify-otp', async (req, res): Promise<void> => {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        message: 'Email and code are required',
        messageAr: 'البريد الإلكتروني والرمز مطلوبان',
      });
      return;
    }

    const otp = await OTP.findOne({
      email,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        messageAr: 'رمز التحقق غير صالح أو منتهي الصلاحية',
      });
      return;
    }

    otp.isUsed = true;
    await otp.save();

    // Check if user exists
    const user = await User.findOne({ email });
    const isNewUser = !user;

    if (!isNewUser) {
      const payload: JWTPayload = {
        userId: user!._id.toString(),
        role: user!.role,
        email: user!.email || email,
      };
      const token = generateAccessToken(payload);
      res.json({
        success: true,
        data: {
          isNewUser: false,
          user,
          tokens: { accessToken: token, refreshToken: 'refresh-token' },
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { isNewUser: true },
    });
  });

  app.post('/api/v1/auth/register', async (req, res): Promise<void> => {
    const { email, name, role } = req.body;

    if (!email || !name) {
      res.status(400).json({
        success: false,
        message: 'Email and name are required',
        messageAr: 'البريد الإلكتروني والاسم مطلوبان',
      });
      return;
    }

    const user = await User.create({
      email,
      name,
      role: role || 'passenger',
    });

    const payload: JWTPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email || email,
    };
    const token = generateAccessToken(payload);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens: { accessToken: token, refreshToken: 'refresh-token' },
      },
    });
  });

  return app;
};

describe('API Endpoints', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Auth Endpoints', () => {
    describe('POST /api/v1/auth/send-otp', () => {
      it('should send OTP successfully', async () => {
        const response = await request(app)
          .post('/api/v1/auth/send-otp')
          .send({ email: 'test@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('OTP sent successfully');
      });

      it('should fail without email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/send-otp')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/verify-otp', () => {
      beforeEach(async () => {
        await OTP.create({
          email: 'test@example.com',
          code: '123456',
          purpose: 'login',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
      });

      it('should verify OTP for new user', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({ email: 'test@example.com', code: '123456' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.isNewUser).toBe(true);
      });

      it('should verify OTP for existing user', async () => {
        await User.create({
          email: 'test@example.com',
          name: 'Existing User',
          role: 'passenger',
        });

        const response = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({ email: 'test@example.com', code: '123456' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.isNewUser).toBe(false);
        expect(response.body.data.tokens).toBeDefined();
      });

      it('should fail with invalid OTP', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({ email: 'test@example.com', code: '000000' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail without required fields', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/register', () => {
      it('should register new user', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'newuser@example.com',
            name: 'Test User',
            role: 'passenger',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.name).toBe('Test User');
        expect(response.body.data.tokens).toBeDefined();
      });

      it('should fail without required fields', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({ email: 'newuser@example.com' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});

describe('Request Validation', () => {
  describe('Email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@example.org',
      ];

      validEmails.forEach((email) => {
        expect(email).toMatch(/^\S+@\S+\.\S+$/);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@nodomain.com',
        'no@domain',
      ];

      invalidEmails.forEach((email) => {
        expect(email).not.toMatch(/^\S+@\S+\.\S+$/);
      });
    });
  });

  describe('Coordinates validation', () => {
    it('should validate Egyptian coordinates', () => {
      // Egypt bounding box approximately
      const egyptBounds = {
        minLat: 22.0,
        maxLat: 31.7,
        minLng: 25.0,
        maxLng: 35.0,
      };

      const validCoordinates = [
        { lat: 30.0444, lng: 31.2357 }, // Cairo
        { lat: 31.2001, lng: 29.9187 }, // Alexandria
        { lat: 30.0626, lng: 31.2497 }, // Giza
      ];

      validCoordinates.forEach(({ lat, lng }) => {
        expect(lat).toBeGreaterThanOrEqual(egyptBounds.minLat);
        expect(lat).toBeLessThanOrEqual(egyptBounds.maxLat);
        expect(lng).toBeGreaterThanOrEqual(egyptBounds.minLng);
        expect(lng).toBeLessThanOrEqual(egyptBounds.maxLng);
      });
    });
  });
});
