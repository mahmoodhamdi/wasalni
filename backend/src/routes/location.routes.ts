import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import locationController from '../controllers/location.controller';

const router = Router();

// Public routes (still need auth)
router.get('/search', authenticate, locationController.searchPlaces);
router.get('/place/:placeId', authenticate, locationController.getPlaceDetails);
router.get('/address', authenticate, locationController.getAddress);
router.post('/route', authenticate, locationController.calculateRoute);
router.post('/fare', authenticate, locationController.getFareEstimate);
router.get('/eta', authenticate, locationController.getETA);

// Passenger routes
router.get('/drivers/nearby', authenticate, locationController.getNearbyDrivers);
router.get('/driver/:driverId', authenticate, locationController.getDriverLocation);

// Driver routes
router.post('/update', authenticate, requireRole('driver'), locationController.updateLocation);
router.post('/status', authenticate, requireRole('driver'), locationController.setOnlineStatus);

// Admin routes
router.get('/stats', authenticate, requireRole('admin'), locationController.getLocationStats);
router.get('/drivers/online', authenticate, requireRole('admin'), locationController.getAllOnlineDrivers);

export default router;
