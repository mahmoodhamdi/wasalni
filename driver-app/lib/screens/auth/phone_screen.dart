import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});

  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  String? _validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'يرجى إدخال رقم الهاتف';
    }
    final cleaned = value.replaceAll(RegExp(r'[^\d]'), '');
    if (cleaned.length < 10 || cleaned.length > 11) {
      return 'رقم الهاتف غير صحيح';
    }
    if (!cleaned.startsWith('01')) {
      return 'يجب أن يبدأ الرقم بـ 01';
    }
    return null;
  }

  Future<void> _sendOTP() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      String phone = _phoneController.text.replaceAll(RegExp(r'[^\d]'), '');
      if (!phone.startsWith('+')) {
        phone = '+2$phone';
      }

      final success = await ref.read(authProvider.notifier).sendOTP(phone);

      if (mounted) {
        if (success) {
          context.push('/otp', extra: phone);
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage ?? 'فشل إرسال رمز التحقق'),
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
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.w),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أدخل رقم هاتفك',
                  style: AppTextStyles.heading2,
                ),
                SizedBox(height: 8.h),
                Text(
                  'سنرسل لك رمز تحقق للتأكد من هويتك',
                  style: AppTextStyles.subtitle,
                ),
                SizedBox(height: 32.h),
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    textDirection: TextDirection.ltr,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(11),
                    ],
                    decoration: InputDecoration(
                      hintText: '01XXXXXXXXX',
                      prefixIcon: Container(
                        padding: EdgeInsets.symmetric(horizontal: 16.w),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('\u{1F1EA}\u{1F1EC}', style: TextStyle(fontSize: 24.sp)),
                            SizedBox(width: 8.w),
                            Text('+2', style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600)),
                            SizedBox(width: 8.w),
                            Container(width: 1, height: 24.h, color: AppColors.textHint),
                          ],
                        ),
                      ),
                    ),
                    validator: _validatePhone,
                  ),
                ),
                SizedBox(height: 16.h),
                Text(
                  'بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية',
                  style: AppTextStyles.caption,
                  textAlign: TextAlign.center,
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _sendOTP,
                    child: _isLoading
                        ? SizedBox(
                            width: 24.w,
                            height: 24.w,
                            child: const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text('متابعة', style: AppTextStyles.button.copyWith(color: Colors.white)),
                  ),
                ),
                SizedBox(height: 24.h),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
