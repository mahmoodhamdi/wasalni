import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  StreamSubscription<Position>? _positionSubscription;
  Position? _lastPosition;

  // Egypt default center (Cairo)
  static const defaultLatitude = 30.0444;
  static const defaultLongitude = 31.2357;

  // Bagour, Menoufia center
  static const bagourLatitude = 30.4167;
  static const bagourLongitude = 30.9667;

  Position? get lastPosition => _lastPosition;

  /// Check if location services are enabled
  Future<bool> isLocationEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Request location permission
  Future<LocationPermissionStatus> requestPermission() async {
    // Check if location services are enabled
    final serviceEnabled = await isLocationEnabled();
    if (!serviceEnabled) {
      return LocationPermissionStatus.serviceDisabled;
    }

    // Check current permission status
    var status = await Permission.location.status;

    if (status.isGranted) {
      return LocationPermissionStatus.granted;
    }

    if (status.isPermanentlyDenied) {
      return LocationPermissionStatus.permanentlyDenied;
    }

    // Request permission
    status = await Permission.location.request();

    if (status.isGranted) {
      return LocationPermissionStatus.granted;
    } else if (status.isPermanentlyDenied) {
      return LocationPermissionStatus.permanentlyDenied;
    } else {
      return LocationPermissionStatus.denied;
    }
  }

  /// Get current position
  Future<Position?> getCurrentPosition({
    LocationAccuracy accuracy = LocationAccuracy.high,
  }) async {
    try {
      final permissionStatus = await requestPermission();
      if (permissionStatus != LocationPermissionStatus.granted) {
        return null;
      }

      _lastPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: accuracy,
      );

      return _lastPosition;
    } catch (e) {
      // Location error - return null
      return null;
    }
  }

  /// Start listening to location updates
  Stream<Position> getPositionStream({
    LocationAccuracy accuracy = LocationAccuracy.high,
    int distanceFilter = 10,
  }) {
    return Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: accuracy,
        distanceFilter: distanceFilter,
      ),
    ).handleError((error) {
      // Handle location stream error silently
    });
  }

  /// Start tracking location with callback
  void startTracking({
    required Function(Position) onLocationUpdate,
    LocationAccuracy accuracy = LocationAccuracy.high,
    int distanceFilter = 10,
  }) {
    stopTracking();

    _positionSubscription = getPositionStream(
      accuracy: accuracy,
      distanceFilter: distanceFilter,
    ).listen((position) {
      _lastPosition = position;
      onLocationUpdate(position);
    });
  }

  /// Stop tracking location
  void stopTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
  }

  /// Calculate distance between two points in meters
  double calculateDistance(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  /// Calculate bearing between two points
  double calculateBearing(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.bearingBetween(startLat, startLng, endLat, endLng);
  }

  /// Open location settings
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }

  /// Open app settings
  Future<bool> openAppSettings() async {
    return await Geolocator.openAppSettings();
  }

  /// Check if position is within Egypt bounds
  bool isInEgypt(double lat, double lng) {
    const egyptBounds = {
      'north': 31.7,
      'south': 22.0,
      'east': 36.9,
      'west': 24.7,
    };

    return lat >= egyptBounds['south']! &&
        lat <= egyptBounds['north']! &&
        lng >= egyptBounds['west']! &&
        lng <= egyptBounds['east']!;
  }

  /// Get default position (Bagour)
  Position getDefaultPosition() {
    return Position(
      latitude: bagourLatitude,
      longitude: bagourLongitude,
      timestamp: DateTime.now(),
      accuracy: 0,
      altitude: 0,
      altitudeAccuracy: 0,
      heading: 0,
      headingAccuracy: 0,
      speed: 0,
      speedAccuracy: 0,
    );
  }

  void dispose() {
    stopTracking();
  }
}

enum LocationPermissionStatus {
  granted,
  denied,
  permanentlyDenied,
  serviceDisabled,
}

final locationService = LocationService();
