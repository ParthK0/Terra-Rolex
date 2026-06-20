import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface LocalCarbonMapProps {
  // no props needed for basic geolocated view
}

// Custom Retro Ambient Map styling to keep map look minimal, professional, and matching the light theme
const MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "simplified" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eaf2f8" }] }, // soft blue-green
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#cbd5e1" }] } // soft steel blue
];

export default function LocalCarbonMap({}: LocalCarbonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeInfo, setActiveInfo] = useState<{ title: string; desc: string; co2: string } | null>(null);

  // 1. Dynamic script loader for Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError("Map API key is missing. Verify settings.");
      return;
    }

    if (window.hasOwnProperty('google') && (window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-dashboard-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => setMapError("Failed to fetch map script from cloud.");
      document.head.appendChild(script);
    } else {
      const handleLoad = () => setMapsLoaded(true);
      script.addEventListener('load', handleLoad);
      return () => script.removeEventListener('load', handleLoad);
    }
  }, []);

  // 2. Initialize map and markers based on geolocated city coordinates
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current) return;

    const g = (window as any).google;
    if (!g || !g.maps) return;

    // Define defaults (London)
    let lat = 51.5074;
    let lng = -0.1278;

    const renderMapInstance = (centerLat: number, centerLng: number, zoomLevel = 13) => {
      if (!mapContainerRef.current) return;
      try {
        const map = new g.maps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: zoomLevel,
          styles: MAP_STYLE,
          disableDefaultUI: true, // cleaner glassmorphic dashboard feel
          zoomControl: true,
          gestureHandling: "cooperative",
        });

        // Current geolocated center marker (pulsing look)
        new g.maps.Marker({
          position: { lat: centerLat, lng: centerLng },
          map,
          title: "Your Location",
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2E90FA",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }
        });

        // Local Eco Points generator around user coords
        const ecoSpots = [
          { latOffset: 0.008, lngOffset: -0.012, title: "EV Quick Charging Station", desc: "Reduce commuting emissions with electric power.", co2: "-12.5 kg/charge" },
          { latOffset: -0.006, lngOffset: 0.014, title: "Bicycle Rental Docking Station", desc: "Log a cycle commute and save transport score points.", co2: "-2.4 kg/trip" },
          { latOffset: 0.012, lngOffset: 0.007, title: "Organic Green Grocer Shop", desc: "Purchase local produce reducing transport freight footprints.", co2: "-3.8 kg/basket" },
          { latOffset: -0.011, lngOffset: -0.009, title: "Municipal Waste & Compost Hub", desc: "Proper composting cuts residential methane scores.", co2: "-1.5 kg/week" },
        ];

        ecoSpots.forEach((spot) => {
          const marker = new g.maps.Marker({
            position: { lat: centerLat + spot.latOffset, lng: centerLng + spot.lngOffset },
            map,
            title: spot.title,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#16A34A", // green eco points
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
            }
          });

          marker.addListener('click', () => {
            setActiveInfo({
              title: spot.title,
              desc: spot.desc,
              co2: spot.co2,
            });
          });
        });
      } catch (err) {
        console.error("Map initialization failed:", err);
      }
    };

    // Attempt geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          renderMapInstance(pos.coords.latitude, pos.coords.longitude, 13);
        },
        () => {
          // Geolocation blocked/failed — fallback
          renderMapInstance(lat, lng, 12);
        },
        { timeout: 5000 }
      );
    } else {
      renderMapInstance(lat, lng, 12);
    }
  }, [mapsLoaded]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-white/20 shadow-lg bg-slate-100 flex flex-col justify-between">
      
      {/* ── Loader overlay ─────────────────────────────────────────────────── */}
      {!mapsLoaded && !mapError && (
        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-2.5 z-20">
          <Loader className="w-6 h-6 animate-spin text-accent-blue" />
          <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider">Geolocating environmental grid...</span>
        </div>
      )}

      {/* ── Error message overlay ──────────────────────────────────────────── */}
      {mapError && (
        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center z-20">
          <span className="text-xl">🗺️</span>
          <p className="text-xs font-bold text-text-charcoal mt-2">{mapError}</p>
          <p className="text-[10px] text-text-grey mt-1">Manual entry is fully operational on logging tabs.</p>
        </div>
      )}

      {/* Google Map canvas hook */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ── Click detail popup (custom glassmorphic overlay inside map card) ── */}
      {activeInfo && (
        <div className="absolute bottom-3 inset-x-3 bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-xl p-3 shadow-md z-30 flex flex-col justify-between gap-1 animate-fade-in">
          <div className="flex justify-between items-start">
            <h4 className="text-xs font-bold text-text-charcoal leading-tight">{activeInfo.title}</h4>
            <button
              onClick={() => setActiveInfo(null)}
              className="text-[10px] text-text-grey hover:text-text-charcoal font-bold p-0.5 cursor-pointer leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] text-text-grey leading-relaxed">{activeInfo.desc}</p>
          <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-gray-100">
            <span className="text-[8px] uppercase tracking-widest font-extrabold text-accent-green">Footprint Impact</span>
            <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">{activeInfo.co2}</span>
          </div>
        </div>
      )}
    </div>
  );
}
