import { Router } from 'express';
import { authenticate, passengerOnly } from '../middleware/auth.middleware';
import * as passengerController from '../controllers/passenger.controller';

const router = Router();

// All routes require authentication and passenger role
router.use(authenticate);
router.use(passengerOnly);

/**
 * @swagger
 * tags:
 *   name: Passenger
 *   description: Passenger-specific endpoints
 */

/**
 * @swagger
 * /passenger/saved-places:
 *   get:
 *     summary: Get saved places
 *     description: Returns all saved places for the authenticated passenger
 *     tags: [Passenger]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved places retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Saved places retrieved successfully
 *                 messageAr:
 *                   type: string
 *                   example: تم استرجاع الأماكن المحفوظة بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedPlaces:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SavedPlace'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/saved-places', passengerController.getSavedPlaces);

/**
 * @swagger
 * /passenger/saved-places:
 *   post:
 *     summary: Add a saved place
 *     description: Adds a new saved place for the authenticated passenger (max 10 places)
 *     tags: [Passenger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 example: المنزل
 *                 description: Name for the saved place
 *               address:
 *                 type: string
 *                 example: شارع الجمهورية، الباجور
 *                 description: Address of the place
 *               latitude:
 *                 type: number
 *                 example: 30.4285
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 example: 30.9785
 *                 description: Longitude coordinate
 *               icon:
 *                 type: string
 *                 enum: [home, work, favorite]
 *                 default: favorite
 *                 description: Icon type for the place
 *     responses:
 *       201:
 *         description: Saved place added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Saved place added successfully
 *                 messageAr:
 *                   type: string
 *                   example: تم إضافة المكان المحفوظ بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedPlace:
 *                       $ref: '#/components/schemas/SavedPlace'
 *       400:
 *         description: Validation error or max places reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Maximum saved places limit reached (10)
 *                 messageAr:
 *                   type: string
 *                   example: تم الوصول للحد الأقصى من الأماكن المحفوظة (10)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/saved-places', passengerController.addSavedPlace);

/**
 * @swagger
 * /passenger/saved-places/{placeId}:
 *   put:
 *     summary: Update a saved place
 *     description: Updates an existing saved place
 *     tags: [Passenger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the saved place
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: المنزل الجديد
 *               address:
 *                 type: string
 *                 example: شارع النيل، الباجور
 *               latitude:
 *                 type: number
 *                 example: 30.4290
 *               longitude:
 *                 type: number
 *                 example: 30.9790
 *               icon:
 *                 type: string
 *                 enum: [home, work, favorite]
 *     responses:
 *       200:
 *         description: Saved place updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Saved place updated successfully
 *                 messageAr:
 *                   type: string
 *                   example: تم تحديث المكان المحفوظ بنجاح
 *       400:
 *         description: Invalid place ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Saved place not found
 */
router.put('/saved-places/:placeId', passengerController.updateSavedPlace);

/**
 * @swagger
 * /passenger/saved-places/{placeId}:
 *   delete:
 *     summary: Delete a saved place
 *     description: Deletes a saved place
 *     tags: [Passenger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the saved place
 *     responses:
 *       200:
 *         description: Saved place deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Saved place deleted successfully
 *                 messageAr:
 *                   type: string
 *                   example: تم حذف المكان المحفوظ بنجاح
 *       400:
 *         description: Invalid place ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Saved place not found
 */
router.delete('/saved-places/:placeId', passengerController.deleteSavedPlace);

/**
 * @swagger
 * components:
 *   schemas:
 *     SavedPlace:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           example: المنزل
 *         address:
 *           type: string
 *           example: شارع الجمهورية، الباجور
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: Point
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               example: [30.9785, 30.4285]
 *         icon:
 *           type: string
 *           enum: [home, work, favorite]
 *           example: home
 */

export default router;
