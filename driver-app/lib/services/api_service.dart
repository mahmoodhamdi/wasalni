import 'package:dio/dio.dart';

import '../config/app_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  Dio? _dioInstance;
  String? _token;
  bool _isInitialized = false;

  // Safe getter for Dio instance
  Dio get _dio {
    if (_dioInstance == null) {
      throw StateError('ApiService.init() must be called before using the service');
    }
    return _dioInstance!;
  }

  void init() {
    // Prevent double initialization
    if (_isInitialized) {
      return;
    }
    _isInitialized = true;

    _dioInstance = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.apiTimeout,
        receiveTimeout: AppConfig.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      ),
    );

    _dioInstance!.interceptors.add(
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

  String? _refreshToken;

  void setToken(String token) {
    _token = token;
  }

  void setRefreshToken(String token) {
    _refreshToken = token;
  }

  void clearToken() {
    _token = null;
    _refreshToken = null;
  }

  // Auth Endpoints

  /// Send OTP to email for registration, login, or password reset
  Future<Response> sendOTP(String email, {String purpose = 'login'}) async {
    return await _dio.post('/auth/send-otp', data: {
      'email': email,
      'purpose': purpose,
    });
  }

  /// Verify OTP for login (returns tokens if user exists)
  Future<Response> verifyLoginOTP(String email, String otp) async {
    return await _dio.post('/auth/verify-otp', data: {
      'email': email,
      'otp': otp,
    });
  }

  /// Verify OTP for registration (just verifies, doesn't return tokens)
  Future<Response> verifyRegistrationOTP(String email, String otp) async {
    return await _dio.post('/auth/verify-registration-otp', data: {
      'email': email,
      'otp': otp,
    });
  }

  /// Login with email and password
  Future<Response> login(String email, String password) async {
    return await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
  }

  /// Google Sign-In with Firebase ID token
  Future<Response> googleSignIn(String idToken, {String role = 'driver'}) async {
    return await _dio.post('/auth/google', data: {
      'idToken': idToken,
      'role': role,
    });
  }

  /// Register new driver with email/password or Google auth
  Future<Response> registerDriver({
    required String email,
    String? password,
    required String name,
    String? phone,
    required String nationalId,
    required String vehicleType,
    required String vehicleCategory,
    required Map<String, dynamic> vehicle,
    String? googleId,
    String? avatar,
  }) async {
    return await _dio.post('/auth/register/driver', data: {
      'email': email,
      if (password != null) 'password': password,
      'name': name,
      if (phone != null) 'phone': phone,
      'nationalId': nationalId,
      'vehicleType': vehicleType,
      'vehicleCategory': vehicleCategory,
      'vehicle': vehicle,
      if (googleId != null) 'googleId': googleId,
      if (avatar != null) 'avatar': avatar,
    });
  }

  /// Reset password with OTP
  Future<Response> resetPassword(String email, String otp, String newPassword) async {
    return await _dio.post('/auth/reset-password', data: {
      'email': email,
      'otp': otp,
      'newPassword': newPassword,
    });
  }

  /// Change password (authenticated)
  Future<Response> changePassword(String currentPassword, String newPassword) async {
    return await _dio.put('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
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
    return await _dio.post('/location/status', data: {
      'isOnline': true,
    });
  }

  Future<Response> goOffline() async {
    return await _dio.post('/location/status', data: {
      'isOnline': false,
    });
  }

  Future<Response> updateLocation({
    required double lat,
    required double lng,
    double? heading,
    double? speed,
  }) async {
    return await _dio.post('/location/update', data: {
      'lat': lat,
      'lng': lng,
      if (heading != null) 'heading': heading,
      if (speed != null) 'speed': speed,
    });
  }

  // Trip Endpoints
  Future<Response> acceptTrip(String tripId) async {
    return await _dio.put('/driver/trips/$tripId/accept');
  }

  Future<Response> rejectTrip(String tripId) async {
    return await _dio.put('/driver/trips/$tripId/reject');
  }

  Future<Response> arrivedAtPickup(String tripId) async {
    return await _dio.put('/driver/trips/$tripId/status', data: {
      'status': 'driver_arrived',
    });
  }

  Future<Response> startTrip(String tripId) async {
    return await _dio.put('/driver/trips/$tripId/status', data: {
      'status': 'trip_started',
    });
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

  // Upload multiple documents at once
  Future<Response> uploadDocuments(Map<String, dynamic> files) async {
    final Map<String, dynamic> formFields = {};

    for (final entry in files.entries) {
      final file = entry.value;
      if (file is String) {
        formFields[entry.key] = await MultipartFile.fromFile(file);
      } else if (file != null && file.path != null) {
        formFields[entry.key] = await MultipartFile.fromFile(file.path);
      }
    }

    FormData formData = FormData.fromMap(formFields);
    return await _dio.post('/driver/documents/batch', data: formData);
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
