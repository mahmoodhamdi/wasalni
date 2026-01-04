import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        children: [
          // Notifications Section
          _buildSectionHeader('الإشعارات'),
          SwitchListTile(
            secondary: const Icon(Icons.notifications_outlined),
            title: const Text('تفعيل الإشعارات'),
            subtitle: const Text('استقبال إشعارات الرحلات الجديدة'),
            value: _notificationsEnabled,
            onChanged: (value) {
              setState(() => _notificationsEnabled = value);
            },
          ),

          const Divider(),

          // Privacy Section
          _buildSectionHeader('الخصوصية والموقع'),
          SwitchListTile(
            secondary: const Icon(Icons.location_on_outlined),
            title: const Text('مشاركة الموقع'),
            subtitle: const Text('تفعيل تتبع الموقع أثناء العمل'),
            value: _locationEnabled,
            onChanged: (value) {
              setState(() => _locationEnabled = value);
            },
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
            title: const Text('عن وصّلني للسائقين'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () => _showAboutDialog(context),
          ),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('شروط الخدمة'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () => _showLegalPage(context, 'شروط الخدمة', _termsOfService),
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('سياسة الخصوصية'),
            trailing: const Icon(Icons.arrow_back_ios, size: 16),
            onTap: () => _showLegalPage(context, 'سياسة الخصوصية', _privacyPolicy),
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
          color: AppColors.primary,
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
      applicationName: 'وصّلني للسائقين',
      applicationVersion: '1.0.0',
      applicationIcon: Icon(
        Icons.local_taxi,
        size: 48.sp,
        color: AppColors.primary,
      ),
      children: [
        const Text(
          'تطبيق وصّلني للسائقين - خدمات النقل المحلية في منطقة الباجور والمناطق المحيطة.',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  void _showLegalPage(BuildContext context, String title, String content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: EdgeInsets.all(20.w),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 20.sp,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              SizedBox(height: 16.h),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Text(
                    content,
                    style: TextStyle(fontSize: 14.sp, height: 1.6),
                    textAlign: TextAlign.right,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static const String _termsOfService = '''
شروط استخدام تطبيق وصّلني للسائقين

1. القبول بالشروط
باستخدامك لتطبيق وصّلني للسائقين، فإنك توافق على الالتزام بهذه الشروط والأحكام.

2. متطلبات السائق
- يجب أن يكون عمرك 21 سنة أو أكثر
- رخصة قيادة سارية
- سجل جنائي نظيف
- تأمين على المركبة

3. المسؤوليات
- الالتزام بقوانين المرور
- معاملة الركاب باحترام
- الحفاظ على نظافة المركبة
- عدم التدخين أثناء الرحلات

4. الأرباح والعمولة
- تحصل على نسبة من كل رحلة
- الدفع أسبوعياً أو حسب الاتفاق
- العمولة تشمل جميع الرسوم

5. إنهاء الحساب
نحتفظ بحق إيقاف حسابك في حالة:
- انتهاك الشروط
- شكاوى متكررة من الركاب
- سلوك غير لائق

للاستفسارات: drivers@wasalni.app
''';

  static const String _privacyPolicy = '''
سياسة الخصوصية - وصّلني للسائقين

آخر تحديث: يناير 2026

1. المعلومات التي نجمعها
- معلومات الحساب (الاسم، رقم الهاتف، البريد)
- بيانات الموقع أثناء العمل
- معلومات المركبة والمستندات
- سجل الرحلات والأرباح

2. كيف نستخدم المعلومات
- لتقديم خدمة النقل
- لمطابقتك مع الركاب القريبين
- لحساب أرباحك
- للتواصل معك

3. مشاركة المعلومات
نشارك معلوماتك مع:
- الركاب (الاسم وصورة المركبة أثناء الرحلة)
- السلطات القانونية عند الطلب

4. أمن المعلومات
- نستخدم تشفير SSL لحماية بياناتك
- لا نبيع بياناتك لأطراف ثالثة

5. الموقع الجغرافي
- نستخدم موقعك لمطابقتك مع الركاب
- يتم تتبع الموقع أثناء وضع "متاح" فقط

وصّلني - شريكك في النجاح
''';
}
