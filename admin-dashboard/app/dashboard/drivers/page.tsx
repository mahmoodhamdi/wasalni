'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Car, Check, X, Eye, RefreshCw, Ban, Play } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { driversApi } from '@/lib/api';

interface Driver {
  _id: string;
  user?: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    profileImage?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isOnline: boolean;
  isAvailable: boolean;
  vehicleType: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
  };
  rating: number;
  totalTrips: number;
  createdAt: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;

      const response = await driversApi.getAll(params);
      if (response.data.success) {
        setDrivers(response.data.data.drivers);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleApprove = async (driverId: string) => {
    try {
      setActionLoading(driverId);
      await driversApi.approve(driverId);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to approve driver:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (driverId: string) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;

    try {
      setActionLoading(driverId);
      await driversApi.reject(driverId, reason);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to reject driver:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (driverId: string) => {
    const reason = prompt('سبب الإيقاف:');
    if (!reason) return;

    try {
      setActionLoading(driverId);
      await driversApi.suspend(driverId, reason);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to suspend driver:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (driverId: string) => {
    try {
      setActionLoading(driverId);
      await driversApi.activate(driverId);
      fetchDrivers();
    } catch (err) {
      console.error('Failed to activate driver:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<Driver, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'الاسم',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Car size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.original.user?.name || '-'}</p>
            <p className="text-sm text-slate-500">{row.original.user?.phone || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'vehicleType',
      header: 'نوع المركبة',
      cell: ({ row }) => {
        const types: Record<string, string> = {
          economy: 'اقتصادي',
          comfort: 'مريح',
          family: 'عائلي',
          tuktuk: 'توكتوك',
          motorcycle: 'موتوسيكل',
        };
        return (
          <div>
            <p className="text-slate-800 font-medium">{types[row.original.vehicleType] || row.original.vehicleType}</p>
            {row.original.vehicle && (
              <p className="text-xs text-slate-500">
                {row.original.vehicle.make} {row.original.vehicle.model}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
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
        return (
          <span
            className={`px-3 py-1 rounded-full text-sm ${statusStyles[row.original.status]}`}
          >
            {statusLabels[row.original.status]}
          </span>
        );
      },
    },
    {
      accessorKey: 'isOnline',
      header: 'متصل',
      cell: ({ row }) => (
        <span
          className={`w-3 h-3 rounded-full inline-block ${
            row.original.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        />
      ),
    },
    {
      accessorKey: 'rating',
      header: 'التقييم',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-amber-500">★</span>
          <span className="text-slate-800 font-medium">{(row.original.rating || 0).toFixed(1)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalTrips',
      header: 'الرحلات',
      cell: ({ row }) => (
        <span className="text-slate-800 font-semibold">{row.original.totalTrips || 0}</span>
      ),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }) => {
        const driver = row.original;
        const isActioning = actionLoading === driver._id;

        return (
          <div className="flex items-center gap-1">
            <button
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              title="عرض التفاصيل"
              disabled={isActioning}
            >
              <Eye size={18} />
            </button>

            {driver.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove(driver._id)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                  title="موافقة"
                  disabled={isActioning}
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => handleReject(driver._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="رفض"
                  disabled={isActioning}
                >
                  <X size={18} />
                </button>
              </>
            )}

            {driver.status === 'approved' && (
              <button
                onClick={() => handleSuspend(driver._id)}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50"
                title="إيقاف"
                disabled={isActioning}
              >
                <Ban size={18} />
              </button>
            )}

            {driver.status === 'suspended' && (
              <button
                onClick={() => handleActivate(driver._id)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                title="تفعيل"
                disabled={isActioning}
              >
                <Play size={18} />
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
        <h1 className="text-2xl font-bold text-slate-900">السائقين</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="approved">مفعّل</option>
            <option value="suspended">موقوف</option>
            <option value="rejected">مرفوض</option>
          </select>
          <button
            onClick={fetchDrivers}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            title="تحديث"
          >
            <RefreshCw size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      <DataTable
        data={drivers}
        columns={columns}
        searchPlaceholder="بحث عن سائق..."
      />
    </div>
  );
}
