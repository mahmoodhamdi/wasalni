'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { User, Eye, Ban, CheckCircle } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { Passenger } from '@/types';

// Mock data
const mockPassengers: Passenger[] = [
  {
    _id: '1',
    phone: '+201111111111',
    name: 'سارة أحمد',
    email: 'sara@example.com',
    role: 'passenger',
    isActive: true,
    isVerified: true,
    totalTrips: 45,
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    phone: '+201222222222',
    name: 'محمد خالد',
    role: 'passenger',
    isActive: true,
    isVerified: true,
    totalTrips: 12,
    rating: 4.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '3',
    phone: '+201333333333',
    name: 'فاطمة علي',
    role: 'passenger',
    isActive: false,
    isVerified: true,
    totalTrips: 8,
    rating: 4.2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
          <p className="font-medium text-slate-900">{row.original.name}</p>
          <p className="text-sm text-slate-500">{row.original.phone}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'البريد الإلكتروني',
    cell: ({ row }) => row.original.email || '-',
  },
  {
    accessorKey: 'isActive',
    header: 'الحالة',
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-sm ${
          row.original.isActive
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {row.original.isActive ? 'نشط' : 'محظور'}
      </span>
    ),
  },
  {
    accessorKey: 'totalTrips',
    header: 'الرحلات',
  },
  {
    accessorKey: 'rating',
    header: 'التقييم',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="text-amber-500">★</span>
        <span>{row.original.rating?.toFixed(1) || '-'}</span>
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          title="عرض التفاصيل"
        >
          <Eye size={18} />
        </button>
        {row.original.isActive ? (
          <button
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="حظر"
          >
            <Ban size={18} />
          </button>
        ) : (
          <button
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
            title="إلغاء الحظر"
          >
            <CheckCircle size={18} />
          </button>
        )}
      </div>
    ),
  },
];

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch passengers from API
    setTimeout(() => {
      setPassengers(mockPassengers);
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
        <h1 className="text-2xl font-bold text-slate-900">الركاب</h1>
        <div className="flex gap-2">
          <select className="px-4 py-2 border border-slate-200 rounded-lg bg-white">
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="blocked">محظور</option>
          </select>
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
