import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark single notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Update FCM token
router.post('/fcm-token', notificationController.updateFCMToken);

// Remove FCM token (on logout)
router.delete('/fcm-token', notificationController.removeFCMToken);

// Test notification (development only)
router.post('/test', notificationController.sendTestNotification);

export default router;
