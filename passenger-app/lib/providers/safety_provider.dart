import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_service.dart';

// Emergency Contact
class EmergencyContact {
  final String? id;
  final String name;
  final String phone;
  final String relationship;
  final bool notifyOnTrip;
  final bool notifyOnSOS;

  const EmergencyContact({
    this.id,
    required this.name,
    required this.phone,
    required this.relationship,
    this.notifyOnTrip = true,
    this.notifyOnSOS = true,
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      id: json['_id'],
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      relationship: json['relationship'] ?? 'other',
      notifyOnTrip: json['notifyOnTrip'] ?? true,
      notifyOnSOS: json['notifyOnSOS'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'relationship': relationship,
      'notifyOnTrip': notifyOnTrip,
      'notifyOnSOS': notifyOnSOS,
    };
  }

  String get relationshipAr {
    switch (relationship) {
      case 'parent':
        return 'أحد الوالدين';
      case 'spouse':
        return 'الزوج/الزوجة';
      case 'sibling':
        return 'أخ/أخت';
      case 'friend':
        return 'صديق';
      default:
        return 'آخر';
    }
  }

  EmergencyContact copyWith({
    String? id,
    String? name,
    String? phone,
    String? relationship,
    bool? notifyOnTrip,
    bool? notifyOnSOS,
  }) {
    return EmergencyContact(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      relationship: relationship ?? this.relationship,
      notifyOnTrip: notifyOnTrip ?? this.notifyOnTrip,
      notifyOnSOS: notifyOnSOS ?? this.notifyOnSOS,
    );
  }
}

// Safety Preferences
class SafetyPreferences {
  final bool autoShareTrips;
  final List<String> shareWithContacts;
  final bool sendETAUpdates;
  final bool sosGestureEnabled;
  final bool nightModeAlerts;
  final bool recordTrips;

  const SafetyPreferences({
    this.autoShareTrips = false,
    this.shareWithContacts = const [],
    this.sendETAUpdates = true,
    this.sosGestureEnabled = true,
    this.nightModeAlerts = true,
    this.recordTrips = false,
  });

  factory SafetyPreferences.fromJson(Map<String, dynamic> json) {
    return SafetyPreferences(
      autoShareTrips: json['autoShareTrips'] ?? false,
      shareWithContacts: List<String>.from(json['shareWithContacts'] ?? []),
      sendETAUpdates: json['sendETAUpdates'] ?? true,
      sosGestureEnabled: json['sosGestureEnabled'] ?? true,
      nightModeAlerts: json['nightModeAlerts'] ?? true,
      recordTrips: json['recordTrips'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'autoShareTrips': autoShareTrips,
      'shareWithContacts': shareWithContacts,
      'sendETAUpdates': sendETAUpdates,
      'sosGestureEnabled': sosGestureEnabled,
      'nightModeAlerts': nightModeAlerts,
      'recordTrips': recordTrips,
    };
  }

  SafetyPreferences copyWith({
    bool? autoShareTrips,
    List<String>? shareWithContacts,
    bool? sendETAUpdates,
    bool? sosGestureEnabled,
    bool? nightModeAlerts,
    bool? recordTrips,
  }) {
    return SafetyPreferences(
      autoShareTrips: autoShareTrips ?? this.autoShareTrips,
      shareWithContacts: shareWithContacts ?? this.shareWithContacts,
      sendETAUpdates: sendETAUpdates ?? this.sendETAUpdates,
      sosGestureEnabled: sosGestureEnabled ?? this.sosGestureEnabled,
      nightModeAlerts: nightModeAlerts ?? this.nightModeAlerts,
      recordTrips: recordTrips ?? this.recordTrips,
    );
  }
}

// Trip Share Link
class TripShareLink {
  final String tripId;
  final String token;
  final DateTime expiresAt;
  final String shareUrl;

  const TripShareLink({
    required this.tripId,
    required this.token,
    required this.expiresAt,
    required this.shareUrl,
  });

