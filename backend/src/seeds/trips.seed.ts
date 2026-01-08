import { Trip } from '../models';
import { SeededPassenger } from './passengers.seed';
import { SeededDriver } from './drivers.seed';

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

  const trips = [
    // COMPLETED TRIPS (3)
    {
      tripNumber: 'WAS-240101-0001',
      passengerId: passengers[0]._id,
      driverId: approvedDrivers[0]._id,
      rideType: 'economy',
      tripType: 'instant',
      pickup: {
        address: 'ميدان التحرير، القاهرة',
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
        },
      },
      dropoff: {
        address: 'سيتي ستارز، مدينة نصر',
        location: {
          type: 'Point',
          coordinates: [31.3425, 30.0725],
        },
      },
      route: {
        distanceMeters: 12500,
        durationSeconds: 1800,
        distanceText: '12.5 كم',
        durationText: '30 دقيقة',
      },
      status: 'trip_completed',
      statusHistory: [
        { status: 'searching', timestamp: new Date(now - 2 * hour) },
        { status: 'driver_assigned', timestamp: new Date(now - 2 * hour + 2 * 60000) },
        { status: 'driver_arriving', timestamp: new Date(now - 2 * hour + 3 * 60000) },
        { status: 'driver_arrived', timestamp: new Date(now - 2 * hour + 8 * 60000) },
        { status: 'trip_started', timestamp: new Date(now - 2 * hour + 10 * 60000) },
        { status: 'trip_completed', timestamp: new Date(now - 2 * hour + 45 * 60000) },
      ],
      fare: {
        baseFare: 10,
        distanceFare: 37.5,
        timeFare: 17.5,
        waitingFare: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
        bookingFee: 3,
        tolls: 0,
        discount: 0,
        subtotal: 68,
        total: 68,
      },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      paidAt: new Date(now - 2 * hour + 45 * 60000),
      driverEarnings: 57.8,
      platformEarnings: 10.2,
      requestedAt: new Date(now - 2 * hour),
      driverAssignedAt: new Date(now - 2 * hour + 2 * 60000),
      driverArrivedAt: new Date(now - 2 * hour + 8 * 60000),
      tripStartedAt: new Date(now - 2 * hour + 10 * 60000),
      tripCompletedAt: new Date(now - 2 * hour + 45 * 60000),
      passengerRating: {
        score: 5,
        comment: 'سائق ممتاز ومحترم',
        badges: ['clean_car', 'polite'],
        createdAt: new Date(now - 2 * hour + 46 * 60000),
      },
      driverRating: {
        score: 5,
        comment: 'راكب محترم',
        badges: [],
        createdAt: new Date(now - 2 * hour + 47 * 60000),
      },
    },
    {
      tripNumber: 'WAS-240101-0002',
      passengerId: passengers[1]._id,
      driverId: approvedDrivers[1]._id,
      rideType: 'comfort',
      tripType: 'instant',
      pickup: {
        address: 'مطار القاهرة الدولي',
        location: {
          type: 'Point',
          coordinates: [31.4015, 30.1219],
        },
      },
      dropoff: {
        address: 'فندق ماريوت الزمالك',
        location: {
          type: 'Point',
          coordinates: [31.2240, 30.0561],
        },
      },
      route: {
        distanceMeters: 25000,
        durationSeconds: 2400,
        distanceText: '25 كم',
        durationText: '40 دقيقة',
      },
      status: 'trip_completed',
      statusHistory: [
        { status: 'searching', timestamp: new Date(now - 1 * day) },
        { status: 'driver_assigned', timestamp: new Date(now - 1 * day + 3 * 60000) },
        { status: 'trip_completed', timestamp: new Date(now - 1 * day + 62 * 60000) },
      ],
      fare: {
        baseFare: 15,
        distanceFare: 100,
        timeFare: 30,
        waitingFare: 5,
        surgeMultiplier: 1,
        surgeAmount: 0,
        bookingFee: 5,
        tolls: 0,
        discount: 25,
        promoCode: 'WELCOME50',
        subtotal: 155,
        total: 130,
      },
      paymentMethod: 'card',
      paymentStatus: 'paid',
      paidAt: new Date(now - 1 * day + 62 * 60000),
      driverEarnings: 106.6,
      platformEarnings: 23.4,
      requestedAt: new Date(now - 1 * day),
      tripCompletedAt: new Date(now - 1 * day + 62 * 60000),
      passengerRating: {
        score: 4,
        badges: [],
        createdAt: new Date(now - 1 * day + 63 * 60000),
      },
      driverRating: {
        score: 5,
        badges: [],
        createdAt: new Date(now - 1 * day + 64 * 60000),
      },
    },
    {
      tripNumber: 'WAS-240101-0003',
      passengerId: passengers[2]._id,
      driverId: approvedDrivers[2]._id,
      rideType: 'family',
      tripType: 'instant',
      pickup: {
        address: 'المعادي الجديدة',
        location: {
          type: 'Point',
          coordinates: [31.2500, 29.9603],
        },
      },
      dropoff: {
        address: 'مول العرب، 6 أكتوبر',
        location: {
          type: 'Point',
          coordinates: [31.0187, 30.0761],
        },
      },
      route: {
        distanceMeters: 35000,
        durationSeconds: 3000,
        distanceText: '35 كم',
        durationText: '50 دقيقة',
      },
      status: 'trip_completed',
      statusHistory: [
        { status: 'searching', timestamp: new Date(now - 2 * day) },
        { status: 'trip_completed', timestamp: new Date(now - 2 * day + 70 * 60000) },
      ],
      fare: {
        baseFare: 20,
        distanceFare: 175,
        timeFare: 50,
        waitingFare: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
        bookingFee: 5,
        tolls: 0,
        discount: 0,
        subtotal: 250,
        total: 250,
      },
      paymentMethod: 'wallet',
      paymentStatus: 'paid',
      paidAt: new Date(now - 2 * day + 70 * 60000),
      driverEarnings: 212.5,
      platformEarnings: 37.5,
      requestedAt: new Date(now - 2 * day),
      tripCompletedAt: new Date(now - 2 * day + 70 * 60000),
      passengerRating: {
        score: 5,
        comment: 'سيارة نظيفة ومريحة',
        badges: ['clean_car', 'safe_driving'],
        createdAt: new Date(now - 2 * day + 71 * 60000),
      },
      driverRating: {
        score: 5,
        badges: [],
        createdAt: new Date(now - 2 * day + 72 * 60000),
      },
    },

    // ACTIVE TRIPS (2)
    // Trip in progress
    {
      tripNumber: 'WAS-240108-0001',
      passengerId: passengers[2]._id,
      driverId: approvedDrivers[3]._id,
      rideType: 'economy',
      tripType: 'instant',
      pickup: {
        address: 'مول العرب، 6 أكتوبر',
        location: {
          type: 'Point',
          coordinates: [31.0187, 30.0761],
        },
      },
      dropoff: {
        address: 'ميدان الرماية، الهرم',
        location: {
          type: 'Point',
          coordinates: [31.1342, 29.9870],
        },
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
      estimatedFare: {
        min: 65,
        max: 85,
      },
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      requestedAt: new Date(now - 25 * 60000),
      driverAssignedAt: new Date(now - 23 * 60000),
      driverArrivedAt: new Date(now - 18 * 60000),
      tripStartedAt: new Date(now - 15 * 60000),
    },
    // Driver arriving
    {
      tripNumber: 'WAS-240108-0002',
      passengerId: passengers[3]._id,
      driverId: approvedDrivers[0]._id,
      rideType: 'economy',
      tripType: 'instant',
      pickup: {
        address: 'جامعة القاهرة',
        location: {
          type: 'Point',
          coordinates: [31.2001, 30.0264],
        },
      },
      dropoff: {
        address: 'المهندسين',
        location: {
          type: 'Point',
          coordinates: [31.2001, 30.0561],
        },
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
      estimatedFare: {
        min: 30,
        max: 40,
      },
      paymentMethod: 'wallet',
      paymentStatus: 'pending',
      requestedAt: new Date(now - 5 * 60000),
      driverAssignedAt: new Date(now - 3 * 60000),
    },

    // SEARCHING TRIP (1)
    {
      tripNumber: 'WAS-240108-0003',
      passengerId: passengers[4]._id,
      rideType: 'comfort',
      tripType: 'instant',
      pickup: {
        address: 'داون تاون مول، التجمع',
        location: {
          type: 'Point',
          coordinates: [31.4280, 30.0074],
        },
      },
      dropoff: {
        address: 'كايرو فيستيفال سيتي',
        location: {
          type: 'Point',
          coordinates: [31.4015, 30.0300],
        },
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
      estimatedFare: {
        min: 55,
        max: 75,
      },
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      requestedAt: new Date(now - 1 * 60000),
    },

    // CANCELLED TRIPS (2)
    {
      tripNumber: 'WAS-240107-0001',
      passengerId: passengers[0]._id,
      driverId: approvedDrivers[2]._id,
      rideType: 'family',
      tripType: 'instant',
      pickup: {
        address: 'فورسيزونز الجيزة',
        location: {
          type: 'Point',
          coordinates: [31.2089, 30.0131],
        },
      },
      dropoff: {
        address: 'الأهرامات',
        location: {
          type: 'Point',
          coordinates: [31.1342, 29.9792],
        },
      },
      route: {
        distanceMeters: 8000,
        durationSeconds: 1200,
        distanceText: '8 كم',
        durationText: '20 دقيقة',
      },
      status: 'cancelled',
      statusHistory: [
        { status: 'searching', timestamp: new Date(now - 3 * hour) },
        { status: 'driver_assigned', timestamp: new Date(now - 3 * hour + 2 * 60000) },
        { status: 'cancelled', timestamp: new Date(now - 3 * hour + 5 * 60000) },
      ],
      isCancelled: true,
      cancelledBy: 'passenger',
      cancelReason: 'تغيرت خططي',
      cancelledAt: new Date(now - 3 * hour + 5 * 60000),
      cancellationFee: 10,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      requestedAt: new Date(now - 3 * hour),
      driverAssignedAt: new Date(now - 3 * hour + 2 * 60000),
    },
    {
      tripNumber: 'WAS-240107-0002',
      passengerId: passengers[1]._id,
      driverId: approvedDrivers[4]._id,
      rideType: 'comfort',
      tripType: 'instant',
      pickup: {
        address: 'مدينتي',
        location: {
          type: 'Point',
          coordinates: [31.6400, 30.1150],
        },
      },
      dropoff: {
        address: 'الرحاب',
        location: {
          type: 'Point',
          coordinates: [31.4900, 30.0600],
        },
      },
      route: {
        distanceMeters: 20000,
        durationSeconds: 1800,
        distanceText: '20 كم',
        durationText: '30 دقيقة',
      },
      status: 'cancelled',
      statusHistory: [
        { status: 'searching', timestamp: new Date(now - 5 * hour) },
        { status: 'driver_assigned', timestamp: new Date(now - 5 * hour + 3 * 60000) },
        { status: 'cancelled', timestamp: new Date(now - 5 * hour + 10 * 60000) },
      ],
      isCancelled: true,
      cancelledBy: 'driver',
      cancelReason: 'عطل مفاجئ في السيارة',
      cancelledAt: new Date(now - 5 * hour + 10 * 60000),
      cancellationFee: 0,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      requestedAt: new Date(now - 5 * hour),
      driverAssignedAt: new Date(now - 5 * hour + 3 * 60000),
    },

    // SCHEDULED TRIP (1)
    {
      tripNumber: 'WAS-240109-0001',
      passengerId: passengers[0]._id,
      rideType: 'comfort',
      tripType: 'scheduled',
      isScheduled: true,
      scheduledTime: new Date(now + 1 * day),
      pickup: {
        address: 'المنزل - شارع الهرم',
        location: {
          type: 'Point',
          coordinates: [31.2001, 30.0131],
        },
      },
      dropoff: {
        address: 'مطار القاهرة الدولي',
        location: {
          type: 'Point',
          coordinates: [31.4015, 30.1219],
        },
      },
      route: {
        distanceMeters: 35000,
        durationSeconds: 3000,
        distanceText: '35 كم',
        durationText: '50 دقيقة',
      },
      status: 'searching',
      statusHistory: [
        { status: 'searching', timestamp: new Date(now) },
      ],
      estimatedFare: {
        min: 170,
        max: 220,
      },
      paymentMethod: 'card',
      paymentStatus: 'pending',
      requestedAt: new Date(now),
    },
  ];

  const createdTrips = await Trip.insertMany(trips);
  return createdTrips;
}
