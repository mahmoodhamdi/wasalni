import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/promo_provider.dart';
import '../config/theme.dart';

// ignore_for_file: deprecated_member_use

class PromoCodeInput extends ConsumerStatefulWidget {
  final double fare;
  final String rideType;
  final Function(String code, double discount)? onPromoApplied;
  final VoidCallback? onPromoRemoved;

  const PromoCodeInput({
    super.key,
    required this.fare,
    required this.rideType,
    this.onPromoApplied,
    this.onPromoRemoved,
  });

  @override
  ConsumerState<PromoCodeInput> createState() => _PromoCodeInputState();
}

class _PromoCodeInputState extends ConsumerState<PromoCodeInput> {
  final _controller = TextEditingController();
  bool _isExpanded = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(promoProvider);
    final hasAppliedPromo = state.appliedPromoCode != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header / Toggle
        InkWell(
          onTap: hasAppliedPromo ? null : () {
            setState(() => _isExpanded = !_isExpanded);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: hasAppliedPromo
                  ? Colors.green.withOpacity(0.1)
                  : Colors.grey.withOpacity(0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: hasAppliedPromo
                    ? Colors.green.withOpacity(0.3)
                    : Colors.grey.withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  hasAppliedPromo ? Icons.check_circle : Icons.local_offer_outlined,
                  color: hasAppliedPromo ? Colors.green : AppColors.primary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: hasAppliedPromo
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              state.appliedPromoCode!,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Colors.green,
                              ),
                            ),
                            Text(
                              'Saving ${state.appliedDiscount!.toStringAsFixed(0)} EGP',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.green.shade700,
                              ),
                            ),
                          ],
                        )
                      : Text(
                          'Add promo code',
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                ),
                if (hasAppliedPromo)
                  IconButton(
                    onPressed: () {
                      ref.read(promoProvider.notifier).removeAppliedPromo();
                      widget.onPromoRemoved?.call();
                    },
                    icon: const Icon(Icons.close, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  )
                else
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey,
                  ),
              ],
            ),
          ),
        ),

        // Input field (when expanded)
        if (_isExpanded && !hasAppliedPromo)
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(top: 8),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        textCapitalization: TextCapitalization.characters,
                        decoration: InputDecoration(
                          hintText: 'Enter code',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 12,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        onPressed: state.isValidating ? null : _applyPromo,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: state.isValidating
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Apply'),
                      ),
                    ),
                  ],
                ),

                // Validation result
                if (state.lastValidation != null && !state.lastValidation!.valid)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            state.lastValidation!.message ?? 'Invalid promo code',
                            style: TextStyle(
                              color: Colors.red.shade700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }

  void _applyPromo() async {
    final code = _controller.text.trim();
    if (code.isEmpty) return;

    final valid = await ref.read(promoProvider.notifier).validatePromoCode(
      code: code,
      fare: widget.fare,
      rideType: widget.rideType,
    );

    if (valid) {
      final validation = ref.read(promoProvider).lastValidation!;
      ref.read(promoProvider.notifier).applyPromo(
        code.toUpperCase(),
        validation.discount ?? 0,
      );

      widget.onPromoApplied?.call(code.toUpperCase(), validation.discount ?? 0);
      _controller.clear();
      setState(() => _isExpanded = false);
    }
  }
}

/// Compact promo display for booking summary
class AppliedPromoDisplay extends ConsumerWidget {
  final VoidCallback? onRemove;

  const AppliedPromoDisplay({super.key, this.onRemove});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(promoProvider);

    if (state.appliedPromoCode == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.green.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_offer, color: Colors.green, size: 16),
          const SizedBox(width: 6),
          Text(
            state.appliedPromoCode!,
            style: const TextStyle(
              color: Colors.green,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '(-${state.appliedDiscount!.toStringAsFixed(0)} EGP)',
            style: TextStyle(
              color: Colors.green.shade700,
              fontSize: 12,
            ),
          ),
          if (onRemove != null) ...[
            const SizedBox(width: 8),
            InkWell(
              onTap: () {
                ref.read(promoProvider.notifier).removeAppliedPromo();
                onRemove?.call();
              },
              child: const Icon(Icons.close, size: 16, color: Colors.green),
            ),
          ],
        ],
      ),
    );
  }
}
