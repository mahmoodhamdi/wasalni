'use client';

import { useState } from 'react';
import { Bell, Send, Users, Car, UserCircle, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface NotificationForm {
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  targetType: 'all' | 'drivers' | 'passengers' | 'specific';
  targetIds: string[];
  data?: Record<string, string>;
}

export default function NotificationsPage() {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    titleAr: '',
    body: '',
    bodyAr: '',
    targetType: 'all',
    targetIds: [],
    data: {},
  });
  const [isSending, setIsSending] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<
    { title: string; targetType: string; sentAt: Date; count: number }[]
  >([]);

  const handleSend = async () => {
    if (!form.titleAr || !form.bodyAr) {
      alert('يرجى ملء العنوان والمحتوى');
      return;
    }

    setIsSending(true);
    try {
      const response = await api.post('/admin/notifications/send', {
        title: form.title || form.titleAr,
        titleAr: form.titleAr,
        body: form.body || form.bodyAr,
        bodyAr: form.bodyAr,
        targetType: form.targetType,
        targetIds: form.targetIds,
        data: form.data,
      });

      if (response.data.success) {
        setSentNotifications((prev) => [
          {
            title: form.titleAr,
            targetType: form.targetType,
            sentAt: new Date(),
            count: response.data.data.sentCount || 0,
          },
          ...prev,
        ]);

        // Reset form
        setForm({
          title: '',
          titleAr: '',
          body: '',
          bodyAr: '',
          targetType: 'all',
          targetIds: [],
          data: {},
        });

        alert('تم إرسال الإشعار بنجاح');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('فشل في إرسال الإشعار');
    } finally {
      setIsSending(false);
    }
  };

  const targetOptions = [
    { value: 'all', label: 'الجميع', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { value: 'drivers', label: 'السائقين', icon: Car, color: 'bg-emerald-100 text-emerald-600' },
    { value: 'passengers', label: 'الركاب', icon: UserCircle, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الإشعارات</h1>
          <p className="text-slate-500">إرسال إشعارات للمستخدمين</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">إرسال إشعار جديد</h2>

            {/* Target Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                إرسال إلى
              </label>
              <div className="flex flex-wrap gap-3">
                {targetOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setForm({ ...form, targetType: option.value as NotificationForm['targetType'] })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      form.targetType === option.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${option.color}`}>
                      <option.icon size={16} />
                    </div>
                    <span className="font-medium text-slate-900">{option.label}</span>
                    {form.targetType === option.value && (
                      <Check size={16} className="text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Content */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  العنوان (عربي) *
                </label>
                <input
                  type="text"
                  value={form.titleAr}
                  onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                  placeholder="عنوان الإشعار"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Notification Title"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  المحتوى (عربي) *
                </label>
                <textarea
                  value={form.bodyAr}
                  onChange={(e) => setForm({ ...form, bodyAr: e.target.value })}
                  placeholder="محتوى الإشعار..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  المحتوى (إنجليزي)
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Notification body..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 mb-2">معاينة الإشعار:</p>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {form.titleAr || 'عنوان الإشعار'}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {form.bodyAr || 'محتوى الإشعار سيظهر هنا...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSend}
                disabled={isSending || !form.titleAr || !form.bodyAr}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                <span>إرسال الإشعار</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Sent */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">الإشعارات المرسلة</h2>

            {sentNotifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Bell size={48} className="mx-auto mb-4 text-slate-300" />
                <p>لم يتم إرسال إشعارات بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentNotifications.map((notification, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-900 text-sm">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-emerald-600">
                        {notification.count} مستلم
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {notification.targetType === 'all'
                          ? 'الجميع'
                          : notification.targetType === 'drivers'
                          ? 'السائقين'
                          : 'الركاب'}
                      </span>
                      <span>
                        {notification.sentAt.toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Templates */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">قوالب سريعة</h2>
            <div className="space-y-2">
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    titleAr: 'عرض خاص! 🎉',
                    bodyAr: 'احصل على خصم 20% على رحلتك القادمة. استخدم الكود: SAVE20',
                  })
                }
                className="w-full text-right p-3 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm"
              >
                <p className="font-medium text-slate-900">عرض خاص</p>
                <p className="text-slate-500">خصم على الرحلات</p>
              </button>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    titleAr: 'تحديث مهم ⚠️',
                    bodyAr: 'تم تحديث التطبيق. يرجى التحديث للاستمتاع بأحدث الميزات.',
                  })
                }
                className="w-full text-right p-3 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm"
              >
                <p className="font-medium text-slate-900">تحديث التطبيق</p>
                <p className="text-slate-500">إعلام عن تحديث جديد</p>
              </button>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    titleAr: 'رمضان كريم 🌙',
                    bodyAr: 'كل عام وأنتم بخير. استمتع برحلات مجانية خلال شهر رمضان المبارك!',
                  })
                }
                className="w-full text-right p-3 bg-slate-50 rounded-lg hover:bg-slate-100 text-sm"
              >
                <p className="font-medium text-slate-900">رسالة موسمية</p>
                <p className="text-slate-500">تهنئة بالمناسبات</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
