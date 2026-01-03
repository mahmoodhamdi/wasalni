import admin from 'firebase-admin';
import { config } from './index';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): admin.app.App | null => {
  // Skip Firebase initialization if credentials are not configured
  if (
    !config.firebase.projectId ||
    !config.firebase.privateKey ||
    !config.firebase.clientEmail
  ) {
    logger.warn(
      'Firebase credentials not configured, push notifications will be disabled'
    );
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
    });

    logger.info('Firebase initialized');
    return firebaseApp;
  } catch (error) {
    logger.error(`Firebase initialization failed: ${error}`);
    return null;
  }
};

export const getFirebaseApp = (): admin.app.App | null => {
  return firebaseApp;
};

export const getMessaging = (): admin.messaging.Messaging | null => {
  if (!firebaseApp) return null;
  return admin.messaging(firebaseApp);
};

// Send push notification to a single device
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string | null> => {
  const messaging = getMessaging();
  if (!messaging) {
    logger.warn('Firebase messaging not available');
    return null;
  }

  try {
    const response = await messaging.send({
      token,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'wasalni_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    logger.info(`Push notification sent: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Failed to send push notification: ${error}`);
    return null;
  }
};

// Send push notification to multiple devices
export const sendMultiplePushNotifications = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<admin.messaging.BatchResponse | null> => {
  const messaging = getMessaging();
  if (!messaging) {
    logger.warn('Firebase messaging not available');
    return null;
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
      },
    });

    logger.info(
      `Push notifications sent: ${response.successCount}/${tokens.length} successful`
    );
    return response;
  } catch (error) {
    logger.error(`Failed to send push notifications: ${error}`);
    return null;
  }
};

export default {
  initializeFirebase,
  getFirebaseApp,
  getMessaging,
  sendPushNotification,
  sendMultiplePushNotifications,
};
