import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../config/theme.dart';

class DriverInfoCard extends StatelessWidget {
  final String driverName;
  final String? driverPhoto;
  final double? rating;
  final String vehicleModel;
  final String vehicleColor;
  final String vehiclePlate;
  final int? eta;
  final VoidCallback? onCall;
  final VoidCallback? onMessage;
  final VoidCallback? onCancel;

  const DriverInfoCard({
    super.key,
    required this.driverName,
    this.driverPhoto,
    this.rating,
    required this.vehicleModel,
    required this.vehicleColor,
    required this.vehiclePlate,
    this.eta,
    this.onCall,
    this.onMessage,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ETA
          if (eta != null)
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(vertical: 8.h),
              margin: EdgeInsets.only(bottom: 12.h),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Text(
                'السائق سيصل خلال $eta دقيقة',
                textAlign: TextAlign.center,
                style: AppTextStyles.body.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

          // Driver Info Row
          Row(
            children: [
              // Driver Photo
              CircleAvatar(
                radius: 30.r,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                backgroundImage:
                    driverPhoto != null ? NetworkImage(driverPhoto!) : null,
                child: driverPhoto == null
                    ? Icon(
                        Icons.person,
                        size: 30.sp,
                        color: AppColors.primary,
                      )
                    : null,
              ),
              SizedBox(width: 12.w),
              // Driver Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      driverName,
                      style: AppTextStyles.body.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (rating != null)
                      Row(
                        children: [
                          Icon(
                            Icons.star,
                            size: 16.sp,
                            color: AppColors.warning,
                          ),
                          SizedBox(width: 4.w),
                          Text(
                            rating!.toStringAsFixed(1),
                            style: AppTextStyles.caption,
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              // Action Buttons
              Row(
                children: [
                  if (onMessage != null)
                    _ActionButton(
                      icon: Icons.message_outlined,
                      onTap: onMessage!,
                    ),
                  SizedBox(width: 8.w),
                  if (onCall != null)
                    _ActionButton(
                      icon: Icons.phone_outlined,
                      onTap: onCall!,
                      isPrimary: true,
                    ),
                ],
              ),
            ],
          ),
          SizedBox(height: 16.h),

          // Vehicle Info
          Container(
            padding: EdgeInsets.all(12.w),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.directions_car,
                  color: AppColors.textSecondary,
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$vehicleModel - $vehicleColor',
                        style: AppTextStyles.body,
                      ),
                      Text(
                        vehiclePlate,
                        style: AppTextStyles.caption.copyWith(
                          fontWeight: FontWeight.w600,
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Cancel Button
          if (onCancel != null) ...[
            SizedBox(height: 12.h),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: onCancel,
                child: Text(
                  'إلغاء الرحلة',
                  style: AppTextStyles.button.copyWith(
                    color: AppColors.error,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const _ActionButton({
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44.w,
        height: 44.w,
        decoration: BoxDecoration(
          color: isPrimary
              ? AppColors.primary
              : AppColors.primary.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: isPrimary ? Colors.white : AppColors.primary,
          size: 22.sp,
        ),
      ),
    );
  }
}
