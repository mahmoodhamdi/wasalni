class AppConfig {
  static const String appName = 'وصّلني للسائقين';
  static const String appNameEn = 'Wasalni Driver';
  static const String appTagline = 'كسب أكثر معنا';
  static const String appVersion = '1.0.0';

  // API
  static const String apiBaseUrl = 'http://localhost:5000/api/v1';
  static const String socketUrl = 'http://localhost:5000';
  static const Duration apiTimeout = Duration(seconds: 30);

  // Google Maps
  static const String googleMapsApiKey = '';

  // App Settings
  static const int otpLength = 6;
  static const int otpExpiryMinutes = 5;
  static const int locationUpdateInterval = 10; // seconds

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
  static const String supportPhone = '+201000000000';
}
