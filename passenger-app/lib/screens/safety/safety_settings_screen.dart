import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../providers/safety_provider.dart';

// App Colors
class AppColors {
  static const Color primary = Color(0xFF1E88E5);
}

class SafetySettingsScreen extends ConsumerStatefulWidget {
  const SafetySettingsScreen({super.key});

  @override
  ConsumerState<SafetySettingsScreen> createState() => _SafetySettingsScreenState();
}

class _SafetySettingsScreenState extends ConsumerState<SafetySettingsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(safetyProvider.notifier).loadEmergencyContacts();
      ref.read(safetyProvider.notifier).loadSafetyPreferences();
    });
  }

  Future<void> _updatePreference(SafetyPreferences Function(SafetyPreferences) update) async {
    final current = ref.read(safetyProvider).preferences;
    final updated = update(current);
    await ref.read(safetyProvider.notifier).updateSafetyPreferences(updated);
  }

  @override
  Widget build(BuildContext context) {
    final safetyState = ref.watch(safetyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('إعدادات الأمان'),
        centerTitle: true,
      ),
      body: safetyState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: EdgeInsets.all(16.w),
              children: [
                // Emergency Contacts Section
                _SectionHeader(
                  icon: Icons.contacts_outlined,
                  title: 'جهات الاتصال الطارئة',
                  subtitle: '${safetyState.contacts.length}/5 جهات اتصال',
                ),
                Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppColors.primary.withOpacity(0.1),
                      child: Icon(
                        Icons.person_add_outlined,
                        color: AppColors.primary,
                      ),
                    ),
                    title: const Text('إدارة جهات الاتصال'),
                    subtitle: const Text('أضف أو عدل جهات الاتصال الطارئة'),
                    trailing: const Icon(Icons.chevron_left),
                    onTap: () => context.push('/emergency-contacts'),
                  ),
                ),
                SizedBox(height: 24.h),

                // Auto Share Section
                _SectionHeader(
                  icon: Icons.share_outlined,
                  title: 'مشاركة الرحلة التلقائية',
                  subtitle: 'شارك رحلاتك مع جهات الاتصال',
                ),
                Card(
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: safetyState.preferences.autoShareTrips,
                        onChanged: (value) {
                          _updatePreference(
                            (p) => p.copyWith(autoShareTrips: value),
                          );
                        },
                        title: const Text('مشاركة الرحلات تلقائياً'),
                        subtitle: const Text('إرسال رابط تتبع لجهات الاتصال عند بدء الرحلة'),
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        value: safetyState.preferences.sendETAUpdates,
                        onChanged: (value) {
                          _updatePreference(
                            (p) => p.copyWith(sendETAUpdates: value),
                          );
                        },
                        title: const Text('إرسال تحديثات الوصول'),
                        subtitle: const Text('إشعار جهات الاتصال بوقت الوصول المتوقع'),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // SOS Settings
                _SectionHeader(
                  icon: Icons.sos,
                  title: 'إعدادات الطوارئ',
                  subtitle: 'إعدادات زر SOS',
                ),
                Card(
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: safetyState.preferences.sosGestureEnabled,
                        onChanged: (value) {
                          _updatePreference(
                            (p) => p.copyWith(sosGestureEnabled: value),
                          );
                        },
                        title: const Text('تفعيل إيماءة SOS'),
                        subtitle: const Text('اضغط 5 مرات على زر الطاقة لتفعيل SOS'),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.info_outline, color: Colors.orange),
                        title: const Text('عند تفعيل SOS'),
                        subtitle: const Text(
                          'سيتم إرسال موقعك وتفاصيل الرحلة لجهات الاتصال الطارئة وفريق الدعم',
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // Night Mode Alerts
                _SectionHeader(
                  icon: Icons.nightlight_outlined,
                  title: 'الرحلات الليلية',
                  subtitle: 'إعدادات الأمان الإضافية ليلاً',
                ),
                Card(
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: safetyState.preferences.nightModeAlerts,
                        onChanged: (value) {
                          _updatePreference(
                            (p) => p.copyWith(nightModeAlerts: value),
                          );
                        },
                        title: const Text('تنبيهات الرحلات الليلية'),
                        subtitle: const Text('تفعيل تنبيهات إضافية بين 10م و 6ص'),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // Trip Recording (optional feature)
                _SectionHeader(
                  icon: Icons.fiber_manual_record,
                  title: 'تسجيل الرحلات',
                  subtitle: 'تسجيل صوتي للرحلات',
                ),
                Card(
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: safetyState.preferences.recordTrips,
                        onChanged: (value) {
                          _updatePreference(
                            (p) => p.copyWith(recordTrips: value),
                          );
                        },
                        title: const Text('تسجيل الرحلات'),
                        subtitle: const Text('تسجيل صوتي تلقائي أثناء الرحلة (قريباً)'),
                        secondary: Container(
                          padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade100,
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                          child: Text(
                            'قريباً',
                            style: TextStyle(
                              fontSize: 10.sp,
                              color: Colors.blue.shade800,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // Safety Tips
                Card(
                  color: AppColors.primary.withOpacity(0.05),
                  child: Padding(
                    padding: EdgeInsets.all(16.w),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.lightbulb_outline,
                              color: AppColors.primary,
                            ),
                            SizedBox(width: 8.w),
                            Text(
                              'نصائح الأمان',
                              style: TextStyle(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 12.h),
                        _SafetyTip(
                          icon: Icons.car_rental,
                          text: 'تأكد من مطابقة رقم لوحة السيارة قبل الركوب',
                        ),
                        SizedBox(height: 8.h),
                        _SafetyTip(
                          icon: Icons.share_location,
                          text: 'شارك تفاصيل رحلتك مع شخص تثق به',
                        ),
                        SizedBox(height: 8.h),
                        _SafetyTip(
                          icon: Icons.airline_seat_recline_normal,
                          text: 'اجلس في المقعد الخلفي للمزيد من الأمان',
                        ),
                        SizedBox(height: 8.h),
                        _SafetyTip(
                          icon: Icons.sos,
                          text: 'في حالة الطوارئ اضغط على زر SOS',
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 32.h),
              ],
            ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Row(
        children: [
          Icon(icon, size: 24.sp, color: AppColors.primary),
          SizedBox(width: 12.w),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12.sp,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SafetyTip extends StatelessWidget {
  final IconData icon;
  final String text;

  const _SafetyTip({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18.sp, color: Colors.grey[600]),
        SizedBox(width: 8.w),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13.sp,
              color: Colors.grey[700],
            ),
          ),
        ),
      ],
    );
  }
}
