import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../services/storage_service.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _locationEnabled = true;
  String _selectedLanguage = 'ar';

  @override
  void initState() {
    super.initState();
    _selectedLanguage = storageService.getLanguage();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإعدادات'),
      ),
      body: ListView(
        children: [
          // Notifications Section
          _buildSectionHeader('الإشعارات'),
          SwitchListTile(
            secondary: const Icon(Icons.notifications_outlined),
            title: const Text('تفعيل الإشعارات'),
            subtitle: const Text('استقبال إشعارات الرحلات والعروض'),
            value: _notificationsEnabled,
            onChanged: (value) {
              setState(() => _notificationsEnabled = value);
            },
          ),

          const Divider(),

          // Privacy Section
          _buildSectionHeader('الخصوصية والأمان'),
          SwitchListTile(
            secondary: const Icon(Icons.location_on_outlined),
            title: const Text('مشاركة الموقع'),
            subtitle: const Text('السماح بتتبع موقعك أثناء الرحلة'),
            value: _locationEnabled,
            onChanged: (value) {
              setState(() => _locationEnabled = value);
            },
          ),
          ListTile(
            leading: const Icon(Icons.security_outlined),
            title: const Text('إعدادات الأمان'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () => context.push('/safety-settings'),
          ),
          ListTile(
            leading: const Icon(Icons.contact_emergency_outlined),
            title: const Text('جهات الطوارئ'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () => context.push('/emergency-contacts'),
          ),

          const Divider(),

          // Language Section
          _buildSectionHeader('اللغة'),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('اللغة'),
            subtitle: Text(_selectedLanguage == 'ar' ? 'العربية' : 'English'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: _showLanguageDialog,
          ),

          const Divider(),

          // About Section
          _buildSectionHeader('حول التطبيق'),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('عن وصّلني'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () => _showAboutDialog(context),
          ),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('شروط الخدمة'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () {
              // TODO: Navigate to terms
            },
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('سياسة الخصوصية'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () {
              // TODO: Navigate to privacy policy
            },
          ),

          SizedBox(height: 24.h),

          // Version
          Center(
            child: Text(
              'الإصدار 1.0.0',
              style: TextStyle(
                fontSize: 12.sp,
                color: Colors.grey[500],
              ),
            ),
          ),
          SizedBox(height: 24.h),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 8.h),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14.sp,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).primaryColor,
        ),
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('اختر اللغة'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('العربية'),
              value: 'ar',
              groupValue: _selectedLanguage,
              onChanged: (value) {
                setState(() => _selectedLanguage = value!);
                storageService.setLanguage(value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('English'),
              value: 'en',
              groupValue: _selectedLanguage,
              onChanged: (value) {
                setState(() => _selectedLanguage = value!);
                storageService.setLanguage(value!);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'وصّلني',
      applicationVersion: '1.0.0',
      applicationIcon: Icon(
        Icons.local_taxi,
        size: 48.sp,
        color: Theme.of(context).primaryColor,
      ),
      children: [
        const Text(
          'تطبيق وصّلني لخدمات النقل المحلية في منطقة الباجور والمناطق المحيطة.',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
