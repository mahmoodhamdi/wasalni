import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;
  String? _token;
  String? _refreshToken;
  bool _isRefreshing = false;
  Function? _onTokenExpired;

  void init() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.apiTimeout,
        receiveTimeout: AppConfig.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_token != null) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 errors with token refresh
          if (error.response?.statusCode == 401 && !_isRefreshing) {
            _isRefreshing = true;
            try {
              final refreshed = await _tryRefreshToken();
              if (refreshed) {
                // Retry the original request
                final opts = Options(
                  method: error.requestOptions.method,
                  headers: {
                    ...error.requestOptions.headers,
                    'Authorization': 'Bearer $_token',
                  },
                );
                final response = await _dio.request(
                  error.requestOptions.path,
                  data: error.requestOptions.data,
                  queryParameters: error.requestOptions.queryParameters,
                  options: opts,
                );
                _isRefreshing = false;
                return handler.resolve(response);
              }
            } catch (_) {
              // Refresh failed
            }
            _isRefreshing = false;
            // Token refresh failed - trigger logout
            _token = null;
            _refreshToken = null;
            _onTokenExpired?.call();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<bool> _tryRefreshToken() async {
    if (_refreshToken == null) return false;

    try {
      final response = await _dio.post('/auth/refresh', data: {
        'refreshToken': _refreshToken,
      });

      if (response.data['success'] == true) {
        final tokens = response.data['data']['tokens'];
        _token = tokens['accessToken'];
        _refreshToken = tokens['refreshToken'];

        // Save to storage
        final storage = StorageService();
        await storage.setToken(_token!);
        await storage.setRefreshToken(_refreshToken!);

        return true;
      }
    } catch (_) {
      // Refresh failed
    }
    return false;
  }

  void setToken(String token) {
    _token = token;
  }

  void setRefreshToken(String token) {
    _refreshToken = token;
  }

  void setOnTokenExpired(Function callback) {
    _onTokenExpired = callback;
  }

  void clearToken() {
    _token = null;
    _refreshToken = null;
  }

  // Auth Endpoints
  Future<Response> sendOTP(String phone) async {
    return await _dio.post('/auth/send-otp', data: {'phone': phone});
  }

  Future<Response> verifyOTP(String phone, String otp) async {
    return await _dio.post('/auth/verify-otp', data: {
      'phone': phone,
      'otp': otp,
    });
  }

  Future<Response> register({
    required String phone,
    required String name,
    String? email,
    String? gender,
  }) async {
    return await _dio.post('/auth/register/passenger', data: {
      'phone': phone,
      'name': name,
      if (email != null) 'email': email,
      if (gender != null) 'gender': gender,
    });
  }

  Future<Response> getProfile() async {
    return await _dio.get('/auth/profile');
  }

  Future<Response> updateProfile(Map<String, dynamic> data) async {
    return await _dio.put('/auth/profile', data: data);
  }

  // Trip Endpoints
  Future<Response> calculateFare({
    required Map<String, double> pickup,
    required Map<String, double> dropoff,
    required String rideType,
  }) async {
    return await _dio.post('/trips/calculate', data: {
      'pickup': pickup,
      'dropoff': dropoff,
      'rideType': rideType,
    });
  }

  Future<Response> requestTrip({
    required Map<String, dynamic> pickup,
    required Map<String, dynamic> dropoff,
    required String rideType,
    String? promoCode,
    String? paymentMethod,
  }) async {
    return await _dio.post('/trips/request', data: {
      'pickup': pickup,
      'dropoff': dropoff,
      'rideType': rideType,
      if (promoCode != null) 'promoCode': promoCode,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
    });
  }

  Future<Response> getTrip(String tripId) async {
    return await _dio.get('/trips/$tripId');
  }

  Future<Response> cancelTrip(String tripId, String reason) async {
    return await _dio.post('/trips/$tripId/cancel', data: {'reason': reason});
  }

  Future<Response> rateTrip(String tripId, int rating, String? review) async {
    return await _dio.post('/trips/$tripId/rate', data: {
      'rating': rating,
      if (review != null) 'review': review,
    });
  }

  Future<Response> getTripHistory({int page = 1, int limit = 20}) async {
    return await _dio.get('/trips/history', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  // Location Endpoints
  Future<Response> searchPlaces(String query, [double? lat, double? lng]) async {
    return await _dio.get('/location/search', queryParameters: {
      'query': query,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    });
  }

  Future<Response> getAddressFromCoordinates(double lat, double lng) async {
    return await _dio.get('/location/address', queryParameters: {
      'lat': lat,
      'lng': lng,
    });
  }

  Future<Response> getPlaceDetails(String placeId) async {
    return await _dio.get('/location/place/$placeId');
  }

  Future<Response> getDirections({
    required Map<String, double> origin,
    required Map<String, double> destination,
  }) async {
    return await _dio.get('/location/directions', queryParameters: {
      'originLat': origin['lat'],
      'originLng': origin['lng'],
      'destLat': destination['lat'],
      'destLng': destination['lng'],
    });
  }

  Future<Response> getNearbyDrivers(double lat, double lng, {double? radius}) async {
    return await _dio.get('/location/drivers/nearby', queryParameters: {
      'lat': lat,
      'lng': lng,
      if (radius != null) 'radius': radius,
    });
  }

  Future<Response> calculateRoute({
    required Map<String, double> origin,
    required Map<String, double> destination,
  }) async {
    return await _dio.post('/location/route', data: {
      'origin': origin,
      'destination': destination,
    });
  }

  Future<Response> getFareEstimate({
    required Map<String, double> origin,
    required Map<String, double> destination,
    String rideCategory = 'economy',
  }) async {
    return await _dio.post('/location/fare', data: {
      'origin': origin,
      'destination': destination,
      'rideCategory': rideCategory,
    });
  }

  // Fare Endpoints
  Future<Response> getFareEstimates({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
  }) async {
    return await _dio.post('/fare/estimate', data: {
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'dropoffLat': dropoffLat,
      'dropoffLng': dropoffLng,
    });
  }

  Future<Response> validatePromo({
    required String code,
    required String rideType,
  }) async {
    return await _dio.post('/fare/validate-promo', data: {
      'code': code,
      'rideType': rideType,
    });
  }

  // Trip Endpoints (new)
  Future<Response> createTrip({
    required Map<String, dynamic> pickup,
    required Map<String, dynamic> dropoff,
    required String rideType,
    String paymentMethod = 'cash',
    String? promoCode,
    List<Map<String, dynamic>>? stops,
  }) async {
    return await _dio.post('/trips', data: {
      'pickup': pickup,
      'dropoff': dropoff,
      'rideType': rideType,
      'paymentMethod': paymentMethod,
      if (promoCode != null) 'promoCode': promoCode,
      if (stops != null) 'stops': stops,
    });
  }

  Future<Response> getActiveTrip() async {
    return await _dio.get('/trips/active');
  }

  Future<Response> getMyTrips({int page = 1, int limit = 20, String? status}) async {
    return await _dio.get('/trips', queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
    });
  }

  Future<Response> shareTrip(String tripId, List<Map<String, String>> contacts) async {
    return await _dio.post('/trips/$tripId/share', data: {'contacts': contacts});
  }

  Future<Response> triggerSOS(String tripId, double lat, double lng) async {
    return await _dio.post('/trips/$tripId/sos', data: {
      'latitude': lat,
      'longitude': lng,
    });
  }

  // Saved Places
  Future<Response> getSavedPlaces() async {
    return await _dio.get('/places');
  }

  Future<Response> addSavedPlace(Map<String, dynamic> place) async {
    return await _dio.post('/places', data: place);
  }

  Future<Response> deleteSavedPlace(String placeId) async {
    return await _dio.delete('/places/$placeId');
  }

  // Promo Codes
  Future<Response> validatePromoCode({
    required String code,
    required double fare,
    required String rideType,
  }) async {
    return await _dio.post('/promo/validate', data: {
      'code': code,
      'fare': fare,
      'rideType': rideType,
    });
  }

  Future<Response> getAvailablePromos({String? rideType, double? fare}) async {
    return await _dio.get('/promo/available', queryParameters: {
      if (rideType != null) 'rideType': rideType,
      if (fare != null) 'fare': fare,
    });
  }

  Future<Response> getPromoHistory({int page = 1, int limit = 20}) async {
    return await _dio.get('/promo/history', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  // Notifications
  Future<Response> getNotifications({int page = 1}) async {
    return await _dio.get('/notifications', queryParameters: {'page': page});
  }

  Future<Response> markNotificationRead(String notificationId) async {
    return await _dio.put('/notifications/$notificationId/read');
  }

  // Settings
  Future<Response> updateFCMToken(String token) async {
    return await _dio.put('/auth/fcm-token', data: {'token': token});
  }

  // Safety Endpoints
  Future<Response> getEmergencyContacts() async {
    return await _dio.get('/safety/emergency-contacts');
  }

  Future<Response> addEmergencyContact(Map<String, dynamic> contact) async {
    return await _dio.post('/safety/emergency-contacts', data: contact);
  }

  Future<Response> updateEmergencyContact(String contactId, Map<String, dynamic> updates) async {
    return await _dio.put('/safety/emergency-contacts/$contactId', data: updates);
  }

  Future<Response> removeEmergencyContact(String contactId) async {
    return await _dio.delete('/safety/emergency-contacts/$contactId');
  }

  Future<Response> getSafetyPreferences() async {
    return await _dio.get('/safety/preferences');
  }

  Future<Response> updateSafetyPreferences(Map<String, dynamic> preferences) async {
    return await _dio.put('/safety/preferences', data: preferences);
  }

  Future<Response> generateTripShareLink(String tripId, {int expirationHours = 24}) async {
    return await _dio.post('/safety/trips/$tripId/share', data: {
      'expirationHours': expirationHours,
    });
  }

  Future<Response> verifyDriver(String driverId) async {
    return await _dio.get('/safety/verify-driver/$driverId');
  }

  Future<Response> getSafetyTips({bool isNewDriver = false, bool isLongTrip = false}) async {
    return await _dio.get('/safety/tips', queryParameters: {
      'isNewDriver': isNewDriver.toString(),
      'isLongTrip': isLongTrip.toString(),
    });
  }

  Future<Response> respondToSafetyCheck(String tripId, String response) async {
    return await _dio.post('/safety/trips/$tripId/safety-check', data: {
      'response': response,
    });
  }

  // Scheduled Trips Endpoints
  Future<Response> getScheduledTrips({int page = 1, int limit = 10}) async {
    return await _dio.get('/scheduled', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  Future<Response> getScheduledSlots(DateTime date) async {
    return await _dio.get('/scheduled/slots', queryParameters: {
      'date': date.toIso8601String().split('T')[0],
    });
  }

  Future<Response> getScheduledStats({DateTime? startDate, DateTime? endDate}) async {
    return await _dio.get('/scheduled/stats', queryParameters: {
      if (startDate != null) 'startDate': startDate.toIso8601String(),
      if (endDate != null) 'endDate': endDate.toIso8601String(),
    });
  }

  Future<Response> getScheduledTripDetails(String tripId) async {
    return await _dio.get('/scheduled/$tripId');
  }

  Future<Response> createScheduledTrip({
    required Map<String, dynamic> pickup,
    required Map<String, dynamic> dropoff,
    required String rideType,
    required String scheduledTime,
    String? paymentMethod,
    String? promoCode,
    String? notes,
  }) async {
    return await _dio.post('/scheduled', data: {
      'pickup': pickup,
      'dropoff': dropoff,
      'rideType': rideType,
      'scheduledTime': scheduledTime,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (promoCode != null) 'promoCode': promoCode,
      if (notes != null) 'notes': notes,
    });
  }

  Future<Response> modifyScheduledTime(String tripId, DateTime newTime) async {
    return await _dio.patch('/scheduled/$tripId/time', data: {
      'scheduledTime': newTime.toIso8601String(),
    });
  }

  Future<Response> cancelScheduledTrip(String tripId, {String? reason}) async {
    return await _dio.post('/scheduled/$tripId/cancel', data: {
      if (reason != null) 'reason': reason,
    });
  }
}

// Global instance
final apiService = ApiService();

// Riverpod provider
final apiServiceProvider = Provider<ApiService>((ref) {
  return apiService;
});
