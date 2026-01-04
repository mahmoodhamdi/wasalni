import mongoose from 'mongoose';
import { config } from '../config';
import { seedUsers } from './users.seed';
import { seedDrivers } from './drivers.seed';
import { seedPassengers } from './passengers.seed';
import { seedTrips } from './trips.seed';
import { seedZones } from './zones.seed';
import { seedFareSettings } from './fareSettings.seed';
import { seedPromos } from './promos.seed';

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
   Phone: +201000000000
   Email: admin@wasalni.com
   Password: admin123

${COLORS.blue}👥 Passengers (6):${COLORS.reset}
   +201111111111 - أحمد محمد (Active, has wallet ₤250)
   +201111111112 - سارة أحمد (Active, has wallet ₤100)
   +201111111113 - محمود علي (Active)
   +201111111114 - فاطمة حسن (Active, has wallet ₤500)
   +201111111115 - عمر خالد (Active)
   +201111111116 - راكب موقوف (Suspended)

${COLORS.green}🚗 Approved Drivers (5):${COLORS.reset}
   +201222222221 - محمد السائق (Online, Economy, Rating: 4.8)
   +201222222222 - علي السائق (Online, Comfort, Rating: 4.5)
   +201222222223 - حسن السائق (Offline, Family, Rating: 4.9)
   +201222222224 - أحمد السائق (On Trip, Economy, Rating: 4.3)
   +201222222225 - كريم السائق (Offline, Comfort, Rating: 4.6)

${COLORS.yellow}⏳ Pending Drivers (3):${COLORS.reset}
   +201333333331 - يوسف السائق (Economy)
   +201333333332 - إبراهيم السائق (Comfort)
   +201333333333 - مصطفى السائق (TukTuk)

${COLORS.red}🚫 Suspended Driver (1):${COLORS.reset}
   +201444444444 - سائق موقوف (Rating: 3.2)

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
