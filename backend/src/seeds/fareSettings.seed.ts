import { FareSetting } from '../models';

export async function seedFareSettings(): Promise<any[]> {
  // Clear existing fare settings
  await FareSetting.deleteMany({});

  const fareSettings = [
    {
      rideType: 'economy',
      baseFare: 10,
      perKm: 3,
      perMinute: 0.5,
      minimumFare: 15,
      bookingFee: 3,
      waitingFare: {
        freeMinutes: 5,
        perMinute: 1,
      },
      surgeTimes: [
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '07:00',
          endTime: '09:00',
          multiplier: 1.3,
        },
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '17:00',
          endTime: '20:00',
          multiplier: 1.3,
        },
      ],
      isActive: true,
    },
    {
      rideType: 'comfort',
      baseFare: 15,
      perKm: 4,
      perMinute: 0.75,
      minimumFare: 20,
      bookingFee: 5,
      waitingFare: {
        freeMinutes: 5,
        perMinute: 1.5,
      },
      surgeTimes: [
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '07:00',
          endTime: '09:00',
          multiplier: 1.25,
        },
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '17:00',
          endTime: '20:00',
          multiplier: 1.25,
        },
      ],
      isActive: true,
    },
    {
      rideType: 'family',
      baseFare: 20,
      perKm: 5,
      perMinute: 1,
      minimumFare: 30,
      bookingFee: 5,
      waitingFare: {
        freeMinutes: 7,
        perMinute: 2,
      },
      surgeTimes: [
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '07:00',
          endTime: '09:00',
          multiplier: 1.2,
        },
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '17:00',
          endTime: '20:00',
          multiplier: 1.2,
        },
      ],
      isActive: true,
    },
    {
      rideType: 'tuktuk',
      baseFare: 5,
      perKm: 2,
      perMinute: 0.25,
      minimumFare: 10,
      bookingFee: 2,
      waitingFare: {
        freeMinutes: 3,
        perMinute: 0.5,
      },
      surgeTimes: [
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '07:00',
          endTime: '09:00',
          multiplier: 1.2,
        },
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '17:00',
          endTime: '20:00',
          multiplier: 1.2,
        },
      ],
      isActive: true,
    },
    {
      rideType: 'motorcycle',
      baseFare: 7,
      perKm: 2.5,
      perMinute: 0.3,
      minimumFare: 12,
      bookingFee: 2,
      waitingFare: {
        freeMinutes: 3,
        perMinute: 0.5,
      },
      surgeTimes: [
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '07:00',
          endTime: '09:00',
          multiplier: 1.15,
        },
        {
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '17:00',
          endTime: '20:00',
          multiplier: 1.15,
        },
      ],
      isActive: true,
    },
  ];

  const createdSettings = await FareSetting.insertMany(fareSettings);
  return createdSettings;
}