  factory TripShareLink.fromJson(Map<String, dynamic> json) {
    return TripShareLink(
      tripId: json['tripId'] ?? '',
      token: json['token'] ?? '',
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'])
          : DateTime.now().add(const Duration(hours: 24)),
      shareUrl: json['shareUrl'] ?? '',
    );
  }
}

// Safety State
class SafetyState {
  final List<EmergencyContact> contacts;
  final SafetyPreferences preferences;
  final bool isLoading;
  final String? errorMessage;
  final TripShareLink? activeShareLink;

  const SafetyState({
    this.contacts = const [],
    this.preferences = const SafetyPreferences(),
    this.isLoading = false,
    this.errorMessage,
    this.activeShareLink,
  });

  SafetyState copyWith({
    List<EmergencyContact>? contacts,
    SafetyPreferences? preferences,
    bool? isLoading,
    String? errorMessage,
    TripShareLink? activeShareLink,
    bool clearError = false,
    bool clearShareLink = false,
  }) {
    return SafetyState(
      contacts: contacts ?? this.contacts,
      preferences: preferences ?? this.preferences,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      activeShareLink: clearShareLink ? null : (activeShareLink ?? this.activeShareLink),
    );
  }
}

// Safety Notifier
class SafetyNotifier extends StateNotifier<SafetyState> {
  SafetyNotifier() : super(const SafetyState());

  Future<void> loadEmergencyContacts() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.getEmergencyContacts();

      if (response.data['success'] == true) {
        final data = response.data['data'] as List;
        final contacts = data.map((e) => EmergencyContact.fromJson(e)).toList();
        state = state.copyWith(contacts: contacts, isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في تحميل جهات الاتصال',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
    }
  }

  Future<bool> addEmergencyContact(EmergencyContact contact) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.addEmergencyContact(contact.toJson());

      if (response.data['success'] == true) {
        final data = response.data['data'] as List;
        final contacts = data.map((e) => EmergencyContact.fromJson(e)).toList();
        state = state.copyWith(contacts: contacts, isLoading: false);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في إضافة جهة الاتصال',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<bool> updateEmergencyContact(String contactId, Map<String, dynamic> updates) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.updateEmergencyContact(contactId, updates);

      if (response.data['success'] == true) {
        final data = response.data['data'] as List;
        final contacts = data.map((e) => EmergencyContact.fromJson(e)).toList();
        state = state.copyWith(contacts: contacts, isLoading: false);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في تحديث جهة الاتصال',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<bool> removeEmergencyContact(String contactId) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.removeEmergencyContact(contactId);

      if (response.data['success'] == true) {
        final data = response.data['data'] as List;
        final contacts = data.map((e) => EmergencyContact.fromJson(e)).toList();
        state = state.copyWith(contacts: contacts, isLoading: false);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في حذف جهة الاتصال',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<void> loadSafetyPreferences() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.getSafetyPreferences();

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final preferences = SafetyPreferences.fromJson(data);
        state = state.copyWith(preferences: preferences, isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في تحميل إعدادات الأمان',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
    }
  }

  Future<bool> updateSafetyPreferences(SafetyPreferences preferences) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.updateSafetyPreferences(preferences.toJson());

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final updatedPrefs = SafetyPreferences.fromJson(data);
        state = state.copyWith(preferences: updatedPrefs, isLoading: false);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في تحديث إعدادات الأمان',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<TripShareLink?> generateShareLink(String tripId) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.generateTripShareLink(tripId);

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final shareLink = TripShareLink.fromJson(data);
        state = state.copyWith(activeShareLink: shareLink, isLoading: false);
        return shareLink;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في إنشاء رابط المشاركة',
        );
        return null;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return null;
    }
  }

  Future<bool> triggerSOS(String tripId, double latitude, double longitude) async {
    try {
      final response = await apiService.triggerSOS(tripId, latitude, longitude);
      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> respondToSafetyCheck(String tripId, String response) async {
    try {
      final res = await apiService.respondToSafetyCheck(tripId, response);
      return res.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void clearShareLink() {
    state = state.copyWith(clearShareLink: true);
  }
}

// Provider
final safetyProvider = StateNotifierProvider<SafetyNotifier, SafetyState>((ref) {
  return SafetyNotifier();
});
