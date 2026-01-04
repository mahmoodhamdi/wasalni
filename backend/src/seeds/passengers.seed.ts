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
      user: passengerUsers[0]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'شارع الهرم، الجيزة',
          location: {
            type: 'Point',
            coordinates: [31.2001, 30.0131],
          },
          type: 'home',
        },
        {
          name: 'العمل',
          address: 'وسط البلد، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.2357, 30.0444],
          },
          type: 'work',
        },
      ],
      emergencyContacts: [
        {
          name: 'محمد (أخ)',
          phone: '+201234567890',
          relationship: 'brother',
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
      paymentMethods: [
        {
          type: 'card',
          lastFour: '4242',
          brand: 'visa',
          isDefault: true,
        },
      ],
      rating: 4.9,
      totalRatings: 45,
      totalTrips: 50,
      wallet: {
        balance: 250,
        currency: 'EGP',
      },
    },
    {
      user: passengerUsers[1]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'مصر الجديدة، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.2497, 30.0626],
          },
          type: 'home',
        },
        {
          name: 'الجامعة',
          address: 'جامعة عين شمس',
          location: {
            type: 'Point',
            coordinates: [31.2826, 30.0751],
          },
          type: 'other',
        },
      ],
      emergencyContacts: [
        {
          name: 'أمي',
          phone: '+201234567891',
          relationship: 'mother',
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
      rating: 4.8,
      totalRatings: 32,
      totalTrips: 35,
      wallet: {
        balance: 100,
        currency: 'EGP',
      },
    },
    {
      user: passengerUsers[2]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'المعادي، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.2500, 29.9603],
          },
          type: 'home',
        },
      ],
      rating: 4.7,
      totalRatings: 20,
      totalTrips: 25,
      wallet: {
        balance: 0,
        currency: 'EGP',
      },
    },
    {
      user: passengerUsers[3]._id,
      savedPlaces: [
        {
          name: 'المنزل',
          address: 'مدينة نصر، القاهرة',
          location: {
            type: 'Point',
            coordinates: [31.3300, 30.0500],
          },
          type: 'home',
        },
        {
          name: 'العمل',
          address: 'التجمع الخامس',
          location: {
            type: 'Point',
            coordinates: [31.4200, 30.0074],
          },
          type: 'work',
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
      rating: 5.0,
      totalRatings: 15,
      totalTrips: 15,
      wallet: {
        balance: 500,
        currency: 'EGP',
      },
    },
    {
      user: passengerUsers[4]._id,
      savedPlaces: [],
      rating: 4.5,
      totalRatings: 8,
      totalTrips: 10,
      wallet: {
        balance: 75,
        currency: 'EGP',
      },
    },
    // Suspended passenger
    {
      user: passengerUsers[5]._id,
      savedPlaces: [],
      rating: 2.5,
      totalRatings: 10,
      totalTrips: 12,
      wallet: {
        balance: 0,
        currency: 'EGP',
      },
    },
  ];

  const createdPassengers = await Passenger.insertMany(passengers);

  return createdPassengers.map((p, i) => ({
    _id: p._id.toString(),
    userId: p.user.toString(),
    name: passengerUsers[i].name,
  }));
}
