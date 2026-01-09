import DriverLocation from '../models/DriverLocation';
import { SeededDriver } from './drivers.seed';

// Cairo area locations for online drivers
const onlineLocations = [
  { lat: 30.0444, lng: 31.2357, heading: 45 }, // Downtown Cairo
  { lat: 30.0626, lng: 31.2497, heading: 180 }, // Heliopolis
  { lat: 30.0761, lng: 31.0187, heading: 270 }, // 6th October
];

export async function seedDriverLocations(drivers: SeededDriver[]): Promise<number> {
  // Get online drivers from seeded drivers
  const onlineDrivers = drivers.filter((d) => d.isOnline);

  if (onlineDrivers.length === 0) {
    console.warn('⚠️ No online drivers found to seed locations');
    return 0;
  }

  const driverLocations = onlineDrivers.map((driver, index) => {
    const location = onlineLocations[index % onlineLocations.length];
    return {
      driverId: driver._id,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      heading: location.heading,
      speed: Math.floor(Math.random() * 30) + 10, // 10-40 km/h
      accuracy: Math.floor(Math.random() * 10) + 5, // 5-15 meters
      isOnline: true,
      isAvailable: driver.status === 'approved',
    };
  });

  await DriverLocation.insertMany(driverLocations);

  return driverLocations.length;
}
