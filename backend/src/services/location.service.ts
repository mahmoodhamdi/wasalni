import { Types } from 'mongoose';
import { getRedisClient } from '../config/redis';
import { calculateETA, getDistanceMatrix } from '../config/maps';
import DriverLocation, { IDriverLocation } from '../models/DriverLocation';
import Driver from '../models/Driver';
import { logger } from '../utils/logger';
import { config } from '../config';

// Redis keys
const DRIVER_LOCATION_KEY = 'driver:location:';
const NEARBY_DRIVERS_KEY = 'drivers:nearby';
const DRIVER_ONLINE_SET = 'drivers:online';

interface DriverLocationData {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  isOnline: boolean;
  isAvailable: boolean;
  updatedAt: number;
}

interface NearbyDriver {
  driverId: string;
  distance: number;
  lat: number;
  lng: number;
  heading?: number;
  driver?: {
    _id: string;
    name: string;
    phone: string;
    avatar?: string;
    rating: number;
    vehicle: {
      type: string;
      category: string;
      make: string;
      model: string;
      color: string;
      plateNumber: string;
    };
  };
}

/**
 * Update driver location in Redis and MongoDB
 */
export const updateDriverLocation = async (
  driverId: string | Types.ObjectId,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number,
  accuracy?: number
): Promise<void> => {
  const driverIdStr = driverId.toString();
  const redis = getRedisClient();
  const now = Date.now();

  try {
    // Update Redis for real-time access
    if (redis) {
      const locationData: DriverLocationData = {
        driverId: driverIdStr,
        lat,
        lng,
        heading,
        speed,
        accuracy,
        isOnline: true,
        isAvailable: true,
        updatedAt: now,
      };

      // Store location data
      await redis.hset(
        `${DRIVER_LOCATION_KEY}${driverIdStr}`,
        {
          driverId: driverIdStr,
          lat: lat.toString(),
          lng: lng.toString(),
          heading: heading?.toString() || '',
          speed: speed?.toString() || '',
          accuracy: accuracy?.toString() || '',
          isOnline: 'true',
          isAvailable: 'true',
          updatedAt: now.toString(),
        }
      );

      // Update geospatial index for nearby queries
      await redis.geoadd(NEARBY_DRIVERS_KEY, lng, lat, driverIdStr);

      // Set TTL (expire after 5 minutes of no updates)
      await redis.expire(`${DRIVER_LOCATION_KEY}${driverIdStr}`, 300);
    }

    // Also update MongoDB (for persistence and complex queries)
    await DriverLocation.updateLocation(
      new Types.ObjectId(driverIdStr),
      lat,
      lng,
      heading,
      speed,
      accuracy
    );
  } catch (error) {
    logger.error(`Failed to update driver location: ${error}`);
    throw error;
  }
};

/**
 * Find nearby available drivers using Redis GEO or MongoDB fallback
 */
