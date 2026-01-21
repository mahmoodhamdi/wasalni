import { Request, Response } from 'express';
import { Types } from 'mongoose';
import locationService from '../services/location.service';
import mapsService from '../services/maps.service';
import { logger } from '../utils/logger';

/**
 * Update driver location
 * POST /api/v1/location/update
 */
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.driverId;
    if (!driverId) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح للسائقين فقط',
      });
    }

    const { lat, lng, heading, speed, accuracy } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'الإحداثيات مطلوبة',
      });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'إحداثيات غير صالحة',
      });
    }

    await locationService.updateDriverLocation(driverId, lat, lng, heading, speed, accuracy);

    return res.json({
      success: true,
      message: 'تم تحديث الموقع',
    });
  } catch (error) {
    logger.error(`Update location error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث الموقع',
    });
  }
};

/**
 * Get nearby available drivers
 * GET /api/v1/location/drivers/nearby
 */
export const getNearbyDrivers = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius, vehicleType, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'الإحداثيات مطلوبة',
      });
    }

    const drivers = await locationService.findNearbyDrivers(
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseFloat(radius as string) : undefined,
      20,
      vehicleType as string,
      category as string
    );

    return res.json({
      success: true,
      data: {
        drivers,
        count: drivers.length,
      },
    });
  } catch (error) {
    logger.error(`Get nearby drivers error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في البحث عن السائقين',
    });
  }
};

/**
 * Set driver online status
 * POST /api/v1/location/status
 */
export const setOnlineStatus = async (req: Request, res: Response) => {
  try {
    const driverId = req.user?.driverId;
    if (!driverId) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح للسائقين فقط',
      });
    }

    const { isOnline, isAvailable } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'حالة الاتصال مطلوبة',
      });
    }

    await locationService.setDriverOnlineStatus(driverId, isOnline, isAvailable);

    return res.json({
      success: true,
      message: isOnline ? 'أنت الآن متصل' : 'تم قطع الاتصال',
      data: { isOnline, isAvailable: isOnline ? (isAvailable ?? true) : false },
    });
  } catch (error) {
    logger.error(`Set online status error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث الحالة',
    });
  }
};

/**
 * Get driver location
 * GET /api/v1/location/driver/:driverId
 */
export const getDriverLocation = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    if (!Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف السائق غير صالح',
      });
    }

    const location = await locationService.getDriverLocation(driverId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على موقع السائق',
      });
    }

    return res.json({
      success: true,
      data: { location },
    });
  } catch (error) {
    logger.error(`Get driver location error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الحصول على الموقع',
    });
  }
};

/**
 * Get ETA to a location
 * GET /api/v1/location/eta
 */
export const getETA = async (req: Request, res: Response) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({
        success: false,
        message: 'الإحداثيات مطلوبة',
      });
    }

    const eta = await locationService.estimateArrivalTime(
      { lat: parseFloat(originLat as string), lng: parseFloat(originLng as string) },
      { lat: parseFloat(destLat as string), lng: parseFloat(destLng as string) }
    );

    if (!eta) {
      return res.status(500).json({
        success: false,
        message: 'فشل في حساب الوقت المتوقع',
      });
    }

    return res.json({
      success: true,
      data: { eta },
    });
  } catch (error) {
    logger.error(`Get ETA error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في حساب الوقت',
    });
  }
};

/**
 * Search places (autocomplete)
 * GET /api/v1/location/search
 */
export const searchPlaces = async (req: Request, res: Response) => {
  try {
    const { query, lat, lng } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'نص البحث مطلوب',
      });
    }

    const location = lat && lng ? { lat: parseFloat(lat as string), lng: parseFloat(lng as string) } : undefined;

    const places = await mapsService.searchPlaces(query as string, location);

    return res.json({
      success: true,
      data: { places },
    });
  } catch (error) {
    logger.error(`Search places error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في البحث',
    });
  }
};

/**
 * Get place details
 * GET /api/v1/location/place/:placeId
 */
export const getPlaceDetails = async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المكان مطلوب',
      });
    }

    const place = await mapsService.getPlaceDetails(placeId);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على المكان',
      });
    }

    return res.json({
      success: true,
      data: { place },
    });
  } catch (error) {
    logger.error(`Get place details error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الحصول على تفاصيل المكان',
    });
  }
};

/**
 * Reverse geocode coordinates
 * GET /api/v1/location/address
 */
export const getAddress = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'الإحداثيات مطلوبة',
      });
    }

    const address = await mapsService.getAddressFromCoordinates(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على العنوان',
      });
    }

    return res.json({
      success: true,
      data: { address },
    });
  } catch (error) {
    logger.error(`Get address error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الحصول على العنوان',
    });
  }
};

/**
 * Calculate route between two points
 * POST /api/v1/location/route
 */
export const calculateRoute = async (req: Request, res: Response) => {
  try {
    const { origin, destination, waypoints } = req.body;

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({
        success: false,
        message: 'نقاط البداية والنهاية مطلوبة',
      });
    }

    const route = await mapsService.calculateRoute(origin, destination, waypoints);

    if (!route) {
      return res.status(500).json({
        success: false,
        message: 'فشل في حساب المسار',
      });
    }

    return res.json({
      success: true,
      data: { route },
    });
  } catch (error) {
    logger.error(`Calculate route error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في حساب المسار',
    });
  }
};

/**
 * Get fare estimate
 * POST /api/v1/location/fare
 */
export const getFareEstimate = async (req: Request, res: Response) => {
  try {
    const { origin, destination, rideCategory } = req.body;

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({
        success: false,
        message: 'نقاط البداية والنهاية مطلوبة',
      });
    }

    const fare = await mapsService.calculateFareEstimate(
      origin,
      destination,
      rideCategory || 'economy'
    );

    if (!fare) {
      return res.status(500).json({
        success: false,
        message: 'فشل في حساب التكلفة',
      });
    }

    return res.json({
      success: true,
      data: { fare },
    });
  } catch (error) {
    logger.error(`Get fare estimate error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في حساب التكلفة',
    });
  }
};

/**
 * Get online drivers count (admin)
 * GET /api/v1/location/stats
 */
export const getLocationStats = async (_req: Request, res: Response) => {
  try {
    const onlineCount = await locationService.getOnlineDriversCount();

    return res.json({
      success: true,
      data: {
        onlineDrivers: onlineCount,
      },
    });
  } catch (error) {
    logger.error(`Get location stats error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الحصول على الإحصائيات',
    });
  }
};

/**
 * Get all online drivers (admin)
 * GET /api/v1/location/drivers/online
 */
export const getAllOnlineDrivers = async (_req: Request, res: Response) => {
  try {
    const drivers = await locationService.getAllOnlineDrivers();

    return res.json({
      success: true,
      data: {
        drivers,
        count: drivers.length,
      },
    });
  } catch (error) {
    logger.error(`Get all online drivers error: ${error}`);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الحصول على السائقين',
    });
  }
};

export default {
  updateLocation,
  getNearbyDrivers,
  setOnlineStatus,
  getDriverLocation,
  getETA,
  searchPlaces,
  getPlaceDetails,
  getAddress,
  calculateRoute,
  getFareEstimate,
  getLocationStats,
  getAllOnlineDrivers,
};
