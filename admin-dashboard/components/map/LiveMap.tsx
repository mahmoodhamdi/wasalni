'use client';

import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Car } from 'lucide-react';

// Fix for default marker icons in Leaflet - only run once
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export interface DriverLocation {
  driverId: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleCategory: string;
  vehicle?: {
    type: string;
    category: string;
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  location: {
    lat: number;
    lng: number;
  };
  heading?: number;
  isAvailable: boolean;
  lastUpdate: string;
}

interface LiveMapProps {
  drivers: DriverLocation[];
  center: [number, number];
  zoom: number;
  onDriverSelect?: (driver: DriverLocation) => void;
  formatLastUpdate: (dateString: string) => string;
}

export default function LiveMap({
  drivers,
  center,
  zoom,
  onDriverSelect,
  formatLastUpdate,
}: LiveMapProps) {
  // Use mounted state to ensure single initialization in React Strict Mode
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100">
        <div className="text-slate-500">جارٍ تحميل الخريطة...</div>
      </div>
    );
  }

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {drivers.map((driver) => (
        <Marker
          key={driver.driverId}
          position={[driver.location.lat, driver.location.lng]}
          eventHandlers={{
            click: () => onDriverSelect?.(driver),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]" dir="rtl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{driver.name}</h3>
                  <p className="text-sm text-slate-500">{driver.phone}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {driver.vehicle && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">المركبة:</span>
                    <span className="text-slate-800">
                      {driver.vehicle.make} {driver.vehicle.model} - {driver.vehicle.color}
                    </span>
                  </div>
                )}
                {driver.vehicle && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">اللوحة:</span>
                    <span className="text-slate-800">{driver.vehicle.plateNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">الحالة:</span>
                  <span className={`font-medium ${driver.isAvailable ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {driver.isAvailable ? 'متاح' : 'مشغول'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">آخر تحديث:</span>
                  <span className="text-slate-800">{formatLastUpdate(driver.lastUpdate)}</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
