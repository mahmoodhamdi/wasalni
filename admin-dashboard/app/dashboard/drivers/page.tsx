'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Car, Check, X, Eye } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { Driver } from '@/types';

// Mock data
const mockDrivers: Driver[] = [
  {
    _id: '1',
    phone: '+201234567890',
    name: 'أحمد محمد',
    role: 'driver',
    isActive: true,
    isVerified: true,
    status: 'approved',
    driverStatus: 'online',
    vehicleType: 'economy',
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'أبيض',
      plateNumber: 'أ ب ج 1234',
    },
    documents: {},
    totalTrips: 150,
    rating: 4.8,
    completionRate: 95,
    earnings: 15000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    phone: '+201098765432',
    name: 'محمود علي',
    role: 'driver',
    isActive: true,
    isVerified: false,
    status: 'pending',
    driverStatus: 'offline',
    vehicleType: 'tuktuk',
    vehicle: {
      make: 'Bajaj',
      model: 'RE',
      year: 2022,
      color: 'أصفر',
      plateNumber: 'ط ك ك 567',
    },
    documents: {},
    totalTrips: 0,
    rating: 0,
    completionRate: 0,
    earnings: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
          <p className="font-medium text-slate-900">{row.original.name}</p>
          <p className="text-sm text-slate-500">{row.original.phone}</p>
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
      return types[row.original.vehicleType] || row.original.vehicleType;
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
          className={`px-3 py-1 rounded-full text-sm ${
            statusStyles[row.original.status]
          }`}
        >
          {statusLabels[row.original.status]}
        </span>
      );
    },
  },
  {
    accessorKey: 'driverStatus',
    header: 'متصل',
    cell: ({ row }) => {
      const online = row.original.driverStatus === 'online';
      return (
        <span
          className={`w-3 h-3 rounded-full inline-block ${
            online ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        />
      );
    },
  },
  {
    accessorKey: 'rating',
    header: 'التقييم',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="text-amber-500">★</span>
        <span>{row.original.rating.toFixed(1)}</span>
      </div>
    ),
  },
  {
    accessorKey: 'totalTrips',
    header: 'الرحلات',
  },
  {
    id: 'actions',
    header: 'إجراءات',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          title="عرض التفاصيل"
        >
          <Eye size={18} />
        </button>
        {row.original.status === 'pending' && (
          <>
            <button
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
              title="موافقة"
            >
              <Check size={18} />
            </button>
            <button
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="رفض"
            >
              <X size={18} />
            </button>
          </>
        )}
      </div>
    ),
  },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch drivers from API
    setTimeout(() => {
      setDrivers(mockDrivers);
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
        <h1 className="text-2xl font-bold text-slate-900">السائقين</h1>
        <div className="flex gap-2">
          <select className="px-4 py-2 border border-slate-200 rounded-lg bg-white">
            <option value="">جميع الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="approved">مفعّل</option>
            <option value="suspended">موقوف</option>
          </select>
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
