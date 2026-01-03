'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MapPin, Eye } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { Trip } from '@/types';

// Mock data
const mockTrips: Trip[] = [
  {
    _id: '1001',
    passenger: {
      _id: 'p1',
      name: 'سارة أحمد',
      phone: '+201111111111',
      role: 'passenger',
      isActive: true,
      isVerified: true,
      totalTrips: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    driver: {
      _id: 'd1',
      name: 'أحمد محمد',
      phone: '+201234567890',
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
    pickup: {
      latitude: 30.45,
      longitude: 30.9667,
      address: 'الباجور، المنوفية',
    },
    dropoff: {
      latitude: 30.46,
      longitude: 30.98,
      address: 'ميدان الباجور',
    },
    rideType: 'economy',
    status: 'completed',
    fare: {
      baseFare: 10,
      distanceFare: 15,
      timeFare: 5,
      surgeFare: 0,
      discount: 0,
      total: 30,
    },
    distance: 5.2,
    duration: 15,
    rating: {
      score: 5,
      comment: 'رحلة ممتازة',
      ratedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
];

const columns: ColumnDef<Trip, unknown>[] = [
  {
    accessorKey: '_id',
    header: 'رقم الرحلة',
    cell: ({ row }) => `#${row.original._id}`,
  },
  {
    accessorKey: 'passenger',
    header: 'الراكب',
    cell: ({ row }) => row.original.passenger.name,
  },
  {
    accessorKey: 'driver',
    header: 'السائق',
    cell: ({ row }) => row.original.driver?.name || '-',
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
            statusStyles[row.original.status]
          }`}
        >
          {statusLabels[row.original.status]}
        </span>
      );
    },
  },
  {
    accessorKey: 'fare',
    header: 'الأجرة',
    cell: ({ row }) => `${row.original.fare.total} ج.م`,
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

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch trips from API
    setTimeout(() => {
      setTrips(mockTrips);
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
        <h1 className="text-2xl font-bold text-slate-900">الرحلات</h1>
        <div className="flex gap-2">
          <select className="px-4 py-2 border border-slate-200 rounded-lg bg-white">
            <option value="">جميع الحالات</option>
            <option value="pending">في الانتظار</option>
            <option value="in_progress">جارية</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          />
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
              <p className="text-xl font-bold text-slate-900">5,420</p>
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
              <p className="text-xl font-bold text-slate-900">4,850</p>
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
              <p className="text-xl font-bold text-slate-900">12</p>
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
              <p className="text-xl font-bold text-slate-900">320</p>
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
