import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('المساعدة والدعم'),
      ),
      body: ListView(
        padding: EdgeInsets.all(16.w),
        children: [
          // Contact Options
          _buildSectionHeader(context, 'تواصل معنا'),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.phone, color: Colors.green),
                  title: const Text('اتصل بنا'),
                  subtitle: const Text('للمساعدة الفورية'),
                  trailing: const Icon(Icons.arrow_back_ios, size: 16),
                  onTap: () => _launchPhone('01234567890'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.chat, color: Colors.blue),
                  title: const Text('واتساب'),
                  subtitle: const Text('تحدث مع فريق الدعم'),
                  trailing: const Icon(Icons.arrow_back_ios, size: 16),
                  onTap: () => _launchWhatsApp('01234567890'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.email, color: Colors.orange),
                  title: const Text('البريد الإلكتروني'),
                  subtitle: const Text('support@wasalni.app'),
                  trailing: const Icon(Icons.arrow_back_ios, size: 16),
                  onTap: () => _launchEmail('support@wasalni.app'),
                ),
              ],
            ),
          ),
          SizedBox(height: 24.h),

          // FAQ Section
          _buildSectionHeader(context, 'الأسئلة الشائعة'),
          _buildFAQItem(
            context,
            question: 'كيف أطلب رحلة؟',
            answer:
                'اختر موقع الانطلاق والوجهة من الخريطة، ثم اختر نوع السيارة واضغط على طلب رحلة.',
          ),
          _buildFAQItem(
            context,
            question: 'كيف أدفع؟',
            answer:
                'حالياً الدفع نقداً للسائق عند نهاية الرحلة. قريباً سيتوفر الدفع الإلكتروني.',
          ),
          _buildFAQItem(
            context,
            question: 'كيف ألغي رحلة؟',
            answer:
                'يمكنك إلغاء الرحلة قبل وصول السائق بالضغط على زر إلغاء في شاشة الرحلة.',
          ),
          _buildFAQItem(
            context,
            question: 'ماذا لو نسيت شيئاً في السيارة؟',
            answer:
                'تواصل مع فريق الدعم فوراً وسنساعدك في التواصل مع السائق لاستعادة ممتلكاتك.',
          ),
          _buildFAQItem(
            context,
            question: 'كيف أبلغ عن مشكلة؟',
            answer:
                'اذهب إلى سجل الرحلات، اختر الرحلة، ثم اضغط على "إبلاغ عن مشكلة".',
          ),
          SizedBox(height: 24.h),

          // Emergency Section
          _buildSectionHeader(context, 'الطوارئ'),
          Card(
            color: Colors.red.shade50,
            child: ListTile(
              leading: Icon(Icons.emergency, color: Colors.red, size: 32.sp),
              title: const Text(
                'في حالة الطوارئ',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: const Text('اضغط لطلب المساعدة الفورية'),
              trailing: const Icon(Icons.arrow_back_ios, size: 16),
              onTap: () => _launchPhone('122'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 16.sp,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).primaryColor,
        ),
      ),
    );
  }

  Widget _buildFAQItem(
    BuildContext context, {
    required String question,
    required String answer,
  }) {
    return Card(
      margin: EdgeInsets.only(bottom: 8.h),
      child: ExpansionTile(
        title: Text(
          question,
          style: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 16.h),
            child: Text(
              answer,
              style: TextStyle(
                fontSize: 14.sp,
                color: Colors.grey[700],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _launchPhone(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _launchWhatsApp(String phone) async {
    final uri = Uri.parse('https://wa.me/2$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _launchEmail(String email) async {
    final uri = Uri.parse('mailto:$email?subject=مساعدة تطبيق وصّلني');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}
