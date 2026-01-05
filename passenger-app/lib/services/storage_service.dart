import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  late SharedPreferences _prefs;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // Keys
  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUserName = 'user_name';
  static const String _keyUserEmail = 'user_email';
  static const String _keyUserPhone = 'user_phone';
  static const String _keyUserRole = 'user_role';
  static const String _keyIsLoggedIn = 'is_logged_in';
  static const String _keyOnboardingComplete = 'onboarding_complete';
  static const String _keyLanguage = 'language';

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Token Management
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _secureStorage.write(key: _keyAccessToken, value: accessToken);
    await _secureStorage.write(key: _keyRefreshToken, value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _keyRefreshToken);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: _keyAccessToken);
    await _secureStorage.delete(key: _keyRefreshToken);
  }

  // User Data Management
  Future<void> saveUserData({
    required String id,
    required String name,
    String? email,
    String? phone,
    required String role,
  }) async {
    await _prefs.setString(_keyUserId, id);
    await _prefs.setString(_keyUserName, name);
    if (email != null) await _prefs.setString(_keyUserEmail, email);
    if (phone != null) await _prefs.setString(_keyUserPhone, phone);
    await _prefs.setString(_keyUserRole, role);
    await _prefs.setBool(_keyIsLoggedIn, true);
  }

  String? getUserId() => _prefs.getString(_keyUserId);
  String? getUserName() => _prefs.getString(_keyUserName);
  String? getUserEmail() => _prefs.getString(_keyUserEmail);
  String? getUserPhone() => _prefs.getString(_keyUserPhone);
  String? getUserRole() => _prefs.getString(_keyUserRole);
  bool isLoggedIn() => _prefs.getBool(_keyIsLoggedIn) ?? false;

  Future<void> clearUserData() async {
    await _prefs.remove(_keyUserId);
    await _prefs.remove(_keyUserName);
    await _prefs.remove(_keyUserEmail);
    await _prefs.remove(_keyUserPhone);
    await _prefs.remove(_keyUserRole);
    await _prefs.setBool(_keyIsLoggedIn, false);
  }

  // Complete logout
  Future<void> logout() async {
    await clearTokens();
    await clearUserData();
  }

  // Onboarding
  bool isOnboardingComplete() => _prefs.getBool(_keyOnboardingComplete) ?? false;
  Future<void> setOnboardingComplete() async {
    await _prefs.setBool(_keyOnboardingComplete, true);
  }

  // Language
  String getLanguage() => _prefs.getString(_keyLanguage) ?? 'ar';
  Future<void> setLanguage(String language) async {
    await _prefs.setString(_keyLanguage, language);
  }

  // FCM Token
  static const String _keyFCMToken = 'fcm_token';

  Future<void> setFCMToken(String token) async {
    await _secureStorage.write(key: _keyFCMToken, value: token);
  }

  Future<String?> getFCMToken() async {
    return await _secureStorage.read(key: _keyFCMToken);
  }

  Future<void> clearFCMToken() async {
    await _secureStorage.delete(key: _keyFCMToken);
  }

  // Alias for getAccessToken
  Future<String?> getToken() async {
    return await getAccessToken();
  }

  // Alias for saving individual tokens
  Future<void> setToken(String token) async {
    await _secureStorage.write(key: _keyAccessToken, value: token);
  }

  Future<void> setRefreshToken(String token) async {
    await _secureStorage.write(key: _keyRefreshToken, value: token);
  }
}

// Global instance
final storageService = StorageService();

// Provider
final storageServiceProvider = Provider<StorageService>((ref) => storageService);
