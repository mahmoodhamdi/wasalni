import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../services/api_service.dart';
import '../../services/storage_service.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();

  File? _avatarFile;
  bool _isLoading = false;
  String? _currentAvatar;
  String _selectedGender = 'male';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    _nameController.text = storageService.getUserName() ?? '';
    _phoneController.text = storageService.getUserPhone() ?? '';
    _emailController.text = storageService.getUserEmail() ?? '';
    _currentAvatar = storageService.getUserAvatar();

    final gender = storageService.getUserGender();
    if (gender != null) {
      _selectedGender = gender;
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();

    final choice = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('الكاميرا'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('معرض الصور'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (choice != null) {
      final image = await picker.pickImage(
        source: choice,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() => _avatarFile = File(image.path));
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final data = <String, dynamic>{
        'name': _nameController.text.trim(),
        'gender': _selectedGender,
      };

      // Add phone only if changed and not empty
      final phone = _phoneController.text.trim();
      if (phone.isNotEmpty) {
        data['phone'] = phone;
      }

      // TODO: Handle avatar upload to Cloudinary
      // if (_avatarFile != null) {
      //   final avatarUrl = await _uploadAvatar();
      //   data['avatar'] = avatarUrl;
      // }

      final response = await apiService.updateProfile(data);

      if (response.data['success'] == true) {
        // Update local storage
        await storageService.setUserName(_nameController.text.trim());
        if (phone.isNotEmpty) {
          await storageService.setUserPhone(phone);
        }
        await storageService.setUserGender(_selectedGender);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم تحديث الملف الشخصي بنجاح'),
              backgroundColor: Colors.green,
            ),
          );
          // Check if we can pop, otherwise go to home
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/home');
          }
        }
      } else {
        throw Exception(response.data['messageAr'] ?? 'حدث خطأ');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ: $e'),
            backgroundColor: Colors.red,
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
        title: const Text('تعديل الملف الشخصي'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveProfile,
            child: _isLoading
                ? SizedBox(
                    width: 20.w,
                    height: 20.w,
                    child: const CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('حفظ'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Avatar
              GestureDetector(
                onTap: _pickImage,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 60.r,
                      backgroundColor:
                          Theme.of(context).primaryColor.withValues(alpha: 0.1),
                      backgroundImage: _avatarFile != null
                          ? FileImage(_avatarFile!)
                          : (_currentAvatar != null
                              ? NetworkImage(_currentAvatar!)
                              : null) as ImageProvider?,
                      child: _avatarFile == null && _currentAvatar == null
                          ? Icon(
                              Icons.person,
                              size: 60.r,
                              color: Theme.of(context).primaryColor,
                            )
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: CircleAvatar(
                        radius: 18.r,
                        backgroundColor: Theme.of(context).primaryColor,
                        child: Icon(
                          Icons.camera_alt,
                          size: 18.r,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'اضغط لتغيير الصورة',
                style: TextStyle(
                  fontSize: 12.sp,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 32.h),

              // Name
              TextFormField(
                controller: _nameController,
                textDirection: TextDirection.rtl,
                decoration: InputDecoration(
                  labelText: 'الاسم الكامل',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'الاسم مطلوب';
                  }
                  if (v.trim().length < 3) {
                    return 'الاسم يجب أن يكون 3 أحرف على الأقل';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16.h),

              // Phone
              TextFormField(
                controller: _phoneController,
                textDirection: TextDirection.ltr,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'رقم الهاتف',
                  hintText: '01xxxxxxxxx',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
                validator: (v) {
                  if (v != null && v.isNotEmpty) {
                    // Validate Egyptian phone number format
                    final phoneRegex = RegExp(r'^01[0-9]{9}$');
                    if (!phoneRegex.hasMatch(v)) {
                      return 'أدخل رقم هاتف صحيح (01xxxxxxxxx)';
                    }
                  }
                  return null;
                },
              ),
              SizedBox(height: 16.h),

              // Email (read-only)
              TextFormField(
                controller: _emailController,
                textDirection: TextDirection.ltr,
                readOnly: true,
                enabled: false,
                decoration: InputDecoration(
                  labelText: 'البريد الإلكتروني',
                  prefixIcon: const Icon(Icons.email_outlined),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  filled: true,
                  fillColor: Colors.grey[100],
                ),
              ),
              SizedBox(height: 16.h),

              // Gender Selection
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'الجنس',
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 8.h),
                      Row(
                        children: [
                          Expanded(
                            child: _GenderOption(
                              label: 'ذكر',
                              icon: Icons.male,
                              isSelected: _selectedGender == 'male',
                              onTap: () =>
                                  setState(() => _selectedGender = 'male'),
                            ),
                          ),
                          SizedBox(width: 16.w),
                          Expanded(
                            child: _GenderOption(
                              label: 'أنثى',
                              icon: Icons.female,
                              isSelected: _selectedGender == 'female',
                              onTap: () =>
                                  setState(() => _selectedGender = 'female'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 32.h),

              // Change Password Button
              OutlinedButton.icon(
                onPressed: () => context.push('/change-password'),
                icon: const Icon(Icons.lock_outline),
                label: const Text('تغيير كلمة المرور'),
                style: OutlinedButton.styleFrom(
                  minimumSize: Size(double.infinity, 50.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
              SizedBox(height: 16.h),

              // Emergency Contacts Button
              OutlinedButton.icon(
                onPressed: () => context.push('/emergency-contacts'),
                icon: const Icon(Icons.emergency_outlined),
                label: const Text('جهات اتصال الطوارئ'),
                style: OutlinedButton.styleFrom(
                  minimumSize: Size(double.infinity, 50.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12.r),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).primaryColor.withValues(alpha: 0.1)
              : Colors.grey[100],
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isSelected
                ? Theme.of(context).primaryColor
                : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected
                  ? Theme.of(context).primaryColor
                  : Colors.grey[600],
            ),
            SizedBox(width: 8.w),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected
                    ? Theme.of(context).primaryColor
                    : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
