'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Car, MapPin, DollarSign, Clock, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { dashboardApi, driversApi, tripsApi } from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  totalPassengers: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  activeTrips: number;
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  avgRating: number;
}

interface PendingDriver {
  _id: string;
  user?: {
    _id: string;
    name: string;
    phone: string;
  };
  vehicleType: string;
  createdAt: string;
}

interface RecentTrip {
  _id: string;
  tripNumber: string;
  status: string;
  rideType: string;
  pickup?: {
    address: string;
  };
  dropoff?: {
    address: string;
  };
  fare?: {
    total: number;
  };
  passengerId?: {
    user?: {
      name: string;
    };
  };
  createdAt: string;
}

const defaultStats: DashboardStats = {
  totalPassengers: 0,
  totalDrivers: 0,
  activeDrivers: 0,
  pendingDrivers: 0,
  totalTrips: 0,
  completedTrips: 0,
  cancelledTrips: 0,
  activeTrips: 0,
  totalRevenue: 0,
  todayRevenue: 0,
  weekRevenue: 0,
  monthRevenue: 0,
  avgRating: 0,
};

const statusLabels: Record<string, { label: string; color: string }> = {
  searching: { label: 'بحث', color: 'bg-yellow-100 text-yellow-700' },
  driver_assigned: { label: 'تم التعيين', color: 'bg-blue-100 text-blue-700' },
  driver_arriving: { label: 'في الطريق', color: 'bg-blue-100 text-blue-700' },
  driver_arrived: { label: 'وصل', color: 'bg-purple-100 text-purple-700' },
  trip_started: { label: 'جارية', color: 'bg-indigo-100 text-indigo-700' },
  trip_completed: { label: 'مكتملة', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'ملغية', color: 'bg-red-100 text-red-700' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingDrivers = useCallback(async () => {
    try {
      const response = await driversApi.getAll({ status: 'pending' });
      if (response.data.success) {
        setPendingDrivers(response.data.data.drivers?.slice(0, 3) || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending drivers:', err);
    }
  }, []);

  const fetchRecentTrips = useCallback(async () => {
    try {
      const response = await tripsApi.getRecent(5);
      if (response.data.success) {
        setRecentTrips(response.data.data.trips || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent trips:', err);
    }
  }, []);

  const handleApprove = async (driverId: string) => {
    try {
      setActionLoading(driverId);
      const response = await driversApi.approve(driverId);
      if (response.data.success) {
        fetchPendingDrivers();
        const statsResponse = await dashboardApi.getStats();
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data.stats);
        }
        alert('تمت الموافقة على السائق بنجاح');
      }
    } catch (err: any) {
      console.error('Failed to approve driver:', err);
      alert(err.response?.data?.messageAr || 'فشل في الموافقة على السائق');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (driverId: string) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;

    try {
      setActionLoading(driverId);
      const response = await driversApi.reject(driverId, reason);
      if (response.data.success) {
        fetchPendingDrivers();
        const statsResponse = await dashboardApi.getStats();
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data.stats);
        }
        alert('تم رفض السائق');
      }
    } catch (err: any) {
      console.error('Failed to reject driver:', err);
      alert(err.response?.data?.messageAr || 'فشل في رفض السائق');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsResponse] = await Promise.all([
          dashboardApi.getStats(),
          fetchPendingDrivers(),
          fetchRecentTrips(),
        ]);
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data.stats);
        }
      } catch (err: any) {
        console.error('Failed to fetch stats:', err);
        setError('فشل في تحميل الإحصائيات');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchPendingDrivers, fetchRecentTrips]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `منذ ${diff} ثانية`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="text-sm text-slate-500">
          آخر تحديث: {new Date().toLocaleString('ar-EG')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="إجمالي الركاب"
          value={stats.totalPassengers.toLocaleString('ar-EG')}
          icon={Users}
        />
        <StatsCard
          title="السائقين النشطين"
          value={`${stats.activeDrivers} / ${stats.totalDrivers}`}
          icon={Car}
        />
        <StatsCard
          title="إجمالي الرحلات"
          value={stats.totalTrips.toLocaleString('ar-EG')}
          icon={MapPin}
        />
        <StatsCard
          title="إيرادات اليوم"
          value={`${stats.todayRevenue.toLocaleString('ar-EG')} ج.م`}
          icon={DollarSign}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="طلبات انتظار الموافقة"
          value={stats.pendingDrivers}
          icon={Clock}
        />
        <StatsCard
          title="الرحلات المكتملة"
          value={stats.totalTrips > 0 ? `${((stats.completedTrips / stats.totalTrips) * 100).toFixed(1)}%` : '0%'}
          icon={CheckCircle}
        />
        <StatsCard
          title="متوسط التقييم"
          value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ★` : '-'}
          icon={TrendingUp}
        />
        <StatsCard
          title="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString('ar-EG')} ج.م`}
          icon={DollarSign}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              طلبات انتظار الموافقة
            </h3>
            {pendingDrivers.length > 0 && (
              <Link href="/dashboard/drivers/pending" className="text-sm text-emerald-600 hover:underline">
                عرض الكل
              </Link>
            )}
          </div>
          {pendingDrivers.length > 0 ? (
            <div className="space-y-4">
              {pendingDrivers.map((driver) => (
                <div
                  key={driver._id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Car size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{driver.user?.name || 'سائق جديد'}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(driver.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(driver._id)}
                      disabled={actionLoading === driver._id}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actionLoading === driver._id ? '...' : 'موافقة'}
                    </button>
                    <button
                      onClick={() => handleReject(driver._id)}
                      disabled={actionLoading === driver._id}
                      className="px-3 py-1 border border-red-600 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              لا توجد طلبات في الانتظار
            </p>
          )}
        </div>

        {/* Recent Trips */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              آخر الرحلات
            </h3>
            <Link href="/dashboard/trips" className="text-sm text-emerald-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          {recentTrips.length > 0 ? (
            <div className="space-y-4">
              {recentTrips.map((trip) => {
                const statusInfo = statusLabels[trip.status] || { label: trip.status, color: 'bg-gray-100 text-gray-700' };
                return (
                  <Link
                    key={trip._id}
                    href={`/dashboard/trips/${trip._id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <MapPin size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {trip.tripNumber || `رحلة #${trip._id.slice(-6)}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {trip.passengerId?.user?.name || 'راكب'} • {formatTimeAgo(trip.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trip.fare?.total && (
                        <span className="text-sm text-slate-600">
                          {trip.fare.total} ج.م
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              لا توجد رحلات حديثة
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
