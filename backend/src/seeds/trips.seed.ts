import { Trip } from '../models';
import { SeededPassenger } from './passengers.seed';
import { SeededDriver } from './drivers.seed';

// Cairo area locations
const locations = [
  { name: 'ميدان التحرير', lat: 30.0444, lng: 31.2357 },
  { name: 'سيتي ستارز، مدينة نصر', lat: 30.0725, lng: 31.3425 },
  { name: 'مطار القاهرة الدولي', lat: 30.1219, lng: 31.4015 },
  { name: 'فندق ماريوت الزمالك', lat: 30.0561, lng: 31.2240 },
  { name: 'المعادي الجديدة', lat: 29.9603, lng: 31.2500 },
  { name: 'مول العرب، 6 أكتوبر', lat: 30.0761, lng: 31.0187 },
  { name: 'ميدان الرماية، الهرم', lat: 29.9870, lng: 31.1342 },
  { name: 'جامعة القاهرة', lat: 30.0264, lng: 31.2001 },
  { name: 'المهندسين', lat: 30.0561, lng: 31.2001 },
  { name: 'داون تاون مول، التجمع', lat: 30.0074, lng: 31.4280 },
  { name: 'كايرو فيستيفال سيتي', lat: 30.0300, lng: 31.4015 },
  { name: 'فورسيزونز الجيزة', lat: 30.0131, lng: 31.2089 },
  { name: 'الأهرامات', lat: 29.9792, lng: 31.1342 },
  { name: 'مدينتي', lat: 30.1150, lng: 31.6400 },
  { name: 'الرحاب', lat: 30.0600, lng: 31.4900 },
  { name: 'الدقي', lat: 30.0385, lng: 31.2115 },
  { name: 'شبرا', lat: 30.0887, lng: 31.2466 },
  { name: 'مصر الجديدة', lat: 30.0900, lng: 31.3300 },
  { name: 'حدائق القبة', lat: 30.0893, lng: 31.2987 },
  { name: 'عين شمس', lat: 30.1314, lng: 31.3283 },
];

const rideTypes = ['economy', 'comfort', 'family', 'tuktuk'];
const paymentMethods = ['cash', 'card', 'wallet'];
const cancelReasons = [
  'تغيرت خططي',
  'وقت الانتظار طويل',
  'وجدت وسيلة نقل أخرى',
  'خطأ في العنوان',
  'السائق بعيد جداً',
];
const driverCancelReasons = [
  'عطل مفاجئ في السيارة',
  'لا أستطيع الوصول للموقع',
  'حالة طوارئ',
  'الراكب لم يحضر',
];

