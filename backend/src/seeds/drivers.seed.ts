import { Driver } from '../models';
import { SeededUser } from './users.seed';

export interface SeededDriver {
  _id: string;
  userId: string;
  status: string;
  vehicleType: string;
  vehicleCategory: string;
  isOnline: boolean;
}

// Cairo area locations
const locations = [
  { lat: 30.0444, lng: 31.2357 }, // Downtown Cairo
  { lat: 30.0626, lng: 31.2497 }, // Heliopolis
  { lat: 30.0131, lng: 31.2089 }, // Maadi
  { lat: 30.0761, lng: 31.0187 }, // 6th October
  { lat: 30.0511, lng: 31.3656 }, // New Cairo
  { lat: 30.1219, lng: 31.4015 }, // Airport area
  { lat: 30.0264, lng: 31.2001 }, // Giza
  { lat: 30.0561, lng: 31.2240 }, // Zamalek
];

export async function seedDrivers(users: SeededUser[]): Promise<SeededDriver[]> {
  const driverUsers = users.filter((u) => u.role === 'driver');

  if (driverUsers.length < 9) {
    console.warn('⚠️ Not enough driver users found');
    return [];
  }

  const drivers = [
    // Approved + Online drivers (2)
    {
      userId: driverUsers[0]._id,
      status: 'approved',
      isOnline: true,
      isAvailable: true,
      isBusy: false,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[0].lng, locations[0].lat],
      },
      heading: 45,
      vehicle: {
        type: 'car',
        category: 'economy',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'أبيض',
        plateNumber: 'أ ب ج 1234',
        seats: 4,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=National+ID+Front',
        nationalIdBack: 'https://placehold.co/400x300?text=National+ID+Back',
        nationalIdNumber: '29901011234567',
        drivingLicenseFront: 'https://placehold.co/400x300?text=License+Front',
        drivingLicenseBack: 'https://placehold.co/400x300?text=License+Back',
        criminalRecord: 'https://placehold.co/400x300?text=Criminal+Record',
      },
      acceptedRideTypes: ['economy', 'comfort'],
      rating: 4.8,
      totalRatings: 156,
      totalTrips: 234,
      completedTrips: 220,
      cancelledTrips: 8,
      totalEarnings: 15680,
      currentBalance: 2350,
      commission: 15,
      acceptanceRate: 92,
      cancellationRate: 3.4,
      onlineHours: 1250,
    },
    {
      userId: driverUsers[1]._id,
      status: 'approved',
      isOnline: true,
      isAvailable: true,
      isBusy: false,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[1].lng, locations[1].lat],
      },
      heading: 180,
      vehicle: {
        type: 'car',
        category: 'comfort',
        make: 'Hyundai',
        model: 'Elantra',
        year: 2021,
        color: 'فضي',
        plateNumber: 'س ص ع 5678',
        seats: 4,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=ID+Front',
        nationalIdBack: 'https://placehold.co/400x300?text=ID+Back',
        nationalIdNumber: '29802021234567',
        drivingLicenseFront: 'https://placehold.co/400x300?text=License+Front',
        drivingLicenseBack: 'https://placehold.co/400x300?text=License+Back',
      },
      acceptedRideTypes: ['comfort'],
      rating: 4.5,
      totalRatings: 89,
      totalTrips: 120,
      completedTrips: 112,
      cancelledTrips: 5,
      totalEarnings: 9800,
      currentBalance: 1200,
      commission: 18,
      acceptanceRate: 88,
      cancellationRate: 4.2,
      onlineHours: 890,
    },

    // Approved + Offline (1)
    {
      userId: driverUsers[2]._id,
      status: 'approved',
      isOnline: false,
      isAvailable: false,
      isBusy: false,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[2].lng, locations[2].lat],
      },
      vehicle: {
        type: 'car',
        category: 'family',
        make: 'Toyota',
        model: 'Innova',
        year: 2022,
        color: 'أسود',
        plateNumber: 'ر ك م 9012',
        seats: 7,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=ID+Front',
        nationalIdBack: 'https://placehold.co/400x300?text=ID+Back',
        nationalIdNumber: '29503031234567',
        drivingLicenseFront: 'https://placehold.co/400x300?text=License+Front',
        drivingLicenseBack: 'https://placehold.co/400x300?text=License+Back',
      },
      acceptedRideTypes: ['family'],
      rating: 4.9,
      totalRatings: 67,
      totalTrips: 85,
      completedTrips: 83,
      cancelledTrips: 1,
      totalEarnings: 18500,
      currentBalance: 4500,
      commission: 12,
      acceptanceRate: 96,
      cancellationRate: 1.2,
      onlineHours: 650,
    },

    // Approved + On Trip (busy) (1)
    {
      userId: driverUsers[3]._id,
      status: 'approved',
      isOnline: true,
      isAvailable: false,
      isBusy: true,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[3].lng, locations[3].lat],
      },
      heading: 270,
      vehicle: {
        type: 'car',
        category: 'economy',
        make: 'Nissan',
        model: 'Sunny',
        year: 2019,
        color: 'أزرق',
        plateNumber: 'ل ن ه 3456',
        seats: 4,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=ID+Front',
        nationalIdBack: 'https://placehold.co/400x300?text=ID+Back',
        nationalIdNumber: '29704041234567',
        drivingLicenseFront: 'https://placehold.co/400x300?text=License+Front',
        drivingLicenseBack: 'https://placehold.co/400x300?text=License+Back',
      },
      acceptedRideTypes: ['economy'],
      rating: 4.3,
      totalRatings: 45,
      totalTrips: 67,
      completedTrips: 60,
      cancelledTrips: 4,
      totalEarnings: 5200,
      currentBalance: 800,
      commission: 15,
      acceptanceRate: 85,
      cancellationRate: 6.0,
      onlineHours: 420,
    },

    // Approved + Offline (1)
    {
      userId: driverUsers[4]._id,
      status: 'approved',
      isOnline: false,
      isAvailable: false,
      isBusy: false,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[4].lng, locations[4].lat],
      },
      vehicle: {
        type: 'car',
        category: 'comfort',
        make: 'Kia',
        model: 'Cerato',
        year: 2021,
        color: 'أحمر',
        plateNumber: 'و ي ف 7890',
        seats: 4,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=ID+Front',
        nationalIdBack: 'https://placehold.co/400x300?text=ID+Back',
        nationalIdNumber: '29605051234567',
        drivingLicenseFront: 'https://placehold.co/400x300?text=License+Front',
        drivingLicenseBack: 'https://placehold.co/400x300?text=License+Back',
      },
      acceptedRideTypes: ['comfort'],
      rating: 4.6,
      totalRatings: 34,
      totalTrips: 45,
      completedTrips: 42,
      cancelledTrips: 2,
      totalEarnings: 3800,
      currentBalance: 600,
      commission: 15,
      acceptanceRate: 90,
      cancellationRate: 4.4,
      onlineHours: 320,
    },

    // Pending Drivers (3)
    {
      userId: driverUsers[5]._id,
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      isBusy: false,
      vehicle: {
        type: 'car',
        category: 'economy',
        make: 'Chevrolet',
        model: 'Lanos',
        year: 2018,
        color: 'أبيض',
        plateNumber: 'ط ظ ع 1111',
        seats: 4,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=Pending+ID',
        drivingLicenseFront: 'https://placehold.co/400x300?text=Pending+License',
      },
      acceptedRideTypes: ['economy'],
      commission: 20,
    },
    {
      userId: driverUsers[6]._id,
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      isBusy: false,
      vehicle: {
        type: 'car',
        category: 'comfort',
        make: 'Peugeot',
        model: '301',
        year: 2020,
        color: 'رمادي',
        plateNumber: 'غ ق ف 2222',
        seats: 4,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=Pending+ID',
        drivingLicenseFront: 'https://placehold.co/400x300?text=Pending+License',
      },
      acceptedRideTypes: ['comfort'],
      commission: 20,
    },
    {
      userId: driverUsers[7]._id,
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      isBusy: false,
      vehicle: {
        type: 'tuktuk',
        category: 'economy',
        make: 'Bajaj',
        model: 'RE',
        year: 2021,
        color: 'أصفر',
        plateNumber: 'ث ذ ح 3333',
        seats: 3,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=Pending+ID',
        drivingLicenseFront: 'https://placehold.co/400x300?text=Pending+License',
      },
      acceptedRideTypes: ['economy'],
      commission: 15,
    },

    // Suspended Driver (1)
    {
      userId: driverUsers[8]._id,
      status: 'suspended',
      rejectionReason: 'مخالفات متكررة وشكاوى من الركاب',
      isOnline: false,
      isAvailable: false,
      isBusy: false,
      vehicle: {
        type: 'car',
        category: 'economy',
        make: 'Toyota',
        model: 'Yaris',
        year: 2017,
        color: 'أبيض',
        plateNumber: 'خ ض ج 4444',
        seats: 4,
      },
      documents: {
        nationalIdFront: 'https://placehold.co/400x300?text=ID+Front',
        nationalIdBack: 'https://placehold.co/400x300?text=ID+Back',
        nationalIdNumber: '29006061234567',
        drivingLicenseFront: 'https://placehold.co/400x300?text=License+Front',
        drivingLicenseBack: 'https://placehold.co/400x300?text=License+Back',
      },
      acceptedRideTypes: ['economy'],
      rating: 3.2,
      totalRatings: 25,
      totalTrips: 50,
      completedTrips: 35,
      cancelledTrips: 15,
      totalEarnings: 2800,
      currentBalance: 0,
      commission: 20,
      acceptanceRate: 60,
      cancellationRate: 30,
      onlineHours: 280,
    },
  ];

  const createdDrivers = await Driver.insertMany(drivers);

  return createdDrivers.map((d) => ({
    _id: d._id.toString(),
    userId: d.userId.toString(),
    status: d.status,
    vehicleType: d.vehicle?.type || 'car',
    vehicleCategory: d.vehicle?.category || 'economy',
    isOnline: d.isOnline,
  }));
}
