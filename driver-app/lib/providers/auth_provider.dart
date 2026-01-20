import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:google_sign_in/google_sign_in.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/socket_service.dart';

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
  otpSent,
  otpVerified,
  error,
}

class AuthState {
  final AuthStatus status;
  final String? userId;
  final String? email;
  final String? phone;
  final String? name;
  final String? avatar;
  final String? googleId;
  final DriverApprovalStatus? approvalStatus;
  final String? rejectionReason;
  final String? errorMessage;
  final bool isNewUser;

  const AuthState({
    this.status = AuthStatus.initial,
    this.userId,
    this.email,
    this.phone,
    this.name,
    this.avatar,
    this.googleId,
    this.approvalStatus,
    this.rejectionReason,
    this.errorMessage,
    this.isNewUser = false,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
  bool get needsRegistration => status == AuthStatus.needsRegistration;
  bool get isPendingApproval => status == AuthStatus.pendingApproval;
  bool get isApproved => approvalStatus == DriverApprovalStatus.approved;

  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? email,
    String? phone,
    String? name,
    String? avatar,
    String? googleId,
    DriverApprovalStatus? approvalStatus,
    String? rejectionReason,
    String? errorMessage,
    bool? isNewUser,
  }) {
    return AuthState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      name: name ?? this.name,
      avatar: avatar ?? this.avatar,
      googleId: googleId ?? this.googleId,
      approvalStatus: approvalStatus ?? this.approvalStatus,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      errorMessage: errorMessage,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  final GoogleSignIn _googleSignIn = GoogleSignIn();

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
                email: userData['email'],
                phone: userData['phone'],
                name: userData['name'],
                avatar: userData['avatar'],
                approvalStatus: approvalStatus,
              );
            } else if (approvalStatus == DriverApprovalStatus.approved) {
              // Connect socket for real-time updates
              final driverId = driverData?['_id'];
              if (driverId != null && token != null) {
                socketService.connect(driverId, token);
              }

              state = state.copyWith(
                status: AuthStatus.authenticated,
                userId: userData['_id'],
                email: userData['email'],
                phone: userData['phone'],
                name: userData['name'],
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

  /// Login with email and password
  Future<bool> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.login(email, password);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        final user = data['user'];
        final driver = data['driver'];

        await _saveAuthData(tokens, user, driver);

        final approvalStatus = _parseApprovalStatus(driver?['status']);

        if (approvalStatus == DriverApprovalStatus.approved) {
          // Connect socket for real-time updates
          final driverId = driver?['_id'];
          final accessToken = tokens['accessToken'];
          if (driverId != null && accessToken != null) {
            socketService.connect(driverId, accessToken);
          }

          state = state.copyWith(
            status: AuthStatus.authenticated,
            userId: user['_id'],
            email: user['email'],
            phone: user['phone'],
            name: user['name'],
            avatar: user['avatar'],
            approvalStatus: approvalStatus,
          );
        } else {
          state = state.copyWith(
            status: AuthStatus.pendingApproval,
            userId: user['_id'],
            email: user['email'],
            phone: user['phone'],
            name: user['name'],
            approvalStatus: approvalStatus,
            rejectionReason: driver?['rejectionReason'],
          );
        }
        return true;
      } else {
        final message = response.data['messageAr'] ?? response.data['message'] ?? 'فشل تسجيل الدخول';
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

  /// Google Sign-In
  Future<bool> signInWithGoogle() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      // Sign out first to ensure account picker shows
      await _googleSignIn.signOut();

      // Trigger Google Sign-In
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        state = state.copyWith(status: AuthStatus.unauthenticated);
        return false;
      }

      // Get auth details
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Sign in to Firebase
      final credential = firebase_auth.GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final firebase_auth.UserCredential userCredential =
          await firebase_auth.FirebaseAuth.instance.signInWithCredential(credential);

      // Get Firebase ID token
      final idToken = await userCredential.user?.getIdToken();
      if (idToken == null) {
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: 'فشل الحصول على رمز التحقق',
        );
        return false;
      }

      // Send to backend
      final response = await apiService.googleSignIn(idToken, role: 'driver');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        final user = data['user'];
        final driver = data['driver'];
        final isNewUser = data['isNewUser'] ?? false;
        final needsDriverRegistration = data['needsDriverRegistration'] ?? false;

        if (isNewUser || needsDriverRegistration) {
          // User needs to complete driver registration
          // Don't save tokens - user is not registered yet
          state = state.copyWith(
            status: AuthStatus.needsRegistration,
            email: user['email'],
            name: user['name'],
            avatar: user['avatar'],
            googleId: user['googleId'],
            isNewUser: true,
          );
          return true;
        }

        await _saveAuthData(tokens, user, driver);

        final approvalStatus = _parseApprovalStatus(driver?['status']);

        if (approvalStatus == DriverApprovalStatus.approved) {
          // Connect socket for real-time updates
          final driverId = driver?['_id'];
          final accessToken = tokens['accessToken'];
          if (driverId != null && accessToken != null) {
            socketService.connect(driverId, accessToken);
          }

          state = state.copyWith(
            status: AuthStatus.authenticated,
            userId: user['_id'],
            email: user['email'],
            phone: user['phone'],
            name: user['name'],
            avatar: user['avatar'],
            approvalStatus: approvalStatus,
            isNewUser: isNewUser,
          );
        } else {
          state = state.copyWith(
            status: AuthStatus.pendingApproval,
            userId: user['_id'],
            email: user['email'],
            phone: user['phone'],
            name: user['name'],
            approvalStatus: approvalStatus,
            rejectionReason: driver?['rejectionReason'],
            isNewUser: isNewUser,
          );
        }
        return true;
      } else {
        final message = response.data['messageAr'] ?? response.data['message'] ?? 'فشل تسجيل الدخول';
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

  /// Send OTP to email
  Future<bool> sendOTP(String email, {String purpose = 'login'}) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.sendOTP(email, purpose: purpose);

      if (response.statusCode == 200 && response.data['success'] == true) {
        state = state.copyWith(
          status: AuthStatus.otpSent,
          email: email,
        );
        return true;
      } else {
        final message = response.data['messageAr'] ?? response.data['message'] ?? 'فشل إرسال رمز التحقق';
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

  /// Verify OTP for login
  Future<String> verifyLoginOTP(String email, String otp) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.verifyLoginOTP(email, otp);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        final user = data['user'];
        final driver = data['driver'];

        await _saveAuthData(tokens, user, driver);

        final approvalStatus = _parseApprovalStatus(driver?['status']);

        if (approvalStatus == DriverApprovalStatus.approved) {
          // Connect socket for real-time updates
          final driverId = driver?['_id'];
          final accessToken = tokens['accessToken'];
          if (driverId != null && accessToken != null) {
            socketService.connect(driverId, accessToken);
          }

          state = state.copyWith(
            status: AuthStatus.authenticated,
            userId: user['_id'],
            email: user['email'],
            phone: user['phone'],
            name: user['name'],
            avatar: user['avatar'],
            approvalStatus: approvalStatus,
          );
          return 'authenticated';
        } else {
          state = state.copyWith(
            status: AuthStatus.pendingApproval,
            userId: user['_id'],
            email: user['email'],
            phone: user['phone'],
            name: user['name'],
            approvalStatus: approvalStatus,
            rejectionReason: driver?['rejectionReason'],
          );
          return 'pending_approval';
        }
      } else {
        final message = response.data['messageAr'] ?? response.data['message'] ?? 'رمز التحقق غير صحيح';
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

  /// Verify OTP for registration
  Future<bool> verifyRegistrationOTP(String email, String otp) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.verifyRegistrationOTP(email, otp);

      if (response.statusCode == 200 && response.data['success'] == true) {
        state = state.copyWith(
          status: AuthStatus.otpVerified,
          email: email,
        );
        return true;
      } else {
        final message = response.data['messageAr'] ?? response.data['message'] ?? 'رمز التحقق غير صحيح';
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

  /// Register new driver
  Future<bool> register({
    required String email,
    String? password,
    required String name,
    String? phone,
    required String nationalId,
    required String vehicleType,
    required String vehicleCategory,
    required Map<String, dynamic> vehicle,
  }) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      // Use googleId from state if available (Google Sign-In flow)
      final googleId = state.googleId;
      final avatar = state.avatar;

      final response = await apiService.registerDriver(
        email: email,
        password: password,
        name: name,
        phone: phone,
        nationalId: nationalId,
        vehicleType: vehicleType,
        vehicleCategory: vehicleCategory,
        vehicle: vehicle,
        googleId: googleId,
        avatar: avatar,
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
          email: user['email'],
          phone: user['phone'],
          name: user['name'],
          approvalStatus: DriverApprovalStatus.pending,
        );
        return true;
      } else {
        final message = response.data['messageAr'] ?? response.data['message'] ?? 'فشل إنشاء الحساب';
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

  /// Reset password with OTP
  Future<bool> resetPassword(String email, String otp, String newPassword) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.resetPassword(email, otp, newPassword);

      if (response.statusCode == 200 && response.data['success'] == true) {
        state = state.copyWith(status: AuthStatus.unauthenticated);
        return true;
      } else {
        final message = response.data['messageAr'] ?? response.data['message'] ?? 'فشل إعادة تعيين كلمة المرور';
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

  /// Change password (authenticated)
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      final response = await apiService.changePassword(currentPassword, newPassword);
      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
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
      // Disconnect socket
      socketService.disconnect();
      // Sign out from Google
      await _googleSignIn.signOut();
      // Sign out from Firebase
      await firebase_auth.FirebaseAuth.instance.signOut();
      // Clear local storage
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

  /// Reset to unauthenticated state
  void resetState() {
    state = const AuthState(status: AuthStatus.unauthenticated);
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
      name: user['name'] ?? '',
      email: user['email'],
      phone: user['phone'],
      role: user['role'] ?? 'driver',
      driverStatus: driver?['status'],
    );
    apiService.setToken(tokens['accessToken']);
    apiService.setRefreshToken(tokens['refreshToken']);
  }

  String _getErrorMessage(dynamic error) {
    // Handle DioException to extract Arabic error message
    if (error is DioException && error.response?.data != null) {
      final data = error.response!.data;
      if (data is Map) {
        return data['messageAr'] ?? data['message'] ?? 'حدث خطأ';
      }
    }

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
