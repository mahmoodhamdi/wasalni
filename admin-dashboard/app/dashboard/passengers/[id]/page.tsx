'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Phone, Mail, Star, MapPin, Calendar, Ban, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { passengersApi, tripsApi } from '@/lib/api';

interface Passenger {
  _id: string;
  user?: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    profileImage?: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
  };
  homeAddress?: { address: string };
  workAddress?: { address: string };
  rating: number;
  totalTrips: number;
  totalSpent: number;
  createdAt: string;
}

interface Trip {
  _id: string;
  pickup: { address: string };
  dropoff: { address: string };
  status: string;
  fare: { total: number };
  createdAt: string;
}

export default function PassengerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const passengerId = params.id as string;

  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPassenger = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await passengersApi.getById(passengerId);
      if (response.data.success) {
        setPassenger(response.data.data.passenger);
      }
    } catch (err) {
      console.error('Failed to fetch passenger:', err);
    } finally {
      setIsLoading(false);
    }
  }, [passengerId]);

  const fetchTrips = useCallback(async () => {
    try {
      const response = await tripsApi.getAll({ passengerId, limit: 10 } as unknown as Parameters<typeof tripsApi.getAll>[0]);
      if (response.data.success) {
        setTrips(response.data.data.trips || []);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    }
  }, [passengerId]);

  useEffect(() => {
    fetchPassenger();
    fetchTrips();
  }, [fetchPassenger, fetchTrips]);

  const handleToggleActive = async () => {
    try {
      setActionLoading(true);
      await passengersApi.toggleActive(passengerId);
      fetchPassenger();
    } catch (err) {
      console.error('Failed to toggle active:', err);
      alert('فشل في تغيير حالة الراكب');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!passenger) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-700">الراكب غير موجود</h2>
        <button
          onClick={() => router.push('/dashboard/passengers')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
        >
          العودة للركاب
        </button>
      </div>
    );
  }

  const isActive = passenger.user?.isActive ?? true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/passengers')}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {passenger.user?.name}
            </h1>
            <p className="text-slate-500">تفاصيل الراكب</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPassenger}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
          >
            <RefreshCw size={20} className="text-slate-600" />
          </button>
          <button
            onClick={handleToggleActive}
            disabled={actionLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
              isActive
                ? 'border border-red-600 text-red-600 hover:bg-red-50'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isActive ? (
              <>
                <Ban size={18} />
                حظر
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                إلغاء الحظر
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={40} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{passenger.user?.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-blue-100">
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {passenger.user?.phone}
                    </span>
                    {passenger.user?.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {passenger.user?.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-yellow-300">
                    <Star size={20} fill="currentColor" />
                    <span className="text-2xl font-bold">
                      {(passenger.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-100">التقييم</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {passenger.totalTrips || 0}
                  </p>
                  <p className="text-sm text-slate-500">رحلة</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {(passenger.totalSpent || 0).toLocaleString('ar-EG')}
                  </p>
                  <p className="text-sm text-slate-500">ج.م إنفاق</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isActive ? 'نشط' : 'محظور'}
                  </span>
                  <p className="text-sm text-slate-500 mt-1">الحالة</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      passenger.user?.isVerified
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {passenger.user?.isVerified ? 'موثق' : 'غير موثق'}
                  </span>
                  <p className="text-sm text-slate-500 mt-1">التحقق</p>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              العناوين المحفوظة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-emerald-600" />
                  <span className="font-medium text-slate-900">المنزل</span>
                </div>
                <p className="text-sm text-slate-600">
                  {passenger.homeAddress?.address || 'غير محدد'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-blue-600" />
                  <span className="font-medium text-slate-900">العمل</span>
                </div>
                <p className="text-sm text-slate-600">
                  {passenger.workAddress?.address || 'غير محدد'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Trips */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              آخر الرحلات
            </h3>
            {trips.length > 0 ? (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip._id}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                    onClick={() => router.push(`/dashboard/trips/${trip._id}`)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {trip.pickup.address}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        إلى: {trip.dropoff.address}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">
                        {trip.fare.total.toFixed(2)} ج.م
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(trip.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">لا توجد رحلات</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              إحصائيات
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-slate-500" />
                  <span className="text-slate-600">الرحلات</span>
                </div>
                <span className="font-bold text-slate-900">{passenger.totalTrips || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-slate-500" />
                  <span className="text-slate-600">التقييم</span>
                </div>
                <span className="font-bold text-amber-500">
                  {(passenger.rating || 0).toFixed(1)} ★
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-500" />
                  <span className="text-slate-600">تاريخ التسجيل</span>
                </div>
                <span className="font-bold text-slate-900">
                  {new Date(passenger.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              التواصل
            </h3>
            <div className="space-y-3">
              <a
                href={`tel:${passenger.user?.phone}`}
                className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <Phone size={18} />
                <span>اتصال</span>
              </a>
              {passenger.user?.email && (
                <a
                  href={`mailto:${passenger.user?.email}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <Mail size={18} />
                  <span>بريد إلكتروني</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
