import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

// ==================== Models ====================

class PromoCode {
  final String id;
  final String code;
  final String type; // 'percentage' or 'fixed'
  final double value;
  final double? maxDiscount;
  final double? minFare;
  final DateTime validFrom;
  final DateTime validUntil;
  final List<String>? rideTypes;
  final String? description;
  final String? descriptionAr;
  final int? remainingUses;

  PromoCode({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    this.maxDiscount,
    this.minFare,
    required this.validFrom,
    required this.validUntil,
    this.rideTypes,
    this.description,
    this.descriptionAr,
    this.remainingUses,
  });

  factory PromoCode.fromJson(Map<String, dynamic> json) {
    return PromoCode(
      id: json['_id'] ?? json['id'] ?? '',
      code: json['code'] ?? '',
      type: json['type'] ?? 'percentage',
      value: (json['value'] ?? 0).toDouble(),
      maxDiscount: json['maxDiscount']?.toDouble(),
      minFare: json['minFare']?.toDouble(),
      validFrom: DateTime.parse(json['validFrom'] ?? DateTime.now().toIso8601String()),
      validUntil: DateTime.parse(json['validUntil'] ?? DateTime.now().toIso8601String()),
      rideTypes: json['rideTypes'] != null
          ? List<String>.from(json['rideTypes'])
          : null,
      description: json['description'],
      descriptionAr: json['descriptionAr'],
      remainingUses: json['remainingUses'],
    );
  }

  String get discountText {
    if (type == 'percentage') {
      return '${value.toInt()}%';
    } else {
      return '${value.toStringAsFixed(0)} EGP';
    }
  }

  String get discountTextAr {
    if (type == 'percentage') {
      return '${value.toInt()}%';
    } else {
      return '${value.toStringAsFixed(0)} ج.م';
    }
  }

  bool get isExpiringSoon {
    final daysLeft = validUntil.difference(DateTime.now()).inDays;
    return daysLeft <= 3 && daysLeft >= 0;
  }

  int get daysUntilExpiry {
    return validUntil.difference(DateTime.now()).inDays;
  }
}

class PromoUsage {
  final String id;
  final String promoCode;
  final String tripId;
  final double discountAmount;
  final DateTime usedAt;

  PromoUsage({
    required this.id,
    required this.promoCode,
    required this.tripId,
    required this.discountAmount,
    required this.usedAt,
  });

