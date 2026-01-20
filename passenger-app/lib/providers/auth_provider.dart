import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:google_sign_in/google_sign_in.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/socket_service.dart';

// Auth State
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  needsRegistration,
  needsProfileCompletion,
  otpSent,
  otpVerified,
  error,
}

class AuthState {
  final AuthStatus status;
  final String? userId;
  final String? email;
  final String? name;
  final String? phone;
  final String? avatar;
  final String? errorMessage;
  final bool isNewUser;

  const AuthState({
    this.status = AuthStatus.initial,
    this.userId,
    this.email,
    this.name,
    this.phone,
    this.avatar,
    this.errorMessage,
    this.isNewUser = false,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
  bool get needsRegistration => status == AuthStatus.needsRegistration;

  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? email,
    String? name,
    String? phone,
    String? avatar,
    String? errorMessage,
    bool? isNewUser,
  }) {
    return AuthState(
      status: status ?? this.status,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      avatar: avatar ?? this.avatar,
      errorMessage: errorMessage,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  final GoogleSignIn _googleSignIn = GoogleSignIn();

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

            // Connect socket for real-time updates
            final userId = userData['_id'];
            if (userId != null && token != null) {
              socketService.connect(userId, token);
            }

            state = state.copyWith(
              status: AuthStatus.authenticated,
              userId: userId,
              email: userData['email'],
              name: userData['name'],
              phone: userData['phone'],
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

      apiService.setRefreshToken(refreshToken);
      // The API interceptor handles refresh automatically
      return false;
    } catch (e) {
      return false;
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

        await _saveAuthData(tokens, user);

        // Connect socket for real-time updates
        final userId = user['_id'];
        final accessToken = tokens['accessToken'];
        if (userId != null && accessToken != null) {
          socketService.connect(userId, accessToken);
        }

        state = state.copyWith(
          status: AuthStatus.authenticated,
          userId: userId,
          email: user['email'],
          name: user['name'],
          phone: user['phone'],
          avatar: user['avatar'],
        );
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
      final response = await apiService.googleSignIn(idToken, role: 'passenger');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        final user = data['user'];
        final isNewUser = data['isNewUser'] ?? false;

        await _saveAuthData(tokens, user);

        if (isNewUser) {
          // New user needs to complete their profile
          state = state.copyWith(
            status: AuthStatus.needsProfileCompletion,
            userId: user['_id'],
            email: user['email'],
            name: user['name'],
            phone: user['phone'],
            avatar: user['avatar'],
            isNewUser: true,
          );
        } else {
          // Connect socket for real-time updates
          final passengerId = user['_id'];
          final accessToken = tokens['accessToken'];
          if (passengerId != null && accessToken != null) {
            socketService.connect(passengerId, accessToken);
          }

          state = state.copyWith(
            status: AuthStatus.authenticated,
            userId: user['_id'],
            email: user['email'],
            name: user['name'],
            phone: user['phone'],
            avatar: user['avatar'],
            isNewUser: false,
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

        await _saveAuthData(tokens, user);

        // Connect socket for real-time updates
        final passengerId = user['_id'];
        final accessToken = tokens['accessToken'];
        if (passengerId != null && accessToken != null) {
          socketService.connect(passengerId, accessToken);
        }

        state = state.copyWith(
          status: AuthStatus.authenticated,
          userId: user['_id'],
          email: user['email'],
          name: user['name'],
          phone: user['phone'],
          avatar: user['avatar'],
        );
        return 'authenticated';
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

  /// Register new passenger
  Future<bool> register({
    required String email,
    required String password,
    required String name,
    String? phone,
    String? gender,
  }) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final response = await apiService.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
        gender: gender,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          response.data['success'] == true) {
        final data = response.data['data'];
        final tokens = data['tokens'];
        final user = data['user'];

        await _saveAuthData(tokens, user);

        // Connect socket for real-time updates
        final passengerId = user['_id'];
        final accessToken = tokens['accessToken'];
        if (passengerId != null && accessToken != null) {
          socketService.connect(passengerId, accessToken);
        }

        state = state.copyWith(
          status: AuthStatus.authenticated,
          userId: user['_id'],
          email: user['email'],
          name: user['name'],
          phone: user['phone'],
          avatar: user['avatar'],
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

  /// Update user profile
  Future<bool> updateProfile({
    String? name,
    String? phone,
    String? avatar,
    String? gender,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (phone != null) data['phone'] = phone;
      if (avatar != null) data['avatar'] = avatar;
      if (gender != null) data['gender'] = gender;

      final response = await apiService.updateProfile(data);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final user = response.data['data']['user'];
        state = state.copyWith(
          name: user['name'],
          phone: user['phone'],
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
      // Continue with logout even if API call fails
    }

    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Clear error message
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
      role: user['role'] ?? 'passenger',
    );
    apiService.setToken(tokens['accessToken']);
    apiService.setRefreshToken(tokens['refreshToken']);
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
