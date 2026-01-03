'use client';

import { useEffect, useState } from 'react';
import { Users, Car, MapPin, DollarSign, Clock, CheckCircle } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { DashboardStats } from '@/types';

// Mock data for now
const mockStats: DashboardStats = {
  totalPassengers: 1250,
  totalDrivers: 85,
  activeDrivers: 32,
  totalTrips: 5420,
  completedTrips: 4850,
  cancelledTrips: 320,
  totalRevenue: 125000,
  todayRevenue: 3500,
  pendingDriverApprovals: 5,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real stats from API
    setTimeout(() => {
      setStats(mockStats);
      setIsLoading(false);
    }, 500);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="طلبات انتظار الموافقة"
          value={stats.pendingDriverApprovals}
          icon={Clock}
        />
        <StatsCard
          title="الرحلات المكتملة"
          value={`${((stats.completedTrips / stats.totalTrips) * 100).toFixed(1)}%`}
          icon={CheckCircle}
        />
        <StatsCard
          title="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString('ar-EG')} ج.م`}
          icon={DollarSign}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            طلبات انتظار الموافقة
          </h3>
          {stats.pendingDriverApprovals > 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].slice(0, stats.pendingDriverApprovals).map((i) => (
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
