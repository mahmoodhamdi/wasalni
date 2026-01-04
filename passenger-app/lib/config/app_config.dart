/// App configuration with environment-aware settings
class AppConfig {
  static const String appName = 'وصّلني';
  static const String appNameEn = 'Wasalni';
  static const String appTagline = 'توصيلتك علينا';
  static const String appVersion = '1.0.0';

  // Environment - change this for different builds
  static const AppEnvironment environment = AppEnvironment.development;

  // API URLs based on environment
  static String get apiBaseUrl {
    switch (environment) {
      case AppEnvironment.development:
        return 'http://10.0.2.2:5000/api/v1'; // Android emulator
      case AppEnvironment.staging:
        return 'https://staging-api.wasalni.app/api/v1';
      case AppEnvironment.production:
        return 'https://api.wasalni.app/api/v1';
    }
  }

  static String get socketUrl {
    switch (environment) {
      case AppEnvironment.development:
        return 'http://10.0.2.2:5000';
      case AppEnvironment.staging:
        return 'https://staging-api.wasalni.app';
      case AppEnvironment.production:
        return 'https://api.wasalni.app';
    }
  }

  static const Duration apiTimeout = Duration(seconds: 30);

  // Google Maps API Key
  // Set via Android: android/app/src/main/AndroidManifest.xml
  // Set via iOS: ios/Runner/AppDelegate.swift
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  // App Settings
  static const int otpLength = 6;
  static const int otpExpiryMinutes = 5;
  static const int maxSavedPlaces = 10;

  // Ride Types
  static const List<String> rideTypes = [
    'economy',
    'comfort',
    'family',
    'tuktuk',
    'motorcycle',
  ];

  // Default Location (Bagour, Egypt)
  static const double defaultLatitude = 30.45;
  static const double defaultLongitude = 30.9667;
  static const double defaultZoom = 15.0;

  // Support
  static const String sosPhone = '122';
  static const String supportPhone = '+201000000000';

  // Debug mode
  static bool get isDebug => environment == AppEnvironment.development;
}

enum AppEnvironment {
  development,
  staging,
  production,
}
