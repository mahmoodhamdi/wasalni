import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/promo_provider.dart';
import '../../config/theme.dart';

// ignore_for_file: deprecated_member_use

class PromosScreen extends ConsumerStatefulWidget {
  const PromosScreen({super.key});

  @override
  ConsumerState<PromosScreen> createState() => _PromosScreenState();
}

class _PromosScreenState extends ConsumerState<PromosScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _promoCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  void _loadData() {
    Future.microtask(() {
      ref.read(promoProvider.notifier).loadAvailablePromos();
      ref.read(promoProvider.notifier).loadUsageHistory(refresh: true);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _promoCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(promoProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Promo Codes'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Available'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Promo code input
          _buildPromoCodeInput(),

          // Tab views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAvailablePromos(state),
                _buildUsageHistory(state),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoCodeInput() {
    final state = ref.watch(promoProvider);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Have a promo code?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _promoCodeController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'Enter promo code',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    prefixIcon: const Icon(Icons.local_offer_outlined),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: state.isValidating ? null : _validatePromo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
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
          if (state.lastValidation != null) ...[
            const SizedBox(height: 12),
            _buildValidationResult(state.lastValidation!),
          ],
        ],
      ),
    );
  }

  Widget _buildValidationResult(PromoValidationResult result) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: result.valid
            ? Colors.green.withOpacity(0.1)
            : Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: result.valid ? Colors.green : Colors.red,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            result.valid ? Icons.check_circle : Icons.error,
            color: result.valid ? Colors.green : Colors.red,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              result.valid
                  ? 'Promo code applied! Save ${result.discountType == 'percentage' ? '${result.discount?.toInt()}%' : '${result.discount?.toStringAsFixed(0)} EGP'}'
                  : result.message ?? 'Invalid promo code',
              style: TextStyle(
                color: result.valid ? Colors.green.shade700 : Colors.red.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (result.valid)
            TextButton(
              onPressed: () {
                ref.read(promoProvider.notifier).clearValidation();
              },
              child: const Text('Clear'),
            ),
        ],
      ),
    );
  }

  void _validatePromo() async {
    final code = _promoCodeController.text.trim();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a promo code')),
      );
      return;
    }

    // For validation demo, use placeholder fare/rideType
    // In real use, this would come from the current booking
    final valid = await ref.read(promoProvider.notifier).validatePromoCode(
      code: code,
      fare: 50.0, // Placeholder
      rideType: 'economy', // Placeholder
    );

    if (valid) {
      _promoCodeController.clear();
    }
  }

  Widget _buildAvailablePromos(PromoState state) {
    if (state.isLoading && state.availablePromos.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.availablePromos.isEmpty) {
      return _buildEmptyState(
        icon: Icons.local_offer_outlined,
        title: 'No Promos Available',
        subtitle: 'Check back later for new offers!',
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(promoProvider.notifier).loadAvailablePromos();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.availablePromos.length,
        itemBuilder: (context, index) {
          return _buildPromoCard(state.availablePromos[index]);
        },
      ),
    );
  }

  Widget _buildPromoCard(PromoCode promo) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: promo.isExpiringSoon
              ? Colors.orange.withOpacity(0.5)
              : Colors.grey.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with discount
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary,
                  AppColors.primary.withOpacity(0.8),
                ],
              ),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(11),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.local_offer,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        promo.discountText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        promo.type == 'percentage' ? 'Off your ride' : 'Discount',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                if (promo.isExpiringSoon)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${promo.daysUntilExpiry}d left',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Promo code
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.grey.shade300,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              promo.code,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: promo.code));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Promo code copied!'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                      icon: const Icon(Icons.copy),
                      tooltip: 'Copy code',
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Conditions
                if (promo.minFare != null || promo.maxDiscount != null || promo.rideTypes != null)
                  Column(
                    children: [
                      const Divider(),
                      const SizedBox(height: 8),
                      if (promo.minFare != null)
                        _buildConditionRow(
                          Icons.attach_money,
                          'Min fare: ${promo.minFare!.toStringAsFixed(0)} EGP',
                        ),
                      if (promo.maxDiscount != null)
                        _buildConditionRow(
                          Icons.trending_down,
                          'Max discount: ${promo.maxDiscount!.toStringAsFixed(0)} EGP',
                        ),
                      if (promo.rideTypes != null && promo.rideTypes!.isNotEmpty)
                        _buildConditionRow(
                          Icons.directions_car,
                          'Valid for: ${promo.rideTypes!.join(', ')}',
                        ),
                    ],
                  ),

                const SizedBox(height: 8),

                // Expiry
                Row(
                  children: [
                    Icon(
                      Icons.schedule,
                      size: 14,
                      color: Colors.grey.shade600,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Valid until ${DateFormat('MMM d, yyyy').format(promo.validUntil)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConditionRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUsageHistory(PromoState state) {
    if (state.isLoading && state.usageHistory.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.usageHistory.isEmpty) {
      return _buildEmptyState(
        icon: Icons.history,
        title: 'No Usage History',
        subtitle: 'Your promo code usage will appear here',
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 100 &&
            state.hasMore &&
            !state.isLoading) {
          ref.read(promoProvider.notifier).loadMoreHistory();
        }
        return false;
      },
      child: RefreshIndicator(
        onRefresh: () async {
          await ref.read(promoProvider.notifier).loadUsageHistory(refresh: true);
        },
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: state.usageHistory.length + (state.hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == state.usageHistory.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            return _buildHistoryItem(state.usageHistory[index]);
          },
        ),
      ),
    );
  }

  Widget _buildHistoryItem(PromoUsage usage) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.local_offer,
              color: AppColors.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  usage.promoCode,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('MMM d, yyyy • h:mm a').format(usage.usedAt),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '-${usage.discountAmount.toStringAsFixed(0)} EGP',
              style: const TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 48,
                color: Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
