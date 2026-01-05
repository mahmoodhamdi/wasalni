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
                  Icons.drive_eta,
                  size: 50.sp,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 24.h),
              Text(
                'انضم إلى فريق وصّلني',
                style: AppTextStyles.heading2,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 12.h),
              Text(
                'كن جزءاً من أفضل فريق توصيل في الباجور\nاكسب دخلاً إضافياً بجدولك الخاص',
                style: AppTextStyles.subtitle,
                textAlign: TextAlign.center,
              ),
              const Spacer(flex: 2),
              // Features
              _buildFeature(
                icon: Icons.attach_money,
                title: 'دخل مرن',
                subtitle: 'اكسب حسب وقتك',
              ),
              SizedBox(height: 16.h),
              _buildFeature(
                icon: Icons.access_time,
                title: 'حريتك',
                subtitle: 'اعمل وقتما تريد',
              ),
              SizedBox(height: 16.h),
              _buildFeature(
                icon: Icons.support_agent,
                title: 'دعم مستمر',
                subtitle: 'نحن معك دائماً',
              ),
              const Spacer(flex: 2),
              // Get Started Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.push('/login'),
                  child: Text(
                    'ابدأ التسجيل',
                    style: AppTextStyles.button.copyWith(color: Colors.white),
                  ),
                ),
              ),
              SizedBox(height: 12.h),
              TextButton(
                onPressed: () => context.push('/login'),
                child: const Text('لديك حساب؟ سجل دخول'),
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
