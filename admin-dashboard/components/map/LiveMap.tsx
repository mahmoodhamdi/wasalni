'use client';

import { useEffect, useRef, useId } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const mapId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Track which drivers we've seen this update
    const currentDriverIds = new Set(drivers.map(d => d.driverId));

    // Remove markers for drivers no longer in the list
    markersRef.current.forEach((marker, driverId) => {
      if (!currentDriverIds.has(driverId)) {
        marker.remove();
        markersRef.current.delete(driverId);
      }
    });

    // Add or update markers for current drivers
    drivers.forEach((driver) => {
      const existingMarker = markersRef.current.get(driver.driverId);
      const position: L.LatLngExpression = [driver.location.lat, driver.location.lng];

      const popupContent = `
        <div class="p-2 min-w-[200px]" dir="rtl">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">${driver.name}</h3>
              <p class="text-sm text-slate-500">${driver.phone}</p>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            ${driver.vehicle ? `
              <div class="flex justify-between">
                <span class="text-slate-500">المركبة:</span>
                <span class="text-slate-800">${driver.vehicle.make} ${driver.vehicle.model} - ${driver.vehicle.color}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">اللوحة:</span>
                <span class="text-slate-800">${driver.vehicle.plateNumber}</span>
              </div>
            ` : ''}
            <div class="flex justify-between">
              <span class="text-slate-500">الحالة:</span>
              <span class="font-medium ${driver.isAvailable ? 'text-emerald-600' : 'text-amber-600'}">
                ${driver.isAvailable ? 'متاح' : 'مشغول'}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">آخر تحديث:</span>
              <span class="text-slate-800">${formatLastUpdate(driver.lastUpdate)}</span>
            </div>
          </div>
        </div>
      `;

      if (existingMarker) {
        // Update existing marker position
        existingMarker.setLatLng(position);
        existingMarker.getPopup()?.setContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker(position)
          .addTo(map)
          .bindPopup(popupContent);

        if (onDriverSelect) {
          marker.on('click', () => onDriverSelect(driver));
        }

        markersRef.current.set(driver.driverId, marker);
      }
    });
  }, [drivers, formatLastUpdate, onDriverSelect]);

  return (
    <div
      ref={containerRef}
      id={`map-${mapId}`}
      className="h-full w-full"
      style={{ minHeight: '400px' }}
    />
  );
}
