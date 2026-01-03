import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wasalni',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // OTP
  otp: {
    expiresIn: parseInt(process.env.OTP_EXPIRES_IN || '5', 10), // minutes
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Google Maps
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  // SMS
  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    fromNumber: process.env.SMS_FROM_NUMBER,
  },

  // App Settings
  app: {
    defaultCommission: parseInt(process.env.DEFAULT_COMMISSION || '20', 10),
    bookingFee: parseInt(process.env.BOOKING_FEE || '3', 10),
    maxSearchRadius: parseInt(process.env.MAX_SEARCH_RADIUS || '5', 10), // km
    driverSearchTimeout: parseInt(
      process.env.DRIVER_SEARCH_TIMEOUT || '60',
      10
    ), // seconds
    cancellationFee: parseInt(process.env.CANCELLATION_FEE || '10', 10),
    freeCancellationMinutes: parseInt(
      process.env.FREE_CANCELLATION_MINUTES || '2',
      10
    ),
    sosPhone: process.env.SOS_PHONE || '122',
    supportPhone: process.env.SUPPORT_PHONE || '01000000000',
    frontendUrl: process.env.FRONTEND_URL || 'https://wasalni.app',
  },

  // Fare Settings
  fare: {
    economy: {
      baseFare: parseFloat(process.env.BASE_FARE_ECONOMY || '10'),
      perKm: parseFloat(process.env.PER_KM_ECONOMY || '3'),
      perMinute: parseFloat(process.env.PER_MINUTE_ECONOMY || '0.5'),
      minimumFare: parseFloat(process.env.MINIMUM_FARE_ECONOMY || '15'),
    },
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
};

export default config;
