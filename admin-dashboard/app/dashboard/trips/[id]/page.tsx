'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { MapPin, User, Car, Phone, Clock, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { tripsApi } from '@/lib/api';

interface Trip {
  _id: string;
  passenger?: {
    _id: string;
    user?: {
      name: string;
      phone: string;
    };
  };
  driver?: {
    _id: string;
    user?: {
      name: string;
      phone: string;
    };
    vehicle?: {
      make: string;
      model: string;
      color: string;
      plateNumber: string;
    };
  };
  pickup: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  dropoff: {
    address: string;
    coordinates?: { lat: number; lng: number };
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
  rating?: number;
  feedback?: string;
  cancelReason?: string;
  createdAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchTrip = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await tripsApi.getById(tripId);
      if (response.data.success) {
        setTrip(response.data.data.trip);
      }
    } catch (err) {
      console.error('Failed to fetch trip:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

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

  if (!trip) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-700">الرحلة غير موجودة</h2>
        <button
          onClick={() => router.push('/dashboard/trips')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
        >
          العودة للرحلات
        </button>
      </div>
    );
  }

  const mapCenter = trip.pickup.coordinates || { lat: 30.4167, lng: 30.9667 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/trips')}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              رحلة #{trip._id.slice(-6).toUpperCase()}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm ${statusStyles[trip.status]}`}>
                {statusLabels[trip.status]}
              </span>
              <span className="text-slate-500">
                {rideTypeLabels[trip.rideType] || trip.rideType}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchTrip}
          className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
        >
          <RefreshCw size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {isLoaded ? (
              <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={13}>
                {trip.pickup.coordinates && (
                  <Marker
                    position={trip.pickup.coordinates}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: '#10B981',
                      fillOpacity: 1,
                      strokeColor: '#fff',
                      strokeWeight: 2,
                    }}
                  />
                )}
                {trip.dropoff.coordinates && (
                  <Marker
                    position={trip.dropoff.coordinates}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: '#EF4444',
                      fillOpacity: 1,
                      strokeColor: '#fff',
                      strokeWeight: 2,
                    }}
                  />
                )}
                {trip.pickup.coordinates && trip.dropoff.coordinates && (
                  <Polyline
                    path={[trip.pickup.coordinates, trip.dropoff.coordinates]}
                    options={{
                      strokeColor: '#10B981',
                      strokeWeight: 4,
                      strokeOpacity: 0.8,
                    }}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            )}
          </div>

          {/* Route Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">تفاصيل المسار</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">نقطة الانطلاق</p>
                  <p className="font-medium text-slate-900">{trip.pickup.address}</p>
                </div>
              </div>
              <div className="border-r-2 border-dashed border-slate-200 h-8 mr-5"></div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">نقطة الوصول</p>
                  <p className="font-medium text-slate-900">{trip.dropoff.address}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {(trip.distance / 1000).toFixed(1)} كم
                </p>
                <p className="text-sm text-slate-500">المسافة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round(trip.duration / 60)} دقيقة
                </p>
                <p className="text-sm text-slate-500">الوقت</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Passenger */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">الراكب</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={28} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {trip.passenger?.user?.name || '-'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {trip.passenger?.user?.phone || '-'}
                  </p>
                </div>
                {trip.passenger?.user?.phone && (
                  <a
                    href={`tel:${trip.passenger.user.phone}`}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Phone size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Driver */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">السائق</h3>
              {trip.driver ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Car size={28} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {trip.driver.user?.name || '-'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {trip.driver.vehicle?.make} {trip.driver.vehicle?.model} -{' '}
                      {trip.driver.vehicle?.plateNumber}
                    </p>
                  </div>
                  {trip.driver.user?.phone && (
                    <a
                      href={`tel:${trip.driver.user.phone}`}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                    >
                      <Phone size={18} />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">لم يتم تعيين سائق</p>
              )}
            </div>
          </div>

          {/* Rating & Feedback */}
          {trip.status === 'completed' && trip.rating && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">التقييم</h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-amber-500">
                  {trip.rating} ★
                </div>
                {trip.feedback && (
                  <p className="text-slate-600 flex-1">{trip.feedback}</p>
                )}
              </div>
            </div>
          )}

          {/* Cancel Reason */}
          {trip.status === 'cancelled' && trip.cancelReason && (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-2">سبب الإلغاء</h3>
              <p className="text-red-700">{trip.cancelReason}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fare Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">تفاصيل الأجرة</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">الأجرة الأساسية</span>
                <span className="text-slate-900">{trip.fare.baseFare.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">أجرة المسافة</span>
                <span className="text-slate-900">{trip.fare.distanceFare.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">أجرة الوقت</span>
                <span className="text-slate-900">{trip.fare.timeFare.toFixed(2)} ج.م</span>
              </div>
              {trip.fare.surgeFare > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>رسوم الذروة</span>
                  <span>+{trip.fare.surgeFare.toFixed(2)} ج.م</span>
                </div>
              )}
              {trip.fare.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>الخصم</span>
                  <span>-{trip.fare.discount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-slate-900">الإجمالي</span>
                  <span className="text-emerald-600">{trip.fare.total.toFixed(2)} ج.م</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">عمولة المنصة</span>
                  <span className="text-slate-900">{trip.fare.platformFee.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">أرباح السائق</span>
                  <span className="text-emerald-600">{trip.fare.driverEarnings.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">الجدول الزمني</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <Clock size={16} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">تم الإنشاء</p>
                  <p className="text-xs text-slate-500">
                    {new Date(trip.createdAt).toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
              {trip.acceptedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">تم القبول</p>
                    <p className="text-xs text-slate-500">
                      {new Date(trip.acceptedAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              )}
              {trip.arrivedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                    <Clock size={16} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">وصل السائق</p>
                    <p className="text-xs text-slate-500">
                      {new Date(trip.arrivedAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              )}
              {trip.startedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">بدأت الرحلة</p>
                    <p className="text-xs text-slate-500">
                      {new Date(trip.startedAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              )}
              {trip.completedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Clock size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">اكتملت</p>
                    <p className="text-xs text-slate-500">
                      {new Date(trip.completedAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              )}
              {trip.cancelledAt && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Clock size={16} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">تم الإلغاء</p>
                    <p className="text-xs text-slate-500">
                      {new Date(trip.cancelledAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
