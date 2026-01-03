import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../config/theme.dart';

class DocumentsScreen extends ConsumerStatefulWidget {
  const DocumentsScreen({super.key});

  @override
  ConsumerState<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends ConsumerState<DocumentsScreen> {
  bool _isLoading = false;

  final Map<String, String?> _documents = {
    'nationalIdFront': null,
    'nationalIdBack': null,
    'driverLicense': null,
    'vehicleLicense': null,
    'vehiclePhoto': null,
  };

  final Map<String, Map<String, dynamic>> _documentInfo = {
    'nationalIdFront': {
      'title': 'البطاقة الشخصية (الوجه)',
      'icon': Icons.credit_card,
    },
    'nationalIdBack': {
      'title': 'البطاقة الشخصية (الظهر)',
      'icon': Icons.credit_card,
    },
    'driverLicense': {
      'title': 'رخصة القيادة',
      'icon': Icons.badge,
    },
    'vehicleLicense': {
      'title': 'رخصة المركبة',
      'icon': Icons.description,
    },
    'vehiclePhoto': {
      'title': 'صورة المركبة',
      'icon': Icons.directions_car,
    },
  };

  Future<void> _uploadDocument(String documentKey) async {
    // TODO: Implement image picker
    // For now, simulate upload
    setState(() {
      _documents[documentKey] = 'uploaded_${DateTime.now().millisecondsSinceEpoch}';
    });
  }

  bool get _allDocumentsUploaded {
    return _documents.values.every((doc) => doc != null);
  }

  Future<void> _submitDocuments() async {
    if (!_allDocumentsUploaded) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى رفع جميع المستندات المطلوبة'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // TODO: Upload documents to server
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        _showSuccessDialog();
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

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, size: 80.sp, color: AppColors.success),
            SizedBox(height: 16.h),
            Text(
              'تم إرسال طلبك بنجاح',
              style: AppTextStyles.heading3,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 8.h),
            Text(
              'سيتم مراجعة مستنداتك وإعلامك بالنتيجة خلال 24-48 ساعة',
              style: AppTextStyles.caption,
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                context.go('/');
              },
              child: const Text('حسناً'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('رفع المستندات'),
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('المستندات المطلوبة', style: AppTextStyles.heading2),
              SizedBox(height: 8.h),
              Text(
                'يرجى رفع صور واضحة للمستندات التالية',
                style: AppTextStyles.subtitle,
              ),
              SizedBox(height: 24.h),

              Expanded(
                child: ListView.separated(
                  itemCount: _documents.length,
                  separatorBuilder: (_, __) => SizedBox(height: 12.h),
                  itemBuilder: (context, index) {
                    final key = _documents.keys.elementAt(index);
                    final info = _documentInfo[key]!;
                    final isUploaded = _documents[key] != null;

                    return _DocumentCard(
                      title: info['title'] as String,
                      icon: info['icon'] as IconData,
                      isUploaded: isUploaded,
                      onTap: () => _uploadDocument(key),
                    );
                  },
                ),
              ),

              SizedBox(height: 16.h),

              // Progress Indicator
              LinearProgressIndicator(
                value: _documents.values.where((d) => d != null).length / _documents.length,
                backgroundColor: Colors.grey.shade200,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
              SizedBox(height: 8.h),
              Text(
                '${_documents.values.where((d) => d != null).length} من ${_documents.length} مستندات',
                style: AppTextStyles.caption,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 16.h),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitDocuments,
                  child: _isLoading
                      ? SizedBox(
                          width: 24.w,
                          height: 24.w,
                          child: const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          'إرسال الطلب',
                          style: AppTextStyles.button.copyWith(color: Colors.white),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isUploaded;
  final VoidCallback onTap;

  const _DocumentCard({
    required this.title,
    required this.icon,
    required this.isUploaded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: isUploaded ? AppColors.success.withValues(alpha: 0.1) : Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isUploaded ? AppColors.success : Colors.grey.shade300,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48.w,
              height: 48.w,
              decoration: BoxDecoration(
                color: isUploaded
                    ? AppColors.success.withValues(alpha: 0.2)
                    : AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Icon(
                isUploaded ? Icons.check : icon,
                color: isUploaded ? AppColors.success : AppColors.primary,
              ),
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    isUploaded ? 'تم الرفع' : 'اضغط للرفع',
                    style: AppTextStyles.caption.copyWith(
                      color: isUploaded ? AppColors.success : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isUploaded ? Icons.check_circle : Icons.upload_outlined,
              color: isUploaded ? AppColors.success : AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}