export const findNearbyDrivers = async (
  lat: number,
  lng: number,
  radiusKm: number = config.app.maxSearchRadius,
  limit: number = 20,
  vehicleType?: string,
  category?: string
): Promise<NearbyDriver[]> => {
  const redis = getRedisClient();

  try {
    let nearbyDriverIds: { driverId: string; distance: number }[] = [];

    // Try Redis first for faster geo queries
    if (redis) {
      const results = await redis.georadius(
        NEARBY_DRIVERS_KEY,
        lng,
        lat,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC',
        'COUNT',
        limit * 2 // Get more to filter by availability
      );

      if (results && results.length > 0) {
        nearbyDriverIds = results.map((result: [string, string]) => ({
          driverId: result[0],
          distance: parseFloat(result[1]),
        }));

        // Filter by online and available status
        const availableDrivers: { driverId: string; distance: number; data: DriverLocationData }[] = [];

        for (const driver of nearbyDriverIds) {
          const locationData = await redis.hgetall(`${DRIVER_LOCATION_KEY}${driver.driverId}`);

          if (
            locationData &&
            locationData.isOnline === 'true' &&
            locationData.isAvailable === 'true'
          ) {
            availableDrivers.push({
              ...driver,
              data: {
                driverId: driver.driverId,
                lat: parseFloat(locationData.lat as string),
                lng: parseFloat(locationData.lng as string),
                heading: locationData.heading ? parseFloat(locationData.heading as string) : undefined,
                speed: locationData.speed ? parseFloat(locationData.speed as string) : undefined,
                accuracy: locationData.accuracy ? parseFloat(locationData.accuracy as string) : undefined,
                isOnline: true,
                isAvailable: true,
                updatedAt: parseInt(locationData.updatedAt as string),
              },
            });
          }

          if (availableDrivers.length >= limit) break;
        }

        // Fetch driver details from MongoDB
        const driverIds = availableDrivers.map((d) => new Types.ObjectId(d.driverId));
        const drivers = await Driver.find({ _id: { $in: driverIds } })
          .populate('userId', 'name phone avatar')
          .lean();

        // Filter by vehicle type/category if specified
        const filteredDrivers = drivers.filter((driver) => {
          if (vehicleType && driver.vehicle.type !== vehicleType) return false;
          if (category && driver.vehicle.category !== category) return false;
          return driver.status === 'approved';
        });

        return availableDrivers
          .filter((d) => filteredDrivers.some((fd) => fd._id.toString() === d.driverId))
          .map((d) => {
            const driverData = filteredDrivers.find((fd) => fd._id.toString() === d.driverId);
            const user = driverData?.userId as { name: string; phone: string; avatar?: string } | undefined;

            return {
              driverId: d.driverId,
              distance: d.distance,
              lat: d.data.lat,
              lng: d.data.lng,
              heading: d.data.heading,
              driver: driverData
                ? {
                    _id: driverData._id.toString(),
                    name: user?.name || '',
                    phone: user?.phone || '',
                    avatar: user?.avatar,
                    rating: driverData.rating,
                    vehicle: {
                      type: driverData.vehicle.type,
                      category: driverData.vehicle.category,
                      make: driverData.vehicle.make,
                      model: driverData.vehicle.model,
                      color: driverData.vehicle.color,
                      plateNumber: driverData.vehicle.plateNumber,
                    },
                  }
                : undefined,
            };
          });
      }
    }

    // Fallback to MongoDB geospatial query
    logger.info('Using MongoDB fallback for nearby drivers');
    const mongoResults = await DriverLocation.findNearbyAvailable(lat, lng, radiusKm, limit);

    const nearbyFromMongo: NearbyDriver[] = [];

    for (const result of mongoResults) {
      // driverId is populated, so it's the full Driver document
      const populatedDriver = result.driverId as unknown as {
        _id: Types.ObjectId;
        userId: { name: string; phone: string; avatar?: string };
        rating: number;
        status: string;
        vehicle: {
          type: string;
          category: string;
          make: string;
          model: string;
          color: string;
          plateNumber: string;
        };
      };

      if (!populatedDriver || populatedDriver.status !== 'approved') continue;
      if (vehicleType && populatedDriver.vehicle.type !== vehicleType) continue;
      if (category && populatedDriver.vehicle.category !== category) continue;

      const user = populatedDriver.userId;
      const [driverLng, driverLat] = result.location.coordinates;
      const distance = calculateHaversineDistance(lat, lng, driverLat, driverLng);

      nearbyFromMongo.push({
        driverId: populatedDriver._id.toString(),
        distance,
        lat: driverLat,
        lng: driverLng,
        heading: result.heading,
        driver: {
          _id: populatedDriver._id.toString(),
          name: user?.name || '',
          phone: user?.phone || '',
          avatar: user?.avatar,
          rating: populatedDriver.rating,
          vehicle: {
            type: populatedDriver.vehicle.type,
            category: populatedDriver.vehicle.category,
            make: populatedDriver.vehicle.make,
            model: populatedDriver.vehicle.model,
            color: populatedDriver.vehicle.color,
            plateNumber: populatedDriver.vehicle.plateNumber,
          },
        },
      });
    }

    return nearbyFromMongo;
  } catch (error) {
    logger.error(`Failed to find nearby drivers: ${error}`);
    throw error;
  }
};

/**
 * Set driver online/offline status
 */
