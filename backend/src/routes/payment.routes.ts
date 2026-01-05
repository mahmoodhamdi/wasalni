import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment and wallet management
 */

// Public webhook endpoints (no auth)
/**
 * @swagger
 * /payment/webhook/paymob:
 *   post:
 *     summary: Paymob webhook callback
 *     description: Receives payment status updates from Paymob
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/paymob', paymentController.paymobWebhook);

/**
 * @swagger
 * /payment/callback:
 *   get:
 *     summary: Paymob payment callback
 *     description: Redirect endpoint after payment completion
 *     tags: [Payment]
 *     responses:
 *       302:
 *         description: Redirect to app/frontend
 */
router.get('/callback', paymentController.paymobCallback);

// Protected routes
router.use(authenticate);

/**
 * @swagger
 * /payment/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     description: Returns the user's wallet balance
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                     currency:
 *                       type: string
 */
router.get('/wallet/balance', paymentController.getWalletBalance);

/**
 * @swagger
 * /payment/wallet/topup:
 *   post:
 *     summary: Top up wallet
 *     description: Generate payment URL to top up wallet
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10
 *                 maximum: 5000
 *                 description: Amount to top up (EGP)
 *     responses:
 *       200:
 *         description: Payment URL generated
 */
router.post('/wallet/topup', paymentController.topUpWallet);

/**
 * @swagger
 * /payment/history:
 *   get:
 *     summary: Get payment history
 *     description: Returns paginated payment history for the user
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get('/history', paymentController.getPaymentHistory);

/**
 * @swagger
 * /payment/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     description: Returns details of a specific payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved
 *       404:
 *         description: Payment not found
 */
router.get('/:paymentId', paymentController.getPayment);

/**
 * @swagger
 * /payment/trip/{tripId}/pay:
 *   post:
 *     summary: Pay for trip with card
 *     description: Generate payment URL to pay for a trip
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment URL generated
 */
router.post('/trip/:tripId/pay', paymentController.payForTrip);

/**
 * @swagger
 * /payment/trip/{tripId}/pay-wallet:
 *   post:
 *     summary: Pay for trip with wallet
 *     description: Pay for a trip using wallet balance
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Insufficient balance
 */
router.post('/trip/:tripId/pay-wallet', paymentController.payWithWallet);

// Admin routes
/**
 * @swagger
 * /payment/admin/driver/{driverId}/payout:
 *   post:
 *     summary: Process driver payout
 *     description: Admin endpoint to process driver earnings payout
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payout processed
 */
router.post('/admin/driver/:driverId/payout', adminOnly, paymentController.processDriverPayout);

/**
 * @swagger
 * /payment/admin/{paymentId}/refund:
 *   post:
 *     summary: Refund payment
 *     description: Admin endpoint to refund a payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment refunded
 */
router.post('/admin/:paymentId/refund', adminOnly, paymentController.refundPayment);

export default router;
