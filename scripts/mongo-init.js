// MongoDB Initialization Script
// This script runs when MongoDB container starts for the first time

db = db.getSiblingDB('wasalni');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['phone', 'name', 'role'],
      properties: {
        phone: { bsonType: 'string', description: 'Phone number is required' },
        name: { bsonType: 'string', description: 'Name is required' },
        role: { enum: ['passenger', 'driver', 'admin'], description: 'Role must be passenger, driver, or admin' }
      }
    }
  }
});

db.createCollection('trips');
db.createCollection('faresettings');
db.createCollection('promocodes');
db.createCollection('transactions');
db.createCollection('notifications');
db.createCollection('zones');
db.createCollection('settings');

// Create indexes
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

db.trips.createIndex({ passenger: 1 });
db.trips.createIndex({ driver: 1 });
db.trips.createIndex({ status: 1 });
db.trips.createIndex({ createdAt: -1 });
db.trips.createIndex({ 'pickup.location': '2dsphere' });
db.trips.createIndex({ 'dropoff.location': '2dsphere' });

db.promocodes.createIndex({ code: 1 }, { unique: true });
db.promocodes.createIndex({ validUntil: 1 });

db.transactions.createIndex({ user: 1 });
db.transactions.createIndex({ createdAt: -1 });

db.notifications.createIndex({ user: 1 });
db.notifications.createIndex({ createdAt: -1 });

db.zones.createIndex({ polygon: '2dsphere' });

// Insert default fare settings
db.faresettings.insertMany([
  {
    vehicleType: 'economy',
    baseFare: 10,
    perKmRate: 3,
    perMinuteRate: 0.5,
    minimumFare: 15,
    cancellationFee: 5,
    waitingFeePerMinute: 0.5,
    freeWaitingMinutes: 5,
    platformFeePercentage: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    vehicleType: 'comfort',
    baseFare: 15,
    perKmRate: 4,
    perMinuteRate: 0.7,
    minimumFare: 20,
    cancellationFee: 7,
    waitingFeePerMinute: 0.7,
    freeWaitingMinutes: 5,
    platformFeePercentage: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    vehicleType: 'family',
    baseFare: 20,
    perKmRate: 5,
    perMinuteRate: 0.8,
    minimumFare: 25,
    cancellationFee: 10,
    waitingFeePerMinute: 0.8,
    freeWaitingMinutes: 5,
    platformFeePercentage: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    vehicleType: 'tuktuk',
    baseFare: 5,
    perKmRate: 2,
    perMinuteRate: 0.3,
    minimumFare: 8,
    cancellationFee: 3,
    waitingFeePerMinute: 0.3,
    freeWaitingMinutes: 5,
    platformFeePercentage: 15,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    vehicleType: 'motorcycle',
    baseFare: 7,
    perKmRate: 2.5,
    perMinuteRate: 0.4,
    minimumFare: 10,
    cancellationFee: 4,
    waitingFeePerMinute: 0.4,
    freeWaitingMinutes: 3,
    platformFeePercentage: 15,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert default admin user
db.users.insertOne({
  phone: '+201000000000',
  name: 'مدير النظام',
  email: 'admin@wasalni.com',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.Hxz/P5VQXB5K1e', // admin123
  role: 'admin',
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert default zone (Bagour area)
db.zones.insertOne({
  name: 'Bagour',
  nameAr: 'الباجور',
  polygon: {
    type: 'Polygon',
    coordinates: [[
      [30.85, 30.35],
      [31.05, 30.35],
      [31.05, 30.55],
      [30.85, 30.55],
      [30.85, 30.35]
    ]]
  },
  isActive: true,
  surgeMultiplier: 1.0,
  isHighDemand: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');
