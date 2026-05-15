/**
 * Bagour Demo Seeder — investor / sales demo data
 *
 * Run: npm run seed:bagour
 *      npm run seed:bagour:fresh  (drops DB first)
 *
 * Populates a realistic mini-economy in Bagour (~25K residents),
 * highlighting the moat features: Tuk-Tuk + Motorcycle.
 *
 * Counts:
 *   - 40 drivers (15 economy, 8 comfort, 5 family, 10 tuk-tuk, 5 motorcycle)
 *   - 80 passengers
 *   - 200 trips across all states + payment methods
 *   - 3 admins (super_admin, ops_manager, support_agent)
 */

import mongoose, { Types } from 'mongoose';
// bcrypt removed — User model's pre-save hook handles hashing
import dayjs from 'dayjs';
import { config } from '../config';
import { Driver, Passenger, Trip, User } from '../models';
import { logger } from '../utils/logger';

const BAGOUR_CENTER = { lat: 30.5167, lng: 30.7167 };

const BAGOUR_LANDMARKS: Array<{ name_ar: string; lat: number; lng: number }> = [
  { name_ar: 'وسط الباجور - شارع الجمهورية', lat: 30.5167, lng: 30.7167 },
  { name_ar: 'حي المعلمين', lat: 30.519, lng: 30.7185 },
  { name_ar: 'شارع الجلاء', lat: 30.515, lng: 30.713 },
  { name_ar: 'محطة قطار الباجور', lat: 30.514, lng: 30.717 },
  { name_ar: 'سوق الباجور المركزي', lat: 30.5175, lng: 30.7175 },
  { name_ar: 'مستشفى الباجور المركزي', lat: 30.5195, lng: 30.7195 },
  { name_ar: 'مدرسة الباجور الثانوية', lat: 30.518, lng: 30.716 },
  { name_ar: 'مسجد الجمعة', lat: 30.5205, lng: 30.7185 },
  { name_ar: 'كفر الباجور', lat: 30.495, lng: 30.704 },
  { name_ar: 'طملاي', lat: 30.547, lng: 30.732 },
  { name_ar: 'شنوان', lat: 30.503, lng: 30.745 },
  { name_ar: 'البتانون', lat: 30.495, lng: 30.722 },
  { name_ar: 'ميت أبو الكوم', lat: 30.536, lng: 30.755 },
  { name_ar: 'ميت خاقان', lat: 30.49, lng: 30.748 },
  { name_ar: 'عشما', lat: 30.553, lng: 30.69 },
  { name_ar: 'سرباي', lat: 30.491, lng: 30.69 },
  { name_ar: 'دملاج', lat: 30.508, lng: 30.685 },
];

const DRIVER_FIRST_NAMES = [
  'محمد', 'أحمد', 'علي', 'حسن', 'حسين', 'إبراهيم', 'يوسف', 'كريم',
  'طارق', 'رمضان', 'شعبان', 'عمرو', 'خالد', 'مصطفى', 'محمود',
  'سامي', 'وائل', 'ياسر', 'فتحي', 'عبدالله', 'هشام', 'عماد', 'مدحت',
  'صلاح', 'جمال', 'فاروق', 'سعد', 'بهاء', 'علاء', 'حاتم',
];
const DRIVER_LAST_NAMES = [
  'عبدالله', 'إبراهيم', 'السيد', 'طاهر', 'محمد', 'الباجوري', 'المنوفي',
  'حسن', 'علي', 'متولي', 'سلامة', 'البنا', 'فهمي', 'الشاذلي',
];

const PASSENGER_FIRST_NAMES_M = ['محمد', 'أحمد', 'علي', 'محمود', 'حسن', 'مصطفى', 'كريم', 'عمر'];
const PASSENGER_FIRST_NAMES_F = ['فاطمة', 'مريم', 'عائشة', 'زينب', 'هدى', 'منى', 'سلمى', 'دينا'];

