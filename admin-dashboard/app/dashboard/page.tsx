'use client';

import { useEffect, useState } from 'react';
import { Users, Car, MapPin, DollarSign, Clock, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { dashboardApi } from '@/lib/api';

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardApi.getStats();
        if (response.data.success) {
          setStats(response.data.data.stats);
        }
      } catch (err: any) {
        console.error('Failed to fetch stats:', err);
        setError('فشل في تحميل الإحصائيات');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

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
          change={{ value: 12, type: 'increase' }}
        />
        <StatsCard
          title="السائقين النشطين"
          value={`${stats.activeDrivers} / ${stats.totalDrivers}`}
          icon={Car}
          change={{ value: 5, type: 'increase' }}
        />
        <StatsCard
          title="الرحلات اليوم"
          value={stats.completedTrips.toLocaleString('ar-EG')}
          icon={MapPin}
          change={{ value: 8, type: 'increase' }}
        />
        <StatsCard
          title="إيرادات اليوم"
          value={`${stats.todayRevenue.toLocaleString('ar-EG')} ج.م`}
          icon={DollarSign}
          change={{ value: 15, type: 'increase' }}
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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            طلبات انتظار الموافقة
          </h3>
          {stats.pendingDrivers > 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].slice(0, Math.min(stats.pendingDrivers, 3)).map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Car size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">سائق جديد {i}</p>
                      <p className="text-sm text-slate-500">منذ ساعتين</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                      موافقة
                    </button>
                    <button className="px-3 py-1 border border-red-600 text-red-600 rounded-lg text-sm hover:bg-red-50">
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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            آخر الرحلات
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      رحلة #{1000 + i}
                    </p>
                    <p className="text-sm text-slate-500">منذ {i * 5} دقائق</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  مكتملة
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
