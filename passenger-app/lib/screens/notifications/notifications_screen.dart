import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../services/api_service.dart';

// Notification model
class NotificationModel {
  final String id;
  final String title;
  final String titleAr;
  final String body;
  final String bodyAr;
  final String type;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? data;

  NotificationModel({
    required this.id,
    required this.title,
    required this.titleAr,
    required this.body,
    required this.bodyAr,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.data,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      titleAr: json['titleAr'] ?? json['title'] ?? '',
      body: json['body'] ?? '',
      bodyAr: json['bodyAr'] ?? json['body'] ?? '',
      type: json['type'] ?? 'system',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      data: json['data'],
    );
  }
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    // Set Arabic locale for timeago
    timeago.setLocaleMessages('ar', timeago.ArMessages());
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final response = await apiService.getNotifications();
      if (response.data['success'] == true) {
        final list = response.data['data'] as List? ?? [];
        setState(() {
          _notifications = list.map((n) => NotificationModel.fromJson(n)).toList();
          _unreadCount = _notifications.where((n) => !n.isRead).length;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      await apiService.markNotificationRead(id);
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == id);
        if (index != -1) {
          _notifications[index] = NotificationModel(
            id: _notifications[index].id,
            title: _notifications[index].title,
            titleAr: _notifications[index].titleAr,
            body: _notifications[index].body,
            bodyAr: _notifications[index].bodyAr,
            type: _notifications[index].type,
            isRead: true,
            createdAt: _notifications[index].createdAt,
            data: _notifications[index].data,
          );
          _unreadCount = _notifications.where((n) => !n.isRead).length;
        }
      });
    } catch (_) {}
  }

  Future<void> _markAllAsRead() async {
    try {
      // Use the API if available
      // For now, mark all locally
      setState(() {
        _notifications = _notifications.map((n) => NotificationModel(
          id: n.id,
          title: n.title,
          titleAr: n.titleAr,
          body: n.body,
          bodyAr: n.bodyAr,
          type: n.type,
          isRead: true,
          createdAt: n.createdAt,
          data: n.data,
        )).toList();
        _unreadCount = 0;
      });
    } catch (_) {}
  }

  void _handleNotificationTap(NotificationModel notification) {
    if (!notification.isRead) {
      _markAsRead(notification.id);
    }

    // Navigate based on notification type
    final data = notification.data;
    switch (notification.type) {
      case 'trip':
        final tripId = data?['tripId'];
        if (tripId != null) {
          context.push('/trip');
        }
        break;
      case 'promo':
        context.push('/promos');
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('قراءة الكل'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.separated(
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final notification = _notifications[index];
                      return _NotificationTile(
                        notification: notification,
                        onTap: () => _handleNotificationTap(notification),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_off_outlined,
            size: 80.r,
            color: Colors.grey[300],
          ),
          SizedBox(height: 16.h),
          Text(
            'لا توجد إشعارات',
            style: TextStyle(
              fontSize: 18.sp,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'ستظهر هنا إشعارات الرحلات والعروض',
            style: TextStyle(
              fontSize: 14.sp,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.notification,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      tileColor: notification.isRead ? null : Colors.blue.withAlpha(13),
      leading: CircleAvatar(
        backgroundColor: _getIconColor().withAlpha(25),
        child: Icon(_getIcon(), color: _getIconColor()),
      ),
      title: Text(
        notification.titleAr,
        style: TextStyle(
          fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            notification.bodyAr,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          SizedBox(height: 4.h),
          Text(
            timeago.format(notification.createdAt, locale: 'ar'),
            style: TextStyle(
              fontSize: 12.sp,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
      trailing: notification.isRead
          ? null
          : Container(
              width: 8.w,
              height: 8.w,
              decoration: const BoxDecoration(
                color: Colors.blue,
                shape: BoxShape.circle,
              ),
            ),
    );
  }

  IconData _getIcon() {
    switch (notification.type) {
      case 'trip':
        return Icons.directions_car;
      case 'promo':
        return Icons.local_offer;
      case 'earnings':
        return Icons.account_balance_wallet;
      case 'system':
      default:
        return Icons.notifications;
    }
  }

  Color _getIconColor() {
    switch (notification.type) {
      case 'trip':
        return Colors.blue;
      case 'promo':
        return Colors.pink;
      case 'earnings':
        return Colors.green;
      case 'system':
      default:
        return Colors.grey;
    }
  }
}
