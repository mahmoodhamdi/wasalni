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
  final _nationalIdController = TextEditingController();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _colorController = TextEditingController();
  final _plateController = TextEditingController();

  String _selectedVehicleType = 'car';
  String _selectedCategory = 'economy';
  bool _isLoading = false;

  final List<Map<String, String>> _vehicleTypes = [
    {'id': 'car', 'name': 'سيارة'},
    {'id': 'tuktuk', 'name': 'توكتوك'},
    {'id': 'motorcycle', 'name': 'موتوسيكل'},
  ];

  final List<Map<String, String>> _categories = [
    {'id': 'economy', 'name': 'اقتصادي'},
    {'id': 'comfort', 'name': 'مريح'},
    {'id': 'family', 'name': 'عائلي'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _nationalIdController.dispose();
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _colorController.dispose();
    _plateController.dispose();
    super.dispose();
  }

  String? _validateRequired(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return 'يرجى إدخال $fieldName';
    }
    return null;
  }

  String? _validateNationalId(String? value) {
    if (value == null || value.isEmpty) {
      return 'يرجى إدخال الرقم القومي';
    }
    if (value.length != 14) {
      return 'الرقم القومي يجب أن يكون 14 رقم';
    }
    return null;
  }

  String? _validateYear(String? value) {
    if (value == null || value.isEmpty) {
      return 'يرجى إدخال سنة الصنع';
    }
    final year = int.tryParse(value);
    if (year == null || year < 1990 || year > DateTime.now().year + 1) {
      return 'سنة الصنع غير صحيحة';
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
        email: _emailController.text.isNotEmpty ? _emailController.text.trim() : null,
        nationalId: _nationalIdController.text.trim(),
        vehicleType: _selectedVehicleType,
        vehicleCategory: _selectedCategory,
        vehicle: {
          'make': _makeController.text.trim(),
          'model': _modelController.text.trim(),
          'year': int.parse(_yearController.text.trim()),
          'color': _colorController.text.trim(),
          'plateNumber': _plateController.text.trim(),
        },
      );

      if (mounted) {
        if (success) {
          context.go('/documents');
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
        title: const Text('تسجيل سائق جديد'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(24.w),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Section 1: Personal Info
                Text('البيانات الشخصية', style: AppTextStyles.heading3),
                SizedBox(height: 16.h),

                // Name
                TextFormField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'الاسم الكامل',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (v) => _validateRequired(v, 'الاسم'),
                ),
                SizedBox(height: 16.h),

                // National ID
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: TextFormField(
                    controller: _nationalIdController,
                    keyboardType: TextInputType.number,
                    maxLength: 14,
                    decoration: const InputDecoration(
                      labelText: 'الرقم القومي',
                      prefixIcon: Icon(Icons.credit_card),
                      counterText: '',
                    ),
                    validator: _validateNationalId,
                  ),
                ),
                SizedBox(height: 16.h),

                // Email (Optional)
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'البريد الإلكتروني (اختياري)',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                  ),
                ),
                SizedBox(height: 32.h),

                // Section 2: Vehicle Info
                Text('بيانات المركبة', style: AppTextStyles.heading3),
                SizedBox(height: 16.h),

                // Vehicle Type
                DropdownButtonFormField<String>(
                  value: _selectedVehicleType,
                  decoration: const InputDecoration(
                    labelText: 'نوع المركبة',
                    prefixIcon: Icon(Icons.directions_car_outlined),
                  ),
                  items: _vehicleTypes.map((type) {
                    return DropdownMenuItem(
                      value: type['id'],
                      child: Text(type['name']!),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() => _selectedVehicleType = value!);
                  },
                ),
                SizedBox(height: 16.h),

                // Category
                DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'فئة الخدمة',
                    prefixIcon: Icon(Icons.category_outlined),
                  ),
                  items: _categories.map((cat) {
                    return DropdownMenuItem(
                      value: cat['id'],
                      child: Text(cat['name']!),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() => _selectedCategory = value!);
                  },
                ),
                SizedBox(height: 16.h),

                // Make & Model
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _makeController,
                        decoration: const InputDecoration(
                          labelText: 'الشركة المصنعة',
                          hintText: 'Toyota',
                        ),
                        validator: (v) => _validateRequired(v, 'الشركة'),
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: TextFormField(
                        controller: _modelController,
                        decoration: const InputDecoration(
                          labelText: 'الموديل',
                          hintText: 'Corolla',
                        ),
                        validator: (v) => _validateRequired(v, 'الموديل'),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),

                // Year & Color
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _yearController,
                        keyboardType: TextInputType.number,
                        maxLength: 4,
                        decoration: const InputDecoration(
                          labelText: 'سنة الصنع',
                          hintText: '2020',
                          counterText: '',
                        ),
                        validator: _validateYear,
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: TextFormField(
                        controller: _colorController,
                        decoration: const InputDecoration(
                          labelText: 'اللون',
                          hintText: 'أبيض',
                        ),
                        validator: (v) => _validateRequired(v, 'اللون'),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),

                // Plate Number
                TextFormField(
                  controller: _plateController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    labelText: 'رقم اللوحة',
                    hintText: 'أ ب ج 123',
                    prefixIcon: Icon(Icons.confirmation_number_outlined),
                  ),
                  validator: (v) => _validateRequired(v, 'رقم اللوحة'),
                ),
                SizedBox(height: 40.h),

                // Next Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _register,
                    child: _isLoading
                        ? SizedBox(
                            width: 24.w,
                            height: 24.w,
                            child: const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text('التالي - رفع المستندات', style: AppTextStyles.button.copyWith(color: Colors.white)),
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
