'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { User, Eye, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { passengersApi } from '@/lib/api';

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
  };
  homeAddress?: {
    address: string;
  };
  workAddress?: {
    address: string;
  };
  rating: number;
  totalTrips: number;
  createdAt: string;
}

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPassengers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;

      const response = await passengersApi.getAll(params);
      if (response.data.success) {
        setPassengers(response.data.data.passengers);
      }
    } catch (err) {
      console.error('Failed to fetch passengers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPassengers();
  }, [fetchPassengers]);

  const handleToggleActive = async (passengerId: string) => {
    try {
      setActionLoading(passengerId);
      await passengersApi.toggleActive(passengerId);
      fetchPassengers();
    } catch (err) {
      console.error('Failed to toggle passenger status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<Passenger, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'الاسم',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.original.user?.name || '-'}</p>
            <p className="text-sm text-slate-500">{row.original.user?.phone || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'البريد الإلكتروني',
      cell: ({ row }) => row.original.user?.email || '-',
    },
    {
      accessorKey: 'isActive',
      header: 'الحالة',
      cell: ({ row }) => {
        const isActive = row.original.user?.isActive ?? true;
        return (
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {isActive ? 'نشط' : 'محظور'}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalTrips',
      header: 'الرحلات',
      cell: ({ row }) => row.original.totalTrips || 0,
    },
    {
      accessorKey: 'rating',
      header: 'التقييم',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-amber-500">★</span>
          <span>{(row.original.rating || 0).toFixed(1)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'تاريخ التسجيل',
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString('ar-EG'),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }) => {
        const passenger = row.original;
        const isActioning = actionLoading === passenger._id;
        const isActive = passenger.user?.isActive ?? true;

        return (
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              title="عرض التفاصيل"
              disabled={isActioning}
            >
              <Eye size={18} />
            </button>
            {isActive ? (
              <button
                onClick={() => handleToggleActive(passenger._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                title="حظر"
                disabled={isActioning}
              >
                <Ban size={18} />
              </button>
            ) : (
              <button
                onClick={() => handleToggleActive(passenger._id)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                title="إلغاء الحظر"
                disabled={isActioning}
              >
                <CheckCircle size={18} />
              </button>
            )}
          </div>
        );
      },
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
        <h1 className="text-2xl font-bold text-slate-900">الركاب</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="blocked">محظور</option>
          </select>
          <button
            onClick={fetchPassengers}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            title="تحديث"
          >
            <RefreshCw size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      <DataTable
        data={passengers}
        columns={columns}
        searchPlaceholder="بحث عن راكب..."
      />
    </div>
  );
}
