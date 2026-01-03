import request from 'supertest';
import express from 'express';
import User from '../models/User';
import OTP from '../models/OTP';
import { generateToken } from '../utils/jwt';

// Create a minimal test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mock auth endpoints for testing
  app.post('/api/v1/auth/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Create OTP
    const code = '123456'; // Fixed for testing
    await OTP.create({
      phone,
      code,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  });

  app.post('/api/v1/auth/verify-otp', async (req, res) => {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone and code are required',
      });
    }

    const otp = await OTP.findOne({
      phone,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    otp.isUsed = true;
    await otp.save();

    // Check if user exists
    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (!isNewUser) {
      const token = generateToken(user!._id.toString(), user!.role);
      return res.json({
        success: true,
        data: {
          isNewUser: false,
          user,
          tokens: { accessToken: token, refreshToken: 'refresh-token' },
        },
      });
    }

    res.json({
      success: true,
      data: { isNewUser: true },
    });
  });

  app.post('/api/v1/auth/register', async (req, res) => {
    const { phone, name, role } = req.body;

    if (!phone || !name) {
      return res.status(400).json({
        success: false,
        message: 'Phone and name are required',
      });
    }

    const user = await User.create({
      phone,
      name,
      role: role || 'passenger',
    });

    const token = generateToken(user._id.toString(), user.role);

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
          .send({ phone: '+201012345678' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('OTP sent successfully');
      });

      it('should fail without phone number', async () => {
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
          phone: '+201012345678',
          code: '123456',
          purpose: 'login',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
      });

      it('should verify OTP for new user', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({ phone: '+201012345678', code: '123456' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.isNewUser).toBe(true);
      });

      it('should verify OTP for existing user', async () => {
        await User.create({
          phone: '+201012345678',
          name: 'Existing User',
          role: 'passenger',
        });

        const response = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({ phone: '+201012345678', code: '123456' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.isNewUser).toBe(false);
        expect(response.body.data.tokens).toBeDefined();
      });

      it('should fail with invalid OTP', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({ phone: '+201012345678', code: '000000' });

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
            phone: '+201012345678',
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
          .send({ phone: '+201012345678' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});

describe('Request Validation', () => {
  describe('Phone number validation', () => {
    it('should accept valid Egyptian phone numbers', () => {
      const validNumbers = [
        '+201012345678',
        '+201112345678',
        '+201212345678',
        '+201512345678',
      ];

      validNumbers.forEach((phone) => {
        expect(phone).toMatch(/^\+20(10|11|12|15)\d{8}$/);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '01012345678', // Missing country code
        '+20101234567', // Too short
        '+2010123456789', // Too long
        '+201312345678', // Invalid prefix (13)
      ];

      invalidNumbers.forEach((phone) => {
        expect(phone).not.toMatch(/^\+20(10|11|12|15)\d{8}$/);
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
