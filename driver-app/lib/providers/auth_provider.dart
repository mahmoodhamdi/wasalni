import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

// Driver approval status
enum DriverApprovalStatus {
  pending,
  approved,
  rejected,
  suspended,
}

// Auth State
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  needsRegistration,
  pendingApproval,
  error,
}

class AuthState {
  final AuthStatus status;
  final String? userId;
  final String? phone;
  final String? name;
  final String? email;
  final String? avatar;
  final DriverApprovalStatus? approvalStatus;
  final String? rejectionReason;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.userId,
    this.phone,
    this.name,
    this.email,
    this.avatar,
    this.approvalStatus,
    this.rejectionReason,
    this.errorMessage,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
  bool get needsRegistration => status == AuthStatus.needsRegistration;
  bool get isPendingApproval => status == AuthStatus.pendingApproval;
  bool get isApproved => approvalStatus == DriverApprovalStatus.approved;

  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? phone,
    String? name,
    String? email,
    String? avatar,
    DriverApprovalStatus? approvalStatus,
    String? rejectionReason,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      phone: phone ?? this.phone,
      name: name ?? this.name,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      approvalStatus: approvalStatus ?? this.approvalStatus,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      errorMessage: errorMessage,
    );
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  /// Check if user is already logged in
  Future<void> checkAuthStatus() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final isLoggedIn = storageService.isLoggedIn();
      final token = await storageService.getAccessToken();

      if (isLoggedIn && token != null) {
        apiService.setToken(token);

        try {
          final response = await apiService.getProfile();
          if (response.statusCode == 200 && response.data['success'] == true) {
            final userData = response.data['data']['user'];
            final driverData = response.data['data']['driver'];

            final approvalStatus = _parseApprovalStatus(driverData?['status']);

            if (approvalStatus == DriverApprovalStatus.pending) {
              state = state.copyWith(
                status: AuthStatus.pendingApproval,
                userId: userData['_id'],
                phone: userData['phone'],
                name: userData['name'],
                email: userData['email'],
                avatar: userData['avatar'],
                approvalStatus: approvalStatus,
              );
            } else if (approvalStatus == DriverApprovalStatus.approved) {
              state = state.copyWith(
                status: AuthStatus.authenticated,
                userId: userData['_id'],
                phone: userData['phone'],
                name: userData['name'],
                email: userData['email'],
                avatar: userData['avatar'],
                approvalStatus: approvalStatus,
              );
            } else {
              state = state.copyWith(
                status: AuthStatus.pendingApproval,
                userId: userData['_id'],
                approvalStatus: approvalStatus,
                rejectionReason: driverData?['rejectionReason'],
              );
            }
            return;
          }
        } catch (e) {
          // Token might be expired
        }
      }

      state = state.copyWith(status: AuthStatus.unauthenticated);
    } catch (e) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  DriverApprovalStatus _parseApprovalStatus(String? status) {
    switch (status) {
      case 'approved':
        return DriverApprovalStatus.approved;
      case 'rejected':
        return DriverApprovalStatus.rejected;
      case 'suspended':
        return DriverApprovalStatus.suspended;
      default:
        return DriverApprovalStatus.pending;
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

  /// Verify OTP - returns status string
  Future<String> verifyOTP(String phone, String otp) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.verifyOTP(phone, otp);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];

        if (data['isNewUser'] == true) {
          state = state.copyWith(
            status: AuthStatus.needsRegistration,
            phone: phone,
          );
          return 'needs_registration';
        } else {
          final tokens = data['tokens'];
          final user = data['user'];
          final driver = data['driver'];

          await _saveAuthData(tokens, user, driver);

          final approvalStatus = _parseApprovalStatus(driver?['status']);

          if (approvalStatus == DriverApprovalStatus.approved) {
            state = state.copyWith(
              status: AuthStatus.authenticated,
              userId: user['_id'],
              phone: user['phone'],
              name: user['name'],
              email: user['email'],
              avatar: user['avatar'],
              approvalStatus: approvalStatus,
            );
            return 'authenticated';
          } else {
            state = state.copyWith(
              status: AuthStatus.pendingApproval,
              userId: user['_id'],
              phone: user['phone'],
              name: user['name'],
              approvalStatus: approvalStatus,
              rejectionReason: driver?['rejectionReason'],
            );
            return 'pending_approval';
          }
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

  /// Register new driver
  Future<bool> register({
    required String phone,
    required String name,
    String? email,
    required String nationalId,
    required String vehicleType,
    required String vehicleCategory,
    required Map<String, dynamic> vehicle,
  }) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.registerDriver(
        phone: phone,
        name: name,
        email: email,
        nationalId: nationalId,
        vehicleType: vehicleType,
        vehicleCategory: vehicleCategory,
        vehicle: vehicle,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        final user = data['user'];
        final driver = data['driver'];

        await _saveAuthData(tokens, user, driver);

        state = state.copyWith(
          status: AuthStatus.pendingApproval,
          userId: user['_id'],
          phone: user['phone'],
          name: user['name'],
          email: user['email'],
          approvalStatus: DriverApprovalStatus.pending,
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

  /// Update FCM token
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
      await storageService.logout();
      apiService.clearToken();
    } catch (e) {
      // Continue with logout
    }

    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }

  // Helper methods
  Future<void> _saveAuthData(
    Map<String, dynamic> tokens,
    Map<String, dynamic> user,
    Map<String, dynamic>? driver,
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
      driverStatus: driver?['status'],
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
