import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: In-app chat between passenger and driver
 */

/**
 * @swagger
 * /chat:
 *   get:
 *     summary: Get user's chats
 *     description: Returns list of all chats for the authenticated user
 *     tags: [Chat]
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
 *         description: Chats retrieved successfully
 */
router.get('/', chatController.getChats);

/**
 * @swagger
 * /chat/unread-count:
 *   get:
 *     summary: Get total unread messages count
 *     description: Returns total count of unread messages across all chats
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 */
router.get('/unread-count', chatController.getUnreadCount);

/**
 * @swagger
 * /chat/trip/{tripId}:
 *   get:
 *     summary: Get or create chat for a trip
 *     description: Gets existing chat or creates new one for the specified trip
 *     tags: [Chat]
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
 *         description: Chat retrieved successfully
 *       404:
 *         description: Trip not found
 */
router.get('/trip/:tripId', chatController.getTripChat);

/**
 * @swagger
 * /chat/{chatId}:
 *   get:
 *     summary: Get chat by ID
 *     description: Returns chat details including participants
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat retrieved successfully
 *       404:
 *         description: Chat not found
 */
router.get('/:chatId', chatController.getChat);

/**
 * @swagger
 * /chat/{chatId}/messages:
 *   get:
 *     summary: Get messages for a chat
 *     description: Returns paginated list of messages in reverse chronological order
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/:chatId/messages', chatController.getMessages);

/**
 * @swagger
 * /chat/{chatId}/messages:
 *   post:
 *     summary: Send a message
 *     description: Sends a new message in the specified chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               type:
 *                 type: string
 *                 enum: [text, image, location, voice]
 *                 default: text
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               mediaUrl:
 *                 type: string
 *                 description: URL for image or voice message
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Chat is closed or invalid message
 */
router.post('/:chatId/messages', chatController.sendMessage);

/**
 * @swagger
 * /chat/{chatId}/read:
 *   put:
 *     summary: Mark messages as read
 *     description: Marks all unread messages in the chat as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.put('/:chatId/read', chatController.markAsRead);

export default router;
