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
    // COMPLETED TRIPS (5)
    {
      tripNumber: 'WAS-10001',
      passenger: passengers[0]._id,
      driver: approvedDrivers[0]._id,
      rideType: 'economy',
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
      status: 'completed',
      distance: 12.5,
      estimatedDuration: 30,
      actualDuration: 35,
      fare: {
        baseFare: 10,
        distanceFare: 37.5,
        timeFare: 17.5,
        surgeFare: 0,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 70,
        driverEarnings: 59.5,
        platformFee: 10.5,
      },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      passengerRating: 5,
      passengerReview: 'سائق ممتاز ومحترم',
      driverRating: 5,
      driverReview: 'راكب محترم',
      createdAt: new Date(now - 2 * hour),
      acceptedAt: new Date(now - 2 * hour + 2 * 60000),
      arrivedAt: new Date(now - 2 * hour + 8 * 60000),
      startedAt: new Date(now - 2 * hour + 10 * 60000),
      completedAt: new Date(now - 2 * hour + 45 * 60000),
    },
    {
      tripNumber: 'WAS-10002',
      passenger: passengers[1]._id,
      driver: approvedDrivers[1]._id,
      rideType: 'comfort',
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
      status: 'completed',
      distance: 25,
      estimatedDuration: 40,
      actualDuration: 45,
      fare: {
        baseFare: 15,
        distanceFare: 100,
        timeFare: 31.5,
        surgeFare: 0,
        waitingFee: 5,
        serviceFee: 5,
        discount: 25,
        promoCode: 'WELCOME50',
        total: 131.5,
        driverEarnings: 107.43,
        platformFee: 24.07,
      },
      paymentMethod: 'card',
      paymentStatus: 'paid',
      passengerRating: 4,
      driverRating: 5,
      createdAt: new Date(now - 1 * day),
      acceptedAt: new Date(now - 1 * day + 3 * 60000),
      arrivedAt: new Date(now - 1 * day + 12 * 60000),
      startedAt: new Date(now - 1 * day + 17 * 60000),
      completedAt: new Date(now - 1 * day + 62 * 60000),
    },
    {
      tripNumber: 'WAS-10003',
      passenger: passengers[2]._id,
      driver: approvedDrivers[2]._id,
      rideType: 'family',
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
      status: 'completed',
      distance: 35,
      estimatedDuration: 50,
      actualDuration: 55,
      fare: {
        baseFare: 20,
        distanceFare: 175,
        timeFare: 44,
        surgeFare: 0,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 244,
        driverEarnings: 214.72,
        platformFee: 29.28,
      },
      paymentMethod: 'wallet',
      paymentStatus: 'paid',
      passengerRating: 5,
      passengerReview: 'سيارة نظيفة ومريحة',
      driverRating: 5,
      createdAt: new Date(now - 2 * day),
      completedAt: new Date(now - 2 * day + 70 * 60000),
    },
    {
      tripNumber: 'WAS-10004',
      passenger: passengers[0]._id,
      driver: approvedDrivers[0]._id,
      rideType: 'economy',
      pickup: {
        address: 'جامعة القاهرة',
        location: {
          type: 'Point',
          coordinates: [31.2001, 30.0264],
        },
      },
      dropoff: {
        address: 'الدقي',
        location: {
          type: 'Point',
          coordinates: [31.2120, 30.0380],
        },
      },
      status: 'completed',
      distance: 3,
      estimatedDuration: 10,
      actualDuration: 12,
      fare: {
        baseFare: 10,
        distanceFare: 9,
        timeFare: 6,
        surgeFare: 0,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 30,
        driverEarnings: 25.5,
        platformFee: 4.5,
      },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      passengerRating: 5,
      driverRating: 4,
      createdAt: new Date(now - 3 * day),
      completedAt: new Date(now - 3 * day + 20 * 60000),
    },
    {
      tripNumber: 'WAS-10005',
      passenger: passengers[3]._id,
      driver: approvedDrivers[4]._id,
      rideType: 'comfort',
      pickup: {
        address: 'التجمع الخامس',
        location: {
          type: 'Point',
          coordinates: [31.4200, 30.0074],
        },
      },
      dropoff: {
        address: 'مدينة نصر',
        location: {
          type: 'Point',
          coordinates: [31.3300, 30.0500],
        },
      },
      status: 'completed',
      distance: 15,
      estimatedDuration: 25,
      actualDuration: 28,
      fare: {
        baseFare: 15,
        distanceFare: 60,
        timeFare: 19.6,
        surgeFare: 10,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 109.6,
        driverEarnings: 89.66,
        platformFee: 19.94,
      },
      paymentMethod: 'card',
      paymentStatus: 'paid',
      passengerRating: 4,
      driverRating: 5,
      createdAt: new Date(now - 5 * day),
      completedAt: new Date(now - 5 * day + 35 * 60000),
    },

    // ACTIVE TRIPS (3)
    // Trip in progress
    {
      tripNumber: 'WAS-10010',
      passenger: passengers[2]._id,
      driver: approvedDrivers[3]._id,
      rideType: 'economy',
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
      status: 'trip_started',
      distance: 15,
      estimatedDuration: 30,
      fare: {
        baseFare: 10,
        distanceFare: 45,
        timeFare: 15,
        surgeFare: 0,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 75,
        driverEarnings: 63.75,
        platformFee: 11.25,
      },
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      createdAt: new Date(now - 25 * 60000),
      acceptedAt: new Date(now - 23 * 60000),
      arrivedAt: new Date(now - 18 * 60000),
      startedAt: new Date(now - 15 * 60000),
    },
    // Driver assigned, arriving
    {
      tripNumber: 'WAS-10011',
      passenger: passengers[3]._id,
      driver: approvedDrivers[0]._id,
      rideType: 'economy',
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
      status: 'driver_arriving',
      distance: 5,
      estimatedDuration: 15,
      fare: {
        baseFare: 10,
        distanceFare: 15,
        timeFare: 7.5,
        surgeFare: 0,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 37.5,
        driverEarnings: 31.88,
        platformFee: 5.62,
      },
      paymentMethod: 'wallet',
      paymentStatus: 'pending',
      createdAt: new Date(now - 5 * 60000),
      acceptedAt: new Date(now - 3 * 60000),
    },
    // Pending, looking for driver
    {
      tripNumber: 'WAS-10012',
      passenger: passengers[4]._id,
      driver: null,
      rideType: 'comfort',
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
      status: 'pending',
      distance: 8,
      estimatedDuration: 20,
      fare: {
        baseFare: 15,
        distanceFare: 32,
        timeFare: 14,
        surgeFare: 0,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 66,
        driverEarnings: 54.12,
        platformFee: 11.88,
      },
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      createdAt: new Date(now - 1 * 60000),
    },

    // CANCELLED TRIPS (2)
    {
      tripNumber: 'WAS-10020',
      passenger: passengers[0]._id,
      driver: approvedDrivers[2]._id,
      rideType: 'family',
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
      status: 'cancelled',
      cancelledBy: 'passenger',
      cancellationReason: 'تغيرت خططي',
      cancellationFee: 10,
      distance: 8,
      estimatedDuration: 20,
      fare: {
        baseFare: 20,
        distanceFare: 40,
        timeFare: 16,
        total: 81,
      },
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      createdAt: new Date(now - 3 * hour),
      acceptedAt: new Date(now - 3 * hour + 2 * 60000),
      cancelledAt: new Date(now - 3 * hour + 5 * 60000),
    },
    {
      tripNumber: 'WAS-10021',
      passenger: passengers[1]._id,
      driver: approvedDrivers[4]._id,
      rideType: 'comfort',
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
      status: 'cancelled',
      cancelledBy: 'driver',
      cancellationReason: 'عطل مفاجئ في السيارة',
      cancellationFee: 0,
      distance: 20,
      estimatedDuration: 30,
      fare: {
        baseFare: 15,
        distanceFare: 80,
        timeFare: 21,
        total: 121,
      },
      paymentMethod: 'card',
      paymentStatus: 'pending',
      createdAt: new Date(now - 5 * hour),
      acceptedAt: new Date(now - 5 * hour + 3 * 60000),
      cancelledAt: new Date(now - 5 * hour + 10 * 60000),
    },

    // SCHEDULED TRIP (1)
    {
      tripNumber: 'WAS-10030',
      passenger: passengers[0]._id,
      driver: null,
      rideType: 'comfort',
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
      status: 'scheduled',
      isScheduled: true,
      scheduledAt: new Date(now + 1 * day),
      distance: 35,
      estimatedDuration: 50,
      fare: {
        baseFare: 15,
        distanceFare: 140,
        timeFare: 35,
        surgeFare: 0,
        waitingFee: 0,
        serviceFee: 5,
        discount: 0,
        total: 195,
        driverEarnings: 159.9,
        platformFee: 35.1,
      },
      paymentMethod: 'card',
      paymentStatus: 'pending',
      createdAt: new Date(now),
      notes: 'رحلة للمطار - رجاء الحضور قبل الموعد بـ 15 دقيقة',
    },
  ];

  const createdTrips = await Trip.insertMany(trips);
  return createdTrips;
}
