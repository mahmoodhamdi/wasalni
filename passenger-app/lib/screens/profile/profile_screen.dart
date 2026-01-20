import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
import '../../services/storage_service.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userName = storageService.getUserName() ?? 'مستخدم';
    final userPhone = storageService.getUserPhone() ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('الملف الشخصي'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/edit-profile'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Column(
          children: [
            // Profile Avatar
            CircleAvatar(
              radius: 50.r,
              backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.1),
              child: Text(
                userName.isNotEmpty ? userName[0].toUpperCase() : 'م',
                style: TextStyle(
                  fontSize: 32.sp,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ),
            SizedBox(height: 16.h),

            // User Name
            Text(
              userName,
              style: TextStyle(
                fontSize: 22.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 4.h),

            // User Phone
            Text(
              userPhone,
              style: TextStyle(
                fontSize: 14.sp,
                color: Colors.grey[600],
              ),
              textDirection: TextDirection.ltr,
            ),
            SizedBox(height: 32.h),

            // Menu Items
            _buildMenuItem(
              context,
              icon: Icons.history,
              title: 'سجل الرحلات',
              onTap: () => context.push('/history'),
            ),
            _buildMenuItem(
              context,
              icon: Icons.schedule,
              title: 'الرحلات المجدولة',
              onTap: () => context.push('/scheduled-trips'),
            ),
            _buildMenuItem(
              context,
              icon: Icons.local_offer_outlined,
              title: 'الأكواد الترويجية',
              onTap: () => context.push('/promos'),
            ),
            _buildMenuItem(
              context,
              icon: Icons.security_outlined,
              title: 'إعدادات الأمان',
              onTap: () => context.push('/safety-settings'),
            ),
            _buildMenuItem(
              context,
              icon: Icons.settings_outlined,
              title: 'الإعدادات',
              onTap: () => context.push('/settings'),
            ),
            _buildMenuItem(
              context,
              icon: Icons.help_outline,
              title: 'المساعدة والدعم',
              onTap: () => context.push('/help'),
            ),
            SizedBox(height: 24.h),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showLogoutConfirmation(context, ref),
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text(
                  'تسجيل الخروج',
                  style: TextStyle(color: Colors.red),
                ),
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 12.h),
                  side: const BorderSide(color: Colors.red),
                ),
              ),
            ),
            SizedBox(height: 16.h),

            // App Version
            Text(
              'الإصدار 1.0.0',
              style: TextStyle(
                fontSize: 12.sp,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: EdgeInsets.only(bottom: 8.h),
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).primaryColor),
        title: Text(title),
        trailing: const Icon(Icons.arrow_back_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  void _showLogoutConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/welcome');
              }
            },
            child: const Text(
              'تسجيل الخروج',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}
