import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

/// AppLogger - Centralized logging utility for Wasalni Driver app
///
/// Replaces print() statements with proper logging that:
/// - Only shows in debug mode
/// - Has categorized levels (debug, info, warning, error)
/// - Can be extended to send to crash reporting services
class AppLogger {
  /// Debug level - for detailed debugging information
  static void debug(String message, {String? tag, dynamic error, StackTrace? stackTrace}) {
    if (kDebugMode) {
      developer.log(message, name: tag ?? 'DEBUG', error: error, stackTrace: stackTrace);
    }
  }

  /// Info level - for general information
  static void info(String message, {String? tag}) {
    if (kDebugMode) {
      developer.log(message, name: tag ?? 'INFO');
    }
  }

  /// Warning level - for potential issues
  static void warning(String message, {String? tag, dynamic error}) {
    if (kDebugMode) {
      developer.log(message, name: tag ?? 'WARNING', error: error);
    }
  }

  /// Error level - for actual errors
  static void error(String message, {String? tag, dynamic error, StackTrace? stackTrace}) {
    if (kDebugMode) {
      developer.log(message, name: tag ?? 'ERROR', error: error, stackTrace: stackTrace);
    }
    // TODO: In production, send to Crashlytics or Sentry
    // if (!kDebugMode && error != null) {
    //   FirebaseCrashlytics.instance.recordError(error, stackTrace);
    // }
  }

  /// Log API request/response
  static void api(String method, String url, {dynamic data, String? tag}) {
    if (kDebugMode) {
      developer.log('$method $url', name: tag ?? 'API');
      if (data != null) {
        developer.log('Data: $data', name: tag ?? 'API');
      }
    }
  }

  /// Log socket events
  static void socket(String event, {dynamic data, String? tag}) {
    if (kDebugMode) {
      developer.log(event, name: tag ?? 'SOCKET');
      if (data != null) {
        developer.log('Data: $data', name: tag ?? 'SOCKET');
      }
    }
  }

  /// Log navigation events
  static void navigation(String route, {String? tag}) {
    if (kDebugMode) {
      developer.log('-> $route', name: tag ?? 'NAV');
    }
  }

  /// Log location events
  static void location(String message, {dynamic data, String? tag}) {
    if (kDebugMode) {
      developer.log(message, name: tag ?? 'LOCATION');
      if (data != null) {
        developer.log('Data: $data', name: tag ?? 'LOCATION');
      }
    }
  }
}
