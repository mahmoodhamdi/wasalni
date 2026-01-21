import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../config/theme.dart';
import '../../config/app_config.dart';
import '../../providers/auth_provider.dart';

class OTPScreen extends ConsumerStatefulWidget {
  final String email;
  final String purpose; // 'login', 'registration', 'password_reset'

  const OTPScreen({super.key, required this.email, this.purpose = 'login'});

  @override
  ConsumerState<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends ConsumerState<OTPScreen> {
  final List<TextEditingController> _controllers = List.generate(
    AppConfig.otpLength,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(
    AppConfig.otpLength,
    (_) => FocusNode(),
  );

  bool _isLoading = false;
  bool _canResend = false;
  int _resendSeconds = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startResendTimer() {
    _resendSeconds = 60;
    _canResend = false;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_resendSeconds > 0) {
          _resendSeconds--;
        } else {
          _canResend = true;
          timer.cancel();
        }
      });
    });
  }

  String get _otp => _controllers.map((c) => c.text).join();

  void _onOTPChanged(int index, String value) {
    if (value.isNotEmpty && index < AppConfig.otpLength - 1) {
      _focusNodes[index + 1].requestFocus();
    }

    if (_otp.length == AppConfig.otpLength) {
      _verifyOTP();
    }
  }

  Future<void> _verifyOTP() async {
    if (_otp.length != AppConfig.otpLength) return;

    setState(() => _isLoading = true);

    try {
      if (widget.purpose == 'login') {
        // Login OTP verification
        final result = await ref.read(authProvider.notifier).verifyLoginOTP(
              widget.email,
              _otp,
            );

        if (mounted) {
          if (result == 'authenticated') {
            context.go('/home');
          } else {
            _showError(ref.read(authProvider).errorMessage ?? 'رمز التحقق غير صحيح');
          }
        }
      } else if (widget.purpose == 'registration') {
        // Registration OTP verification
        final success = await ref.read(authProvider.notifier).verifyRegistrationOTP(
              widget.email,
              _otp,
            );

        if (mounted) {
          if (success) {
            context.go('/register', extra: widget.email);
          } else {
            _showError(ref.read(authProvider).errorMessage ?? 'رمز التحقق غير صحيح');
          }
        }
      } else if (widget.purpose == 'password_reset') {
        // Password reset OTP - go to reset password screen
        context.go('/reset-password', extra: {'email': widget.email, 'otp': _otp});
      }
    } catch (e) {
      if (mounted) {
        _showError('حدث خطأ: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
    for (var controller in _controllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
  }

  Future<void> _resendOTP() async {
    if (!_canResend) return;

    try {
      final success =
          await ref.read(authProvider.notifier).sendOTP(widget.email, purpose: widget.purpose);

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم إرسال رمز جديد'),
              backgroundColor: AppColors.success,
            ),
          );
          _startResendTimer();
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage ?? 'فشل إعادة إرسال الرمز'),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'أدخل رمز التحقق',
                style: AppTextStyles.heading2,
              ),
              SizedBox(height: 8.h),
              Text(
                'أرسلنا رمز تحقق إلى ${widget.email}',
                style: AppTextStyles.subtitle,
              ),
              SizedBox(height: 32.h),
              // OTP Input Fields
              Directionality(
                textDirection: TextDirection.ltr,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(
                    6,
                    (index) => SizedBox(
                      width: 45,
                      height: 55,
                      child: TextFormField(
                        controller: _controllers[index],
                        focusNode: _focusNodes[index],
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.number,
                        maxLength: 1,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          counterText: '',
                          contentPadding: EdgeInsets.zero,
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppColors.primary,
                              width: 2,
                            ),
                          ),
                        ),
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        onChanged: (value) => _onOTPChanged(index, value),
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(height: 24.h),
              // Resend Button
              Center(
                child: _canResend
                    ? TextButton(
                        onPressed: _resendOTP,
                        child: const Text('إعادة إرسال الرمز'),
                      )
                    : Text(
                        'إعادة الإرسال خلال $_resendSeconds ثانية',
                        style: AppTextStyles.caption,
                      ),
              ),
              const Spacer(),
              // Verify Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading || _otp.length != AppConfig.otpLength
                      ? null
                      : _verifyOTP,
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
                          'تحقق',
                          style: AppTextStyles.button.copyWith(
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }
}
