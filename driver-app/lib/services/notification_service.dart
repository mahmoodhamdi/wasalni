import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'storage_service.dart';
import 'api_service.dart';

// Background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) {
    print('Background message: ${message.messageId}');
    print('Data: ${message.data}');
  }
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

    if (kDebugMode) {
      print('Notification permission: ${settings.authorizationStatus}');
    }

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
        if (kDebugMode) {
          print('FCM Token: $token');
        }
        await _saveAndSendToken(token);
      }

      // Listen for token refresh
      _messaging.onTokenRefresh.listen(_saveAndSendToken);
    } catch (e) {
      if (kDebugMode) {
        print('Error getting FCM token: $e');
      }
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
      } catch (e) {
        if (kDebugMode) {
          print('Error sending FCM token to server: $e');
        }
      }
    }
  }

  void _setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('Foreground message: ${message.notification?.title}');
        print('Data: ${message.data}');
      }

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
    if (kDebugMode) {
      print('Notification tapped: ${message.data}');
    }

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
