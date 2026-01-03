import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

// Auth State
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  needsRegistration,
  error,
}

class AuthState {
  final AuthStatus status;
  final String? userId;
  final String? phone;
  final String? name;
  final String? email;
  final String? avatar;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.userId,
    this.phone,
    this.name,
    this.email,
    this.avatar,
    this.errorMessage,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
  bool get needsRegistration => status == AuthStatus.needsRegistration;

  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? phone,
    String? name,
    String? email,
    String? avatar,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      phone: phone ?? this.phone,
      name: name ?? this.name,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      errorMessage: errorMessage,
    );
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  /// Check if user is already logged in (on app start)
  Future<void> checkAuthStatus() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final isLoggedIn = storageService.isLoggedIn();
      final token = await storageService.getAccessToken();

      if (isLoggedIn && token != null) {
        // Set token in API service
        apiService.setToken(token);

        // Try to get profile from server
        try {
          final response = await apiService.getProfile();
          if (response.statusCode == 200 && response.data['success'] == true) {
            final userData = response.data['data']['user'];
            state = state.copyWith(
              status: AuthStatus.authenticated,
              userId: userData['_id'],
              phone: userData['phone'],
              name: userData['name'],
              email: userData['email'],
              avatar: userData['avatar'],
            );
            return;
          }
        } catch (e) {
          // Token might be expired, try to refresh
          final refreshed = await _refreshToken();
          if (refreshed) {
            return;
          }
        }
      }

      state = state.copyWith(status: AuthStatus.unauthenticated);
    } catch (e) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await storageService.getRefreshToken();
      if (refreshToken == null) return false;

      // Call refresh endpoint would go here
      // For now, just return false to force re-login
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Send OTP to phone number
  Future<bool> sendOTP(String phone) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.sendOTP(phone);

      if (response.statusCode == 200 && response.data['success'] == true) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          phone: phone,
        );
        return true;
      } else {
        final message = response.data['message'] ?? 'Failed to send OTP';
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: message,
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: _getErrorMessage(e),
      );
      return false;
    }
  }

  /// Verify OTP
  /// Returns: 'authenticated' if user exists, 'needs_registration' if new user, 'error' if failed
  Future<String> verifyOTP(String phone, String otp) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.verifyOTP(phone, otp);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];

        if (data['isNewUser'] == true) {
          // New user - needs registration
          state = state.copyWith(
            status: AuthStatus.needsRegistration,
            phone: phone,
          );
          return 'needs_registration';
        } else {
          // Existing user - logged in
          final tokens = data['tokens'];
          final user = data['user'];

          await _saveAuthData(tokens, user);

          state = state.copyWith(
            status: AuthStatus.authenticated,
            userId: user['_id'],
            phone: user['phone'],
            name: user['name'],
            email: user['email'],
            avatar: user['avatar'],
          );
          return 'authenticated';
        }
      } else {
        final message = response.data['message'] ?? 'OTP verification failed';
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: message,
        );
        return 'error';
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: _getErrorMessage(e),
      );
      return 'error';
    }
  }

  /// Register new passenger
  Future<bool> register({
    required String phone,
    required String name,
    String? email,
    String? gender,
  }) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.register(
        phone: phone,
        name: name,
        email: email,
        gender: gender,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        final user = data['user'];

        await _saveAuthData(tokens, user);

        state = state.copyWith(
          status: AuthStatus.authenticated,
          userId: user['_id'],
          phone: user['phone'],
          name: user['name'],
          email: user['email'],
          avatar: user['avatar'],
        );
        return true;
      } else {
        final message = response.data['message'] ?? 'Registration failed';
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: message,
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: _getErrorMessage(e),
      );
      return false;
    }
  }

  /// Update user profile
  Future<bool> updateProfile({
    String? name,
    String? email,
    String? avatar,
    String? gender,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (email != null) data['email'] = email;
      if (avatar != null) data['avatar'] = avatar;
      if (gender != null) data['gender'] = gender;

      final response = await apiService.updateProfile(data);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final user = response.data['data']['user'];
        state = state.copyWith(
          name: user['name'],
          email: user['email'],
          avatar: user['avatar'],
        );
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Update FCM token for push notifications
  Future<void> updateFCMToken(String token) async {
    try {
      await apiService.updateFCMToken(token);
    } catch (e) {
      // Silently fail
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      // Clear local storage
      await storageService.logout();
      apiService.clearToken();
    } catch (e) {
      // Continue with logout even if API call fails
    }

    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Clear error message
  void clearError() {
    state = state.copyWith(errorMessage: null);
  }

  // Helper methods
  Future<void> _saveAuthData(
    Map<String, dynamic> tokens,
    Map<String, dynamic> user,
  ) async {
    await storageService.saveTokens(
      accessToken: tokens['accessToken'],
      refreshToken: tokens['refreshToken'],
    );
    await storageService.saveUserData(
      id: user['_id'],
      name: user['name'],
      phone: user['phone'],
      role: user['role'],
    );
    apiService.setToken(tokens['accessToken']);
  }

  String _getErrorMessage(dynamic error) {
    if (error.toString().contains('SocketException') ||
        error.toString().contains('Connection refused')) {
      return 'لا يمكن الاتصال بالخادم';
    }
    if (error.toString().contains('TimeoutException')) {
      return 'انتهت مهلة الاتصال';
    }
    return 'حدث خطأ غير متوقع';
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
