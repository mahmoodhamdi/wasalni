import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'storage_service.dart';
import 'api_service.dart';
import '../utils/app_logger.dart';

const String _tag = 'NotificationService';

// Background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  AppLogger.info('Background message: ${message.messageId}', tag: 'FCM');
  AppLogger.debug('Data: ${message.data}', tag: 'FCM');
}

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final StorageService _storageService;
  final ApiService _apiService;

  Function(Map<String, dynamic>)? onNotificationTap;
  Function(RemoteMessage)? onForegroundMessage;
  Function(Map<String, dynamic>)? onTripRequest;

  NotificationService(this._storageService, this._apiService);

  Future<void> initialize() async {
    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: true, // For urgent trip requests
      provisional: false,
      sound: true,
    );

    AppLogger.info('Notification permission: ${settings.authorizationStatus}', tag: _tag);

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      await _setupToken();
      _setupMessageHandlers();
    }
  }

  Future<void> _setupToken() async {
    try {
      // Get FCM token
      final token = await _messaging.getToken();
      if (token != null) {
        AppLogger.debug('FCM Token: $token', tag: _tag);
        await _saveAndSendToken(token);
      }

      // Listen for token refresh
      _messaging.onTokenRefresh.listen(_saveAndSendToken);
    } catch (e, stackTrace) {
      AppLogger.error('Error getting FCM token', tag: _tag, error: e, stackTrace: stackTrace);
    }
  }

  Future<void> _saveAndSendToken(String token) async {
    // Save locally
    await _storageService.setFCMToken(token);

    // Send to server if authenticated
    final authToken = await _storageService.getToken();
    if (authToken != null) {
      try {
        await _apiService.updateFCMToken(token);
      } catch (e, stackTrace) {
        AppLogger.error('Error sending FCM token to server', tag: _tag, error: e, stackTrace: stackTrace);
      }
    }
  }

  void _setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      AppLogger.debug('Foreground message: ${message.notification?.title}', tag: _tag);
      AppLogger.debug('Data: ${message.data}', tag: _tag);

      // Check if this is a trip request
      if (message.data['type'] == 'new_trip_request') {
        onTripRequest?.call(message.data);
      }

      onForegroundMessage?.call(message);
    });

    // When app is opened from notification (background state)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from notification (terminated state)
    _checkInitialMessage();
  }

  Future<void> _checkInitialMessage() async {
    final message = await _messaging.getInitialMessage();
    if (message != null) {
      _handleNotificationTap(message);
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    AppLogger.debug('Notification tapped: ${message.data}', tag: _tag);

    onNotificationTap?.call(message.data);
  }

  Future<String?> getToken() async {
    return await _messaging.getToken();
  }

  Future<void> deleteToken() async {
    await _messaging.deleteToken();
    await _storageService.clearFCMToken();
  }

  // Subscribe to driver-specific topics
  Future<void> subscribeToDriverTopics() async {
    await _messaging.subscribeToTopic('drivers');
    await _messaging.subscribeToTopic('drivers_announcements');
  }

  // Unsubscribe from driver topics
  Future<void> unsubscribeFromDriverTopics() async {
    await _messaging.unsubscribeFromTopic('drivers');
    await _messaging.unsubscribeFromTopic('drivers_announcements');
  }

  // Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
  }

  // Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
  }
}

// Provider
final notificationServiceProvider = Provider<NotificationService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return NotificationService(storage, apiService);
});
