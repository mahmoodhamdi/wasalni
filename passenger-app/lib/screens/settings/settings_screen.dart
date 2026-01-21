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
          color: Theme.of(context).primaryColor,
        ),
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('اختر اللغة'),
        content: RadioGroup<String>(
          groupValue: _selectedLanguage,
          onChanged: (value) {
            if (value != null) {
              setState(() => _selectedLanguage = value);
              storageService.setLanguage(value);
              Navigator.pop(dialogContext);
            }
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              RadioListTile<String>(
                title: Text('العربية'),
                value: 'ar',
              ),
              RadioListTile<String>(
                title: Text('English'),
                value: 'en',
              ),
            ],
          ),
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
شروط استخدام تطبيق وصّلني

1. القبول بالشروط
باستخدامك لتطبيق وصّلني، فإنك توافق على الالتزام بهذه الشروط والأحكام.

2. الخدمة
وصّلني هو تطبيق لخدمات النقل المحلية يربط بين الركاب والسائقين في منطقة الباجور والمناطق المحيطة.

3. التسجيل
- يجب أن يكون عمرك 18 سنة أو أكثر
- يجب تقديم معلومات صحيحة ودقيقة
- أنت مسؤول عن الحفاظ على سرية حسابك

4. الدفع
- يتم الدفع نقداً للسائق
- الأسعار تشمل جميع الرسوم والضرائب المطبقة

5. السلوك
- يجب التعامل باحترام مع السائقين
- يُحظر أي سلوك مسيء أو غير لائق
- يُحظر حمل مواد ممنوعة أو خطرة

6. المسؤولية
وصّلني ليست مسؤولة عن:
- التأخير بسبب ظروف خارجة عن السيطرة
- فقدان أو تلف الممتلكات الشخصية
- أي إصابات ناتجة عن حوادث الطرق

7. إلغاء الرحلات
- يمكن إلغاء الرحلة قبل وصول السائق
- قد يتم تطبيق رسوم إلغاء في بعض الحالات

8. التعديلات
نحتفظ بحق تعديل هذه الشروط في أي وقت.

للاستفسارات: support@wasalni.app
''';

  static const String _privacyPolicy = '''
سياسة الخصوصية - وصّلني

آخر تحديث: يناير 2026

1. المعلومات التي نجمعها
- معلومات الحساب (الاسم، رقم الهاتف)
- بيانات الموقع أثناء استخدام التطبيق
- سجل الرحلات

2. كيف نستخدم المعلومات
- لتقديم خدمة النقل
- لتحسين تجربة المستخدم
- للتواصل معك بشأن رحلاتك
- للأغراض الأمنية

3. مشاركة المعلومات
نشارك معلوماتك مع:
- السائقين (الاسم والموقع فقط أثناء الرحلة)
- السلطات القانونية عند الطلب

4. أمن المعلومات
- نستخدم تشفير SSL لحماية بياناتك
- نخزن البيانات بشكل آمن
- لا نبيع بياناتك لأطراف ثالثة

5. الموقع الجغرافي
- نستخدم موقعك لتحديد نقطة الانطلاق
- يمكنك إيقاف مشاركة الموقع من الإعدادات

6. حقوقك
- طلب الوصول إلى بياناتك
- طلب تصحيح البيانات
- طلب حذف حسابك

7. الاتصال
لأي استفسارات حول الخصوصية:
privacy@wasalni.app

وصّلني - نقلك بأمان
''';
}
