import mongoose from 'mongoose';
import { config } from '../config';
import { seedUsers } from './users.seed';
import { seedDrivers } from './drivers.seed';
import { seedPassengers } from './passengers.seed';
import { seedTrips } from './trips.seed';
import { seedZones } from './zones.seed';
import { seedFareSettings } from './fareSettings.seed';
import { seedPromos } from './promos.seed';
import { seedDriverLocations } from './driverLocations.seed';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color: string = COLORS.reset): void {
  console.log(`${color}${message}${COLORS.reset}`);
}

async function seed(): Promise<void> {
  try {
    log('\n🌱 Starting database seeding...', COLORS.cyan);

    // Connect to MongoDB
    log('\n📦 Connecting to MongoDB...', COLORS.blue);
    await mongoose.connect(config.mongodbUri);
    log('✅ Connected to MongoDB', COLORS.green);

    // Check for --fresh flag
    if (process.argv.includes('--fresh')) {
      log('\n🗑️  Dropping database (--fresh flag detected)...', COLORS.yellow);
      await mongoose.connection.dropDatabase();
      log('✅ Database cleared', COLORS.green);
    }

    // Seed data in order (dependencies matter)
    log('\n👤 Seeding users...', COLORS.blue);
    const users = await seedUsers();
    log(`✅ ${users.length} users created`, COLORS.green);

    log('\n🚗 Seeding drivers...', COLORS.blue);
    const drivers = await seedDrivers(users);
    log(`✅ ${drivers.length} drivers created`, COLORS.green);

    log('\n📍 Seeding driver locations...', COLORS.blue);
    const driverLocationsCount = await seedDriverLocations(drivers);
    log(`✅ ${driverLocationsCount} driver locations created`, COLORS.green);

    log('\n👥 Seeding passengers...', COLORS.blue);
    const passengers = await seedPassengers(users);
    log(`✅ ${passengers.length} passengers created`, COLORS.green);

    log('\n📍 Seeding zones...', COLORS.blue);
    const zones = await seedZones();
    log(`✅ ${zones.length} zones created`, COLORS.green);

    log('\n💰 Seeding fare settings...', COLORS.blue);
    const fareSettings = await seedFareSettings();
    log(`✅ ${fareSettings.length} fare settings created`, COLORS.green);

    log('\n🎟️  Seeding promo codes...', COLORS.blue);
    const promos = await seedPromos();
    log(`✅ ${promos.length} promo codes created`, COLORS.green);

    log('\n🚕 Seeding trips...', COLORS.blue);
    const trips = await seedTrips(passengers, drivers);
    log(`✅ ${trips.length} trips created`, COLORS.green);

    // Print summary
    printSummary();

    log('\n🎉 Seeding complete!', COLORS.green);
    process.exit(0);
  } catch (error) {
    log(`\n❌ Seeding failed: ${error}`, COLORS.red);
    console.error(error);
    process.exit(1);
  }
}

function printSummary(): void {
  console.log(`
${COLORS.cyan}${COLORS.bright}
===========================================
📊 SEED DATA SUMMARY
===========================================
${COLORS.reset}
${COLORS.magenta}👤 Admin:${COLORS.reset}
   Email: admin@wasalni.com
   Password: admin123

${COLORS.blue}👥 Passengers (5 Active):${COLORS.reset}
   passenger1@test.com / 123456 - أحمد محمد (wallet ₤250)
   passenger2@test.com / 123456 - سارة أحمد (wallet ₤100)
   passenger3@test.com / 123456 - محمود علي
   passenger4@test.com / 123456 - فاطمة حسن (wallet ₤500)
   passenger5@test.com / 123456 - عمر خالد

${COLORS.green}🚗 Approved Drivers (5):${COLORS.reset}
   driver1@test.com / 123456 - محمد السائق (Online, Economy)
   driver2@test.com / 123456 - علي السائق (Online, Comfort)
   driver3@test.com / 123456 - حسن السائق (Offline, Family)
   driver4@test.com / 123456 - أحمد السائق (On Trip, Economy)
   driver5@test.com / 123456 - كريم السائق (Offline, Comfort)

${COLORS.yellow}⏳ Pending Drivers (3):${COLORS.reset}
   driver.pending1@test.com / 123456 - يوسف السائق
   driver.pending2@test.com / 123456 - إبراهيم السائق
   driver.pending3@test.com / 123456 - مصطفى السائق

${COLORS.red}🚫 Suspended:${COLORS.reset}
   suspended.driver@test.com - سائق موقوف
   suspended.passenger@test.com - راكب موقوف

${COLORS.cyan}🚕 Trips:${COLORS.reset}
   - 5 Completed (with ratings)
   - 3 Active (pending, arriving, in_progress)
   - 2 Cancelled (1 by passenger, 1 by driver)
   - 1 Scheduled (tomorrow)

${COLORS.magenta}🎟️  Promo Codes:${COLORS.reset}
   WELCOME50  - 50% off (max ₤30) - First trip only
   SAVE20     - 20% off (max ₤50) - General use
   FLAT25     - ₤25 off flat discount
   VIP100     - 100% off family rides (VIP)
   WEEKEND30  - 30% off weekend special
   RAMADAN    - 25% off Ramadan special
   TUKTUK10   - ₤10 off tuktuk rides
   AIRPORT15  - 15% off airport trips
   EXPIRED    - (For testing expired promos)
   SOLDOUT    - (For testing max uses reached)

${COLORS.green}💰 Fare Settings (5 vehicle types):${COLORS.reset}
   Economy    - Base: ₤10, Per km: ₤3, Min: ₤15
   Comfort    - Base: ₤15, Per km: ₤4, Min: ₤20
   Family     - Base: ₤20, Per km: ₤5, Min: ₤25
   TukTuk     - Base: ₤5,  Per km: ₤2, Min: ₤8
   Motorcycle - Base: ₤7,  Per km: ₤2.5, Min: ₤10

${COLORS.blue}📍 Service Zones (11):${COLORS.reset}
   Downtown Cairo, Heliopolis, Maadi, 6th October,
   New Cairo, Cairo Airport, Giza, Nasr City,
   Zamalek, Dokki, Bagour (Primary)

${COLORS.yellow}🔐 OTP for ALL users: 123456${COLORS.reset}
   (When SMS_PROVIDER=mock in .env)

${COLORS.cyan}===========================================
${COLORS.reset}
  `);
}

// Run seed
seed();