export const setDriverOnlineStatus = async (
  driverId: string | Types.ObjectId,
  isOnline: boolean,
  isAvailable: boolean = true
): Promise<void> => {
  const driverIdStr = driverId.toString();
  const redis = getRedisClient();

  try {
    if (redis) {
      if (isOnline) {
        await redis.sadd(DRIVER_ONLINE_SET, driverIdStr);
        await redis.hset(`${DRIVER_LOCATION_KEY}${driverIdStr}`, {
          isOnline: 'true',
          isAvailable: isAvailable ? 'true' : 'false',
        });
      } else {
        await redis.srem(DRIVER_ONLINE_SET, driverIdStr);
        await redis.zrem(NEARBY_DRIVERS_KEY, driverIdStr);
        await redis.del(`${DRIVER_LOCATION_KEY}${driverIdStr}`);
      }
    }

    // Update MongoDB
    await DriverLocation.setOnlineStatus(new Types.ObjectId(driverIdStr), isOnline, isAvailable);

    // Also update Driver model
    await Driver.findByIdAndUpdate(driverIdStr, {
      isOnline,
      isAvailable: isOnline ? isAvailable : false,
    });
  } catch (error) {
    logger.error(`Failed to set driver online status: ${error}`);
    throw error;
  }
};

/**
 * Set driver availability (busy/available)
 */
export const setDriverAvailability = async (
  driverId: string | Types.ObjectId,
  isAvailable: boolean
): Promise<void> => {
  const driverIdStr = driverId.toString();
  const redis = getRedisClient();

  try {
    if (redis) {
      await redis.hset(`${DRIVER_LOCATION_KEY}${driverIdStr}`, 'isAvailable', isAvailable ? 'true' : 'false');
    }

    await DriverLocation.setOnlineStatus(new Types.ObjectId(driverIdStr), true, isAvailable);
    await Driver.findByIdAndUpdate(driverIdStr, { isAvailable });
  } catch (error) {
    logger.error(`Failed to set driver availability: ${error}`);
    throw error;
  }
};

/**
 * Get driver's current location
 */
export const getDriverLocation = async (
  driverId: string | Types.ObjectId
): Promise<{ lat: number; lng: number; heading?: number; updatedAt: Date } | null> => {
  const driverIdStr = driverId.toString();
  const redis = getRedisClient();

  try {
    // Try Redis first
    if (redis) {
      const locationData = await redis.hgetall(`${DRIVER_LOCATION_KEY}${driverIdStr}`);

      if (locationData && locationData.lat && locationData.lng) {
        return {
          lat: parseFloat(locationData.lat as string),
          lng: parseFloat(locationData.lng as string),
          heading: locationData.heading ? parseFloat(locationData.heading as string) : undefined,
          updatedAt: new Date(parseInt(locationData.updatedAt as string)),
        };
      }
    }

    // Fallback to MongoDB
    const location = await DriverLocation.getDriverLocation(new Types.ObjectId(driverIdStr));

    if (location) {
      const [lng, lat] = location.location.coordinates;
      return {
        lat,
        lng,
        heading: location.heading,
        updatedAt: location.updatedAt,
      };
    }

    return null;
  } catch (error) {
    logger.error(`Failed to get driver location: ${error}`);
    throw error;
  }
};

/**
 * Get estimated arrival time between driver and passenger
 */
export const estimateArrivalTime = async (
  driverLocation: { lat: number; lng: number },
  passengerLocation: { lat: number; lng: number }
): Promise<{ distanceMeters: number; durationSeconds: number; distanceText: string; durationText: string } | null> => {
  try {
    const result = await calculateETA(driverLocation, passengerLocation);

    if (result) {
      return {
        distanceMeters: result.distance,
        durationSeconds: result.duration,
        distanceText: formatDistance(result.distance),
        durationText: formatDuration(result.duration),
      };
    }

    // Fallback to Haversine calculation
    const distance = calculateHaversineDistance(
      driverLocation.lat,
      driverLocation.lng,
      passengerLocation.lat,
      passengerLocation.lng
    );

    // Assume average speed of 30 km/h in city
    const durationMinutes = (distance / 30) * 60;
    const durationSeconds = Math.round(durationMinutes * 60);

    return {
      distanceMeters: Math.round(distance * 1000),
      durationSeconds,
      distanceText: formatDistance(distance * 1000),
      durationText: formatDuration(durationSeconds),
    };
  } catch (error) {
    logger.error(`Failed to estimate arrival time: ${error}`);
    return null;
  }
};

/**
 * Get route/path for a trip
 */
export const getTripPath = async (
  tripId: string | Types.ObjectId
): Promise<{ lat: number; lng: number; timestamp: Date }[]> => {
  // This would typically store path points during the trip
  // For now, return empty array - will be implemented with trip tracking
  return [];
};

/**
 * Get distance matrix for multiple drivers to one passenger
 */
