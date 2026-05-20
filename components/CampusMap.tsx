import React, { useState, useMemo, useEffect, useRef, useImperativeHandle } from 'react';
import { CampusLocation } from '../types';
import { Clock, Navigation, MapPin, X, Layers, Map as MapIcon } from 'lucide-react';
import { ImageModal } from './ImageModal';
import { fetchGoogleRoute, RouteResult } from '../services/routeService';
import { getRoutingOrigin, isUserOnCampus, OAU_MAIN_GATE } from '../utils/locationUtils';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Programmatically pan/zoom the map when activeDestination changes
const MapController = React.forwardRef<{
  repositionToUser: () => void;
}, {
  destination?: CampusLocation | null;
  userLocation?: { lat: number; lng: number };
}>(({ destination, userLocation }, ref) => {
  const map = useMap();
  const [lastAutoReposition, setLastAutoReposition] = useState<number>(0);
  const [initialZoomDone, setInitialZoomDone] = useState(false);

  // Zoom to user location once when the map loads and their location becomes available
  useEffect(() => {
    if (userLocation && !initialZoomDone) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1.5 });
      setInitialZoomDone(true);
      setLastAutoReposition(Date.now());
    }
  }, [userLocation, initialZoomDone, map]);

  // Auto-reposition to user location every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (userLocation && Date.now() - lastAutoReposition >= 120000) { // 2 minutes
        map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1.5 });
        setLastAutoReposition(Date.now());
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [userLocation, lastAutoReposition, map]);

  // Manual reposition function
  const repositionToUser = () => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1.5 });
      setLastAutoReposition(Date.now());
    }
  };

  // Fly to destination when it changes (no auto for user location)
  useEffect(() => {
    if (destination?.lat && destination?.lng) {
      map.flyTo([destination.lat, destination.lng], 17, { animate: true, duration: 1.5 });
    }
  }, [destination]);

  // Expose reposition function
  useImperativeHandle(ref, () => ({
    repositionToUser,
  }));

  return null;
});