const VEHICLE_MAKES_ECONOMY = [
  { make: 'Chevrolet', model: 'Lanos', years: [2010, 2018] },
  { make: 'Hyundai', model: 'Verna', years: [2012, 2020] },
  { make: 'Nissan', model: 'Sunny', years: [2014, 2022] },
];
const VEHICLE_MAKES_COMFORT = [
  { make: 'Toyota', model: 'Yaris', years: [2019, 2023] },
  { make: 'Hyundai', model: 'Elantra', years: [2020, 2024] },
];
const VEHICLE_MAKES_FAMILY = [
  { make: 'Toyota', model: 'Avanza', years: [2018, 2024] },
  { make: 'Hyundai', model: 'Tucson', years: [2019, 2024] },
];

const COLORS = ['أبيض', 'أسود', 'فضي', 'رمادي', 'أحمر', 'أزرق غامق'];

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const phoneFor = (i: number) => `+201${String(2000_0000 + i).padStart(8, '0')}`;
const arabicPlate = () => `${rand(['أ', 'ب', 'ج', 'د', 'ه', 'و'])} ${rand(['ا', 'ب', 'ج', 'د'])} ${rand(['ك', 'ل', 'م', 'ن'])} ${randInt(1000, 9999)}`;
const motorcyclePlate = () => `${rand(['أ', 'ب', 'ج'])} ${rand(['د', 'ه'])} ${randInt(100, 999)}`;

const jitterLocation = (
  base: { lat: number; lng: number },
  meters = 1500
): { lat: number; lng: number } => {
  const dLat = (Math.random() - 0.5) * (meters / 111000);
  const dLng = (Math.random() - 0.5) * (meters / 95000);
  return { lat: base.lat + dLat, lng: base.lng + dLng };
};

interface DriverSeedSpec {
  vehicleCategory: 'economy' | 'comfort' | 'family' | 'tuktuk' | 'motorcycle';
  vehicleType: 'car' | 'tuktuk' | 'motorcycle';
  count: number;
}

const DRIVER_DISTRIBUTION: DriverSeedSpec[] = [
  { vehicleCategory: 'economy', vehicleType: 'car', count: 15 },
  { vehicleCategory: 'comfort', vehicleType: 'car', count: 8 },
  { vehicleCategory: 'family', vehicleType: 'car', count: 5 },
  { vehicleCategory: 'tuktuk', vehicleType: 'tuktuk', count: 10 },
  { vehicleCategory: 'motorcycle', vehicleType: 'motorcycle', count: 5 },
];

async function clearBagourData(): Promise<void> {
  await User.deleteMany({ email: /@wasalni\.demo$/ });
  await Driver.deleteMany({});
  await Passenger.deleteMany({});
  await Trip.deleteMany({});
}

async function seedAdmins(): Promise<void> {
  // The User pre-save hook hashes plain passwords; passing a pre-hashed
  // value would double-hash it and break login.
  const password = 'Demo123!@#';
  const admins = [
    { name: 'مدير عام النظام', email: 'admin@wasalni.demo', role: 'admin' },
    { name: 'مدير العمليات', email: 'ops@wasalni.demo', role: 'admin' },
    { name: 'دعم العملاء', email: 'support@wasalni.demo', role: 'admin' },
  ];
  for (const a of admins) {
    await User.create({
      ...a,
      phone: phoneFor(9990 + admins.indexOf(a)),
      password,
      isActive: true,
      isVerified: true,
    });
  }
  console.log(`  ✓ 3 admins created (admin@/ops@/support@wasalni.demo, password: Demo123!@#)`);
}

