import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  final String phone;

  const RegisterScreen({super.key, required this.phone});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  String _selectedGender = 'male';
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  String? _validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'يرجى إدخال الاسم';
    }
    if (value.trim().length < 2) {
      return 'الاسم قصير جداً';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Email is optional
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'البريد الإلكتروني غير صحيح';
    }
    return null;
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final success = await ref.read(authProvider.notifier).register(
            phone: widget.phone,
            name: _nameController.text.trim(),
            email: _emailController.text.isNotEmpty
                ? _emailController.text.trim()
                : null,
            gender: _selectedGender,
          );

      if (mounted) {
        if (success) {
          context.go('/home');
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage ?? 'فشل إنشاء الحساب'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('إنشاء حساب'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(24.w),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أكمل بياناتك',
                  style: AppTextStyles.heading2,
                ),
                SizedBox(height: 8.h),
                Text(
                  'أدخل بياناتك لإنشاء حسابك',
                  style: AppTextStyles.subtitle,
                ),
                SizedBox(height: 32.h),

                // Profile Avatar
                Center(
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 50.r,
                        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                        child: Icon(
                          Icons.person,
                          size: 50.sp,
                          color: AppColors.primary,
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: EdgeInsets.all(8.w),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.camera_alt,
                            size: 20.sp,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 32.h),

                // Name Field
                Text('الاسم الكامل', style: AppTextStyles.body),
                SizedBox(height: 8.h),
                TextFormField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    hintText: 'أدخل اسمك الكامل',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: _validateName,
                ),
                SizedBox(height: 20.h),

                // Email Field (Optional)
                Text('البريد الإلكتروني (اختياري)', style: AppTextStyles.body),
                SizedBox(height: 8.h),
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(
                      hintText: 'example@email.com',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: _validateEmail,
                  ),
                ),
                SizedBox(height: 20.h),

                // Phone (Read-only)
                Text('رقم الهاتف', style: AppTextStyles.body),
                SizedBox(height: 8.h),
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: TextFormField(
                    initialValue: widget.phone,
                    readOnly: true,
                    textDirection: TextDirection.ltr,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.phone_outlined),
                      filled: true,
                      fillColor: Colors.grey.shade200,
                    ),
                  ),
                ),
                SizedBox(height: 20.h),

                // Gender Selection
                Text('الجنس', style: AppTextStyles.body),
                SizedBox(height: 8.h),
                Row(
                  children: [
                    Expanded(
                      child: _GenderOption(
                        label: 'ذكر',
                        icon: Icons.male,
                        isSelected: _selectedGender == 'male',
                        onTap: () => setState(() => _selectedGender = 'male'),
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: _GenderOption(
                        label: 'أنثى',
                        icon: Icons.female,
                        isSelected: _selectedGender == 'female',
                        onTap: () => setState(() => _selectedGender = 'female'),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 40.h),

                // Register Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _register,
                    child: _isLoading
                        ? SizedBox(
                            width: 24.w,
                            height: 24.w,
                            child: const CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            'إنشاء حساب',
                            style: AppTextStyles.button.copyWith(
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
                SizedBox(height: 16.h),

                // Terms
                Center(
                  child: Text(
                    'بإنشاء حساب، أنت توافق على شروط الخدمة وسياسة الخصوصية',
                    style: AppTextStyles.caption,
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GenderOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _GenderOption({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 16.h),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32.sp,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
            ),
            SizedBox(height: 8.h),
            Text(
              label,
              style: AppTextStyles.body.copyWith(
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
