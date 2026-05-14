import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Passenger from '../models/Passenger';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';

/**
 * Get all saved places for the authenticated passenger
 * GET /api/v1/passenger/saved-places
 */
export const getSavedPlaces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const passenger = await Passenger.findOne({ userId }).select('savedPlaces');
    if (!passenger) {
      throw new NotFoundError('Passenger profile not found', 'ملف الراكب غير موجود');
    }

    sendSuccess(
      res,
      { savedPlaces: passenger.savedPlaces || [] },
      'Saved places retrieved successfully',
      'تم استرجاع الأماكن المحفوظة بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new saved place
 * POST /api/v1/passenger/saved-places
 */
export const addSavedPlace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, address, latitude, longitude, icon } = req.body;

    // Validate required fields
    if (!name || !address || latitude === undefined || longitude === undefined) {
      throw new BadRequestError(
        'Name, address, latitude, and longitude are required',
        'الاسم والعنوان وخط العرض وخط الطول مطلوبة'
      );
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestError('Invalid latitude', 'خط العرض غير صالح');
    }
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestError('Invalid longitude', 'خط الطول غير صالح');
    }

    const passenger = await Passenger.findOne({ userId });
    if (!passenger) {
      throw new NotFoundError('Passenger profile not found', 'ملف الراكب غير موجود');
    }

    // Check if saved places limit reached (max 10)
    if (passenger.savedPlaces && passenger.savedPlaces.length >= 10) {
      throw new BadRequestError(
        'Maximum saved places limit reached (10)',
        'تم الوصول للحد الأقصى من الأماكن المحفوظة (10)'
      );
    }

    // Check for duplicate name
    const existingPlace = passenger.savedPlaces?.find(
      (place) => place.name.toLowerCase() === name.toLowerCase()
    );
    if (existingPlace) {
      throw new BadRequestError(
        'A place with this name already exists',
        'يوجد مكان بهذا الاسم بالفعل'
      );
    }

    // Create the new saved place
    const newPlace = {
      _id: new Types.ObjectId(),
      name: name.trim(),
      address: address.trim(),
      location: {
        type: 'Point' as const,
        coordinates: [longitude, latitude] as [number, number], // GeoJSON format: [lng, lat]
      },
      icon: icon || 'favorite',
    };

    // Add to saved places
    passenger.savedPlaces = passenger.savedPlaces || [];
    passenger.savedPlaces.push(newPlace);
    await passenger.save();

    sendSuccess(
      res,
      { savedPlace: newPlace },
      'Saved place added successfully',
      'تم إضافة المكان المحفوظ بنجاح',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a saved place
 * PUT /api/v1/passenger/saved-places/:placeId
 */
export const updateSavedPlace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { placeId } = req.params as Record<string, string>;
    const { name, address, latitude, longitude, icon } = req.body;

    // Validate placeId
    if (!Types.ObjectId.isValid(placeId)) {
      throw new BadRequestError('Invalid place ID', 'معرف المكان غير صالح');
    }

    const passenger = await Passenger.findOne({ userId });
    if (!passenger) {
      throw new NotFoundError('Passenger profile not found', 'ملف الراكب غير موجود');
    }

    // Find the saved place
    const placeIndex = passenger.savedPlaces?.findIndex(
      (place) => place._id?.toString() === placeId
    );

    if (placeIndex === undefined || placeIndex === -1) {
      throw new NotFoundError('Saved place not found', 'المكان المحفوظ غير موجود');
    }

    // Check for duplicate name (excluding current place)
    if (name) {
      const existingPlace = passenger.savedPlaces?.find(
        (place) =>
          place.name.toLowerCase() === name.toLowerCase() &&
          place._id?.toString() !== placeId
      );
      if (existingPlace) {
        throw new BadRequestError(
          'A place with this name already exists',
          'يوجد مكان بهذا الاسم بالفعل'
        );
      }
    }

    // Update the place
    const place = passenger.savedPlaces![placeIndex];
    if (name) place.name = name.trim();
    if (address) place.address = address.trim();
    if (icon) place.icon = icon;
    if (latitude !== undefined && longitude !== undefined) {
      // Validate coordinates
      if (latitude < -90 || latitude > 90) {
        throw new BadRequestError('Invalid latitude', 'خط العرض غير صالح');
      }
      if (longitude < -180 || longitude > 180) {
        throw new BadRequestError('Invalid longitude', 'خط الطول غير صالح');
      }
      place.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    await passenger.save();

    sendSuccess(
      res,
      { savedPlace: place },
      'Saved place updated successfully',
      'تم تحديث المكان المحفوظ بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a saved place
 * DELETE /api/v1/passenger/saved-places/:placeId
 */
export const deleteSavedPlace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { placeId } = req.params as Record<string, string>;

    // Validate placeId
    if (!Types.ObjectId.isValid(placeId)) {
      throw new BadRequestError('Invalid place ID', 'معرف المكان غير صالح');
    }

    const passenger = await Passenger.findOne({ userId });
    if (!passenger) {
      throw new NotFoundError('Passenger profile not found', 'ملف الراكب غير موجود');
    }

    // Find the saved place
    const placeIndex = passenger.savedPlaces?.findIndex(
      (place) => place._id?.toString() === placeId
    );

    if (placeIndex === undefined || placeIndex === -1) {
      throw new NotFoundError('Saved place not found', 'المكان المحفوظ غير موجود');
    }

    // Remove the place
    passenger.savedPlaces!.splice(placeIndex, 1);
    await passenger.save();

    sendSuccess(
      res,
      null,
      'Saved place deleted successfully',
      'تم حذف المكان المحفوظ بنجاح'
    );
  } catch (error) {
    next(error);
  }
};
