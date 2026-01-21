'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, RefreshCw, Save, X, Copy, Check } from 'lucide-react';
import { promosApi } from '@/lib/api';

interface PromoCode {
  _id: string;
  code: string;
  description: string;
  descriptionAr: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minFare?: number;
  maxUsesTotal?: number;
  maxUsesPerUser: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  rideTypes?: string[];
  isActive: boolean;
  createdAt: string;
}

interface PromoStats {
  totalUses: number;
  totalDiscountGiven: number;
  uniqueUsers: number;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [selectedPromoStats, setSelectedPromoStats] = useState<{
    promoId: string;
    stats: PromoStats;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchPromos = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { active?: boolean } = {};
      if (activeFilter === 'active') params.active = true;
      if (activeFilter === 'inactive') params.active = false;

      const response = await promosApi.getAll(params);
      if (response.data.success) {
        setPromos(response.data.data.promoCodes || []);
      }
    } catch (err) {
      console.error('Failed to fetch promos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleSavePromo = async (promo: Partial<PromoCode>) => {
    try {
      if (promo._id) {
        await promosApi.update(promo._id, promo);
      } else {
        await promosApi.create(promo);
      }
      setEditingPromo(null);
      setIsCreating(false);
      fetchPromos();
    } catch (err) {
      console.error('Failed to save promo:', err);
    }
  };

  const handleDeactivatePromo = async (promoId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا العرض؟')) return;
    try {
      await promosApi.deactivate(promoId);
      fetchPromos();
    } catch (err) {
      console.error('Failed to deactivate promo:', err);
    }
  };

  const handleViewStats = async (promoId: string) => {
    try {
      const response = await promosApi.getStats(promoId);
      if (response.data.success) {
        setSelectedPromoStats({ promoId, stats: response.data.data.stats });
      }
    } catch (err) {
      console.error('Failed to fetch promo stats:', err);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
        <h1 className="text-2xl font-bold text-slate-900">العروض والأكواد</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus size={20} />
            إضافة عرض
          </button>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">جميع العروض</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
          <button
            onClick={fetchPromos}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
            title="تحديث"
          >
            <RefreshCw size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Create/Edit Promo Form */}
      {(isCreating || editingPromo) && (
        <PromoForm
          promo={editingPromo || undefined}
          onSave={handleSavePromo}
          onCancel={() => {
            setEditingPromo(null);
            setIsCreating(false);
          }}
        />
      )}

      {/* Stats Modal */}
      {selectedPromoStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">إحصائيات العرض</h3>
              <button onClick={() => setSelectedPromoStats(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">عدد الاستخدامات</span>
                <span className="font-bold text-slate-900">{selectedPromoStats.stats.totalUses}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">إجمالي الخصم</span>
                <span className="font-bold text-slate-900">
                  {selectedPromoStats.stats.totalDiscountGiven.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">المستخدمين الفريدين</span>
                <span className="font-bold text-slate-900">{selectedPromoStats.stats.uniqueUsers}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((promo) => {
          const isExpired = new Date(promo.validUntil) < new Date();
          const isExpiringSoon =
            new Date(promo.validUntil) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && !isExpired;

          return (
            <div
              key={promo._id}
              className={`bg-white rounded-xl p-4 shadow-sm border ${
                isExpired ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      promo.discountType === 'percentage' ? 'bg-purple-100' : 'bg-emerald-100'
                    }`}
                  >
                    <Tag
                      size={20}
                      className={promo.discountType === 'percentage' ? 'text-purple-600' : 'text-emerald-600'}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(promo.code)}
                        className="font-mono font-bold text-slate-900 hover:text-emerald-600 flex items-center gap-1"
                      >
                        {promo.code}
                        {copiedCode === promo.code ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">
                      {promo.discountType === 'percentage'
                        ? `${promo.discountValue}% خصم`
                        : `${promo.discountValue} ج.م خصم`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {isExpired && (
                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">منتهي</span>
                  )}
                  {isExpiringSoon && !isExpired && (
                    <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">ينتهي قريباً</span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      promo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {promo.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-3">{promo.descriptionAr || promo.description}</p>

              <div className="space-y-2 text-sm">
                {promo.minFare && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الحد الأدنى للأجرة:</span>
                    <span className="text-slate-900">{promo.minFare} ج.م</span>
                  </div>
                )}
                {promo.maxDiscount && promo.discountType === 'percentage' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">أقصى خصم:</span>
                    <span className="text-slate-900">{promo.maxDiscount} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">الاستخدامات:</span>
                  <span className="text-slate-900">
                    {promo.usedCount} / {promo.maxUsesTotal || '∞'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">صالح حتى:</span>
                  <span className={isExpired ? 'text-red-600' : 'text-slate-900'}>
                    {new Date(promo.validUntil).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                {promo.rideTypes && promo.rideTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {promo.rideTypes.map((type) => (
                      <span key={type} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        {rideTypeLabels[type] || type}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleViewStats(promo._id)}
                  className="flex-1 px-3 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                >
                  الإحصائيات
                </button>
                <button
                  onClick={() => setEditingPromo(promo)}
                  className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  <Edit2 size={16} />
                </button>
                {promo.isActive && (
                  <button
                    onClick={() => handleDeactivatePromo(promo._id)}
                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {promos.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">لا توجد عروض</div>
        )}
      </div>
    </div>
  );
}

// Promo Form Component
function PromoForm({
  promo,
  onSave,
  onCancel,
}: {
  promo?: PromoCode;
  onSave: (promo: Partial<PromoCode>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return {
      code: promo?.code || '',
      description: promo?.description || '',
      descriptionAr: promo?.descriptionAr || '',
      discountType: promo?.discountType || 'percentage',
      discountValue: promo?.discountValue || 10,
      maxDiscount: promo?.maxDiscount || 50,
      minFare: promo?.minFare || 20,
      maxUsesTotal: promo?.maxUsesTotal || 100,
      maxUsesPerUser: promo?.maxUsesPerUser || 1,
      validFrom: promo?.validFrom ? promo.validFrom.split('T')[0] : today,
      validUntil: promo?.validUntil ? promo.validUntil.split('T')[0] : thirtyDaysLater,
      rideTypes: promo?.rideTypes || [],
      isActive: promo?.isActive ?? true,
    };
  });

  const rideTypes = [
    { value: 'economy', label: 'اقتصادي' },
    { value: 'comfort', label: 'مريح' },
    { value: 'family', label: 'عائلي' },
    { value: 'tuktuk', label: 'توكتوك' },
    { value: 'motorcycle', label: 'موتوسيكل' },
  ];

  const toggleRideType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      rideTypes: prev.rideTypes.includes(type)
        ? prev.rideTypes.filter((t) => t !== type)
        : [...prev.rideTypes, type],
    }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {promo ? 'تعديل عرض' : 'إضافة عرض جديد'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">كود العرض</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
            placeholder="WELCOME10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">نوع الخصم</label>
          <select
            value={formData.discountType}
            onChange={(e) =>
              setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })
            }
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="percentage">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (ج.م)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            قيمة الخصم {formData.discountType === 'percentage' ? '(%)' : '(ج.م)'}
          </label>
          <input
            type="number"
            min="0"
            max={formData.discountType === 'percentage' ? 100 : 1000}
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        {formData.discountType === 'percentage' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">أقصى خصم (ج.م)</label>
            <input
              type="number"
              min="0"
              value={formData.maxDiscount}
              onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأدنى للأجرة (ج.م)</label>
          <input
            type="number"
            min="0"
            value={formData.minFare}
            onChange={(e) => setFormData({ ...formData, minFare: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأقصى للاستخدام</label>
          <input
            type="number"
            min="1"
            value={formData.maxUsesTotal}
            onChange={(e) => setFormData({ ...formData, maxUsesTotal: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">لكل مستخدم</label>
          <input
            type="number"
            min="1"
            value={formData.maxUsesPerUser}
            onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">صالح من</label>
          <input
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">صالح حتى</label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">الوصف (عربي)</label>
          <input
            type="text"
            value={formData.descriptionAr}
            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="خصم 10% على رحلتك الأولى"
          />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-slate-700 mb-2">أنواع الرحلات المتاحة</label>
          <div className="flex flex-wrap gap-2">
            {rideTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleRideType(type.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  formData.rideTypes.includes(type.value)
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                } border`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">اترك فارغاً للتطبيق على جميع الأنواع</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="promoIsActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="promoIsActive" className="text-sm font-medium text-slate-700">
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
          onClick={() => {
            const dataToSave = { ...formData };
            if (promo?._id) {
              (dataToSave as Partial<PromoCode>)._id = promo._id;
            }
            onSave(dataToSave);
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <Save size={18} />
          حفظ
        </button>
      </div>
    </div>
  );
}
