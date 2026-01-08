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

  const passengers = [
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

  const createdPassengers = await Passenger.insertMany(passengers);

  return createdPassengers.map((p, i) => ({
    _id: p._id.toString(),
    userId: p.userId.toString(),
    name: passengerUsers[i].name,
  }));
}
