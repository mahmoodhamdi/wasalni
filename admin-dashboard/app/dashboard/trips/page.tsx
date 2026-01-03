'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MapPin, Eye, RefreshCw } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { tripsApi } from '@/lib/api';

interface Trip {
  _id: string;
  passenger?: {
    user?: {
      name: string;
      phone: string;
    };
  };
  driver?: {
    user?: {
      name: string;
      phone: string;
    };
  };
  pickup: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dropoff: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rideType: string;
  status: string;
  fare: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare: number;
    discount: number;
    total: number;
    platformFee: number;
    driverEarnings: number;
  };
  distance: number;
  duration: number;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface TripStats {
  total: number;
  completed: number;
  cancelled: number;
  inProgress: number;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<TripStats>({ total: 0, completed: 0, cancelled: 0, inProgress: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const fetchTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { status?: string; from?: string; to?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) {
        params.from = dateFilter;
        params.to = dateFilter;
      }

      const [tripsResponse, statsResponse] = await Promise.all([
        tripsApi.getAll(params),
        tripsApi.getStats(params),
      ]);

      if (tripsResponse.data.success) {
        setTrips(tripsResponse.data.data.trips);
      }
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const columns: ColumnDef<Trip, unknown>[] = [
    {
      accessorKey: '_id',
      header: 'رقم الرحلة',
      cell: ({ row }) => `#${row.original._id.slice(-6).toUpperCase()}`,
    },
    {
      accessorKey: 'passenger',
      header: 'الراكب',
      cell: ({ row }) => row.original.passenger?.user?.name || '-',
    },
    {
      accessorKey: 'driver',
      header: 'السائق',
      cell: ({ row }) => row.original.driver?.user?.name || '-',
    },
    {
      accessorKey: 'pickup',
      header: 'من',
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate" title={row.original.pickup.address}>
          {row.original.pickup.address}
        </div>
      ),
    },
    {
      accessorKey: 'dropoff',
      header: 'إلى',
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate" title={row.original.dropoff.address}>
          {row.original.dropoff.address}
        </div>
      ),
    },
    {
      accessorKey: 'rideType',
      header: 'نوع الرحلة',
      cell: ({ row }) => {
        const types: Record<string, string> = {
          economy: 'اقتصادي',
          comfort: 'مريح',
          family: 'عائلي',
          tuktuk: 'توكتوك',
          motorcycle: 'موتوسيكل',
        };
        return types[row.original.rideType] || row.original.rideType;
      },
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const statusStyles: Record<string, string> = {
          pending: 'bg-amber-100 text-amber-700',
          searching: 'bg-blue-100 text-blue-700',
          accepted: 'bg-purple-100 text-purple-700',
          arriving: 'bg-cyan-100 text-cyan-700',
          arrived: 'bg-indigo-100 text-indigo-700',
          in_progress: 'bg-blue-100 text-blue-700',
          completed: 'bg-emerald-100 text-emerald-700',
          cancelled: 'bg-red-100 text-red-700',
        };
        const statusLabels: Record<string, string> = {
          pending: 'في الانتظار',
          searching: 'جاري البحث',
          accepted: 'مقبولة',
          arriving: 'في الطريق',
          arrived: 'وصل',
          in_progress: 'جارية',
          completed: 'مكتملة',
          cancelled: 'ملغاة',
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              statusStyles[row.original.status] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {statusLabels[row.original.status] || row.original.status}
          </span>
        );
      },
    },
    {
      accessorKey: 'fare',
      header: 'الأجرة',
      cell: ({ row }) => `${(row.original.fare?.total || 0).toFixed(2)} ج.م`,
    },
    {
      accessorKey: 'createdAt',
      header: 'التاريخ',
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString('ar-EG'),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: () => (
        <button
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          title="عرض التفاصيل"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

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
        <h1 className="text-2xl font-bold text-slate-900">الرحلات</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="in_progress">جارية</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          />
          <button
            onClick={fetchTrips}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            title="تحديث"
          >
            <RefreshCw size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي الرحلات</p>
              <p className="text-xl font-bold text-slate-900">{stats.total.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MapPin size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">مكتملة</p>
              <p className="text-xl font-bold text-slate-900">{stats.completed.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <MapPin size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">جارية</p>
              <p className="text-xl font-bold text-slate-900">{stats.inProgress.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <MapPin size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">ملغاة</p>
              <p className="text-xl font-bold text-slate-900">{stats.cancelled.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={trips}
        columns={columns}
        searchPlaceholder="بحث عن رحلة..."
      />
    </div>
  );
}