async function seedDrivers(): Promise<Types.ObjectId[]> {
  const password = 'Demo123!@#';
  const driverIds: Types.ObjectId[] = [];
  let idx = 0;

  for (const spec of DRIVER_DISTRIBUTION) {
    for (let i = 0; i < spec.count; i++) {
      const fullName = `${rand(DRIVER_FIRST_NAMES)} ${rand(DRIVER_LAST_NAMES)}`;
      const phone = phoneFor(100 + idx);
      const email = `driver${idx + 1}@wasalni.demo`;
      const user = await User.create({
        name: fullName,
        email,
        phone,
        password,
        role: 'driver',
        isActive: true,
        isVerified: true,
      });

      let vehicleInfo: { make: string; model: string; year: number } = {
        make: 'TukTuk',
        model: 'Bajaj RE',
        year: randInt(2017, 2023),
      };
      if (spec.vehicleCategory === 'economy') {
        const pick = rand(VEHICLE_MAKES_ECONOMY);
        vehicleInfo = { make: pick.make, model: pick.model, year: randInt(pick.years[0], pick.years[1]) };
      } else if (spec.vehicleCategory === 'comfort') {
        const pick = rand(VEHICLE_MAKES_COMFORT);
        vehicleInfo = { make: pick.make, model: pick.model, year: randInt(pick.years[0], pick.years[1]) };
      } else if (spec.vehicleCategory === 'family') {
        const pick = rand(VEHICLE_MAKES_FAMILY);
        vehicleInfo = { make: pick.make, model: pick.model, year: randInt(pick.years[0], pick.years[1]) };
      } else if (spec.vehicleCategory === 'motorcycle') {
        vehicleInfo = { make: 'TVS', model: 'Apache', year: randInt(2018, 2024) };
      }

      const initialLocation = jitterLocation(BAGOUR_CENTER, 5000);

      const driver = await Driver.create({
        userId: user._id,
        status: 'approved',
        isOnline: Math.random() < 0.5,
        isAvailable: true,
        isBusy: false,
        currentLocation: {
          type: 'Point',
          coordinates: [initialLocation.lng, initialLocation.lat],
        },
        heading: randInt(0, 359),
        vehicle: {
          type: spec.vehicleType,
          // Driver model's `category` enum is limited to ride categories
          // (economy/comfort/family). Tuktuks + motorbikes count as economy.
          category:
            spec.vehicleCategory === 'tuktuk' || spec.vehicleCategory === 'motorcycle'
              ? 'economy'
              : spec.vehicleCategory,
          ...vehicleInfo,
          color: rand(COLORS),
          plateNumber: spec.vehicleType === 'motorcycle' ? motorcyclePlate() : arabicPlate(),
          seats: spec.vehicleCategory === 'motorcycle' ? 1 : spec.vehicleCategory === 'family' ? 7 : 4,
        },
        documents: {
          nationalIdFront: 'https://placehold.co/400x300?text=NID-Front',
          nationalIdBack: 'https://placehold.co/400x300?text=NID-Back',
          // 14 digits: century(2) + year(2) + month(2) + day(2) + serial(5) + checksum(1)
          nationalIdNumber: `29${randInt(80, 99)}${String(randInt(1, 12)).padStart(2, '0')}${String(randInt(1, 28)).padStart(2, '0')}${randInt(10000, 99999)}${randInt(0, 9)}`,
          drivingLicenseFront: 'https://placehold.co/400x300?text=License',
          drivingLicenseExpiry: dayjs().add(randInt(180, 720), 'day').toDate(),
          vehicleLicenseFront: 'https://placehold.co/400x300?text=Vehicle+License',
          vehicleLicenseExpiry: dayjs().add(randInt(180, 720), 'day').toDate(),
          vehicleInsurance: 'https://placehold.co/400x300?text=Insurance',
          allVerified: true,
          verifiedAt: dayjs().subtract(randInt(30, 365), 'day').toDate(),
        },
        rating: randFloat(3.2, 5.0),
        totalRides: randInt(20, 500),
        totalEarnings: randInt(500, 25000),
        walletBalance: randInt(-2000, 2000),
        approvedAt: dayjs().subtract(randInt(30, 365), 'day').toDate(),
      });
      driverIds.push(driver._id);
      idx++;
    }
  }
  console.log(
    `  ✓ ${idx} drivers (15 economy, 8 comfort, 5 family, 10 tuk-tuk, 5 motorcycle)`
  );
  return driverIds;
}

