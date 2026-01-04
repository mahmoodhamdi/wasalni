import { Driver } from '../models';
import { SeededUser } from './users.seed';

export interface SeededDriver {
  _id: string;
  userId: string;
  displayName: string;
  status: string;
  vehicleType: string;
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
      user: driverUsers[0]._id,
      displayName: 'محمد السائق',
      status: 'approved',
      isOnline: true,
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[0].lng, locations[0].lat],
      },
      heading: 45,
      speed: 0,
      vehicle: {
        type: 'economy',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'أبيض',
        plateNumber: 'أ ب ج 1234',
        photos: ['https://placehold.co/400x300?text=Car+1'],
      },
      documents: {
        nationalId: {
          url: 'https://placehold.co/400x300?text=National+ID',
          status: 'approved',
        },
        driverLicense: {
          url: 'https://placehold.co/400x300?text=Driver+License',
          status: 'approved',
        },
        vehicleLicense: {
          url: 'https://placehold.co/400x300?text=Vehicle+License',
          status: 'approved',
        },
        criminalRecord: {
          url: 'https://placehold.co/400x300?text=Criminal+Record',
          status: 'approved',
        },
      },
      rating: 4.8,
      totalRatings: 156,
      totalTrips: 234,
      completedTrips: 220,
      cancelledTrips: 8,
      totalEarnings: 15680,
      walletBalance: 2350,
      commission: 15,
      acceptanceRate: 92,
      cancellationRate: 3.4,
      onlineHours: 1250,
    },
    {
      user: driverUsers[1]._id,
      displayName: 'علي السائق',
      status: 'approved',
      isOnline: true,
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[1].lng, locations[1].lat],
      },
      heading: 180,
      speed: 35,
      vehicle: {
        type: 'comfort',
        make: 'Hyundai',
        model: 'Elantra',
        year: 2021,
        color: 'فضي',
        plateNumber: 'س ص ع 5678',
        photos: ['https://placehold.co/400x300?text=Car+2'],
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300', status: 'approved' },
        driverLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        vehicleLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        criminalRecord: { url: 'https://placehold.co/400x300', status: 'approved' },
      },
      rating: 4.5,
      totalRatings: 89,
      totalTrips: 120,
      completedTrips: 112,
      cancelledTrips: 5,
      totalEarnings: 9800,
      walletBalance: 1200,
      commission: 18,
      acceptanceRate: 88,
      cancellationRate: 4.2,
      onlineHours: 890,
    },

    // Approved + Offline (1)
    {
      user: driverUsers[2]._id,
      displayName: 'حسن السائق',
      status: 'approved',
      isOnline: false,
      isAvailable: false,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[2].lng, locations[2].lat],
      },
      vehicle: {
        type: 'family',
        make: 'Toyota',
        model: 'Innova',
        year: 2022,
        color: 'أسود',
        plateNumber: 'ر ك م 9012',
        photos: ['https://placehold.co/400x300?text=Car+3'],
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300', status: 'approved' },
        driverLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        vehicleLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        criminalRecord: { url: 'https://placehold.co/400x300', status: 'approved' },
      },
      rating: 4.9,
      totalRatings: 67,
      totalTrips: 85,
      completedTrips: 83,
      cancelledTrips: 1,
      totalEarnings: 18500,
      walletBalance: 4500,
      commission: 12,
      acceptanceRate: 96,
      cancellationRate: 1.2,
      onlineHours: 650,
    },

    // Approved + On Trip (busy) (1)
    {
      user: driverUsers[3]._id,
      displayName: 'أحمد السائق',
      status: 'approved',
      isOnline: true,
      isAvailable: false, // On a trip
      currentLocation: {
        type: 'Point',
        coordinates: [locations[3].lng, locations[3].lat],
      },
      heading: 270,
      speed: 45,
      vehicle: {
        type: 'economy',
        make: 'Nissan',
        model: 'Sunny',
        year: 2019,
        color: 'أزرق',
        plateNumber: 'ل ن ه 3456',
        photos: ['https://placehold.co/400x300?text=Car+4'],
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300', status: 'approved' },
        driverLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        vehicleLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        criminalRecord: { url: 'https://placehold.co/400x300', status: 'approved' },
      },
      rating: 4.3,
      totalRatings: 45,
      totalTrips: 67,
      completedTrips: 60,
      cancelledTrips: 4,
      totalEarnings: 5200,
      walletBalance: 800,
      commission: 15,
      acceptanceRate: 85,
      cancellationRate: 6.0,
      onlineHours: 420,
    },

    // Approved + Offline (1)
    {
      user: driverUsers[4]._id,
      displayName: 'كريم السائق',
      status: 'approved',
      isOnline: false,
      isAvailable: false,
      currentLocation: {
        type: 'Point',
        coordinates: [locations[4].lng, locations[4].lat],
      },
      vehicle: {
        type: 'comfort',
        make: 'Kia',
        model: 'Cerato',
        year: 2021,
        color: 'أحمر',
        plateNumber: 'و ي ف 7890',
        photos: ['https://placehold.co/400x300?text=Car+5'],
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300', status: 'approved' },
        driverLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        vehicleLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        criminalRecord: { url: 'https://placehold.co/400x300', status: 'approved' },
      },
      rating: 4.6,
      totalRatings: 34,
      totalTrips: 45,
      completedTrips: 42,
      cancelledTrips: 2,
      totalEarnings: 3800,
      walletBalance: 600,
      commission: 15,
      acceptanceRate: 90,
      cancellationRate: 4.4,
      onlineHours: 320,
    },

    // Pending Drivers (3)
    {
      user: driverUsers[5]._id,
      displayName: 'يوسف السائق',
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      vehicle: {
        type: 'economy',
        make: 'Chevrolet',
        model: 'Lanos',
        year: 2018,
        color: 'أبيض',
        plateNumber: 'ط ظ ع 1111',
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300?text=Pending+ID', status: 'pending' },
        driverLicense: { url: 'https://placehold.co/400x300?text=Pending+License', status: 'pending' },
        vehicleLicense: { url: 'https://placehold.co/400x300?text=Pending+Vehicle', status: 'pending' },
        criminalRecord: { url: 'https://placehold.co/400x300?text=Pending+Record', status: 'pending' },
      },
      commission: 20,
    },
    {
      user: driverUsers[6]._id,
      displayName: 'إبراهيم السائق',
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      vehicle: {
        type: 'comfort',
        make: 'Peugeot',
        model: '301',
        year: 2020,
        color: 'رمادي',
        plateNumber: 'غ ق ف 2222',
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300', status: 'pending' },
        driverLicense: { url: 'https://placehold.co/400x300', status: 'pending' },
        vehicleLicense: { url: 'https://placehold.co/400x300', status: 'pending' },
        criminalRecord: { url: 'https://placehold.co/400x300', status: 'pending' },
      },
      commission: 20,
    },
    {
      user: driverUsers[7]._id,
      displayName: 'مصطفى السائق',
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      vehicle: {
        type: 'tuktuk',
        make: 'Bajaj',
        model: 'RE',
        year: 2021,
        color: 'أصفر',
        plateNumber: 'ث ذ ح 3333',
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300', status: 'pending' },
        driverLicense: { url: 'https://placehold.co/400x300', status: 'pending' },
        vehicleLicense: { url: 'https://placehold.co/400x300', status: 'pending' },
      },
      commission: 15,
    },

    // Suspended Driver (1)
    {
      user: driverUsers[8]._id,
      displayName: 'سائق موقوف',
      status: 'suspended',
      suspensionReason: 'مخالفات متكررة وشكاوى من الركاب',
      suspendedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      isOnline: false,
      isAvailable: false,
      vehicle: {
        type: 'economy',
        make: 'Toyota',
        model: 'Yaris',
        year: 2017,
        color: 'أبيض',
        plateNumber: 'خ ض ج 4444',
      },
      documents: {
        nationalId: { url: 'https://placehold.co/400x300', status: 'approved' },
        driverLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        vehicleLicense: { url: 'https://placehold.co/400x300', status: 'approved' },
        criminalRecord: { url: 'https://placehold.co/400x300', status: 'approved' },
      },
      rating: 3.2,
      totalRatings: 25,
      totalTrips: 50,
      completedTrips: 35,
      cancelledTrips: 15,
      totalEarnings: 2800,
      walletBalance: 0,
      commission: 20,
      acceptanceRate: 60,
      cancellationRate: 30,
      onlineHours: 280,
    },
  ];

  const createdDrivers = await Driver.insertMany(drivers);

  return createdDrivers.map((d) => ({
    _id: d._id.toString(),
    userId: d.user.toString(),
    displayName: d.displayName,
    status: d.status,
    vehicleType: d.vehicle?.type || 'economy',
    isOnline: d.isOnline,
  }));
}