interface CampusMapProps {
  locations: CampusLocation[];
  onLocationSelect: (loc: CampusLocation | null) => void;
  onGetDirections: (loc: CampusLocation) => void;
  userLocation?: { lat: number; lng: number };
  activeDestination?: CampusLocation | null;
  isSidebarOpen?: boolean;
  onCloseSidebar?: () => void;
  onOpenSidebar?: () => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  locations,
  onLocationSelect,
  onGetDirections,
  userLocation,
  activeDestination,
  isSidebarOpen,
  onCloseSidebar,
  onOpenSidebar,
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const mapControllerRef = useRef<{ repositionToUser: () => void }>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'schematic' | 'google'>('schematic');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const routeFetchId = useRef(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [tooltipDirections, setTooltipDirections] = useState<Record<string, 'top' | 'bottom'>>({})

  useEffect(() => {
    if (activeDestination && sidebarRef.current) {
      // Small timeout to allow DOM to render before scrolling
      setTimeout(() => {
        sidebarRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [activeDestination, isSidebarOpen]);

  const CAMPUS_CENTRE = { lat: 7.5197, lng: 4.5190 };

  const typeConfig: Record<string, { color: string; label: string }> = {
    academic:    { color: '#3b82f6', label: 'Building' },
    facility:    { color: '#22c55e', label: 'Facility' },
    transport:   { color: '#f97316', label: 'Landmark' },
    residential: { color: '#a855f7', label: 'Department' },
    custom:      { color: '#f97316', label: 'Landmark' },
  };
  const getPinStyle = (type: string) => typeConfig[type] || { color: '#3b82f6', label: 'Building' };

  // Build custom Leaflet DivIcon — pin circle + label text below
  const makeIcon = (color: string, isActive: boolean, name: string) => {
    const size = isActive ? 34 : 26;
    const svgSize = isActive ? 16 : 12;
    return L.divIcon({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
          <div class="${isActive ? 'active-pin-pulse' : ''}" style="
            --pin-color-trans: ${color}AA;
            width:${size}px;height:${size}px;
            background:${color};
            border-radius:50%;
            border:2.5px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.28);
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;
          ">
            <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3" fill="${color}"/>
            </svg>
          </div>
          <div style="
            background:${isActive ? color : 'rgba(255,255,255,0.95)'};
            color:${isActive ? '#fff' : '#1e293b'};
            font-size:10px;
            font-weight:${isActive ? 700 : 600};
            font-family:system-ui,sans-serif;
            padding:2px 6px;
            border-radius:10px;
            white-space:nowrap;
            max-width:120px;
            overflow:hidden;
            text-overflow:ellipsis;
            box-shadow:0 1px 4px rgba(0,0,0,0.18);
            border:1px solid ${isActive ? color : 'rgba(0,0,0,0.08)'};
            pointer-events:none;
          ">${name}</div>
        </div>`,
      className: '',
      // iconSize covers the whole wrapper including label (~40px tall for label)
      iconSize: [140, size + 24],
      // anchor at horizontal center of the pin circle, bottom of the circle
      iconAnchor: [70, size],
      popupAnchor: [0, -size],
    });
  };

  // User location dot icon
  const userIcon = L.divIcon({
    html: `<div style="width:20px;height:20px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25),0 2px 6px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Google Maps embed URL (satellite / directions mode)
  const googleMapSrc = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!apiKey) return '';
    const base = 'https://www.google.com/maps/embed/v1';
    if (activeDestination?.lat && activeDestination?.lng) {
      const originCoords = userLocation ? getRoutingOrigin(userLocation) : undefined;
      const origin = originCoords
        ? `${originCoords.lat},${originCoords.lng}`
        : 'Obafemi+Awolowo+University,Ile-Ife';
      const dest = `${activeDestination.lat},${activeDestination.lng}`;
      return `${base}/directions?origin=${origin}&destination=${dest}&mode=walking&maptype=roadmap&key=${apiKey}`;
    }
    return `${base}/place?q=Obafemi+Awolowo+University,Ile-Ife&maptype=roadmap&zoom=15&key=${apiKey}`;
  }, [viewMode, userLocation, activeDestination]);

  // Fetch route from Google Directions via server proxy
  useEffect(() => {
    if (!activeDestination?.lat || !activeDestination?.lng) {
      setRouteResult(null);
      return;
    }

    // If the user is outside campus but close to the main gate, snap origin to the gate.
    // If they are farther away, use their real location so long-distance routing stays accurate.
    const rawOrigin = userLocation ?? CAMPUS_CENTRE;
    const origin = userLocation ? getRoutingOrigin(userLocation) : rawOrigin;
    const offCampus = userLocation ? !isUserOnCampus(userLocation) : false;
    const useRawGoogleNames = viewMode === 'google';
    // Attach the offCampus flag so the panel can show the gate note
    void offCampus; // used below in JSX via routeResult check

    const fetchId = ++routeFetchId.current;
    setRouteLoading(true);
    setRouteResult(null);

    fetchGoogleRoute(origin, { lat: activeDestination.lat, lng: activeDestination.lng }, useRawGoogleNames)
      .then((result) => {
        if (fetchId !== routeFetchId.current) return;
        setRouteResult(result);
        setRouteLoading(false);
      });
  }, [userLocation, activeDestination, viewMode]);

  // Derive whether the user is outside the OAU perimeter (for the "gate" note)
  const userOffCampus = userLocation ? !isUserOnCampus(userLocation) : false;

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  return (
    <div className="flex h-full w-full bg-[#f8fafc] overflow-hidden">

      {/* Left Column: Map */}
      <div className="flex-1 md:p-4 md:pr-2 flex flex-col relative min-w-0 z-10">
        <div className="flex-1 bg-white md:rounded-xl shadow-sm border-0 md:border md:border-gray-200 relative" style={{ borderRadius: 'inherit' }}>

          {/* Leaflet Map */}
          {viewMode === 'schematic' ? (
            <MapContainer
              center={[CAMPUS_CENTRE.lat, CAMPUS_CENTRE.lng]}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              {/* CartoDB Positron — clean light-mode map like the reference image */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              {/* Route Polyline from Google Directions */}
              {routeResult && routeResult.polyline.length >= 2 && (
                <>
                  <Polyline
                    positions={routeResult.polyline.map((p) => [p.lat, p.lng] as [number, number])}
                    color="#1d4ed8"
                    weight={8}
                    opacity={0.12}
                  />
                  <Polyline
                    positions={routeResult.polyline.map((p) => [p.lat, p.lng] as [number, number])}
                    color="#3b82f6"
                    weight={5}
                    opacity={0.9}
                  />
                </>
              )}

              {/* User location dot */}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
              )}

              {/* Campus location markers */}
              {locations.map((loc) => {
                if (!loc.lat || !loc.lng) return null;
                const isActive = activeDestination?.id === loc.id;
                const style = getPinStyle(loc.type);
                return (
                  <Marker
                    key={loc.id}
                    position={[loc.lat, loc.lng]}
                    icon={makeIcon(style.color, isActive, loc.name)}
                    eventHandlers={{ 
                      click: () => onLocationSelect(loc),
                      mouseover: (e: any) => {
                        setHoveredLocationId(loc.id);
                        const y = e.containerPoint.y;
                        if (y < 220) {
                          setTooltipDirections(prev => ({ ...prev, [loc.id]: 'bottom' }));
                        } else {
                          setTooltipDirections(prev => ({ ...prev, [loc.id]: 'top' }));
                        }
                      },
                      mouseout: () => {
                        setHoveredLocationId(null);
                      }
                    }}
                  >
                    {/* Hover tooltip - only show when this location is hovered */}
                    {hoveredLocationId === loc.id && (
                    <Tooltip
                      direction={tooltipDirections[loc.id] || "top"}
                      offset={tooltipDirections[loc.id] === 'bottom' ? [0, 20] : [0, -36]}
                      opacity={1}
                      className="uninav-tooltip"
                      permanent={true}
                    >
                      <div style={{ width: '220px', overflow: 'hidden' }}>
                        {/* Image banner */}
                        {loc.imageUrl && (
                          <div style={{
                            width: '100%',
                            height: '110px',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '12px 12px 0 0',
                          }}>
                            <img
                              src={loc.imageUrl}
                              alt={loc.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                            {/* Gradient scrim so text below has depth */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35) 100%)',
                            }} />
                          </div>
                        )}

                        {/* Text body */}
                        <div style={{ padding: '8px 10px 10px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px',
                          }}>
                            <div style={{
                              width: '8px', height: '8px',
                              borderRadius: '50%',
                              backgroundColor: style.color,
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontWeight: 700,
                              fontSize: '12px',
                              color: '#0f172a',
                              lineHeight: 1.2,
                            }}>{loc.name}</span>
                          </div>
                          <div style={{
                            display: 'inline-block',
                            background: style.color + '22',
                            color: style.color,
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            marginBottom: '5px',
                          }}>{style.label}</div>
                          {loc.description && (
                            <p style={{
                              fontSize: '11px',
                              color: '#475569',
                              margin: 0,
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            } as React.CSSProperties}>{loc.description}</p>
                          )}
                        </div>
                      </div>
                    </Tooltip>
                    )}
                  </Marker>
                );
              })}

              <MapController ref={mapControllerRef} destination={activeDestination} userLocation={userLocation} />
            </MapContainer>
          ) : (
            <iframe
              src={googleMapSrc}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}

          {/* Satellite / Map Toggle */}
          <div className="absolute bottom-24 right-4 md:bottom-6 md:right-6 z-[400]">
            <button
              onClick={() => setViewMode(viewMode === 'schematic' ? 'google' : 'schematic')}
              className="bg-white p-3 md:px-3 md:py-2.5 rounded-2xl md:rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-gray-700 hover:bg-gray-50 hover:shadow-xl transition-all md:min-w-[76px] min-w-[46px] min-h-[46px]"
            >
              {viewMode === 'schematic' ? (
                <>
                  <Layers size={20} className="md:mb-1 text-gray-800" strokeWidth={2.5} />
                  <span className="hidden md:inline text-[11px] font-bold text-gray-700">Satellite</span>
                </>
              ) : (
                <>
                  <MapIcon size={20} className="md:mb-1 text-gray-800" strokeWidth={2.5} />
                  <span className="hidden md:inline text-[11px] font-bold text-gray-700">Map</span>
                </>
              )}
            </button>
          </div>

          {/* Reposition Button */}
          {viewMode === 'schematic' && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[400]">
              <button
                onClick={() => mapControllerRef.current?.repositionToUser()}
                className="w-[46px] h-[46px] bg-white rounded-full shadow-lg border border-gray-100 flex flex-col items-center justify-center text-blue-600 hover:bg-blue-50 transition-all"
                title="Reposition to current location"
              >
                <Navigation size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Legend */}
          {viewMode === 'schematic' && (
            <div className="hidden md:block absolute bottom-6 left-6 bg-white p-3.5 rounded-xl shadow-md border border-gray-100 min-w-[120px] z-[400]">
              <h4 className="text-xs font-semibold text-gray-700 mb-2.5">Legend</h4>
              <div className="flex flex-col gap-2">
                {Array.from(new Set(Object.values(typeConfig).map((t) => JSON.stringify(t)))).map((tStr, idx) => {
                  const tc = JSON.parse(tStr);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tc.color }}></div>
                      <span className="text-[11px] text-gray-600 font-medium">{tc.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile floating pill for active destination */}
          {activeDestination && (
            <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] w-[85%] max-w-[320px]">
              <button
                onClick={() => onOpenSidebar?.()}
                className="w-full bg-[#1c5fdf] hover:bg-blue-700 shadow-xl rounded-full px-5 py-4 flex items-center justify-between gap-3 text-white transition-transform active:scale-95 border border-blue-400"
              >
                <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border border-white/50 text-[10px] font-mono">i</div>
                <div className="flex-1 text-center font-medium text-[15px] leading-tight text-white px-2">{activeDestination.name}</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Sidebar */}
      <div className={`
        fixed inset-0 z-[1000] bg-[#f8fafc] transform transition-transform duration-300
        md:relative md:inset-auto md:w-[380px] md:translate-x-0 md:bg-[#f8fafc] md:border-l md:border-gray-100 flex flex-col shrink-0 h-full overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Mobile Sidebar Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
          <button onClick={onCloseSidebar} className="p-2 text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 md:pt-6 shrink-0 bg-white md:bg-transparent">
          <div className="bg-white border border-gray-200 rounded-lg flex items-center px-4 py-2.5 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
            <input
              type="text"
              placeholder="Search locations..."
              className="w-full bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6" ref={sidebarRef}>
          {/* Selected Card */}
          {activeDestination && (
            <div className="bg-[#f0f5fc] rounded-xl mb-6 relative border border-transparent shadow-sm overflow-hidden flex flex-col p-5">
              <button
                onClick={() => onLocationSelect(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X size={16} />
              </button>

              {activeDestination.imageUrl && (
                <div
                  className="h-36 w-full rounded-lg overflow-hidden mb-4 cursor-pointer relative"
                  onClick={() => setFullscreenImage(activeDestination.imageUrl!)}
                >
                  <img src={activeDestination.imageUrl} alt={activeDestination.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getPinStyle(activeDestination.type).color }}
                />
                <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{activeDestination.name}</h3>
              </div>
              <p className="text-[12px] text-gray-500 leading-snug mb-4">{activeDestination.description}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => onGetDirections(activeDestination)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold py-2.5 px-3 rounded-lg transition-colors"
                >
                  <Navigation size={13} />
                  Directions
                </button>
              </div>

              {/* Directions Panel */}
              {routeLoading && (
                <div className="mt-3 flex items-center gap-2 justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '100ms' }} />
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
              )}

              {routeResult && !routeLoading && (
                <div className="mt-3 rounded-xl overflow-hidden border border-blue-100">
                  {/* Summary header */}
                  <div className="bg-blue-600 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white">
                      <Navigation size={12} />
                      <span className="text-[12px] font-bold">{routeResult.totalDuration}</span>
                    </div>
                    <span className="text-[11px] text-blue-200 font-medium">{routeResult.totalDistance} walking</span>
                  </div>

                  {/* Off-campus gate note */}
                  {userOffCampus && (
                    <div className="bg-amber-50 border-b border-amber-100 px-3 py-1.5 flex items-start gap-1.5">
                      <MapPin size={11} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-amber-700 leading-snug font-medium">
                        You appear to be off-campus. Directions start from OAU Main Gate.
                      </p>
                    </div>
                  )}

                  {/* Step-by-step list */}
                  <ol className="divide-y divide-gray-100 bg-white max-h-[220px] overflow-y-auto">
                    {routeResult.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 px-3 py-2">
                        <div className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-800 font-medium leading-snug">{step.instruction}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{step.distance}{step.distance && step.duration ? ' · ' : ''}{step.duration}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-3">
              {searchQuery ? `Results for "${searchQuery}"` : `All Locations (${filteredLocations.length})`}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {filteredLocations.map((loc) => {
              const isActive = activeDestination?.id === loc.id;
              const style = getPinStyle(loc.type);
              return (
                <div key={loc.id} className="flex flex-col gap-2">
                  <button
                    onClick={() => onLocationSelect(isActive ? null : loc)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: style.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{loc.name}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{loc.description}</p>
                      </div>
                      {isActive && <MapPin size={14} className="text-blue-500 shrink-0" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {fullscreenImage && (
        <ImageModal imageUrl={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      )}
    </div>
  );
};