async function seedPassengers(): Promise<Types.ObjectId[]> {
  const password = 'Demo123!@#';
  const ids: Types.ObjectId[] = [];
  for (let i = 0; i < 80; i++) {
    const isMale = Math.random() > 0.4;
    const fname = isMale ? rand(PASSENGER_FIRST_NAMES_M) : rand(PASSENGER_FIRST_NAMES_F);
    const lname = rand(DRIVER_LAST_NAMES);
    const phone = phoneFor(200 + i);
    const email = `passenger${i + 1}@wasalni.demo`;
    const user = await User.create({
      name: `${fname} ${lname}`,
      email,
      phone,
      password,
      role: 'passenger',
      gender: isMale ? 'male' : 'female',
      isActive: true,
      isVerified: true,
    });
    const passenger = await Passenger.create({
      userId: user._id,
      walletBalance: randInt(0, 500),
      totalRides: randInt(0, 80),
      savedPlaces:
        i % 3 === 0
          ? [
              {
                name: 'المنزل',
                address: rand(BAGOUR_LANDMARKS).name_ar,
                location: {
                  type: 'Point',
                  coordinates: [BAGOUR_CENTER.lng, BAGOUR_CENTER.lat],
                },
                type: 'home',
              },
            ]
          : [],
    });
    ids.push(passenger._id);
  }
  console.log(`  ✓ 80 passengers`);
  return ids;
}

interface TripDist {
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled' | 'disputed';
  count: number;
}
const TRIP_STATUS_DIST: TripDist[] = [
  { status: 'completed', count: 150 },
  { status: 'in_progress', count: 5 },
  { status: 'pending', count: 10 },
  { status: 'cancelled', count: 30 },
  { status: 'disputed', count: 5 },
];
const PAYMENT_DIST = [
  { method: 'cash', count: 140 },
  { method: 'vodafone_cash', count: 25 },
  { method: 'card', count: 20 },
  { method: 'wallet', count: 15 },
];
const RIDE_TYPE_DIST = [
  { type: 'economy', count: 90 },
  { type: 'comfort', count: 40 },
  { type: 'family', count: 25 },
  { type: 'tuktuk', count: 35 },
  { type: 'motorcycle', count: 10 },
];

