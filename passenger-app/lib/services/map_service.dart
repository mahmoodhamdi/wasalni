import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../utils/app_logger.dart';

/// FREE Maps Service using OpenStreetMap APIs
/// - Nominatim for geocoding and place search
/// - OSRM for routing and directions
/// TODO: Switch to Google Maps when billing is ready
class MapService {
  static final MapService _instance = MapService._internal();
  factory MapService() => _instance;
  MapService._internal();

  // Nominatim API (FREE - 1 request/second limit)
  static const String _nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  // OSRM API (FREE - Open Source Routing Machine)
  static const String _osrmBaseUrl = 'https://router.project-osrm.org';

  // User agent required by Nominatim
  static const String _userAgent = 'Wasalni/1.0 (wasalni.app@gmail.com)';

  // Egypt bounding box for restricting searches
  static const String _egyptBounds = '24.7,22.0,36.9,31.7'; // west,south,east,north

  // Rate limiting: track last request time
  DateTime? _lastNominatimRequest;

  /// Ensure 1 second between Nominatim requests
  Future<void> _respectRateLimit() async {
    if (_lastNominatimRequest != null) {
      final elapsed = DateTime.now().difference(_lastNominatimRequest!);
      if (elapsed.inMilliseconds < 1000) {
        await Future.delayed(Duration(milliseconds: 1000 - elapsed.inMilliseconds));
      }
    }
    _lastNominatimRequest = DateTime.now();
  }

  /// Reverse geocode: coordinates to address
  Future<PlaceResult?> reverseGeocode(double lat, double lng) async {
    try {
      await _respectRateLimit();

      final url = Uri.parse(
        '$_nominatimBaseUrl/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1&accept-language=ar,en'
      );

      final response = await http.get(url, headers: {'User-Agent': _userAgent});

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data != null && data['display_name'] != null) {
          return PlaceResult(
            placeId: data['place_id']?.toString() ?? '',
            displayName: data['display_name'] ?? '',
            displayNameAr: data['namedetails']?['name:ar'] ?? data['display_name'] ?? '',
            lat: lat,
            lng: lng,
            address: _parseAddress(data['address']),
          );
        }
      }
      return null;
    } catch (e) {
      AppLogger.error('Reverse geocode error', error: e, tag: 'MapService');
      return null;
    }
  }

  /// Forward geocode: address to coordinates
  Future<List<PlaceResult>> geocode(String query, {int limit = 5}) async {
    try {
      await _respectRateLimit();

      final url = Uri.parse(
        '$_nominatimBaseUrl/search?format=json&q=${Uri.encodeComponent(query)}'
        '&limit=$limit&addressdetails=1&countrycodes=eg&viewbox=$_egyptBounds&bounded=1'
        '&accept-language=ar,en'
      );

      final response = await http.get(url, headers: {'User-Agent': _userAgent});

      if (response.statusCode == 200) {
        final List data = json.decode(response.body);
        return data.map((item) => PlaceResult(
          placeId: item['place_id']?.toString() ?? '',
          displayName: item['display_name'] ?? '',
          displayNameAr: item['namedetails']?['name:ar'] ?? item['display_name'] ?? '',
          lat: double.tryParse(item['lat']?.toString() ?? '0') ?? 0,
          lng: double.tryParse(item['lon']?.toString() ?? '0') ?? 0,
          address: _parseAddress(item['address']),
        )).toList();
      }
      return [];
    } catch (e) {
      AppLogger.error('Geocode error', error: e, tag: 'MapService');
      return [];
    }
  }

  /// Search places by query (for autocomplete)
  Future<List<PlaceResult>> searchPlaces(String query, {
    double? nearLat,
    double? nearLng,
    int limit = 5,
  }) async {
    try {
      await _respectRateLimit();

      String url = '$_nominatimBaseUrl/search?format=json&q=${Uri.encodeComponent(query)}'
          '&limit=$limit&addressdetails=1&countrycodes=eg&accept-language=ar,en';

      // Add proximity bias if location provided
      if (nearLat != null && nearLng != null) {
        // Create a viewbox around the user's location (roughly 50km)
        final viewbox = '${nearLng - 0.5},${nearLat - 0.5},${nearLng + 0.5},${nearLat + 0.5}';
        url += '&viewbox=$viewbox&bounded=0';
      } else {
        url += '&viewbox=$_egyptBounds&bounded=1';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {'User-Agent': _userAgent},
      );

      if (response.statusCode == 200) {
        final List data = json.decode(response.body);
        return data.map((item) => PlaceResult(
          placeId: item['place_id']?.toString() ?? '',
          displayName: item['display_name'] ?? '',
          displayNameAr: item['namedetails']?['name:ar'] ?? item['display_name'] ?? '',
          lat: double.tryParse(item['lat']?.toString() ?? '0') ?? 0,
          lng: double.tryParse(item['lon']?.toString() ?? '0') ?? 0,
          address: _parseAddress(item['address']),
        )).toList();
      }
      return [];
    } catch (e) {
      AppLogger.error('Search places error', error: e, tag: 'MapService');
      return [];
    }
  }

  /// Get route between two points using OSRM
  Future<RouteResult?> getRoute(
    double startLat,
    double startLng,
    double endLat,
    double endLng, {
    String profile = 'driving', // driving, walking, cycling
  }) async {
    try {
      final url = Uri.parse(
        '$_osrmBaseUrl/route/v1/$profile/$startLng,$startLat;$endLng,$endLat'
        '?overview=full&geometries=geojson&steps=true'
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['code'] == 'Ok' && data['routes'] != null && data['routes'].isNotEmpty) {
          final route = data['routes'][0];
          final geometry = route['geometry'];

          // Parse coordinates from GeoJSON
          List<LatLng> polylinePoints = [];
          if (geometry != null && geometry['coordinates'] != null) {
            for (var coord in geometry['coordinates']) {
              polylinePoints.add(LatLng(coord[1].toDouble(), coord[0].toDouble()));
            }
          }

          // Parse steps for turn-by-turn directions
          List<RouteStep> steps = [];
          if (route['legs'] != null && route['legs'].isNotEmpty) {
            for (var step in route['legs'][0]['steps'] ?? []) {
              steps.add(RouteStep(
                instruction: step['maneuver']?['modifier'] ?? step['maneuver']?['type'] ?? '',
                distance: (step['distance'] ?? 0).toDouble(),
                duration: (step['duration'] ?? 0).toDouble(),
                name: step['name'] ?? '',
              ));
            }
          }

          return RouteResult(
            distanceMeters: (route['distance'] ?? 0).toDouble(),
            durationSeconds: (route['duration'] ?? 0).toDouble(),
            polylinePoints: polylinePoints,
            steps: steps,
          );
        }
      }
      return null;
    } catch (e) {
      AppLogger.error('Route error', error: e, tag: 'MapService');
      return null;
    }
  }

  /// Get distance and duration between two points (simpler than full route)
  Future<DistanceResult?> getDistance(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) async {
    try {
      final url = Uri.parse(
        '$_osrmBaseUrl/route/v1/driving/$startLng,$startLat;$endLng,$endLat'
        '?overview=false'
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['code'] == 'Ok' && data['routes'] != null && data['routes'].isNotEmpty) {
          final route = data['routes'][0];
          return DistanceResult(
            distanceMeters: (route['distance'] ?? 0).toDouble(),
            durationSeconds: (route['duration'] ?? 0).toDouble(),
          );
        }
      }
      return null;
    } catch (e) {
      AppLogger.error('Distance error', error: e, tag: 'MapService');
      return null;
    }
  }

  /// Parse address components from Nominatim response
  AddressComponents _parseAddress(Map<String, dynamic>? address) {
    if (address == null) {
      return AddressComponents();
    }
    return AddressComponents(
      street: address['road'] ?? address['pedestrian'] ?? address['street'] ?? '',
      neighbourhood: address['neighbourhood'] ?? address['suburb'] ?? '',
      city: address['city'] ?? address['town'] ?? address['village'] ?? '',
      state: address['state'] ?? address['governorate'] ?? '',
      country: address['country'] ?? '',
      postcode: address['postcode'] ?? '',
    );
  }
}

