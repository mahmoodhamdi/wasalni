'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Car, User, Phone, Mail, Star, MapPin, Calendar, Ban, Play, ArrowRight, RefreshCw, Wallet } from 'lucide-react';
import { driversApi, tripsApi } from '@/lib/api';

interface Driver {
  _id: string;
  user?: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    profileImage?: string;
    createdAt: string;
  };
  nationalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isOnline: boolean;
  isAvailable: boolean;
  vehicleType: string;
  vehicleCategory: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
  };
  rating: number;
  totalTrips: number;
  totalEarnings: number;
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

export default function DriverDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDriver = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await driversApi.getById(driverId);
      if (response.data.success) {
        setDriver(response.data.data.driver);
      }
    } catch (err) {
      console.error('Failed to fetch driver:', err);
    } finally {
      setIsLoading(false);
    }
  }, [driverId]);

  const fetchTrips = useCallback(async () => {
    try {
      const response = await tripsApi.getAll({ driverId, limit: 10 } as unknown as Parameters<typeof tripsApi.getAll>[0]);
      if (response.data.success) {
        setTrips(response.data.data.trips || []);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    }
  }, [driverId]);

  useEffect(() => {
    fetchDriver();
    fetchTrips();
  }, [fetchDriver, fetchTrips]);

  const handleSuspend = async () => {
    const reason = prompt('سبب الإيقاف:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await driversApi.suspend(driverId, reason);
      fetchDriver();
    } catch (err) {
      console.error('Failed to suspend driver:', err);
      alert('فشل في إيقاف السائق');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setActionLoading(true);
      await driversApi.activate(driverId);
      fetchDriver();
    } catch (err) {
      console.error('Failed to activate driver:', err);
      alert('فشل في تفعيل السائق');
    } finally {
      setActionLoading(false);
    }
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-slate-100 text-slate-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'في الانتظار',
    approved: 'مفعّل',
    rejected: 'مرفوض',
    suspended: 'موقوف',
  };

  const vehicleTypeLabels: Record<string, string> = {
    car: 'سيارة',
    tuktuk: 'توكتوك',
    motorcycle: 'موتوسيكل',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-700">السائق غير موجود</h2>
        <button
          onClick={() => router.push('/dashboard/drivers')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
        >
          العودة للسائقين
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/drivers')}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {driver.user?.name}
            </h1>
            <p className="text-slate-500">تفاصيل السائق</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDriver}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
          >
            <RefreshCw size={20} className="text-slate-600" />
          </button>
          {driver.status === 'approved' && (
            <button
              onClick={handleSuspend}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              <Ban size={18} />
              إيقاف
            </button>
          )}
          {driver.status === 'suspended' && (
            <button
              onClick={handleActivate}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play size={18} />
              تفعيل
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={40} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{driver.user?.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-emerald-100">
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {driver.user?.phone}
                    </span>
                    {driver.user?.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {driver.user?.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-yellow-300">
                    <Star size={20} fill="currentColor" />
                    <span className="text-2xl font-bold">
                      {(driver.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-100">التقييم</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {driver.totalTrips || 0}
                  </p>
                  <p className="text-sm text-slate-500">رحلة</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {(driver.totalEarnings || 0).toLocaleString('ar-EG')}
                  </p>
                  <p className="text-sm text-slate-500">ج.م أرباح</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${statusStyles[driver.status]}`}
                  >
                    {statusLabels[driver.status]}
                  </span>
                  <p className="text-sm text-slate-500 mt-1">الحالة</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <span
                    className={`w-3 h-3 rounded-full inline-block ${
                      driver.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    {driver.isOnline ? 'متصل' : 'غير متصل'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              بيانات المركبة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">نوع المركبة</p>
                <p className="font-medium text-slate-900">
                  {vehicleTypeLabels[driver.vehicleType] || driver.vehicleType}
                </p>
              </div>
              {driver.vehicle && (
                <>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">الماركة</p>
                    <p className="font-medium text-slate-900">
                      {driver.vehicle.make} {driver.vehicle.model}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">سنة الصنع</p>
                    <p className="font-medium text-slate-900">{driver.vehicle.year}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">اللون</p>
                    <p className="font-medium text-slate-900">{driver.vehicle.color}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">رقم اللوحة</p>
                    <p className="font-medium text-slate-900">{driver.vehicle.plateNumber}</p>
                  </div>
                </>
              )}
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
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <MapPin size={18} className="text-emerald-600" />
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
              إحصائيات سريعة
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Car size={18} className="text-slate-500" />
                  <span className="text-slate-600">الرحلات</span>
                </div>
                <span className="font-bold text-slate-900">{driver.totalTrips || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-slate-500" />
                  <span className="text-slate-600">الأرباح</span>
                </div>
                <span className="font-bold text-emerald-600">
                  {(driver.totalEarnings || 0).toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-slate-500" />
                  <span className="text-slate-600">التقييم</span>
                </div>
                <span className="font-bold text-amber-500">
                  {(driver.rating || 0).toFixed(1)} ★
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-500" />
                  <span className="text-slate-600">تاريخ التسجيل</span>
                </div>
                <span className="font-bold text-slate-900">
                  {new Date(driver.createdAt).toLocaleDateString('ar-EG')}
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
                href={`tel:${driver.user?.phone}`}
                className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
              >
                <Phone size={18} />
                <span>اتصال</span>
              </a>
              {driver.user?.email && (
                <a
                  href={`mailto:${driver.user?.email}`}
                  className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
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
