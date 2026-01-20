import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../providers/safety_provider.dart';

// App Colors
class AppColors {
  static const Color primary = Color(0xFF1E88E5);
}

class EmergencyContactsScreen extends ConsumerStatefulWidget {
  const EmergencyContactsScreen({super.key});

  @override
  ConsumerState<EmergencyContactsScreen> createState() => _EmergencyContactsScreenState();
}

class _EmergencyContactsScreenState extends ConsumerState<EmergencyContactsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(safetyProvider.notifier).loadEmergencyContacts();
    });
  }

  void _showAddContactDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _AddContactSheet(),
    );
  }

  void _showEditContactDialog(EmergencyContact contact) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddContactSheet(contact: contact),
    );
  }

  Future<void> _deleteContact(EmergencyContact contact) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف جهة الاتصال'),
        content: Text('هل تريد حذف ${contact.name} من قائمة جهات الاتصال الطارئة؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('حذف'),
          ),
        ],
      ),
    );

    if (confirmed == true && contact.id != null) {
      await ref.read(safetyProvider.notifier).removeEmergencyContact(contact.id!);
    }
  }

  Future<void> _pickFromContacts() async {
    // Request permission
    final permissionStatus = await Permission.contacts.request();

    if (permissionStatus.isGranted) {
      // Open native contact picker
      final Contact? contact = await FlutterContacts.openExternalPick();

      if (contact != null && mounted) {
        // Get full contact with phone numbers
        final fullContact = await FlutterContacts.getContact(contact.id, withProperties: true);

        if (fullContact != null && mounted) {
          String phone = '';
          if (fullContact.phones.isNotEmpty) {
            // Get first phone number and clean it
            phone = fullContact.phones.first.number
                .replaceAll(' ', '')
                .replaceAll('-', '')
                .replaceAll('(', '')
                .replaceAll(')', '');

            // Convert to Egyptian format if needed
            if (phone.startsWith('+2')) {
              phone = phone.substring(2);
            } else if (phone.startsWith('002')) {
              phone = phone.substring(3);
            }
          }

          // Show the add contact sheet with pre-filled data
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => _AddContactSheet(
              prefilledName: fullContact.displayName,
              prefilledPhone: phone,
            ),
          );
        }
      }
    } else if (permissionStatus.isPermanentlyDenied) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('يرجى السماح بالوصول لجهات الاتصال من الإعدادات'),
            action: SnackBarAction(
              label: 'الإعدادات',
              onPressed: () => openAppSettings(),
            ),
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('يجب السماح بالوصول لجهات الاتصال'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final safetyState = ref.watch(safetyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('جهات الاتصال الطارئة'),
        centerTitle: true,
      ),
      body: safetyState.isLoading && safetyState.contacts.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Header info
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(16.w),
                  color: AppColors.primary.withValues(alpha: 0.1),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: AppColors.primary,
                        size: 24.sp,
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: Text(
                          'سيتم إبلاغ جهات الاتصال الطارئة في حالة الطوارئ أو عند مشاركة الرحلة',
                          style: TextStyle(
                            fontSize: 13.sp,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Contacts list
                Expanded(
                  child: safetyState.contacts.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          padding: EdgeInsets.all(16.w),
                          itemCount: safetyState.contacts.length,
                          itemBuilder: (context, index) {
                            return _ContactCard(
                              contact: safetyState.contacts[index],
                              onEdit: () => _showEditContactDialog(safetyState.contacts[index]),
                              onDelete: () => _deleteContact(safetyState.contacts[index]),
                            );
                          },
                        ),
                ),

                // Error message
                if (safetyState.errorMessage != null)
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(16.w),
                    color: Colors.red.shade50,
                    child: Text(
                      safetyState.errorMessage!,
                      style: TextStyle(color: Colors.red, fontSize: 14.sp),
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
      floatingActionButton: safetyState.contacts.length < 5
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Pick from contacts button
                FloatingActionButton(
                  heroTag: 'pick_contact',
                  onPressed: _pickFromContacts,
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary,
                  child: const Icon(Icons.contacts),
                ),
                SizedBox(height: 12.h),
                // Add manually button
                FloatingActionButton.extended(
                  heroTag: 'add_contact',
                  onPressed: _showAddContactDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('إضافة يدوياً'),
                  backgroundColor: AppColors.primary,
                ),
              ],
            )
          : null,
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.contacts_outlined,
            size: 80.sp,
            color: Colors.grey[400],
          ),
          SizedBox(height: 16.h),
          Text(
            'لا توجد جهات اتصال طارئة',
            style: TextStyle(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'أضف جهات اتصال لإبلاغها في حالات الطوارئ',
            style: TextStyle(
              fontSize: 14.sp,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 24.h),
          // Pick from device contacts
          ElevatedButton.icon(
            onPressed: _pickFromContacts,
            icon: const Icon(Icons.contacts),
            label: const Text('اختر من جهات الاتصال'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
            ),
          ),
          SizedBox(height: 12.h),
          // Add manually
          OutlinedButton.icon(
            onPressed: _showAddContactDialog,
            icon: const Icon(Icons.edit),
            label: const Text('أدخل يدوياً'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
            ),
          ),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  final EmergencyContact contact;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ContactCard({
    required this.contact,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12.h),
      child: Padding(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(
                    contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        contact.name,
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        contact.relationshipAr,
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: onEdit,
                  color: Colors.grey[600],
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: onDelete,
                  color: Colors.red,
                ),
              ],
            ),
            SizedBox(height: 12.h),
            Row(
              children: [
                Icon(Icons.phone, size: 16.sp, color: Colors.grey[600]),
                SizedBox(width: 8.w),
                Text(
                  contact.phone,
                  style: TextStyle(fontSize: 14.sp, color: Colors.grey[700]),
                ),
              ],
            ),
            SizedBox(height: 12.h),
            Wrap(
              spacing: 8.w,
              children: [
                if (contact.notifyOnTrip)
                  Chip(
                    label: const Text('إبلاغ عند الرحلة'),
                    labelStyle: TextStyle(fontSize: 11.sp),
                    backgroundColor: Colors.green.shade50,
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
                if (contact.notifyOnSOS)
                  Chip(
                    label: const Text('إبلاغ عند الطوارئ'),
                    labelStyle: TextStyle(fontSize: 11.sp),
                    backgroundColor: Colors.red.shade50,
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AddContactSheet extends ConsumerStatefulWidget {
  final EmergencyContact? contact;
  final String? prefilledName;
  final String? prefilledPhone;

  const _AddContactSheet({
    this.contact,
    this.prefilledName,
    this.prefilledPhone,
  });

  @override
  ConsumerState<_AddContactSheet> createState() => _AddContactSheetState();
}

class _AddContactSheetState extends ConsumerState<_AddContactSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  String _relationship = 'other';
  bool _notifyOnTrip = true;
  bool _notifyOnSOS = true;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: widget.contact?.name ?? widget.prefilledName ?? '',
    );
    _phoneController = TextEditingController(
      text: widget.contact?.phone ?? widget.prefilledPhone ?? '',
    );
    if (widget.contact != null) {
      _relationship = widget.contact!.relationship;
      _notifyOnTrip = widget.contact!.notifyOnTrip;
      _notifyOnSOS = widget.contact!.notifyOnSOS;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickFromContacts() async {
    final permissionStatus = await Permission.contacts.request();

    if (permissionStatus.isGranted) {
      final Contact? contact = await FlutterContacts.openExternalPick();

      if (contact != null && mounted) {
        final fullContact = await FlutterContacts.getContact(contact.id, withProperties: true);

        if (fullContact != null && mounted) {
          setState(() {
            _nameController.text = fullContact.displayName;

            if (fullContact.phones.isNotEmpty) {
              String phone = fullContact.phones.first.number
                  .replaceAll(' ', '')
                  .replaceAll('-', '')
                  .replaceAll('(', '')
                  .replaceAll(')', '');

              if (phone.startsWith('+2')) {
                phone = phone.substring(2);
              } else if (phone.startsWith('002')) {
                phone = phone.substring(3);
              }

              _phoneController.text = phone;
            }
          });
        }
      }
    } else if (permissionStatus.isPermanentlyDenied) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('يرجى السماح بالوصول لجهات الاتصال من الإعدادات'),
            action: SnackBarAction(
              label: 'الإعدادات',
              onPressed: () => openAppSettings(),
            ),
          ),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    bool success;
    if (widget.contact?.id != null) {
      success = await ref.read(safetyProvider.notifier).updateEmergencyContact(
            widget.contact!.id!,
            {
              'name': _nameController.text.trim(),
              'phone': _phoneController.text.trim(),
              'relationship': _relationship,
              'notifyOnTrip': _notifyOnTrip,
              'notifyOnSOS': _notifyOnSOS,
            },
          );
    } else {
      success = await ref.read(safetyProvider.notifier).addEmergencyContact(
            EmergencyContact(
              name: _nameController.text.trim(),
              phone: _phoneController.text.trim(),
              relationship: _relationship,
              notifyOnTrip: _notifyOnTrip,
              notifyOnSOS: _notifyOnSOS,
            ),
          );
    }

    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.contact != null;
    final hasPrefilledData = widget.prefilledName != null || widget.prefilledPhone != null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.all(20.w),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40.w,
                  height: 4.h,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2.r),
                  ),
                ),
              ),
              SizedBox(height: 20.h),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      isEditing
                          ? 'تعديل جهة الاتصال'
                          : hasPrefilledData
                              ? 'تأكيد البيانات'
                              : 'إضافة جهة اتصال طارئة',
                      style: TextStyle(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (!isEditing)
                    TextButton.icon(
                      onPressed: _pickFromContacts,
                      icon: const Icon(Icons.contacts, size: 20),
                      label: const Text('اختر'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.primary,
                      ),
                    ),
                ],
              ),
              SizedBox(height: 20.h),

              // Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'الاسم',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'الرجاء إدخال الاسم';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16.h),

              // Phone
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'رقم الهاتف',
                  prefixIcon: Icon(Icons.phone_outlined),
                  hintText: '01xxxxxxxxx',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'الرجاء إدخال رقم الهاتف';
                  }
                  if (!RegExp(r'^(01)[0125][0-9]{8}$').hasMatch(value.trim())) {
                    return 'رقم هاتف غير صالح';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16.h),

              // Relationship
              DropdownButtonFormField<String>(
                initialValue: _relationship,
                decoration: const InputDecoration(
                  labelText: 'العلاقة',
                  prefixIcon: Icon(Icons.family_restroom),
                ),
                items: const [
                  DropdownMenuItem(value: 'parent', child: Text('أحد الوالدين')),
                  DropdownMenuItem(value: 'spouse', child: Text('الزوج/الزوجة')),
                  DropdownMenuItem(value: 'sibling', child: Text('أخ/أخت')),
                  DropdownMenuItem(value: 'friend', child: Text('صديق')),
                  DropdownMenuItem(value: 'other', child: Text('آخر')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _relationship = value);
                  }
                },
              ),
              SizedBox(height: 20.h),

              // Notification settings
              Text(
                'إعدادات الإشعارات',
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 8.h),
              SwitchListTile(
                value: _notifyOnTrip,
                onChanged: (value) => setState(() => _notifyOnTrip = value),
                title: const Text('إبلاغ عند بدء الرحلة'),
                subtitle: const Text('إرسال رابط تتبع الرحلة'),
                contentPadding: EdgeInsets.zero,
              ),
              SwitchListTile(
                value: _notifyOnSOS,
                onChanged: (value) => setState(() => _notifyOnSOS = value),
                title: const Text('إبلاغ عند الطوارئ'),
                subtitle: const Text('إرسال إشعار في حالة SOS'),
                contentPadding: EdgeInsets.zero,
              ),
              SizedBox(height: 20.h),

              // Save button
              SizedBox(
                width: double.infinity,
                height: 50.h,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(isEditing ? 'حفظ التغييرات' : 'إضافة'),
                ),
              ),
              SizedBox(height: 20.h),
            ],
          ),
        ),
      ),
    );
  }
}
