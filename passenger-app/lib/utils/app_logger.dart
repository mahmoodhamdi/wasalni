import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

/// Application logger utility
///
/// Uses dart:developer log in debug mode for better debugging experience
/// Silently ignores logs in release mode
class AppLogger {
  static const String _defaultTag = 'Wasalni';

  /// Log debug message
  static void debug(String message, {String? tag}) {
    if (kDebugMode) {
      developer.log(
        message,
        name: tag ?? _defaultTag,
        level: 500, // Fine level
      );
    }
  }

  /// Log info message
  static void info(String message, {String? tag}) {
    if (kDebugMode) {
      developer.log(
        message,
        name: tag ?? _defaultTag,
        level: 800, // Info level
      );
    }
  }

  /// Log warning message
  static void warning(String message, {String? tag}) {
    if (kDebugMode) {
      developer.log(
        '\u26A0 $message',
        name: tag ?? _defaultTag,
        level: 900, // Warning level
      );
    }
  }

  /// Log error message with optional error and stack trace
  static void error(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    if (kDebugMode) {
      developer.log(
        '\u274C $message',
        name: tag ?? _defaultTag,
        level: 1000, // Severe level
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  /// Log network request
  static void network(String method, String url, {int? statusCode, String? tag}) {
    if (kDebugMode) {
      final status = statusCode != null ? '[$statusCode]' : '';
      developer.log(
        '\u{1F310} $method $url $status',
        name: tag ?? 'Network',
        level: 800,
      );
    }
  }

  /// Log socket event
  static void socket(String event, {dynamic data, String? tag}) {
    if (kDebugMode) {
      final dataStr = data != null ? ': $data' : '';
      developer.log(
        '\u{1F50C} Socket: $event$dataStr',
        name: tag ?? 'Socket',
        level: 800,
      );
    }
  }
}
