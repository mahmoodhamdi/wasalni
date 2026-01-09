import { Passenger } from '../models';
import { SeededUser } from './users.seed';

export interface SeededPassenger {
  _id: string;
  userId: string;
  name: string;
}

export async function seedPassengers(users: SeededUser[]): Promise<SeededPassenger[]> {
  const passengerUsers = users.filter((u) => u.role === 'passenger');

  if (passengerUsers.length < 6) {
    console.warn('⚠️ Not enough passenger users found');
    return [];
  }

  const passengers: any[] = [
    // Active passengers with full data
    {
      userId: passengerUsers[0]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'شارع الهرم، الجيزة',
          location: {
            type: 'Point',
            coordinates: [31.2001, 30.0131],
          },
          icon: 'home',
        },
        {
          name: 'العمل',
          address: 'وسط البلد، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.2357, 30.0444],
          },
          icon: 'work',
        },
      ],
      emergencyContacts: [
        {
          name: 'محمد (أخ)',
          phone: '+201234567890',
          relationship: 'sibling',
          notifyOnTrip: true,
          notifyOnSOS: true,
        },
      ],
      safetyPreferences: {
        autoShareTrips: true,
        sendETAUpdates: true,
        sosGestureEnabled: true,
        nightModeAlerts: true,
      },
      defaultPaymentMethod: 'cash',
      walletBalance: 250,
      rating: 4.9,
      totalRatings: 45,
      totalTrips: 50,
      totalSpent: 2500,
    },
    {
      userId: passengerUsers[1]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'مصر الجديدة، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.2497, 30.0626],
          },
          icon: 'home',
        },
        {
          name: 'الجامعة',
          address: 'جامعة عين شمس',
          location: {
            type: 'Point',
            coordinates: [31.2826, 30.0751],
          },
          icon: 'favorite',
        },
      ],
      emergencyContacts: [
        {
          name: 'أمي',
          phone: '+201234567891',
          relationship: 'parent',
          notifyOnTrip: true,
          notifyOnSOS: true,
        },
      ],
      safetyPreferences: {
        autoShareTrips: true,
        sendETAUpdates: true,
        sosGestureEnabled: true,
        nightModeAlerts: true,
      },
      defaultPaymentMethod: 'cash',
      walletBalance: 100,
      rating: 4.8,
      totalRatings: 32,
      totalTrips: 35,
      totalSpent: 1750,
    },
    {
      userId: passengerUsers[2]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'المعادي، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.2500, 29.9603],
          },
          icon: 'home',
        },
      ],
      defaultPaymentMethod: 'cash',
      walletBalance: 0,
      rating: 4.7,
      totalRatings: 20,
      totalTrips: 25,
      totalSpent: 1250,
    },
    {
      userId: passengerUsers[3]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'مدينة نصر، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.3300, 30.0500],
          },
          icon: 'home',
        },
        {
          name: 'العمل',
          address: 'التجمع الخامس',
          location: {
            type: 'Point',
            coordinates: [31.4200, 30.0074],
          },
          icon: 'work',
        },
      ],
      emergencyContacts: [
        {
          name: 'زوجي',
          phone: '+201234567892',
          relationship: 'spouse',
          notifyOnTrip: true,
          notifyOnSOS: true,
        },
      ],
      safetyPreferences: {
        autoShareTrips: true,
        sendETAUpdates: true,
        sosGestureEnabled: true,
        nightModeAlerts: true,
      },
      defaultPaymentMethod: 'wallet',
      walletBalance: 500,
      rating: 5.0,
      totalRatings: 15,
      totalTrips: 15,
      totalSpent: 750,
    },
    {
      userId: passengerUsers[4]._id,
      savedPlaces: [],
      defaultPaymentMethod: 'cash',
      walletBalance: 75,
      rating: 4.5,
      totalRatings: 8,
      totalTrips: 10,
      totalSpent: 500,
    },
    // Suspended passenger
    {
      userId: passengerUsers[5]._id,
      savedPlaces: [],
      defaultPaymentMethod: 'cash',
      walletBalance: 0,
      rating: 2.5,
      totalRatings: 10,
      totalTrips: 12,
      totalSpent: 600,
    },
  ];

  // Add more passengers if available (passengers 7-16)
  const additionalPassengerData = [
    { rating: 4.6, totalTrips: 28, totalSpent: 1400, walletBalance: 150 },
    { rating: 4.9, totalTrips: 42, totalSpent: 2100, walletBalance: 300 },
    { rating: 4.3, totalTrips: 15, totalSpent: 750, walletBalance: 0 },
    { rating: 4.7, totalTrips: 33, totalSpent: 1650, walletBalance: 200 },
    { rating: 4.5, totalTrips: 22, totalSpent: 1100, walletBalance: 50 },
    { rating: 4.8, totalTrips: 55, totalSpent: 2750, walletBalance: 400 },
    { rating: 4.4, totalTrips: 18, totalSpent: 900, walletBalance: 0 },
    { rating: 4.6, totalTrips: 31, totalSpent: 1550, walletBalance: 100 },
    { rating: 4.2, totalTrips: 12, totalSpent: 600, walletBalance: 75 },
    { rating: 4.9, totalTrips: 48, totalSpent: 2400, walletBalance: 350 },
  ];

  for (let i = 6; i < passengerUsers.length && i - 6 < additionalPassengerData.length; i++) {
    const data = additionalPassengerData[i - 6];
    passengers.push({
      userId: passengerUsers[i]._id,
      savedPlaces: [],
      defaultPaymentMethod: i % 2 === 0 ? 'cash' : 'wallet',
      walletBalance: data.walletBalance,
      rating: data.rating,
      totalRatings: Math.floor(data.totalTrips * 0.8),
      totalTrips: data.totalTrips,
      totalSpent: data.totalSpent,
    });
  }

  const createdPassengers = await Passenger.insertMany(passengers);

  return createdPassengers.map((p, i) => ({
    _id: p._id.toString(),
    userId: p.userId.toString(),
    name: passengerUsers[i].name,
  }));
}
