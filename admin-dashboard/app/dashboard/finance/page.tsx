'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, RefreshCw } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import { financeApi } from '@/lib/api';

interface FinanceStats {
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalPlatformFees: number;
  totalDriverEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
}

interface RevenueChartData {
  date: string;
  revenue: number;
  trips: number;
}

export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [chartData, setChartData] = useState<RevenueChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartDays, setChartDays] = useState(7);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsResponse, chartResponse] = await Promise.all([
        financeApi.getStats(),
        financeApi.getRevenueChart(chartDays),
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.stats);
      }
      if (chartResponse.data.success) {
        setChartData(chartResponse.data.data.chart || []);
      }
    } catch (err) {
      console.error('Failed to fetch finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [chartDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const defaultStats: FinanceStats = {
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalPlatformFees: 0,
    totalDriverEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
  };

  const s = { ...defaultStats, ...(stats || {}) };

  // Helper function to safely format numbers
  const formatNumber = (num: number | undefined | null) => (num ?? 0).toLocaleString('ar-EG');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">المالية</h1>
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
          title="تحديث"
        >
          <RefreshCw size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="إيرادات اليوم"
          value={`${formatNumber(s.todayRevenue)} ج.م`}
          icon={DollarSign}
          change={{ value: 12, type: 'increase' }}
        />
        <StatsCard
          title="إيرادات الأسبوع"
          value={`${formatNumber(s.weekRevenue)} ج.م`}
          icon={TrendingUp}
          change={{ value: 8, type: 'increase' }}
        />
        <StatsCard
          title="إيرادات الشهر"
          value={`${formatNumber(s.monthRevenue)} ج.م`}
          icon={Wallet}
          change={{ value: 15, type: 'increase' }}
        />
        <StatsCard
          title="إجمالي الإيرادات"
          value={`${formatNumber(s.totalRevenue)} ج.م`}
          icon={CreditCard}
        />
      </div>

      {/* Platform Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">عمولة المنصة</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(s.totalPlatformFees)} ج.م
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">أرباح السائقين</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(s.totalDriverEarnings)} ج.م
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">مدفوعات معلقة</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(s.pendingPayouts)} ج.م
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">مدفوعات مكتملة</p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(s.completedPayouts)} ج.م
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">الإيرادات اليومية</h3>
          <select
            value={chartDays}
            onChange={(e) => setChartDays(Number(e.target.value))}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={14}>آخر 14 يوم</option>
            <option value={30}>آخر 30 يوم</option>
          </select>
        </div>

        {chartData.length > 0 ? (
          <div className="space-y-4">
            {/* Simple bar chart */}
            <div className="flex items-end gap-2 h-48">
              {chartData.map((day, index) => {
                const maxRevenue = Math.max(...chartData.map((d) => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-emerald-500 rounded-t-lg transition-all duration-300 hover:bg-emerald-600"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${day.revenue.toLocaleString('ar-EG')} ج.م`}
                    />
                    <p className="text-xs text-slate-500 mt-2 truncate w-full text-center">
                      {new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'short' })}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-sm text-slate-600">الإيرادات</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-slate-500">
            لا توجد بيانات متاحة
          </div>
        )}
      </div>

      {/* Recent Transactions would go here */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">آخر المعاملات</h3>
        <div className="text-center py-8 text-slate-500">
          سيتم عرض المعاملات الأخيرة هنا
        </div>
      </div>
    </div>
  );
}
