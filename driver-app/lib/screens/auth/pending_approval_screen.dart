import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class PendingApprovalScreen extends ConsumerStatefulWidget {
  const PendingApprovalScreen({super.key});

  @override
  ConsumerState<PendingApprovalScreen> createState() => _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends ConsumerState<PendingApprovalScreen> {
  bool _isRefreshing = false;

  Future<void> _refreshStatus() async {
    setState(() => _isRefreshing = true);
    await ref.read(authProvider.notifier).checkAuthStatus();
    if (mounted) {
      setState(() => _isRefreshing = false);
      final newState = ref.read(authProvider);
      if (newState.isAuthenticated) {
        context.go('/home');
      }
    }
  }

  Future<void> _logout() async {
    await ref.read(authProvider.notifier).logout();
    if (mounted) {
      context.go('/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Status Icon
              _buildStatusIcon(authState.approvalStatus),
              SizedBox(height: 32.h),

              // Title
              Text(
                _getTitle(authState.approvalStatus),
                style: AppTextStyles.heading2,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 16.h),

              // Description
              Text(
                _getDescription(authState.approvalStatus, authState.rejectionReason),
                style: AppTextStyles.subtitle,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 48.h),

              // Action based on status
              if (authState.approvalStatus == DriverApprovalStatus.pending) ...[
                // Refresh button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _isRefreshing ? null : _refreshStatus,
                    icon: _isRefreshing
                        ? SizedBox(
                            width: 20.w,
                            height: 20.w,
                            child: const CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.refresh),
                    label: const Text('تحديث الحالة'),
                  ),
                ),
                SizedBox(height: 16.h),
                // Contact support
                TextButton(
                  onPressed: () {
                    // Open support chat or call
                  },
                  child: const Text('تواصل مع الدعم'),
                ),
              ] else if (authState.approvalStatus == DriverApprovalStatus.rejected) ...[
                // Reapply button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      context.go('/documents');
                    },
                    child: const Text('إعادة تقديم المستندات'),
                  ),
                ),
                SizedBox(height: 16.h),
                TextButton(
                  onPressed: () {
                    // Open support chat
                  },
                  child: const Text('تواصل مع الدعم'),
                ),
              ] else if (authState.approvalStatus == DriverApprovalStatus.suspended) ...[
                // Contact support for suspended accounts
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // Open support
                    },
                    child: const Text('تواصل مع الدعم'),
                  ),
                ),
              ],

              const Spacer(),

              // Logout button
              TextButton(
                onPressed: _logout,
                child: const Text('تسجيل الخروج'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIcon(DriverApprovalStatus? status) {
    IconData icon;
    Color color;

    switch (status) {
      case DriverApprovalStatus.pending:
        icon = Icons.hourglass_top;
        color = Colors.orange;
        break;
      case DriverApprovalStatus.rejected:
        icon = Icons.cancel;
        color = AppColors.error;
        break;
      case DriverApprovalStatus.suspended:
        icon = Icons.block;
        color = AppColors.error;
        break;
      default:
        icon = Icons.hourglass_top;
        color = Colors.orange;
    }

    return Container(
      width: 120.w,
      height: 120.w,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(
        icon,
        size: 60.sp,
        color: color,
      ),
    );
  }

  String _getTitle(DriverApprovalStatus? status) {
    switch (status) {
      case DriverApprovalStatus.pending:
        return 'جاري مراجعة طلبك';
      case DriverApprovalStatus.rejected:
        return 'تم رفض طلبك';
      case DriverApprovalStatus.suspended:
        return 'حسابك موقوف';
      default:
        return 'جاري مراجعة طلبك';
    }
  }

  String _getDescription(DriverApprovalStatus? status, String? reason) {
    switch (status) {
      case DriverApprovalStatus.pending:
        return 'نحن نراجع مستنداتك حالياً.\nسيتم إعلامك بالنتيجة خلال 24-48 ساعة.';
      case DriverApprovalStatus.rejected:
        return reason ?? 'لم تستوفِ مستنداتك المتطلبات.\nيمكنك إعادة التقديم بعد تصحيح المشكلة.';
      case DriverApprovalStatus.suspended:
        return 'تم إيقاف حسابك.\nيرجى التواصل مع الدعم لمعرفة التفاصيل.';
      default:
        return 'نحن نراجع طلبك.';
    }
  }
}
