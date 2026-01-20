'use client';

import { useState, useEffect, useCallback } from 'react';
import { Car, Check, X, Eye, RefreshCw, FileText, User, Phone, Calendar } from 'lucide-react';
import { driversApi } from '@/lib/api';

interface PendingDriver {
  _id: string;
  user?: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    createdAt: string;
  };
  nationalId: string;
  vehicleType: string;
  vehicleCategory: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    vehicleImage?: string;
    registrationImage?: string;
  };
  documents?: {
    nationalIdFront?: string;
    nationalIdBack?: string;
    nationalIdNumber?: string;
    drivingLicenseFront?: string;
    drivingLicenseBack?: string;
    criminalRecord?: string;
  };
  createdAt: string;
}

export default function PendingDriversPage() {
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState(15);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  const fetchPendingDrivers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await driversApi.getAll({ status: 'pending' });
      if (response.data.success) {
        setDrivers(response.data.data.drivers || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending drivers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingDrivers();
  }, [fetchPendingDrivers]);

  const handleApprove = async (driverId: string) => {
    try {
      setActionLoading(driverId);
      const response = await driversApi.approve(driverId);
      if (response.data.success) {
        setSelectedDriver(null);
        fetchPendingDrivers();
        alert('تمت الموافقة على السائق بنجاح');
      }
    } catch (err: any) {
      console.error('Failed to approve driver:', err);
      const errorMessage = err.response?.data?.messageAr || err.response?.data?.message || 'فشل في الموافقة على السائق';
      alert(errorMessage);
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
        setSelectedDriver(null);
        fetchPendingDrivers();
        alert('تم رفض السائق');
      }
    } catch (err: any) {
      console.error('Failed to reject driver:', err);
      const errorMessage = err.response?.data?.messageAr || err.response?.data?.message || 'فشل في رفض السائق';
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const vehicleTypeLabels: Record<string, string> = {
    car: 'سيارة',
    tuktuk: 'توكتوك',
    motorcycle: 'موتوسيكل',
  };

  const vehicleCategoryLabels: Record<string, string> = {
    economy: 'اقتصادي',
    comfort: 'مريح',
    family: 'عائلي',
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">طلبات السائقين</h1>
          <p className="text-slate-500">
            {drivers.length} طلب في الانتظار
          </p>
        </div>
        <button
          onClick={fetchPendingDrivers}
          className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
          title="تحديث"
        >
          <RefreshCw size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drivers List */}
        <div className="lg:col-span-1 space-y-4">
          {drivers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-200">
              <Car size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                لا توجد طلبات
              </h3>
              <p className="text-slate-500">
                جميع الطلبات تمت معالجتها
              </p>
            </div>
          ) : (
            drivers.map((driver) => (
              <div
                key={driver._id}
                onClick={() => setSelectedDriver(driver)}
                className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all ${
                  selectedDriver?._id === driver._id
                    ? 'border-emerald-500 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Car size={24} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {driver.user?.name || 'غير معروف'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {driver.user?.phone || '-'}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                      في الانتظار
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(driver.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Driver Details */}
        <div className="lg:col-span-2">
          {selectedDriver ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedDriver.user?.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-1 text-emerald-100">
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {selectedDriver.user?.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(selectedDriver.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    البيانات الشخصية
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">الرقم القومي</p>
                      <p className="font-medium text-slate-900">
                        {selectedDriver.documents?.nationalIdNumber || selectedDriver.nationalId || '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">البريد الإلكتروني</p>
                      <p className="font-medium text-slate-900">
                        {selectedDriver.user?.email || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    بيانات المركبة
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">نوع المركبة</p>
                      <p className="font-medium text-slate-900">
                        {vehicleTypeLabels[selectedDriver.vehicleType] || selectedDriver.vehicleType}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">الفئة</p>
                      <p className="font-medium text-slate-900">
                        {vehicleCategoryLabels[selectedDriver.vehicleCategory] || selectedDriver.vehicleCategory}
                      </p>
                    </div>
                    {selectedDriver.vehicle && (
                      <>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">الماركة والموديل</p>
                          <p className="font-medium text-slate-900">
                            {selectedDriver.vehicle.make} {selectedDriver.vehicle.model}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">سنة الصنع</p>
                          <p className="font-medium text-slate-900">
                            {selectedDriver.vehicle.year}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">اللون</p>
                          <p className="font-medium text-slate-900">
                            {selectedDriver.vehicle.color}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">رقم اللوحة</p>
                          <p className="font-medium text-slate-900">
                            {selectedDriver.vehicle.plateNumber}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    المستندات
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: 'nationalIdFront', label: 'البطاقة (أمام)', path: selectedDriver.documents?.nationalIdFront },
                      { key: 'nationalIdBack', label: 'البطاقة (خلف)', path: selectedDriver.documents?.nationalIdBack },
                      { key: 'drivingLicenseFront', label: 'رخصة القيادة', path: selectedDriver.documents?.drivingLicenseFront },
                      { key: 'vehicleLicense', label: 'رخصة المركبة', path: selectedDriver.vehicle?.registrationImage },
                      { key: 'vehiclePhoto', label: 'صورة المركبة', path: selectedDriver.vehicle?.vehicleImage },
                    ].map((doc) => (
                      <div
                        key={doc.key}
                        className="p-4 bg-slate-50 rounded-lg flex items-center gap-3"
                      >
                        <FileText size={20} className="text-slate-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {doc.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {doc.path ? 'مرفق' : 'غير مرفق'}
                          </p>
                        </div>
                        {doc.path && (
                          <button
                            onClick={() => setViewingImage(`${API_BASE}${doc.path}`)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commission Setting */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    نسبة العمولة
                  </h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-emerald-600 min-w-[60px] text-center">
                      {commissionRate}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleApprove(selectedDriver._id)}
                    disabled={actionLoading === selectedDriver._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={20} />
                    موافقة
                  </button>
                  <button
                    onClick={() => handleReject(selectedDriver._id)}
                    disabled={actionLoading === selectedDriver._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={20} />
                    رفض
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
              <Eye size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                اختر طلباً للعرض
              </h3>
              <p className="text-slate-500">
                اضغط على أي طلب من القائمة لعرض التفاصيل
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X size={32} />
            </button>
            <img
              src={viewingImage}
              alt="Document"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3QgZmlsbD0iI2YxZjVmOSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk0YTNiOCIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPuKaoO+4jyBGYWlsZWQgdG8gbG9hZCBpbWFnZTwvdGV4dD48L3N2Zz4=';
                target.onerror = null;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
