'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { RefreshCw, MapPin, User, Car, Phone, Clock, Loader2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { tripsApi } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface ActiveTrip {
  _id: string;
  passenger?: {
    user?: {
      name: string;
      phone: string;
    };
  };
  driver?: {
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
    location?: {
      lat: number;
      lng: number;
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
  status: string;
  rideType: string;
  fare: { total: number };
  createdAt: string;
}

const mapCenter = { lat: 30.4167, lng: 30.9667 };

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export default function ActiveTripsPage() {
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchActiveTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await tripsApi.getAll({ status: 'in_progress' });
      if (response.data.success) {
        setTrips(response.data.data.trips || []);
      }
    } catch (err) {
      console.error('Failed to fetch active trips:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup WebSocket
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

    // Get token from zustand store
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

    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket for active trips');
      setIsSocketConnected(true);
      setSocketError(null);
      newSocket.emit('admin:subscribeToTrips');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsSocketConnected(false);
      setSocketError('فشل الاتصال بالتحديثات المباشرة');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsSocketConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect with new token
        const storedAuth = localStorage.getItem('wasalni-admin-auth');
        if (storedAuth) {
          try {
            const parsed = JSON.parse(storedAuth);
            const newToken = parsed?.state?.token;
            if (newToken) {
              newSocket.auth = { token: newToken };
              newSocket.connect();
            }
          } catch {
            setSocketError('فشل إعادة الاتصال - يرجى تسجيل الدخول مجدداً');
          }
        }
      }
    });

    newSocket.on('trip:statusUpdate', (data: { tripId: string; status: string }) => {
      if (data.status === 'completed' || data.status === 'cancelled') {
        setTrips((prev) => prev.filter((t) => t._id !== data.tripId));
        if (selectedTrip?._id === data.tripId) {
          setSelectedTrip(null);
        }
      } else {
        fetchActiveTrips();
      }
    });

    newSocket.on('driver:locationUpdate', (data: { driverId: string; location: { lat: number; lng: number } }) => {
      setTrips((prev) =>
        prev.map((trip) => {
          if (trip.driver && trip.driver.user) {
            return {
              ...trip,
              driver: {
                ...trip.driver,
                location: data.location,
              },
            };
          }
          return trip;
        })
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [fetchActiveTrips, selectedTrip]);

  useEffect(() => {
    fetchActiveTrips();
  }, [fetchActiveTrips]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchActiveTrips, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveTrips]);

  const statusLabels: Record<string, string> = {
    pending: 'في الانتظار',
    searching: 'جاري البحث',
    accepted: 'مقبولة',
    arriving: 'في الطريق',
    arrived: 'وصل',
    in_progress: 'جارية',
  };

  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    searching: '#3B82F6',
    accepted: '#8B5CF6',
    arriving: '#06B6D4',
    arrived: '#6366F1',
    in_progress: '#10B981',
  };

  // Check for missing API key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isApiKeyMissing = !apiKey || apiKey === '';

  if (loadError || isApiKeyMissing) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {isApiKeyMissing ? 'مفتاح Google Maps غير مُعدّ' : 'خطأ في تحميل الخريطة'}
          </h2>
          {isApiKeyMissing && (
            <p className="text-sm text-slate-500">
              يرجى تعيين NEXT_PUBLIC_GOOGLE_MAPS_API_KEY في ملف .env.local
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Socket Error Alert */}
      {socketError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 text-sm">{socketError}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">الرحلات النشطة</h1>
            <p className="text-slate-600">{trips.length} رحلة نشطة الآن</p>
          </div>
          {/* Socket Connection Status */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            isSocketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isSocketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isSocketConnected ? 'مباشر' : 'غير متصل'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-600">جارية</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-slate-600">في الطريق</span>
            </div>
          </div>
          <button
            onClick={fetchActiveTrips}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>تحديث</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={12}>
              {trips.map((trip) => (
                <div key={trip._id}>
                  {/* Pickup Marker */}
                  {trip.pickup.coordinates && (
                    <Marker
                      position={trip.pickup.coordinates}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#10B981',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                      }}
                      onClick={() => setSelectedTrip(trip)}
                    />
                  )}

                  {/* Dropoff Marker */}
                  {trip.dropoff.coordinates && (
                    <Marker
                      position={trip.dropoff.coordinates}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#EF4444',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                      }}
                    />
                  )}

                  {/* Driver Marker */}
                  {trip.driver?.location && (
                    <Marker
                      position={trip.driver.location}
                      icon={{
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: statusColors[trip.status] || '#10B981',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                        rotation: 0,
                      }}
                      onClick={() => setSelectedTrip(trip)}
                    />
                  )}

                  {/* Route Line */}
                  {trip.pickup.coordinates && trip.dropoff.coordinates && (
                    <Polyline
                      path={[trip.pickup.coordinates, trip.dropoff.coordinates]}
                      options={{
                        strokeColor: statusColors[trip.status] || '#10B981',
                        strokeWeight: 3,
                        strokeOpacity: 0.6,
                      }}
                    />
                  )}
                </div>
              ))}

              {selectedTrip && selectedTrip.pickup.coordinates && (
                <InfoWindow
                  position={selectedTrip.pickup.coordinates}
                  onCloseClick={() => setSelectedTrip(null)}
                >
                  <div className="p-2 min-w-[200px]" dir="rtl">
                    <h3 className="font-semibold text-slate-800 mb-2">
                      رحلة #{selectedTrip._id.slice(-6).toUpperCase()}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-slate-500">الراكب:</span>{' '}
                        {selectedTrip.passenger?.user?.name || '-'}
                      </p>
                      <p>
                        <span className="text-slate-500">السائق:</span>{' '}
                        {selectedTrip.driver?.user?.name || '-'}
                      </p>
                      <p>
                        <span className="text-slate-500">الحالة:</span>{' '}
                        <span style={{ color: statusColors[selectedTrip.status] }}>
                          {statusLabels[selectedTrip.status]}
                        </span>
                      </p>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Trips List */}
        <div className="bg-white rounded-lg shadow-sm p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">قائمة الرحلات</h2>
          {trips.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Car size={48} className="mx-auto mb-4 text-slate-300" />
              <p>لا توجد رحلات نشطة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTrip?._id === trip._id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">
                      #{trip._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${statusColors[trip.status]}20`,
                        color: statusColors[trip.status],
                      }}
                    >
                      {statusLabels[trip.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span className="text-slate-600">
                        {trip.passenger?.user?.name || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car size={14} className="text-slate-400" />
                      <span className="text-slate-600">
                        {trip.driver?.user?.name || 'جاري البحث...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" />
                      <span className="text-slate-600 truncate">
                        {trip.pickup.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-red-500" />
                      <span className="text-slate-600 truncate">
                        {trip.dropoff.address}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={14} />
                      <span className="text-xs">
                        {new Date(trip.createdAt).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                    <span className="font-medium text-emerald-600">
                      {trip.fare.total.toFixed(2)} ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
