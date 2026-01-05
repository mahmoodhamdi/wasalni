import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../config/theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.w),
          child: Column(
            children: [
              const Spacer(),
              // Logo
              Container(
                width: 100.w,
                height: 100.w,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(25.r),
                ),
                child: Icon(
                  Icons.local_taxi,
                  size: 50.sp,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 24.h),
              Text(
                'مرحباً بك في وصّلني',
                style: AppTextStyles.heading2,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 12.h),
              Text(
                'أفضل تطبيق توصيل في الباجور\nتوصيلتك علينا',
                style: AppTextStyles.subtitle,
                textAlign: TextAlign.center,
              ),
              const Spacer(flex: 2),
              // Features
              _buildFeature(
                icon: Icons.speed,
                title: 'سريع وموثوق',
                subtitle: 'اطلب سيارة في ثواني',
              ),
              SizedBox(height: 16.h),
              _buildFeature(
                icon: Icons.attach_money,
                title: 'أسعار ثابتة',
                subtitle: 'اعرف السعر قبل الحجز',
              ),
              SizedBox(height: 16.h),
              _buildFeature(
                icon: Icons.security,
                title: 'آمن ومضمون',
                subtitle: 'شارك رحلتك مع عائلتك',
              ),
              const Spacer(flex: 2),
              // Get Started Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.push('/login'),
                  child: Text(
                    'ابدأ الآن',
                    style: AppTextStyles.button.copyWith(color: Colors.white),
                  ),
                ),
              ),
              SizedBox(height: 12.h),
              TextButton(
                onPressed: () {
                  // TODO: Guest mode or help
                },
                child: const Text('تصفح كضيف'),
              ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeature({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          width: 48.w,
          height: 48.w,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12.r),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        SizedBox(width: 16.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600)),
              Text(subtitle, style: AppTextStyles.caption),
            ],
          ),
        ),
      ],
    );
  }
}
