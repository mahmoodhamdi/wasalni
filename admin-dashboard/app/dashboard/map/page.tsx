'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Car, Clock, Loader2 } from 'lucide-react';
import { locationApi } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import type { DriverLocation } from '@/components/map/LiveMap';

// Dynamically import the entire Map component to avoid re-initialization issues
const LiveMap = dynamic(
  () => import('@/components/map/LiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }
);

// API response format from backend
interface ApiDriverResponse {
  driverId: string;
  distance: number;
  lat: number;
  lng: number;
  heading?: number;
  driver: {
    _id: string;
    name: string;
    phone: string;
    avatar?: string;
    rating: number;
    vehicle?: {
      type: string;
      category: string;
      make: string;
      model: string;
      color: string;
      plateNumber: string;
    };
  };
}

// Egypt map center (Cairo area)
const mapCenter: [number, number] = [30.0444, 31.2357];

export default function LiveMapPage() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Transform API response to our format
  const transformDriverData = (apiDrivers: ApiDriverResponse[]): DriverLocation[] => {
    return apiDrivers.map((d) => ({
      driverId: d.driverId,
      userId: d.driver._id,
      name: d.driver.name || 'سائق',
      phone: d.driver.phone || '',
      vehicleType: d.driver.vehicle?.type || 'car',
      vehicleCategory: d.driver.vehicle?.category || 'economy',
      vehicle: d.driver.vehicle,
      location: {
        lat: d.lat,
        lng: d.lng,
      },
      heading: d.heading,
      isAvailable: true,
      lastUpdate: new Date().toISOString(),
    }));
  };

  // Fetch online drivers
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await locationApi.getOnlineDrivers();
      if (response.data.success) {
        const transformedDrivers = transformDriverData(response.data.data.drivers || []);
        setDrivers(transformedDrivers);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('فشل في تحميل بيانات السائقين');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    let token = null;
    const storedAuth = localStorage.getItem('wasalni-admin-auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed?.state?.token;
      } catch {
        // Ignore
      }
    }

    const socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Connected to socket for live map');
      socket.emit('admin:subscribeToDriverLocations');
    });

    socket.on('driver:locationUpdate', (data: DriverLocation) => {
      setDrivers((prev) => {
        const index = prev.findIndex((d) => d.driverId === data.driverId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        }
        return [...prev, data];
      });
    });

    socket.on('driver:online', (data: DriverLocation) => {
      setDrivers((prev) => {
        const exists = prev.find((d) => d.driverId === data.driverId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on('driver:offline', (data: { driverId: string }) => {
      setDrivers((prev) => prev.filter((d) => d.driverId !== data.driverId));
      if (selectedDriver?.driverId === data.driverId) {
        setSelectedDriver(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDriver?.driverId]);

  // Initial fetch
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDrivers, 30000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  const formatLastUpdate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `منذ ${diff} ثانية`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    return `منذ ${Math.floor(diff / 3600)} ساعة`;
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الخريطة الحية</h1>
          <p className="text-slate-600">تتبع مواقع السائقين في الوقت الفعلي</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6 bg-white rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-600">متاحين: {drivers.filter(d => d.isAvailable).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-600">مشغولين: {drivers.filter(d => !d.isAvailable).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">الإجمالي: {drivers.length}</span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Last refresh time */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Clock className="w-4 h-4" />
        <span>آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG')}</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[calc(100vh-280px)]">
        <LiveMap
          drivers={drivers}
          center={mapCenter}
          zoom={12}
          onDriverSelect={setSelectedDriver}
          formatLastUpdate={formatLastUpdate}
        />
      </div>

      {/* Driver List */}
      {drivers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">قائمة السائقين المتصلين</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => (
              <div
                key={driver.driverId}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setSelectedDriver(driver)}
              >
                <div className={`w-3 h-3 rounded-full ${driver.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{driver.name}</p>
                  <p className="text-sm text-slate-500 truncate">
                    {driver.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model}` : driver.vehicleType}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{formatLastUpdate(driver.lastUpdate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && drivers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">لا يوجد سائقين متصلين</h3>
          <p className="text-slate-500">لا يوجد سائقين متصلين حالياً. سيظهرون هنا عند اتصالهم.</p>
        </div>
      )}
    </div>
  );
}
