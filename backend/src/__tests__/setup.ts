import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    geoadd: jest.fn(),
    georadius: jest.fn(),
    geopos: jest.fn(),
    hset: jest.fn(),
    hget: jest.fn(),
    hdel: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn(() => ({
    send: jest.fn().mockResolvedValue('message-id'),
    sendEach: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
  })),
}));

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
