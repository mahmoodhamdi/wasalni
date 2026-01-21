import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  final String email;

  const RegisterScreen({super.key, required this.email});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();

  // Controllers
  final _nameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _nationalIdController = TextEditingController();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _colorController = TextEditingController();
  final _plateController = TextEditingController();

  // State
  int _currentStep = 0;
  String _selectedVehicleType = 'car';
  String _selectedCategory = 'economy';
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  // Animation controller for smooth transitions
  late AnimationController _animationController;

  final List<_VehicleTypeOption> _vehicleTypes = [
    _VehicleTypeOption(
      id: 'car',
      name: 'سيارة',
      icon: Icons.directions_car,
      description: 'سيارة ملاكي',
    ),
    _VehicleTypeOption(
      id: 'tuktuk',
      name: 'توكتوك',
      icon: Icons.electric_rickshaw,
      description: 'توكتوك 3 عجلات',
    ),
    _VehicleTypeOption(
      id: 'motorcycle',
      name: 'موتوسيكل',
      icon: Icons.two_wheeler,
      description: 'دراجة نارية',
    ),
  ];

  final List<_CategoryOption> _categories = [
    _CategoryOption(
      id: 'economy',
      name: 'اقتصادي',
      icon: Icons.savings_outlined,
      description: 'أسعار مناسبة للجميع',
      color: Colors.green,
    ),
    _CategoryOption(
      id: 'comfort',
      name: 'مريح',
      icon: Icons.airline_seat_recline_extra,
      description: 'راحة أكثر وسيارات أحدث',
      color: Colors.blue,
    ),
    _CategoryOption(
      id: 'family',
      name: 'عائلي',
      icon: Icons.family_restroom,
      description: 'سيارات 7 راكب للعائلات',
      color: Colors.purple,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _pageController.dispose();
    _nameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    _nationalIdController.dispose();
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _colorController.dispose();
    _plateController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep == 0) {
      // Validate personal info
      if (_nameController.text.trim().isEmpty) {
        _showError('يرجى إدخال الاسم');
        return;
      }
      if (_nationalIdController.text.length != 14) {
        _showError('الرقم القومي يجب أن يكون 14 رقم');
        return;
      }
      if (_passwordController.text.length < 6) {
        _showError('كلمة المرور قصيرة جداً (6 أحرف على الأقل)');
        return;
      }
      if (_passwordController.text != _confirmPasswordController.text) {
        _showError('كلمة المرور غير متطابقة');
        return;
      }
    }

    if (_currentStep < 2) {
      setState(() => _currentStep++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      context.pop();
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            SizedBox(width: 8.w),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
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
    // Validate vehicle info
    if (_makeController.text.trim().isEmpty ||
        _modelController.text.trim().isEmpty ||
        _yearController.text.trim().isEmpty ||
        _colorController.text.trim().isEmpty ||
        _plateController.text.trim().isEmpty) {
      _showError('يرجى إكمال جميع بيانات المركبة');
      return;
    }

    final yearError = _validateYear(_yearController.text);
    if (yearError != null) {
      _showError(yearError);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final success = await ref.read(authProvider.notifier).register(
        email: widget.email,
        password: _passwordController.text,
        name: _nameController.text.trim(),
        phone: _phoneController.text.isNotEmpty ? _phoneController.text.trim() : null,
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
          _showError(errorMessage ?? 'فشل إنشاء الحساب');
        }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _previousStep,
        ),
        title: const Text('تسجيل سائق جديد'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Progress Indicator
          _buildProgressIndicator(),

          // Form Pages
          Expanded(
            child: Form(
              key: _formKey,
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildPersonalInfoStep(),
                  _buildVehicleTypeStep(),
                  _buildVehicleDetailsStep(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 16.h),
      color: AppColors.surface,
      child: Column(
        children: [
          // Step Labels
          Row(
            children: [
              _buildStepLabel(0, 'البيانات الشخصية', Icons.person),
              _buildStepConnector(0),
              _buildStepLabel(1, 'نوع المركبة', Icons.directions_car),
              _buildStepConnector(1),
              _buildStepLabel(2, 'تفاصيل المركبة', Icons.description),
            ],
          ),
          SizedBox(height: 12.h),
          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (_currentStep + 1) / 3,
              backgroundColor: Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 6.h,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepLabel(int step, String label, IconData icon) {
    final isActive = _currentStep >= step;
    final isCurrent = _currentStep == step;

    return Expanded(
      child: Column(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 36.w,
            height: 36.w,
            decoration: BoxDecoration(
              color: isActive ? AppColors.primary : Colors.grey.shade300,
              shape: BoxShape.circle,
              boxShadow: isCurrent
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 8,
                        spreadRadius: 2,
                      )
                    ]
                  : null,
            ),
            child: Icon(
              icon,
              size: 18.sp,
              color: isActive ? Colors.white : Colors.grey.shade600,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.sp,
              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
              color: isActive ? AppColors.primary : AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildStepConnector(int step) {
    final isActive = _currentStep > step;
    return Container(
      width: 20.w,
      height: 2,
      color: isActive ? AppColors.primary : Colors.grey.shade300,
    );
  }

  // Step 1: Personal Information
  Widget _buildPersonalInfoStep() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(20.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Header
          _buildSectionHeader(
            'مرحباً بك في وصّلني',
            'أدخل بياناتك الشخصية للبدء',
            Icons.waving_hand,
          ),
          SizedBox(height: 20.h),

          // Personal Info Card
          _buildCard(
            child: Column(
              children: [
                _buildTextField(
                  controller: _nameController,
                  label: 'الاسم الكامل',
                  hint: 'أدخل اسمك كما في البطاقة',
                  icon: Icons.person_outline,
                  textCapitalization: TextCapitalization.words,
                ),
                SizedBox(height: 16.h),
                _buildTextField(
                  controller: _nationalIdController,
                  label: 'الرقم القومي',
                  hint: 'أدخل الرقم القومي المكون من 14 رقم',
                  icon: Icons.badge_outlined,
                  keyboardType: TextInputType.number,
                  maxLength: 14,
                  isLTR: true,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
                SizedBox(height: 16.h),
                _buildTextField(
                  controller: _phoneController,
                  label: 'رقم الهاتف (اختياري)',
                  hint: '01xxxxxxxxx',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  isLTR: true,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
              ],
            ),
          ),
          SizedBox(height: 20.h),

          // Account Security Card
          _buildCard(
            title: 'أمان الحساب',
            icon: Icons.security,
            child: Column(
              children: [
                // Email (Read-only)
                _buildTextField(
                  initialValue: widget.email,
                  label: 'البريد الإلكتروني',
                  icon: Icons.email_outlined,
                  readOnly: true,
                  isLTR: true,
                  fillColor: Colors.grey.shade200,
                ),
                SizedBox(height: 16.h),
                _buildTextField(
                  controller: _passwordController,
                  label: 'كلمة المرور',
                  hint: '6 أحرف على الأقل',
                  icon: Icons.lock_outline,
                  obscureText: _obscurePassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      color: AppColors.textSecondary,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                SizedBox(height: 16.h),
                _buildTextField(
                  controller: _confirmPasswordController,
                  label: 'تأكيد كلمة المرور',
                  hint: 'أعد إدخال كلمة المرور',
                  icon: Icons.lock_outline,
                  obscureText: _obscureConfirmPassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
                      color: AppColors.textSecondary,
                    ),
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 24.h),

          // Next Button
          _buildPrimaryButton(
            label: 'التالي',
            icon: Icons.arrow_back,
            onPressed: _nextStep,
          ),
          SizedBox(height: 16.h),
        ],
      ),
    );
  }

  // Step 2: Vehicle Type Selection
  Widget _buildVehicleTypeStep() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(20.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(
            'نوع المركبة',
            'اختر نوع مركبتك',
            Icons.directions_car,
          ),
          SizedBox(height: 20.h),

          // Vehicle Type Selection
          ...List.generate(_vehicleTypes.length, (index) {
            final type = _vehicleTypes[index];
            final isSelected = _selectedVehicleType == type.id;
            return Padding(
              padding: EdgeInsets.only(bottom: 12.h),
              child: _buildSelectionCard(
                isSelected: isSelected,
                onTap: () => setState(() => _selectedVehicleType = type.id),
                child: Row(
                  children: [
                    Container(
                      width: 60.w,
                      height: 60.w,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary.withValues(alpha: 0.1)
                            : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        type.icon,
                        size: 32.sp,
                        color: isSelected ? AppColors.primary : AppColors.textSecondary,
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            type.name,
                            style: TextStyle(
                              fontSize: 18.sp,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? AppColors.primary : AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            type.description,
                            style: TextStyle(
                              fontSize: 13.sp,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Container(
                        padding: EdgeInsets.all(4.w),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.check, size: 16.sp, color: Colors.white),
                      ),
                  ],
                ),
              ),
            );
          }),

          SizedBox(height: 24.h),

          _buildSectionHeader(
            'فئة الخدمة',
            'اختر فئة الخدمة المناسبة لمركبتك',
            Icons.category,
          ),
          SizedBox(height: 16.h),

          // Category Selection
          ...List.generate(_categories.length, (index) {
            final category = _categories[index];
            final isSelected = _selectedCategory == category.id;
            return Padding(
              padding: EdgeInsets.only(bottom: 12.h),
              child: _buildSelectionCard(
                isSelected: isSelected,
                selectedColor: category.color,
                onTap: () => setState(() => _selectedCategory = category.id),
                child: Row(
                  children: [
                    Container(
                      width: 50.w,
                      height: 50.w,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? category.color.withValues(alpha: 0.1)
                            : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        category.icon,
                        size: 26.sp,
                        color: isSelected ? category.color : AppColors.textSecondary,
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            category.name,
                            style: TextStyle(
                              fontSize: 16.sp,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? category.color : AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            category.description,
                            style: TextStyle(
                              fontSize: 12.sp,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Icon(Icons.check_circle, color: category.color, size: 24.sp),
                  ],
                ),
              ),
            );
          }),

          SizedBox(height: 24.h),
          _buildPrimaryButton(
            label: 'التالي',
            icon: Icons.arrow_back,
            onPressed: _nextStep,
          ),
          SizedBox(height: 16.h),
        ],
      ),
    );
  }

  // Step 3: Vehicle Details
  Widget _buildVehicleDetailsStep() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(20.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(
            'تفاصيل المركبة',
            'أدخل بيانات مركبتك بدقة',
            Icons.edit_document,
          ),
          SizedBox(height: 20.h),

          // Vehicle Details Card
          _buildCard(
            title: 'معلومات المركبة',
            icon: Icons.directions_car_filled,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _makeController,
                        label: 'الشركة المصنعة',
                        hint: 'مثال: Toyota',
                        icon: Icons.factory_outlined,
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: _buildTextField(
                        controller: _modelController,
                        label: 'الموديل',
                        hint: 'مثال: Corolla',
                        icon: Icons.car_rental,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _yearController,
                        label: 'سنة الصنع',
                        hint: '2020',
                        icon: Icons.calendar_today_outlined,
                        keyboardType: TextInputType.number,
                        maxLength: 4,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: _buildTextField(
                        controller: _colorController,
                        label: 'اللون',
                        hint: 'مثال: أبيض',
                        icon: Icons.palette_outlined,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),
                _buildTextField(
                  controller: _plateController,
                  label: 'رقم اللوحة',
                  hint: 'مثال: أ ب ج ١٢٣',
                  icon: Icons.pin_outlined,
                  textCapitalization: TextCapitalization.characters,
                ),
              ],
            ),
          ),
          SizedBox(height: 20.h),

          // Info Banner
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: AppColors.info.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppColors.info, size: 24.sp),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    'بعد إكمال البيانات، ستحتاج لرفع صور المستندات للتحقق من حسابك',
                    style: TextStyle(
                      fontSize: 13.sp,
                      color: AppColors.info,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 24.h),

          // Register Button
          _buildPrimaryButton(
            label: 'التالي - رفع المستندات',
            icon: Icons.upload_file,
            isLoading: _isLoading,
            onPressed: _register,
          ),
          SizedBox(height: 16.h),
        ],
      ),
    );
  }

  // Helper Widgets
  Widget _buildSectionHeader(String title, String subtitle, IconData icon) {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(12.w),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary, size: 28.sp),
        ),
        SizedBox(width: 16.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTextStyles.heading3),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 14.sp,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCard({
    required Widget child,
    String? title,
    IconData? icon,
  }) {
    return Container(
      padding: EdgeInsets.all(20.w),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, color: AppColors.primary, size: 20.sp),
                  SizedBox(width: 8.w),
                ],
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            SizedBox(height: 16.h),
          ],
          child,
        ],
      ),
    );
  }

  Widget _buildSelectionCard({
    required Widget child,
    required bool isSelected,
    required VoidCallback onTap,
    Color? selectedColor,
  }) {
    final color = selectedColor ?? AppColors.primary;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: child,
      ),
    );
  }

  Widget _buildTextField({
    TextEditingController? controller,
    String? initialValue,
    required String label,
    String? hint,
    required IconData icon,
    bool readOnly = false,
    bool obscureText = false,
    bool isLTR = false,
    TextInputType? keyboardType,
    int? maxLength,
    TextCapitalization textCapitalization = TextCapitalization.none,
    Widget? suffixIcon,
    Color? fillColor,
    List<TextInputFormatter>? inputFormatters,
  }) {
    final field = TextFormField(
      controller: controller,
      initialValue: initialValue,
      readOnly: readOnly,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLength: maxLength,
      textCapitalization: textCapitalization,
      inputFormatters: inputFormatters,
      textDirection: isLTR ? TextDirection.ltr : null,
      style: TextStyle(fontSize: 15.sp),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, size: 22.sp),
        suffixIcon: suffixIcon,
        counterText: '',
        filled: true,
        fillColor: fillColor ?? Colors.grey.shade50,
        contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );

    return isLTR ? Directionality(textDirection: TextDirection.ltr, child: field) : field;
  }

  Widget _buildPrimaryButton({
    required String label,
    required IconData icon,
    required VoidCallback onPressed,
    bool isLoading = false,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 56.h,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 2,
        ),
        child: isLoading
            ? SizedBox(
                width: 24.w,
                height: 24.w,
                child: const CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(width: 8.w),
                  Icon(icon, size: 20.sp),
                ],
              ),
      ),
    );
  }
}

// Helper Classes
class _VehicleTypeOption {
  final String id;
  final String name;
  final IconData icon;
  final String description;

  _VehicleTypeOption({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
  });
}

class _CategoryOption {
  final String id;
  final String name;
  final IconData icon;
  final String description;
  final Color color;

  _CategoryOption({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.color,
  });
}