const badges = ['clean_car', 'polite', 'safe_driving', 'fast_pickup', 'good_navigation'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTripNumber(date: Date, index: number): string {
  const d = date.toISOString().slice(0, 10).replace(/-/g, '').slice(2);
  return `WAS-${d}-${String(index).padStart(4, '0')}`;
}

export async function seedTrips(
  passengers: SeededPassenger[],
  drivers: SeededDriver[]
): Promise<any[]> {
  const approvedDrivers = drivers.filter((d) => d.status === 'approved');

  if (passengers.length < 5 || approvedDrivers.length < 4) {
    console.warn('⚠️ Not enough passengers or drivers for seeding trips');
    return [];
  }

  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const trips: any[] = [];
  let tripIndex = 1;

  // Generate 100 completed trips over the past 30 days
  for (let i = 0; i < 100; i++) {
    const daysAgo = randomInt(0, 30);
    const hoursAgo = randomInt(1, 23);
    const tripTime = now - daysAgo * day - hoursAgo * hour;

    const pickup = randomElement(locations);
    let dropoff = randomElement(locations);
    while (dropoff.name === pickup.name) {
      dropoff = randomElement(locations);
    }

    const distanceMeters = randomInt(3000, 40000);
    const durationSeconds = Math.round(distanceMeters / 8); // ~30 km/h average
    const rideType = randomElement(rideTypes) as string;

    // Calculate fare based on ride type
    const baseFares: Record<string, number> = { economy: 10, comfort: 15, family: 20, tuktuk: 5 };
    const perKmRates: Record<string, number> = { economy: 3, comfort: 4, family: 5, tuktuk: 2 };

    const baseFare = baseFares[rideType] || 10;
    const distanceFare = Math.round((distanceMeters / 1000) * (perKmRates[rideType] || 3));
    const timeFare = Math.round((durationSeconds / 60) * 0.5);
    const surgeMultiplier = Math.random() > 0.8 ? 1.5 : 1;
    const surgeAmount = surgeMultiplier > 1 ? Math.round((baseFare + distanceFare) * 0.5) : 0;
    const bookingFee = rideType === 'economy' ? 3 : 5;
    const hasDiscount = Math.random() > 0.7;
    const discount = hasDiscount ? randomInt(10, 50) : 0;
    const subtotal = baseFare + distanceFare + timeFare + surgeAmount + bookingFee;
    const total = Math.max(subtotal - discount, baseFare);

    const passenger = randomElement(passengers);
    const driver = randomElement(approvedDrivers);
    const paymentMethod = randomElement(paymentMethods);

    const completedTrip = {
      tripNumber: generateTripNumber(new Date(tripTime), tripIndex++),
      passengerId: passenger._id,
      driverId: driver._id,
      rideType,
      tripType: 'instant',
      pickup: {
        address: pickup.name,
        location: {
          type: 'Point',
          coordinates: [pickup.lng, pickup.lat],
        },
      },
      dropoff: {
        address: dropoff.name,
        location: {
          type: 'Point',
          coordinates: [dropoff.lng, dropoff.lat],
        },
      },
      route: {
        distanceMeters,
        durationSeconds,
        distanceText: `${(distanceMeters / 1000).toFixed(1)} كم`,
        durationText: `${Math.round(durationSeconds / 60)} دقيقة`,
      },
      status: 'trip_completed',
      statusHistory: [
        { status: 'searching', timestamp: new Date(tripTime) },
        { status: 'driver_assigned', timestamp: new Date(tripTime + 2 * 60000) },
        { status: 'driver_arriving', timestamp: new Date(tripTime + 3 * 60000) },
        { status: 'driver_arrived', timestamp: new Date(tripTime + 8 * 60000) },
        { status: 'trip_started', timestamp: new Date(tripTime + 10 * 60000) },
        { status: 'trip_completed', timestamp: new Date(tripTime + 10 * 60000 + durationSeconds * 1000) },
      ],
      fare: {
        baseFare,
        distanceFare,
        timeFare,
        waitingFare: 0,
        surgeMultiplier,
        surgeAmount,
        bookingFee,
        tolls: 0,
        discount,
        promoCode: hasDiscount ? randomElement(['WELCOME50', 'SAVE20', 'FLAT25']) : undefined,
        subtotal,
        total,
      },
      paymentMethod,
      paymentStatus: 'paid',
      paidAt: new Date(tripTime + 10 * 60000 + durationSeconds * 1000 + 60000),
      driverEarnings: Math.round(total * 0.85),
      platformEarnings: Math.round(total * 0.15),
      requestedAt: new Date(tripTime),
      driverAssignedAt: new Date(tripTime + 2 * 60000),
      driverArrivedAt: new Date(tripTime + 8 * 60000),
      tripStartedAt: new Date(tripTime + 10 * 60000),
      tripCompletedAt: new Date(tripTime + 10 * 60000 + durationSeconds * 1000),
      passengerRating: {
        score: randomInt(3, 5),
        comment: Math.random() > 0.5 ? 'رحلة ممتازة' : undefined,
        badges: Math.random() > 0.5 ? [randomElement(badges)] : [],
        createdAt: new Date(tripTime + 10 * 60000 + durationSeconds * 1000 + 120000),
      },
      driverRating: {
        score: randomInt(4, 5),
        badges: [],
        createdAt: new Date(tripTime + 10 * 60000 + durationSeconds * 1000 + 180000),
      },
    };

    trips.push(completedTrip);
  }

  // Generate 20 cancelled trips
  for (let i = 0; i < 20; i++) {
    const daysAgo = randomInt(0, 15);
    const hoursAgo = randomInt(1, 23);
    const tripTime = now - daysAgo * day - hoursAgo * hour;

    const pickup = randomElement(locations);
    let dropoff = randomElement(locations);
    while (dropoff.name === pickup.name) {
      dropoff = randomElement(locations);
    }

    const cancelledByPassenger = Math.random() > 0.4;
    const passenger = randomElement(passengers);
    const driver = randomElement(approvedDrivers);

    const cancelledTrip = {
      tripNumber: generateTripNumber(new Date(tripTime), tripIndex++),
      passengerId: passenger._id,
      driverId: driver._id,
      rideType: randomElement(rideTypes),
      tripType: 'instant',
      pickup: {
        address: pickup.name,
        location: {
          type: 'Point',
          coordinates: [pickup.lng, pickup.lat],
        },
      },
      dropoff: {
        address: dropoff.name,
        location: {
          type: 'Point',
          coordinates: [dropoff.lng, dropoff.lat],
        },
      },
      status: 'cancelled',
      statusHistory: [
        { status: 'searching', timestamp: new Date(tripTime) },
        { status: 'driver_assigned', timestamp: new Date(tripTime + 2 * 60000) },
        { status: 'cancelled', timestamp: new Date(tripTime + 7 * 60000) },
      ],
      isCancelled: true,
      cancelledBy: cancelledByPassenger ? 'passenger' : 'driver',
      cancelReason: cancelledByPassenger
        ? randomElement(cancelReasons)
        : randomElement(driverCancelReasons),
      cancelledAt: new Date(tripTime + 7 * 60000),
      cancellationFee: cancelledByPassenger ? 10 : 0,
      paymentMethod: randomElement(paymentMethods),
      paymentStatus: 'pending',
      requestedAt: new Date(tripTime),
      driverAssignedAt: new Date(tripTime + 2 * 60000),
    };

    trips.push(cancelledTrip);
  }

  // Active trips - in progress
  trips.push({
    tripNumber: generateTripNumber(new Date(), tripIndex++),
    passengerId: passengers[0]._id,
    driverId: approvedDrivers[3]._id,
    rideType: 'economy',
    tripType: 'instant',
    pickup: {
      address: 'مول العرب، 6 أكتوبر',
      location: { type: 'Point', coordinates: [31.0187, 30.0761] },
    },
    dropoff: {
      address: 'ميدان الرماية، الهرم',
      location: { type: 'Point', coordinates: [31.1342, 29.9870] },
    },
    route: {
      distanceMeters: 15000,
      durationSeconds: 1800,
      distanceText: '15 كم',
      durationText: '30 دقيقة',
    },
    status: 'trip_started',
    statusHistory: [
      { status: 'searching', timestamp: new Date(now - 25 * 60000) },
      { status: 'driver_assigned', timestamp: new Date(now - 23 * 60000) },
      { status: 'driver_arriving', timestamp: new Date(now - 22 * 60000) },
      { status: 'driver_arrived', timestamp: new Date(now - 18 * 60000) },
      { status: 'trip_started', timestamp: new Date(now - 15 * 60000) },
    ],
    estimatedFare: { min: 65, max: 85 },
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    requestedAt: new Date(now - 25 * 60000),
    driverAssignedAt: new Date(now - 23 * 60000),
    driverArrivedAt: new Date(now - 18 * 60000),
    tripStartedAt: new Date(now - 15 * 60000),
  });

  // Active - driver arriving
  trips.push({
    tripNumber: generateTripNumber(new Date(), tripIndex++),
    passengerId: passengers[1]._id,
    driverId: approvedDrivers[0]._id,
    rideType: 'comfort',
    tripType: 'instant',
    pickup: {
      address: 'جامعة القاهرة',
      location: { type: 'Point', coordinates: [31.2001, 30.0264] },
    },
    dropoff: {
      address: 'المهندسين',
      location: { type: 'Point', coordinates: [31.2001, 30.0561] },
    },
    route: {
      distanceMeters: 5000,
      durationSeconds: 900,
      distanceText: '5 كم',
      durationText: '15 دقيقة',
    },
    status: 'driver_arriving',
    statusHistory: [
      { status: 'searching', timestamp: new Date(now - 5 * 60000) },
      { status: 'driver_assigned', timestamp: new Date(now - 3 * 60000) },
      { status: 'driver_arriving', timestamp: new Date(now - 2 * 60000) },
    ],
    estimatedFare: { min: 35, max: 45 },
    paymentMethod: 'wallet',
    paymentStatus: 'pending',
    requestedAt: new Date(now - 5 * 60000),
    driverAssignedAt: new Date(now - 3 * 60000),
  });

  // Active - driver arrived, waiting
  trips.push({
    tripNumber: generateTripNumber(new Date(), tripIndex++),
    passengerId: passengers[2]._id,
    driverId: approvedDrivers[1]._id,
    rideType: 'economy',
    tripType: 'instant',
    pickup: {
      address: 'سيتي ستارز، مدينة نصر',
      location: { type: 'Point', coordinates: [31.3425, 30.0725] },
    },
    dropoff: {
      address: 'مصر الجديدة',
      location: { type: 'Point', coordinates: [31.3300, 30.0900] },
    },
    route: {
      distanceMeters: 4000,
      durationSeconds: 600,
      distanceText: '4 كم',
      durationText: '10 دقيقة',
    },
    status: 'driver_arrived',
    statusHistory: [
      { status: 'searching', timestamp: new Date(now - 10 * 60000) },
      { status: 'driver_assigned', timestamp: new Date(now - 8 * 60000) },
      { status: 'driver_arriving', timestamp: new Date(now - 7 * 60000) },
      { status: 'driver_arrived', timestamp: new Date(now - 2 * 60000) },
    ],
    estimatedFare: { min: 25, max: 35 },
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    requestedAt: new Date(now - 10 * 60000),
    driverAssignedAt: new Date(now - 8 * 60000),
    driverArrivedAt: new Date(now - 2 * 60000),
  });

  // Searching trip
  trips.push({
    tripNumber: generateTripNumber(new Date(), tripIndex++),
    passengerId: passengers[3]._id,
    rideType: 'comfort',
    tripType: 'instant',
    pickup: {
      address: 'داون تاون مول، التجمع',
      location: { type: 'Point', coordinates: [31.4280, 30.0074] },
    },
    dropoff: {
      address: 'كايرو فيستيفال سيتي',
      location: { type: 'Point', coordinates: [31.4015, 30.0300] },
    },
    route: {
      distanceMeters: 8000,
      durationSeconds: 1200,
      distanceText: '8 كم',
      durationText: '20 دقيقة',
    },
    status: 'searching',
    statusHistory: [
      { status: 'searching', timestamp: new Date(now - 1 * 60000) },
    ],
    estimatedFare: { min: 55, max: 75 },
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    requestedAt: new Date(now - 1 * 60000),
  });

  // Scheduled trips (3)
  for (let i = 1; i <= 3; i++) {
    trips.push({
      tripNumber: generateTripNumber(new Date(now + i * day), tripIndex++),
      passengerId: randomElement(passengers)._id,
      rideType: randomElement(['comfort', 'family']),
      tripType: 'scheduled',
      isScheduled: true,
      scheduledTime: new Date(now + i * day + randomInt(8, 18) * hour),
      pickup: {
        address: randomElement(locations).name,
        location: {
          type: 'Point',
          coordinates: [randomElement(locations).lng, randomElement(locations).lat],
        },
      },
      dropoff: {
        address: 'مطار القاهرة الدولي',
        location: { type: 'Point', coordinates: [31.4015, 30.1219] },
      },
      route: {
        distanceMeters: randomInt(20000, 40000),
        durationSeconds: randomInt(1800, 3600),
        distanceText: `${randomInt(20, 40)} كم`,
        durationText: `${randomInt(30, 60)} دقيقة`,
      },
      status: 'searching',
      statusHistory: [
        { status: 'searching', timestamp: new Date(now) },
      ],
      estimatedFare: { min: randomInt(150, 200), max: randomInt(200, 280) },
      paymentMethod: 'card',
      paymentStatus: 'pending',
      requestedAt: new Date(now),
    });
  }

  const createdTrips = await Trip.insertMany(trips);
  return createdTrips;
}
