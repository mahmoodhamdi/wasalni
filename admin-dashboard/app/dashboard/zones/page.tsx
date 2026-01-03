'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPinned, Plus, Edit2, Trash2, RefreshCw, Save, X } from 'lucide-react';
import { zonesApi, settingsApi } from '@/lib/api';

interface Zone {
  _id: string;
  name: string;
  nameAr: string;
  type: 'city' | 'district' | 'special';
  isActive: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  fareMultiplier: number;
  createdAt: string;
}

interface FareSetting {
  _id: string;
  rideType: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  platformFeePercent: number;
  isActive: boolean;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [fareSettings, setFareSettings] = useState<FareSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'zones' | 'fares'>('zones');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingFare, setEditingFare] = useState<FareSetting | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [zonesResponse, faresResponse] = await Promise.all([
        zonesApi.getAll(),
        settingsApi.getFareSettings(),
      ]);

      if (zonesResponse.data.success) {
        setZones(zonesResponse.data.data.zones || []);
      }
      if (faresResponse.data.success) {
        setFareSettings(faresResponse.data.data.fareSettings || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveZone = async (zone: Partial<Zone>) => {
    try {
      if (zone._id) {
        await zonesApi.update(zone._id, zone);
      } else {
        await zonesApi.create(zone);
      }
      setEditingZone(null);
      setIsCreating(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save zone:', err);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
    try {
      await zonesApi.delete(zoneId);
      fetchData();
    } catch (err) {
      console.error('Failed to delete zone:', err);
    }
  };

  const handleSaveFare = async (fare: Partial<FareSetting>) => {
    try {
      await settingsApi.updateFareSettings(fare);
      setEditingFare(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save fare settings:', err);
    }
  };

  const rideTypeLabels: Record<string, string> = {
    economy: 'اقتصادي',
    comfort: 'مريح',
    family: 'عائلي',
    tuktuk: 'توكتوك',
    motorcycle: 'موتوسيكل',
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
        <h1 className="text-2xl font-bold text-slate-900">المناطق والأسعار</h1>
        <div className="flex gap-2">
          {activeTab === 'zones' && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus size={20} />
              إضافة منطقة
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            title="تحديث"
          >
            <RefreshCw size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'zones'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          المناطق
        </button>
        <button
          onClick={() => setActiveTab('fares')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'fares'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          تعريفة الأسعار
        </button>
      </div>

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          {/* Create/Edit Zone Form */}
          {(isCreating || editingZone) && (
            <ZoneForm
              zone={editingZone || undefined}
              onSave={handleSaveZone}
              onCancel={() => {
                setEditingZone(null);
                setIsCreating(false);
              }}
            />
          )}

          {/* Zones List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div
                key={zone._id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <MapPinned size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{zone.nameAr || zone.name}</h3>
                      <p className="text-sm text-slate-500">{zone.name}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      zone.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {zone.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">النوع:</span>
                    <span className="text-slate-900">
                      {zone.type === 'city' ? 'مدينة' : zone.type === 'district' ? 'حي' : 'منطقة خاصة'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">معامل السعر:</span>
                    <span className="text-slate-900">{zone.fareMultiplier}x</span>
                  </div>
                  {zone.radius && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">النطاق:</span>
                      <span className="text-slate-900">{zone.radius} كم</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEditingZone(zone)}
                    className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1"
                  >
                    <Edit2 size={16} />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone._id)}
                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {zones.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                لا توجد مناطق مضافة
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fares Tab */}
      {activeTab === 'fares' && (
        <div className="space-y-4">
          {/* Edit Fare Form */}
          {editingFare && (
            <FareForm
              fare={editingFare}
              onSave={handleSaveFare}
              onCancel={() => setEditingFare(null)}
            />
          )}

          {/* Fare Settings Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">نوع الرحلة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">الأجرة الأساسية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">لكل كم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">لكل دقيقة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">الحد الأدنى</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">عمولة المنصة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fareSettings.map((fare) => (
                  <tr key={fare._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {rideTypeLabels[fare.rideType] || fare.rideType}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fare.baseFare} ج.م</td>
                    <td className="px-4 py-3 text-slate-600">{fare.perKm} ج.م</td>
                    <td className="px-4 py-3 text-slate-600">{fare.perMinute} ج.م</td>
                    <td className="px-4 py-3 text-slate-600">{fare.minimumFare} ج.م</td>
                    <td className="px-4 py-3 text-slate-600">{fare.platformFeePercent}%</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          fare.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {fare.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditingFare(fare)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {fareSettings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      لا توجد إعدادات أسعار
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Zone Form Component
function ZoneForm({
  zone,
  onSave,
  onCancel,
}: {
  zone?: Zone;
  onSave: (zone: Partial<Zone>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: zone?.name || '',
    nameAr: zone?.nameAr || '',
    type: zone?.type || 'city',
    isActive: zone?.isActive ?? true,
    fareMultiplier: zone?.fareMultiplier || 1,
    radius: zone?.radius || 5,
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {zone ? 'تعديل منطقة' : 'إضافة منطقة جديدة'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الاسم (إنجليزي)</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الاسم (عربي)</label>
          <input
            type="text"
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Zone['type'] })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="city">مدينة</option>
            <option value="district">حي</option>
            <option value="special">منطقة خاصة</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">معامل السعر</label>
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="3"
            value={formData.fareMultiplier}
            onChange={(e) => setFormData({ ...formData, fareMultiplier: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">النطاق (كم)</label>
          <input
            type="number"
            min="1"
            value={formData.radius}
            onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
            نشط
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2"
        >
          <X size={18} />
          إلغاء
        </button>
        <button
          onClick={() => onSave({ ...formData, _id: zone?._id })}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <Save size={18} />
          حفظ
        </button>
      </div>
    </div>
  );
}

// Fare Form Component
function FareForm({
  fare,
  onSave,
  onCancel,
}: {
  fare: FareSetting;
  onSave: (fare: Partial<FareSetting>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    _id: fare._id,
    rideType: fare.rideType,
    baseFare: fare.baseFare,
    perKm: fare.perKm,
    perMinute: fare.perMinute,
    minimumFare: fare.minimumFare,
    platformFeePercent: fare.platformFeePercent,
    isActive: fare.isActive,
  });

  const rideTypeLabels: Record<string, string> = {
    economy: 'اقتصادي',
    comfort: 'مريح',
    family: 'عائلي',
    tuktuk: 'توكتوك',
    motorcycle: 'موتوسيكل',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        تعديل أسعار - {rideTypeLabels[fare.rideType] || fare.rideType}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الأجرة الأساسية (ج.م)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={formData.baseFare}
            onChange={(e) => setFormData({ ...formData, baseFare: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">لكل كم (ج.م)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.perKm}
            onChange={(e) => setFormData({ ...formData, perKm: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">لكل دقيقة (ج.م)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.perMinute}
            onChange={(e) => setFormData({ ...formData, perMinute: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأدنى (ج.م)</label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData.minimumFare}
            onChange={(e) => setFormData({ ...formData, minimumFare: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">عمولة المنصة (%)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="50"
            value={formData.platformFeePercent}
            onChange={(e) => setFormData({ ...formData, platformFeePercent: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="fareIsActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="fareIsActive" className="text-sm font-medium text-slate-700">
            نشط
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2"
        >
          <X size={18} />
          إلغاء
        </button>
        <button
          onClick={() => onSave(formData)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <Save size={18} />
          حفظ
        </button>
      </div>
    </div>
  );
}
