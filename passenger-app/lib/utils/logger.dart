import 'package:flutter/foundation.dart';

/// AppLogger - Centralized logging utility for Wasalni app
///
/// Replaces print() statements with proper logging that:
/// - Only shows in debug mode
/// - Has categorized levels (debug, info, warning, error)
/// - Can be extended to send to crash reporting services
class AppLogger {
  /// Debug level - for detailed debugging information
  static void debug(String message, [dynamic error, StackTrace? stackTrace]) {
    if (kDebugMode) {
      debugPrint('[DEBUG] $message');
      if (error != null) debugPrint('Error: $error');
      if (stackTrace != null) debugPrint('Stack: $stackTrace');
    }
  }

  /// Info level - for general information
  static void info(String message) {
    if (kDebugMode) {
      debugPrint('[INFO] $message');
    }
  }

  /// Warning level - for potential issues
  static void warning(String message, [dynamic error]) {
    if (kDebugMode) {
      debugPrint('[WARNING] $message');
      if (error != null) debugPrint('Error: $error');
    }
  }

  /// Error level - for actual errors
  static void error(String message, [dynamic error, StackTrace? stackTrace]) {
    if (kDebugMode) {
      debugPrint('[ERROR] $message');
      if (error != null) debugPrint('Error: $error');
      if (stackTrace != null) debugPrint('Stack: $stackTrace');
    }
    // TODO: In production, send to Crashlytics or Sentry
    // if (!kDebugMode && error != null) {
    //   FirebaseCrashlytics.instance.recordError(error, stackTrace);
    // }
  }

  /// Log API request/response
  static void api(String method, String url, [dynamic data]) {
    if (kDebugMode) {
      debugPrint('[API] $method $url');
      if (data != null) debugPrint('Data: $data');
    }
  }

  /// Log socket events
  static void socket(String event, [dynamic data]) {
    if (kDebugMode) {
      debugPrint('[SOCKET] $event');
      if (data != null) debugPrint('Data: $data');
    }
  }

  /// Log navigation events
  static void navigation(String route) {
    if (kDebugMode) {
      debugPrint('[NAV] -> $route');
    }
  }
}