async function seedTrips(
  passengerIds: Types.ObjectId[],
  driverIds: Types.ObjectId[]
): Promise<void> {
  let created = 0;

  // Build flat arrays for distribution sampling
  const statuses: string[] = [];
  TRIP_STATUS_DIST.forEach((d) => {
    for (let i = 0; i < d.count; i++) statuses.push(d.status);
  });
  const methods: string[] = [];
  PAYMENT_DIST.forEach((d) => {
    for (let i = 0; i < d.count; i++) methods.push(d.method);
  });
  const rideTypes: string[] = [];
  RIDE_TYPE_DIST.forEach((d) => {
    for (let i = 0; i < d.count; i++) rideTypes.push(d.type);
  });

  for (let i = 0; i < 200; i++) {
    const pickup = rand(BAGOUR_LANDMARKS);
    let dropoff = rand(BAGOUR_LANDMARKS);
    while (dropoff === pickup) dropoff = rand(BAGOUR_LANDMARKS);

    const rawStatus = rand(statuses) as string;
    // Map seed labels to the Trip model's enum.
    const status =
      rawStatus === 'completed' ? 'trip_completed'
      : rawStatus === 'in_progress' ? 'trip_started'
      : rawStatus === 'pending' ? 'searching'
      : rawStatus === 'disputed' ? 'cancelled'
      : rawStatus;
    const rawPayment = rand(methods);
    const paymentMethod =
      rawPayment === 'vodafone_cash' ? 'wallet'
      : rawPayment === 'card' ? 'card'
      : rawPayment === 'wallet' ? 'wallet'
      : 'cash';
    const rideType = rand(rideTypes);

    const distanceKm = randFloat(0.5, 12);
    const baseFare = rideType === 'tuktuk' ? 5 : rideType === 'motorcycle' ? 6 : rideType === 'economy' ? 8 : rideType === 'comfort' ? 12 : 15;
    const perKm = rideType === 'tuktuk' ? 1.5 : rideType === 'motorcycle' ? 2 : rideType === 'economy' ? 2.5 : rideType === 'comfort' ? 3.5 : 4;
    const distanceFare = Math.round(distanceKm * perKm);
    const bookingFee = 4;
    const total = baseFare + distanceFare + bookingFee;

    const createdAt = dayjs().subtract(randInt(0, 30), 'day').subtract(randInt(0, 23), 'hour');
    const completedAt =
      status === 'trip_completed'
        ? createdAt.add(randInt(8, 35), 'minute').toDate()
        : undefined;

    try {
      await Trip.create({
        // Pre-set tripNumber so the pre-save hook (which counts today's
        // trips) doesn't generate duplicates across back-dated seed rows.
        tripNumber: `WAS-SEED-${String(i + 1).padStart(4, '0')}`,
        passengerId: passengerIds[randInt(0, passengerIds.length - 1)],
        driverId: status !== 'searching' ? driverIds[randInt(0, driverIds.length - 1)] : undefined,
        status,
        rideType,
        pickup: {
          address: pickup.name_ar,
          location: { type: 'Point', coordinates: [pickup.lng, pickup.lat] },
        },
        dropoff: {
          address: dropoff.name_ar,
          location: { type: 'Point', coordinates: [dropoff.lng, dropoff.lat] },
        },
        route: {
          distanceMeters: Math.round(distanceKm * 1000),
          durationSeconds: Math.round(distanceKm * 90),
          distanceText: `${distanceKm.toFixed(1)} كم`,
          durationText: `${Math.round(distanceKm * 1.5)} دقيقة`,
        },
        fare: {
          baseFare,
          distanceFare,
          timeFare: 0,
          waitingFare: 0,
          surgeMultiplier: 1.0,
          surgeAmount: 0,
          bookingFee,
          subtotal: total,
          discount: 0,
          tip: 0,
          tax: 0,
          total,
          currency: 'EGP',
        },
        paymentMethod,
        paymentStatus: status === 'trip_completed' ? 'paid' : 'pending',
        rating:
          status === 'trip_completed'
            ? {
                passengerRating: randInt(3, 5),
                driverRating: randInt(3, 5),
                passengerReview: '',
                driverReview: '',
              }
            : undefined,
        createdAt: createdAt.toDate(),
        completedAt,
      });
      created++;
    } catch (e) {
      logger.warn(`Skipped trip ${i}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`  ✓ ${created} trips (status mix: 150 completed, 5 in-progress, 10 pending, 30 cancelled, 5 disputed)`);
}

async function run(): Promise<void> {
  console.log('\n🌱 Bagour Demo Seeder\n');
  await mongoose.connect(config.mongodbUri);
  console.log('  ✓ MongoDB connected');

  if (process.argv.includes('--fresh')) {
    console.log('  ✓ Dropping existing demo data...');
    await clearBagourData();
  }

  await seedAdmins();
  const driverIds = await seedDrivers();
  const passengerIds = await seedPassengers();
  await seedTrips(passengerIds, driverIds);

  console.log('\n✅ Bagour demo data ready.\n');
  console.log('   Admin login: admin@wasalni.demo / Demo123!@#');
  console.log('   Driver login:    driver1@wasalni.demo / Demo123!@#  (Economy)');
  console.log('   Driver login:    driver29@wasalni.demo / Demo123!@# (TukTuk, the moat)');
  console.log('   Passenger login: passenger1@wasalni.demo / Demo123!@#');
  console.log('\n   See sales/DEMO_ACCOUNTS.md for the full list.');
  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  run().catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  });
}

export default run;
