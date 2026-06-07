/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, NavigationOff, Compass, ShipWheel } from 'lucide-react';
import { Order } from '../types';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface CityMapProps {
  order?: Order;
  courierOnline?: boolean;
}

interface MapContentProps {
  order?: Order;
  progress: number;
}

function MapContent({ order, progress }: MapContentProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [driverPos, setDriverPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLng[] | null>(null);

  useEffect(() => {
    if (!routesLib || !map) return;
    
    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    if (!order) {
      setRoutePath(null);
      setDriverPos(null);
      setRouteInfo(null);
      return;
    }

    const pickupLatLng = { lat: order.origin.lat, lng: order.origin.lng };
    const dropoffLatLng = { lat: order.destination.lat, lng: order.destination.lng };

    routesLib.Route.computeRoutes({
      origin: pickupLatLng,
      destination: dropoffLatLng,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      const activeRoute = routes?.[0];
      if (activeRoute) {
        setRoutePath(activeRoute.path || null);
        
        // Draw polyline on the map
        const newPolylines = activeRoute.createPolylines();
        newPolylines.forEach(p => p.setMap(map));
        polylinesRef.current = newPolylines;

        // Set viewport
        if (activeRoute.viewport) {
          map.fitBounds(activeRoute.viewport);
        }

        // Set routing info details
        const distanceKm = (activeRoute.distanceMeters || 0) / 1000;
        const durationMin = Math.round((activeRoute.durationMillis || 0) / 60000);
        setRouteInfo({
          distance: `${distanceKm.toFixed(1)} km`,
          duration: `${durationMin} mins`
        });
      }
    }).catch(err => {
      console.error('Error computing route:', err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, order?.id, order?.origin.lat, order?.origin.lng, order?.destination.lat, order?.destination.lng]);

  // Animate driver position along computed route path whenever progress or routePath updates
  useEffect(() => {
    if (!order) {
      setDriverPos(null);
      return;
    }

    if (!routePath || routePath.length === 0) {
      // Fallback interpolation if route isn't finished computing
      const ratio = progress / 100;
      setDriverPos({
        lat: order.origin.lat + (order.destination.lat - order.origin.lat) * ratio,
        lng: order.origin.lng + (order.destination.lng - order.origin.lng) * ratio,
      });
      return;
    }

    const totalPoints = routePath.length;
    let index = (progress / 100) * (totalPoints - 1);
    
    // Smooth boundary clamp
    if (index < 0) index = 0;
    if (index > totalPoints - 1) index = totalPoints - 1;

    const floorIndex = Math.floor(index);
    const ceilIndex = Math.ceil(index);
    const ratio = index - floorIndex;
    
    const pt1 = routePath[floorIndex];
    const pt2 = routePath[ceilIndex];
    if (pt1 && pt2) {
      setDriverPos({
        lat: pt1.lat() + (pt2.lat() - pt1.lat()) * ratio,
        lng: pt1.lng() + (pt2.lng() - pt1.lng()) * ratio,
      });
    } else if (pt1) {
      setDriverPos({ lat: pt1.lat(), lng: pt1.lng() });
    }
  }, [progress, routePath, order?.origin.lat, order?.origin.lng, order?.destination.lat, order?.destination.lng]);

  return (
    <>
      {/* Markers */}
      {order && (
        <>
          {/* Pickup Marker */}
          <AdvancedMarker position={{ lat: order.origin.lat, lng: order.origin.lng }} title="PICK-UP">
            <Pin background="#f59e0b" borderColor="#fff" glyphColor="#fff" />
          </AdvancedMarker>

          {/* Destination Marker */}
          <AdvancedMarker position={{ lat: order.destination.lat, lng: order.destination.lng }} title="DROP-OFF">
            <Pin background="#0d9488" borderColor="#fff" glyphColor="#fff" />
          </AdvancedMarker>

          {/* Live Driver Marker */}
          {driverPos && (
            <AdvancedMarker position={driverPos} title="COURIER">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 border-2 border-white shadow-xl animate-bounce">
                <Navigation size={14} className="text-white fill-current transform rotate-45" />
              </div>
            </AdvancedMarker>
          )}
        </>
      )}

      {/* Default Idle Map Marker */}
      {!order && (
        <AdvancedMarker position={{ lat: -6.2088, lng: 106.8456 }} title="COURIER ONLINE">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-teal-500/20 border-2 border-teal-500 animate-pulse">
            <div className="w-2.5 h-2.5 bg-teal-500 rounded-full border border-white" />
          </div>
        </AdvancedMarker>
      )}

      {/* Route distance and estimated duration panel inside map */}
      {order && routeInfo && (
        <div className="absolute top-16 left-4 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-xl text-xs flex gap-4 text-slate-200 z-10 pointer-events-none">
          <div>
            <div className="text-slate-400 text-[10px] font-mono">LIVE DISTANCE</div>
            <div className="font-bold text-emerald-400">{routeInfo.distance}</div>
          </div>
          <div className="w-px bg-slate-800 h-6 my-auto" />
          <div>
            <div className="text-slate-400 text-[10px] font-mono">EST. TIME</div>
            <div className="font-bold text-sky-400">{routeInfo.duration}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CityMap({ order, courierOnline = true }: CityMapProps) {
  // Animated progress (0 to 100) representing where the driver is on the path
  const [progress, setProgress] = useState(0);
  const [mapType, setMapType] = useState<'google' | 'simulator'>(hasValidKey ? 'google' : 'simulator');
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!order) {
      setProgress(0);
      return;
    }

    const interval = 100; // ms
    let targetProgress = 0;

    switch (order.status) {
      case 'pending':
        targetProgress = 0;
        break;
      case 'accepted':
        targetProgress = 15;
        break;
      case 'picking_up':
        targetProgress = 35;
        break;
      case 'in_transit':
        targetProgress = 70;
        break;
      case 'arrived':
        targetProgress = 95;
        break;
      case 'completed':
        targetProgress = 100;
        break;
      default:
        targetProgress = 0;
    }

    // Smoothly animate progress toward target
    const step = () => {
      setProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 1) {
          return targetProgress;
        }
        return prev + diff * 0.1;
      });
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [order, order?.status]);

  // Coordinates of city landmarks for drawing background roads
  const gridLines = Array.from({ length: 6 }, (_, i) => (i + 1) * 60);

  // Define static locations mapped to 400x320 SVG space for predictability
  const getCoordinatesForAddress = (address: string) => {
    if (!address) return { x: 200, y: 160 };
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    const x = Math.abs((hash % 260) + 70); // x between 70 and 330
    const y = Math.abs(((hash >> 3) % 180) + 70); // y between 70 and 250
    return { x, y };
  };

  const originCoords = order ? getCoordinatesForAddress(order.origin.address) : { x: 100, y: 220 };
  const destCoords = order ? getCoordinatesForAddress(order.destination.address) : { x: 300, y: 100 };

  // Calculate driver's position along the path based on progress
  let driverX = 180;
  let driverY = 160;

  if (order) {
    if (progress < 50) {
      // Phase 1: Courier travels from start position (200, 280) to Pick-up (origin)
      const startX = 200;
      const startY = 280;
      const ratio = progress / 50; // scales 0 to 1
      driverX = startX + (originCoords.x - startX) * ratio;
      driverY = startY + (originCoords.y - startY) * ratio;
    } else {
      // Phase 2: Courier travels from Pick-up (origin) to Drop-off (destination)
      const ratio = (progress - 50) / 50; // scales 0 to 1
      driverX = originCoords.x + (destCoords.x - originCoords.x) * ratio;
      driverY = originCoords.y + (destCoords.y - originCoords.y) * ratio;
    }
  }

  // --- GOOGLE MAP KEY EXPLANATORY SCREEN ---
  if (mapType === 'google' && !hasValidKey) {
    return (
      <div id="city-map" className="relative w-full h-80 bg-slate-950 overflow-hidden rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-6 text-center text-slate-200">
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setMapType('simulator')}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow-md shadow-emerald-950/40 cursor-pointer pointer-events-auto"
          >
            <Compass size={12} />
            <span>Switch to Simulator</span>
          </button>
        </div>
        
        <div className="max-w-md space-y-3">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <Navigation className="animate-pulse" size={24} />
            <h3 className="text-sm font-bold tracking-wider font-mono">GOOGLE MAPS API KEY REQUIRED</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
            Experience real-time interactive mapping, traffic, and high-fidelity routing.
          </p>
          
          <div className="bg-slate-900/60 p-3 rounded-xl text-left text-[11px] text-slate-300 border border-slate-800 space-y-1.5 font-sans leading-relaxed">
            <div><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Get a Google Maps API Key</a></div>
            <div><strong>Step 2:</strong> Add key as <code>GOOGLE_MAPS_PLATFORM_KEY</code> in Secrets:</div>
            <div className="pl-4 text-[10px] text-slate-400">
              • Open <strong>Settings</strong> (⚙️ gear icon, top-right of your screen)<br />
              • Select <strong>Secrets</strong><br />
              • Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> (as secret name), hit <strong>Enter</strong>, paste your API key, then hit <strong>Enter</strong> again.
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 italic">
            The application compiles automatically once the secret is saved.
          </p>
        </div>
      </div>
    );
  }

  // --- GOOGLE MAP LIVE VIEW ---
  if (mapType === 'google' && hasValidKey) {
    return (
      <div id="city-map" className="relative w-full h-80 bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
        {/* Toggle buttons */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => setMapType('simulator')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-mono tracking-wide font-semibold text-slate-400 hover:text-slate-200 bg-slate-950/80 backdrop-blur-sm hover:bg-slate-950 rounded-full border border-slate-850 shadow-md transition pointer-events-auto cursor-pointer"
          >
            <Compass size={11} />
            <span>SIMULATOR</span>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-mono tracking-wide font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-900/55 rounded-full shadow-md pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GOOGLE MAPS</span>
          </div>
        </div>

        <APIProvider apiKey={API_KEY} version="weekly">
          <div className="w-full h-full">
            <Map
              defaultCenter={{ lat: -6.2088, lng: 106.8456 }}
              defaultZoom={12}
              mapId="CUSANTAR_MAP_ID"
              style={{ width: '100%', height: '100%' }}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="rounded-2xl"
              gestureHandling="cooperative"
            >
              <MapContent order={order} progress={progress} />
            </Map>
          </div>
        </APIProvider>

        {/* Real-time Status Overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/85 backdrop-blur-md rounded-full border border-slate-800 shadow-lg shadow-black/30">
            <span className={`w-2.5 h-2.5 rounded-full ${order ? 'bg-emerald-505 animate-pulse text-emerald-500 bg-emerald-500' : 'bg-indigo-500'}`} />
            <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-200">
              {order ? `LIVE ROUTE: #${order.id.slice(0, 8).toUpperCase()}` : 'GP_RADAR_LIVE'}
            </span>
          </div>
        </div>

        {/* Address Badge Detail Panel at Bottom */}
        {order && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2 justify-between items-center px-4 py-2 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg text-[11px] text-slate-200 font-medium pointer-events-none">
            <div className="flex items-center gap-1.5 truncate max-w-[45%]">
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="truncate text-slate-400">{order.origin.address}</span>
            </div>
            <div className="flex-grow h-px border-t border-dashed border-slate-850 mx-1"></div>
            <div className="flex items-center gap-1.5 truncate max-w-[45%]">
              <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
              <span className="truncate text-slate-400">{order.destination.address}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- SIMULATOR VIEW (OFFLINE/FALLBACK SVG CANVAS) ---
  return (
    <div id="city-map" className="relative w-full h-80 bg-slate-900 overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      {/* Map Header Overlay with Toggles & Info */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => setMapType('google')}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-mono tracking-wide font-semibold text-slate-400 hover:text-slate-200 bg-slate-950/80 backdrop-blur-sm hover:bg-slate-950 rounded-full border border-slate-850 shadow-md transition pointer-events-auto cursor-pointer"
        >
          <Navigation size={11} className="text-emerald-400 fill-emerald-400" />
          <span>LIVE GOOGLE MAPS</span>
        </button>
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-mono tracking-wide font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-900/55 rounded-full shadow-md pointer-events-none">
          <span>SIMULATOR</span>
        </div>
      </div>

      {/* City Background Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

      {/* Real-time Status Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/85 backdrop-blur-md rounded-full border border-slate-800 shadow-lg shadow-black/30">
          <span className={`w-2.5 h-2.5 rounded-full ${order ? 'bg-emerald-500 animate-pulse' : courierOnline ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-200">
            {order ? `LIVE ROUTE: #${order.id.slice(0, 8).toUpperCase()}` : courierOnline ? 'GPS RADAR ONLINE' : 'GPS RADAR DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Address Badge Detail Panel at Bottom */}
      {order && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2 justify-between items-center px-4 py-2 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg text-[11px] text-slate-200 font-medium pointer-events-none">
          <div className="flex items-center gap-1.5 truncate max-w-[45%]">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="truncate text-slate-400">{order.origin.address}</span>
          </div>
          <div className="flex-grow h-px border-t border-dashed border-slate-850 mx-1"></div>
          <div className="flex items-center gap-1.5 truncate max-w-[45%]">
            <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
            <span className="truncate text-slate-400">{order.destination.address}</span>
          </div>
        </div>
      )}

      {/* SVG Canvas Map */}
      <svg className="w-full h-full pointer-events-none" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f765e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* City Streets Matrix Grid */}
        {gridLines.map((coord, idx) => (
          <g key={idx}>
            {/* Horizontal streets */}
            <line
              x1="0"
              y1={coord}
              x2="400"
              y2={coord}
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />
            {/* Vertical streets */}
            <line
              x1={coord}
              y1="0"
              x2={coord}
              y2={320}
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />
          </g>
        ))}

        {/* City Landmark Names on Grid */}
        <text x="30" y="50" fill="#475569" fontSize="8" fontFamily="monospace" letterSpacing="1">CUSANTAR BLVD</text>
        <text x="210" y="110" fill="#475569" fontSize="8" fontFamily="monospace" letterSpacing="1">GOURMET AVE</text>
        <text x="50" y="270" fill="#475569" fontSize="8" fontFamily="monospace" letterSpacing="1">NUSANTARA HWY</text>
        <text x="280" y="230" fill="#475569" fontSize="8" fontFamily="monospace" letterSpacing="1">SUDIRMAN PKWY</text>

        {/* If Active Order: Draw Pick-up and Drop-off Connection Lines */}
        {order && (
          <g>
            {/* Courier Beginning-to-Pickup Path */}
            {progress < 50 && (
              <line
                x1="200"
                y1="280"
                x2={originCoords.x}
                y2={originCoords.y}
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.75"
              />
            )}

            {/* Main Delivery Route Line (Yellow -> Teal) */}
            <line
              x1={originCoords.x}
              y1={originCoords.y}
              x2={destCoords.x}
              y2={destCoords.y}
              stroke="url(#routeGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Pick-Up Circle Pulsing Ring */}
            <circle cx={originCoords.x} cy={originCoords.y} r="18" fill="url(#ringGrad)" opacity="0.6">
              <animate attributeName="r" values="8;24;8" dur="3s" repeatCount="indefinite" />
            </circle>

            {/* Pick-Up Marker Pin (Amber) */}
            <g transform={`translate(${originCoords.x - 10}, ${originCoords.y - 22})`}>
              <path
                d="M10 0 C4.477 0 0 4.477 0 10 C0 15.523 10 24 10 24 C10 24 20 15.523 20 10 C20 4.477 15.523 0 10 0 Z"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle cx="10" cy="10" r="4.5" fill="#ffffff" />
            </g>

            {/* Drop-Off Marker Pin (Teal) */}
            <g transform={`translate(${destCoords.x - 10}, ${destCoords.y - 22})`}>
              <path
                d="M10 0 C4.477 0 0 4.477 0 10 C0 15.523 10 24 10 24 C10 24 20 15.523 20 10 C20 4.477 15.523 0 10 0 Z"
                fill="#0d9488"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle cx="10" cy="10" r="4.5" fill="#ffffff" />
            </g>

            {/* Pin Labels */}
            <text x={originCoords.x} y={originCoords.y - 28} fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">PICK-UP</text>
            <text x={destCoords.x} y={destCoords.y - 28} fill="#0d9488" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">DROP-OFF</text>

            {/* Courier Live Scooter Dot */}
            <g transform={`translate(${driverX - 14}, ${driverY - 14})`}>
              {/* Outer halo */}
              <circle cx="14" cy="14" r="14" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
              {/* Scooter illustration or arrow */}
              <path
                d="M14 8 V14 L18 16 M21 14 c0 3.866 -3.134 7 -7 7 s-7 -3.134 -7 -7 s3.134 -7 7 -7"
                stroke="#0d9488"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M9 13 H15 M15 13 L13 11 M15 13 L13 15"
                stroke="#0d9488"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        )}

        {/* If NO active order - Courier stands at Center/Radar circle */}
        {!order && courierOnline && (
          <g>
            <circle cx="200" cy="160" r="28" fill="rgba(13, 148, 136, 0.15)">
              <animate attributeName="r" values="10;45;10" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="160" r="6" fill="#0d9488" />
            <text x="200" y="195" fill="#0d9488" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">DRIVER GPS ACTIVE</text>
          </g>
        )}

        {/* If NO Active Order and Courier Offline */}
        {!order && !courierOnline && (
          <g>
            <circle cx="200" cy="160" r="6" fill="#475569" />
            <text x="200" y="185" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="sans-serif">COURIER DISPATCH STATS IDLE</text>
          </g>
        )}
      </svg>
    </div>
  );
}