export const getDriverDistances = async (
  driverLocations: { driverId: string; lat: number; lng: number }[],
  passengerLocation: { lat: number; lng: number }
): Promise<{ driverId: string; distance: number; duration: number }[]> => {
  try {
    const origins = driverLocations.map((d) => ({ lat: d.lat, lng: d.lng }));
    const destinations = [passengerLocation];

    const result = await getDistanceMatrix(origins, destinations);

    if (result && result.rows) {
      return driverLocations.map((driver, index) => {
        const element = result.rows[index]?.elements[0];
        return {
          driverId: driver.driverId,
          distance: element?.distance?.value || 0,
          duration: element?.duration?.value || 0,
        };
      });
    }

    // Fallback to Haversine
    return driverLocations.map((driver) => {
      const distance = calculateHaversineDistance(
        driver.lat,
        driver.lng,
        passengerLocation.lat,
        passengerLocation.lng
      );
      return {
        driverId: driver.driverId,
        distance: Math.round(distance * 1000),
        duration: Math.round((distance / 30) * 3600), // Assume 30 km/h
      };
    });
  } catch (error) {
    logger.error(`Failed to get driver distances: ${error}`);
    throw error;
  }
};

/**
 * Remove driver from location tracking (when going offline)
 */
export const removeDriverLocation = async (
  driverId: string | Types.ObjectId
): Promise<void> => {
  const driverIdStr = driverId.toString();
  const redis = getRedisClient();

  try {
    if (redis) {
      // Remove from online set
      await redis.srem(DRIVER_ONLINE_SET, driverIdStr);
      // Remove from geo index
      await redis.zrem(NEARBY_DRIVERS_KEY, driverIdStr);
      // Delete location data
      await redis.del(`${DRIVER_LOCATION_KEY}${driverIdStr}`);
    }

    // Update MongoDB
    await DriverLocation.setOnlineStatus(new Types.ObjectId(driverIdStr), false, false);

    // Update Driver model
    await Driver.findByIdAndUpdate(driverIdStr, {
      isOnline: false,
      isAvailable: false,
    });

    logger.info(`Driver ${driverIdStr} location removed`);
  } catch (error) {
    logger.error(`Failed to remove driver location: ${error}`);
    throw error;
  }
};

/**
 * Get online drivers count
 */
export const getOnlineDriversCount = async (): Promise<number> => {
  const redis = getRedisClient();

  try {
    if (redis) {
      return await redis.scard(DRIVER_ONLINE_SET);
    }
    return await DriverLocation.getOnlineCount();
  } catch (error) {
    logger.error(`Failed to get online drivers count: ${error}`);
    return 0;
  }
};

/**
 * Get all online drivers for admin dashboard
 */
export const getAllOnlineDrivers = async (): Promise<NearbyDriver[]> => {
  try {
    const locations = await DriverLocation.find({ isOnline: true })
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'name phone avatar' },
      })
      .lean();

    return locations.map((loc) => {
      const driver = loc.driverId as unknown as {
        _id: Types.ObjectId;
        userId: { name: string; phone: string; avatar?: string };
        rating: number;
        vehicle: {
          type: string;
          category: string;
          make: string;
          model: string;
          color: string;
          plateNumber: string;
        };
      };
      const [lng, lat] = loc.location.coordinates;

      return {
        driverId: driver._id.toString(),
        distance: 0,
        lat,
        lng,
        heading: loc.heading,
        driver: {
          _id: driver._id.toString(),
          name: driver.userId?.name || '',
          phone: driver.userId?.phone || '',
          avatar: driver.userId?.avatar,
          rating: driver.rating,
          vehicle: driver.vehicle,
        },
      };
    });
  } catch (error) {
    logger.error(`Failed to get all online drivers: ${error}`);
    return [];
  }
};

// Helper: Calculate Haversine distance in km
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Helper: Format distance in Arabic
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} متر`;
  }
  return `${(meters / 1000).toFixed(1)} كم`;
}

// Helper: Format duration in Arabic
function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
}

export default {
  updateDriverLocation,
  findNearbyDrivers,
  setDriverOnlineStatus,
  setDriverAvailability,
  getDriverLocation,
  removeDriverLocation,
  estimateArrivalTime,
  getTripPath,
  getDriverDistances,
  getOnlineDriversCount,
  getAllOnlineDrivers,
};