/// Place search result
class PlaceResult {
  final String placeId;
  final String displayName;
  final String displayNameAr;
  final double lat;
  final double lng;
  final AddressComponents address;

  PlaceResult({
    required this.placeId,
    required this.displayName,
    required this.displayNameAr,
    required this.lat,
    required this.lng,
    required this.address,
  });

  LatLng get latLng => LatLng(lat, lng);

  /// Get short display name (first part of address)
  String get shortName {
    final parts = displayName.split(',');
    if (parts.length >= 2) {
      return '${parts[0].trim()}, ${parts[1].trim()}';
    }
    return parts[0].trim();
  }
}

/// Address components
class AddressComponents {
  final String street;
  final String neighbourhood;
  final String city;
  final String state;
  final String country;
  final String postcode;

  AddressComponents({
    this.street = '',
    this.neighbourhood = '',
    this.city = '',
    this.state = '',
    this.country = '',
    this.postcode = '',
  });

  String get formattedAddress {
    final parts = <String>[];
    if (street.isNotEmpty) parts.add(street);
    if (neighbourhood.isNotEmpty) parts.add(neighbourhood);
    if (city.isNotEmpty) parts.add(city);
    if (state.isNotEmpty) parts.add(state);
    return parts.join(', ');
  }
}

/// Route result from OSRM
class RouteResult {
  final double distanceMeters;
  final double durationSeconds;
  final List<LatLng> polylinePoints;
  final List<RouteStep> steps;

  RouteResult({
    required this.distanceMeters,
    required this.durationSeconds,
    required this.polylinePoints,
    required this.steps,
  });

  /// Distance in kilometers
  double get distanceKm => distanceMeters / 1000;

  /// Duration in minutes
  double get durationMinutes => durationSeconds / 60;

  /// Formatted distance string
  String get formattedDistance {
    if (distanceMeters < 1000) {
      return '${distanceMeters.toStringAsFixed(0)} م';
    }
    return '${distanceKm.toStringAsFixed(1)} كم';
  }

  /// Formatted duration string
  String get formattedDuration {
    final minutes = durationMinutes.round();
    if (minutes < 60) {
      return '$minutes دقيقة';
    }
    final hours = minutes ~/ 60;
    final remainingMinutes = minutes % 60;
    if (remainingMinutes == 0) {
      return '$hours ساعة';
    }
    return '$hours ساعة و $remainingMinutes دقيقة';
  }
}

/// Single step in route directions
class RouteStep {
  final String instruction;
  final double distance;
  final double duration;
  final String name;

  RouteStep({
    required this.instruction,
    required this.distance,
    required this.duration,
    required this.name,
  });
}

/// Simple distance/duration result
class DistanceResult {
  final double distanceMeters;
  final double durationSeconds;

  DistanceResult({
    required this.distanceMeters,
    required this.durationSeconds,
  });

  double get distanceKm => distanceMeters / 1000;
  double get durationMinutes => durationSeconds / 60;
}

/// Global instance
final mapService = MapService();
