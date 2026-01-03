import 'package:dio/dio.dart';

import '../config/app_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;
  String? _token;

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
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            _token = null;
          }
          return handler.next(error);
        },
      ),
    );
  }

  void setToken(String token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
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

  Future<Response> registerDriver({
    required String phone,
    required String name,
    String? email,
    required String nationalId,
    required String vehicleType,
    required String vehicleCategory,
    required Map<String, dynamic> vehicle,
  }) async {
    return await _dio.post('/auth/register/driver', data: {
      'phone': phone,
      'name': name,
      if (email != null) 'email': email,
      'nationalId': nationalId,
      'vehicleType': vehicleType,
      'vehicleCategory': vehicleCategory,
      'vehicle': vehicle,
    });
  }

  Future<Response> getProfile() async {
    return await _dio.get('/auth/profile');
  }

  Future<Response> updateProfile(Map<String, dynamic> data) async {
    return await _dio.put('/auth/profile', data: data);
  }

  // Driver-specific endpoints
  Future<Response> getDriverStatus() async {
    return await _dio.get('/driver/status');
  }

  Future<Response> goOnline() async {
    return await _dio.put('/driver/online');
  }

  Future<Response> goOffline() async {
    return await _dio.put('/driver/offline');
  }

  Future<Response> updateLocation({
    required double lat,
    required double lng,
    double? heading,
    double? speed,
  }) async {
    return await _dio.put('/driver/location', data: {
      'lat': lat,
      'lng': lng,
      if (heading != null) 'heading': heading,
      if (speed != null) 'speed': speed,
    });
  }

  // Trip Endpoints
  Future<Response> acceptTrip(String tripId) async {
    return await _dio.post('/driver/trips/$tripId/accept');
  }

  Future<Response> rejectTrip(String tripId) async {
    return await _dio.post('/driver/trips/$tripId/reject');
  }

  Future<Response> arrivedAtPickup(String tripId) async {
    return await _dio.put('/driver/trips/$tripId/arrived');
  }

  Future<Response> startTrip(String tripId) async {
    return await _dio.put('/driver/trips/$tripId/start');
  }

  Future<Response> completeTrip(String tripId) async {
    return await _dio.put('/driver/trips/$tripId/complete');
  }

  Future<Response> cancelTrip(String tripId, String reason) async {
    return await _dio.post('/driver/trips/$tripId/cancel', data: {'reason': reason});
  }

  Future<Response> getCurrentTrip() async {
    return await _dio.get('/driver/trips/current');
  }

  Future<Response> getTripHistory({int page = 1, int limit = 20}) async {
    return await _dio.get('/driver/trips/history', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  // Earnings
  Future<Response> getEarnings({String? period}) async {
    return await _dio.get('/driver/earnings', queryParameters: {
      if (period != null) 'period': period,
    });
  }

  Future<Response> getEarningsHistory({int page = 1}) async {
    return await _dio.get('/driver/earnings/history', queryParameters: {
      'page': page,
    });
  }

  // Document upload
  Future<Response> uploadDocument({
    required String type,
    required String filePath,
  }) async {
    FormData formData = FormData.fromMap({
      'type': type,
      'file': await MultipartFile.fromFile(filePath),
    });
    return await _dio.post('/driver/documents', data: formData);
  }

  // Notifications
  Future<Response> getNotifications({int page = 1}) async {
    return await _dio.get('/notifications', queryParameters: {'page': page});
  }

  Future<Response> markNotificationRead(String notificationId) async {
    return await _dio.put('/notifications/$notificationId/read');
  }

  // FCM Token
  Future<Response> updateFCMToken(String token) async {
    return await _dio.put('/auth/fcm-token', data: {'token': token});
  }
}

// Global instance
final apiService = ApiService();