  factory PromoUsage.fromJson(Map<String, dynamic> json) {
    return PromoUsage(
      id: json['_id'] ?? json['id'] ?? '',
      promoCode: json['promoCode'] ?? '',
      tripId: json['tripId'] ?? '',
      discountAmount: (json['discountAmount'] ?? 0).toDouble(),
      usedAt: DateTime.parse(json['usedAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class PromoValidationResult {
  final bool valid;
  final double? discount;
  final String? discountType;
  final String? promoCode;
  final String? message;
  final String? messageAr;

  PromoValidationResult({
    required this.valid,
    this.discount,
    this.discountType,
    this.promoCode,
    this.message,
    this.messageAr,
  });

  factory PromoValidationResult.fromJson(Map<String, dynamic> json) {
    return PromoValidationResult(
      valid: json['valid'] ?? false,
      discount: json['discount']?.toDouble(),
      discountType: json['discountType'],
      promoCode: json['promoCode'],
      message: json['message'],
      messageAr: json['messageAr'],
    );
  }
}

// ==================== State ====================

class PromoState {
  final List<PromoCode> availablePromos;
  final List<PromoUsage> usageHistory;
  final PromoValidationResult? lastValidation;
  final String? appliedPromoCode;
  final double? appliedDiscount;
  final bool isLoading;
  final bool isValidating;
  final String? error;
  final int currentPage;
  final int totalPages;
  final bool hasMore;

  PromoState({
    this.availablePromos = const [],
    this.usageHistory = const [],
    this.lastValidation,
    this.appliedPromoCode,
    this.appliedDiscount,
    this.isLoading = false,
    this.isValidating = false,
    this.error,
    this.currentPage = 1,
    this.totalPages = 1,
    this.hasMore = false,
  });

  PromoState copyWith({
    List<PromoCode>? availablePromos,
    List<PromoUsage>? usageHistory,
    PromoValidationResult? lastValidation,
    String? appliedPromoCode,
    double? appliedDiscount,
    bool? isLoading,
    bool? isValidating,
    String? error,
    int? currentPage,
    int? totalPages,
    bool? hasMore,
    bool clearValidation = false,
    bool clearApplied = false,
    bool clearError = false,
  }) {
    return PromoState(
      availablePromos: availablePromos ?? this.availablePromos,
      usageHistory: usageHistory ?? this.usageHistory,
      lastValidation: clearValidation ? null : (lastValidation ?? this.lastValidation),
      appliedPromoCode: clearApplied ? null : (appliedPromoCode ?? this.appliedPromoCode),
      appliedDiscount: clearApplied ? null : (appliedDiscount ?? this.appliedDiscount),
      isLoading: isLoading ?? this.isLoading,
      isValidating: isValidating ?? this.isValidating,
      error: clearError ? null : (error ?? this.error),
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

// ==================== Notifier ====================

class PromoNotifier extends StateNotifier<PromoState> {
  final ApiService _apiService;

  PromoNotifier(this._apiService) : super(PromoState());

  /// Load available promo codes for current user
  Future<void> loadAvailablePromos({String? rideType, double? fare}) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _apiService.getAvailablePromos(
        rideType: rideType,
        fare: fare,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final promos = (data['promos'] as List)
            .map((p) => PromoCode.fromJson(p))
            .toList();

        state = state.copyWith(
          availablePromos: promos,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Failed to load promos',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Connection error. Please try again.',
      );
    }
  }

  /// Load promo usage history
  Future<void> loadUsageHistory({int page = 1, bool refresh = false}) async {
    if (refresh) {
      state = state.copyWith(
        usageHistory: [],
        currentPage: 1,
        isLoading: true,
        clearError: true,
      );
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    try {
      final response = await _apiService.getPromoHistory(page: page);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final history = (data['history'] as List)
            .map((h) => PromoUsage.fromJson(h))
            .toList();

        final pagination = data['pagination'] ?? {};
        final totalPages = pagination['pages'] ?? 1;
        final currentPage = pagination['page'] ?? page;

        state = state.copyWith(
          usageHistory: refresh ? history : [...state.usageHistory, ...history],
          currentPage: currentPage,
          totalPages: totalPages,
          hasMore: currentPage < totalPages,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Failed to load history',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Connection error. Please try again.',
      );
    }
  }

  /// Load more history (pagination)
  Future<void> loadMoreHistory() async {
    if (state.isLoading || !state.hasMore) return;
    await loadUsageHistory(page: state.currentPage + 1);
  }

  /// Validate a promo code
  Future<bool> validatePromoCode({
    required String code,
    required double fare,
    required String rideType,
  }) async {
    state = state.copyWith(isValidating: true, clearValidation: true, clearError: true);

    try {
      final response = await _apiService.validatePromoCode(
        code: code,
        fare: fare,
        rideType: rideType,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final result = PromoValidationResult.fromJson(data);

        state = state.copyWith(
          lastValidation: result,
          isValidating: false,
        );

        return result.valid;
      } else {
        final result = PromoValidationResult(
          valid: false,
          message: response.data['message'],
          messageAr: response.data['messageAr'],
        );

        state = state.copyWith(
          lastValidation: result,
          isValidating: false,
        );

        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isValidating: false,
        error: 'Connection error. Please try again.',
      );
      return false;
    }
  }

  /// Apply a promo code to current ride
  void applyPromo(String code, double discount) {
    state = state.copyWith(
      appliedPromoCode: code,
      appliedDiscount: discount,
    );
  }

  /// Remove applied promo code
  void removeAppliedPromo() {
    state = state.copyWith(clearApplied: true);
  }

  /// Clear validation result
  void clearValidation() {
    state = state.copyWith(clearValidation: true);
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  /// Calculate discounted fare
  double calculateDiscountedFare(double originalFare) {
    if (state.appliedDiscount == null) return originalFare;
    return originalFare - state.appliedDiscount!;
  }
}

// ==================== Provider ====================

final promoProvider = StateNotifierProvider<PromoNotifier, PromoState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PromoNotifier(apiService);
});

// Selector providers for specific state parts
final availablePromosProvider = Provider<List<PromoCode>>((ref) {
  return ref.watch(promoProvider).availablePromos;
});

final appliedPromoProvider = Provider<String?>((ref) {
  return ref.watch(promoProvider).appliedPromoCode;
});

final appliedDiscountProvider = Provider<double?>((ref) {
  return ref.watch(promoProvider).appliedDiscount;
});

final promoValidationProvider = Provider<PromoValidationResult?>((ref) {
  return ref.watch(promoProvider).lastValidation;
});
