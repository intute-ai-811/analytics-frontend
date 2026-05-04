// import React, { useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import "leaflet.marker.slideto";
// import { ArrowLeft, Wifi, WifiOff } from "lucide-react";

// // VITE_API_URL = bare origin only, no trailing /api
// //   production : VITE_API_URL=""
// //   local dev  : VITE_API_URL=http://localhost:5000
// const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// /* =========================
//    LIVE THRESHOLDS
// ========================= */
// const LIVE_THRESHOLD_MS = 15_000;
// const OFFLINE_THRESHOLD_MS = 5 * 60_000;
// const MAX_POINTS = 100;

// /* =========================
//    FIX DEFAULT ICONS
// ========================= */
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   shadowUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

// /* =========================
//    HELPERS
// ========================= */
// const haversine = ([lat1, lon1], [lat2, lon2]) => {
//   const R = 6371;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// const accuracyColor = (m) =>
//   m == null ? "#6b7280" : m < 10 ? "#22c55e" : m < 50 ? "#facc15" : "#ef4444";

// const formatTs = (d) =>
//   d
//     ? d.toLocaleTimeString(undefined, {
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//         hour12: false,
//       })
//     : "–";

// export default function VehicleLiveTrack() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const mapRef = useRef(null);
//   const markerRef = useRef(null);
//   const accuracyRef = useRef(null);
//   const pathRef = useRef(null);
//   const eventSourceRef = useRef(null);

//   const [points, setPoints] = useState([]);
//   const [lastUpdate, setLastUpdate] = useState(null);
//   const [follow, setFollow] = useState(true);
//   const [sseError, setSseError] = useState(null);

//   /* =========================
//      LIVE STATE
//   ========================= */
//   const now = Date.now();
//   const age = lastUpdate ? now - lastUpdate.getTime() : null;

//   const isLive = age != null && age < LIVE_THRESHOLD_MS;
//   const isOffline = age != null && age > OFFLINE_THRESHOLD_MS;

//   /* =========================
//      MAP INIT
//   ========================= */
//   useEffect(() => {
//     mapRef.current = L.map("live-map", {
//       center: [20.5937, 78.9629],
//       zoom: 5,
//     });

//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       maxZoom: 19,
//     }).addTo(mapRef.current);

//     mapRef.current.on("dragstart", () => setFollow(false));

//     pathRef.current = L.polyline([], {
//       color: "#22c55e",
//       weight: 4,
//       opacity: 0.8,
//     }).addTo(mapRef.current);

//     setTimeout(() => {
//       mapRef.current?.invalidateSize();
//     }, 0);

//     return () => mapRef.current?.remove();
//   }, []);

//   /* =========================
//      SSE CONNECTION
//   ========================= */
//   useEffect(() => {
//     if (!id) return;

//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     const token = user?.token;
//     if (!token) return;

//     const url = `${API_BASE_URL}/api/vehicles/${id}/location/stream?token=${token}`;
//     const es = new EventSource(url);
//     eventSourceRef.current = es;

//     es.onmessage = (e) => {
//       try {
//         const d = JSON.parse(e.data);
//         if (!d?.lat || !d?.lon) return;
//         if (d.lat === 0 && d.lon === 0) return;

//         const latLng = [d.lat, d.lon];
//         setLastUpdate(new Date(d.recorded_at || Date.now()));

//         setPoints((prev) => {
//           if (prev.length) {
//             const dist = haversine(prev[prev.length - 1], latLng);
//             if (dist > 2) return prev; // anti-teleport
//           }

//           const next = [...prev.slice(-MAX_POINTS + 1), latLng];
//           pathRef.current?.setLatLngs(next);
//           return next;
//         });

//         const arrowIcon = L.divIcon({
//           className: "vehicle-arrow",
//           html: `
//             <div style="
//               transform: rotate(${d.heading_deg || 0}deg);
//               font-size: 36px;
//               font-weight: 900;
//               color: ${isOffline ? "#6b7280" : "#22c55e"};
//               text-shadow: 0 0 6px rgba(0,0,0,0.85);
//             ">➤</div>
//           `,
//           iconSize: [40, 40],
//           iconAnchor: [20, 20],
//         });

//         if (!markerRef.current) {
//           markerRef.current = L.marker(latLng, { icon: arrowIcon }).addTo(mapRef.current);
//           mapRef.current.setView(latLng, 16);
//         } else {
//           markerRef.current.setIcon(arrowIcon);
//           markerRef.current.slideTo(latLng, { duration: 1000 });
//           if (follow) mapRef.current.panTo(latLng);
//         }

//         if (accuracyRef.current) accuracyRef.current.remove();
//         accuracyRef.current = L.circle(latLng, {
//           radius: d.accuracy_m || 10,
//           color: accuracyColor(d.accuracy_m),
//           fillOpacity: 0.15,
//         }).addTo(mapRef.current);

//         setSseError(null);
//       } catch {}
//     };

//     es.onerror = () => setSseError("Live stream disconnected");

//     return () => es.close();
//   }, [id, follow, isOffline]);

//   /* =========================
//      UI
//   ========================= */
//   return (
//     <div className="flex flex-col bg-black text-white" style={{ minHeight: 'calc(100vh - 180px)' }}>
//       {/* ================= HEADER ================= */}
//       <div className="shrink-0 px-6 py-4 bg-gray-900 border-b border-gray-800">
//         <h1 className="text-xl font-bold text-center tracking-wide">
//           Live Tracking
//         </h1>

//         <div className="mt-3 flex items-center justify-between text-sm">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-gray-300 hover:text-white"
//           >
//             <ArrowLeft size={16} /> Back
//           </button>

//           {isLive ? (
//             <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/60 font-semibold">
//               <span className="animate-pulse">●</span>
//               <Wifi size={14} /> LIVE
//             </span>
//           ) : isOffline ? (
//             <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700/40 text-gray-400 border border-gray-600/60 font-semibold">
//               <WifiOff size={14} /> OFFLINE
//             </span>
//           ) : (
//             <span className="text-amber-400 font-semibold">
//               Last seen {Math.round(age / 1000)}s ago
//             </span>
//           )}
//         </div>

//         <div className="mt-1 text-xs text-center text-gray-400">
//           Updated: {formatTs(lastUpdate)}
//           {sseError && <span className="ml-2 text-amber-400">⚠ {sseError}</span>}
//         </div>
//       </div>

//       {/* ================= MAP ================= */}
//       <div className="flex-1 relative" style={{ minHeight: '500px' }}>
//         <div id="live-map" className="absolute inset-0" />

//         {/* Recenter Button */}
//         <button
//           onClick={() => {
//             setFollow(true);
//             if (points.length && mapRef.current) {
//               mapRef.current.setView(points[points.length - 1], 16);
//             }
//           }}
//           className={`absolute top-4 right-4 z-[1000] px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg ${
//             follow
//               ? 'bg-emerald-600/80 text-white backdrop-blur-sm'
//               : 'bg-white/90 text-gray-800 hover:bg-white backdrop-blur-sm'
//           }`}
//         >
//           {follow ? '📍 Following' : 'Recenter'}
//         </button>

//         {/* Branding */}
//         <div className="absolute bottom-4 right-4 z-[1000]">
//           <a
//             href="https://www.intute.in/"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="block bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-orange-500 font-semibold hover:text-orange-600 transition-colors duration-200 shadow-lg text-sm"
//           >
//             Intute.ai
//           </a>
//         </div>
//       </div>

//       <style>{`
//         .leaflet-control-attribution {
//           display: none !important;
//         }
//         .leaflet-container {
//           z-index: 1;
//         }
//       `}</style>
//     </div>
//   );
// }
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isDemoMode, DEMO_LOCATION, DEMO_TOKEN } from "../demo/demoData";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.marker.slideto";
import { ArrowLeft, Wifi, WifiOff, Target, Navigation } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

/* =========================
   LIVE THRESHOLDS & COLORS
========================= */
const LIVE_THRESHOLD_MS = 15_000;
const OFFLINE_THRESHOLD_MS = 5 * 60_000;
const MAX_POINTS = 100;

const C = {
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
  slate: "#0a0814",
  border: "rgba(139, 92, 246, 0.3)"
};

/* =========================
   HELPERS
========================= */
const haversine = ([lat1, lon1], [lat2, lon2]) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const accuracyColor = (m) =>
  m == null ? "#6b7280" : m < 10 ? C.purple : m < 50 ? C.pink : "#ef4444";

const formatTs = (d) =>
  d ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "–";

export default function VehicleLiveTrack() {
  const { id } = useParams();
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyRef = useRef(null);
  const pathRef = useRef(null);
  const eventSourceRef = useRef(null);

  const [points, setPoints] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [follow, setFollow] = useState(true);
  const [sseError, setSseError] = useState(null);

  const now = Date.now();
  const age = lastUpdate ? now - lastUpdate.getTime() : null;
  const isLive = age != null && age < LIVE_THRESHOLD_MS;
  const isOffline = age != null && age > OFFLINE_THRESHOLD_MS;

  /* =========================
     MAP INIT
  ========================= */
  useEffect(() => {
    // Using CartoDB Dark Matter for the Cyberpunk look
    mapRef.current = L.map("live-map", {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false // Moved to custom position or styled
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "",
      maxZoom: 19,
    }).addTo(mapRef.current);

    mapRef.current.on("dragstart", () => setFollow(false));

    pathRef.current = L.polyline([], {
      color: C.purple,
      weight: 3,
      opacity: 0.6,
      dashArray: "5, 10",
    }).addTo(mapRef.current);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

    return () => mapRef.current?.remove();
  }, []);

  /* =========================
     SSE CONNECTION
  ========================= */
  useEffect(() => {
    if (!id) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = user?.token;
    if (!token) return;

    // Demo mode: simulate location SSE with drifting GPS instead of a real EventSource
    if (isDemoMode() || token === DEMO_TOKEN) {
      const base = DEMO_LOCATION[id] ?? { lat: 18.5204, lon: 73.8567 };
      let tick = 0;

      const placeMarker = (lat, lon, heading) => {
        const latLng = [lat, lon];
        setLastUpdate(new Date());
        setPoints((prev) => {
          const next = [...prev.slice(-MAX_POINTS + 1), latLng];
          pathRef.current?.setLatLngs(next);
          return next;
        });
        const arrowIcon = L.divIcon({
          className: "vehicle-arrow-container",
          html: `<div style="transform: rotate(${heading}deg); font-size: 32px; color: ${C.purple}; filter: drop-shadow(0 0 8px ${C.purple}); transition: color 0.5s;">➤</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        if (!markerRef.current) {
          markerRef.current = L.marker(latLng, { icon: arrowIcon }).addTo(mapRef.current);
          mapRef.current.setView(latLng, 16);
        } else {
          markerRef.current.setIcon(arrowIcon);
          markerRef.current.slideTo(latLng, { duration: 1000 });
          if (follow) mapRef.current.panTo(latLng);
        }
        if (accuracyRef.current) accuracyRef.current.remove();
        accuracyRef.current = L.circle(latLng, {
          radius: 8,
          color: "#22c55e",
          fillColor: "#22c55e",
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(mapRef.current);
        setSseError(null);
      };

      placeMarker(base.lat, base.lon, 45);
      const intervalId = setInterval(() => {
        tick++;
        const lat = base.lat + Math.sin(tick * 0.15) * 0.0003;
        const lon = base.lon + Math.cos(tick * 0.15) * 0.0003;
        placeMarker(lat, lon, (45 + tick * 8) % 360);
      }, 4000);
      return () => clearInterval(intervalId);
    }

    const url = `${API_BASE_URL}/api/vehicles/${id}/location/stream?token=${token}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (!d?.lat || !d?.lon) return;
        if (d.lat === 0 && d.lon === 0) return;

        const latLng = [d.lat, d.lon];
        setLastUpdate(new Date(d.recorded_at || Date.now()));

        setPoints((prev) => {
          if (prev.length) {
            const dist = haversine(prev[prev.length - 1], latLng);
            if (dist > 2) return prev; 
          }
          const next = [...prev.slice(-MAX_POINTS + 1), latLng];
          pathRef.current?.setLatLngs(next);
          return next;
        });

        const arrowIcon = L.divIcon({
          className: "vehicle-arrow-container",
          html: `
            <div style="
              transform: rotate(${d.heading_deg || 0}deg);
              font-size: 32px;
              color: ${isOffline ? "#6b7280" : C.purple};
              filter: drop-shadow(0 0 8px ${isOffline ? "transparent" : C.purple});
              transition: color 0.5s;
            ">➤</div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        if (!markerRef.current) {
          markerRef.current = L.marker(latLng, { icon: arrowIcon }).addTo(mapRef.current);
          mapRef.current.setView(latLng, 16);
        } else {
          markerRef.current.setIcon(arrowIcon);
          markerRef.current.slideTo(latLng, { duration: 1000 });
          if (follow) mapRef.current.panTo(latLng);
        }

        if (accuracyRef.current) accuracyRef.current.remove();
        accuracyRef.current = L.circle(latLng, {
          radius: d.accuracy_m || 10,
          color: accuracyColor(d.accuracy_m),
          fillColor: accuracyColor(d.accuracy_m),
          fillOpacity: 0.1,
          weight: 1
        }).addTo(mapRef.current);

        setSseError(null);
      } catch (err) {}
    };

    es.onerror = () => setSseError("Link Interrupted");
    return () => es.close();
  }, [id, follow, isOffline]);

  return (
    <div className="flex flex-col bg-[#0a0814] text-white" style={{ minHeight: 'calc(100vh - 180px)' }}>
      <style>{`
        .leaflet-container { background: #0a0814 !important; }
        .header-glass {
          background: rgba(15, 12, 33, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }
        .status-badge {
          font-family: 'Space Grotesk', monospace;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .map-btn {
          background: rgba(15, 12, 30, 0.9);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s;
        }
        .map-btn:hover {
          border-color: ${C.purple};
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
        }
        .text-gradient {
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* ================= HEADER ================= */}
      <div className="shrink-0 px-8 py-6 header-glass relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-gradient" style={{ fontFamily: 'Space Grotesk' }}>
                Live Stream
              </h1>
              <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">
                Satellite Node: {id?.slice(-8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Telemetry Status</p>
              <div className="text-xs font-mono text-purple-300/70">
                Lat: {points[points.length-1]?.[0].toFixed(4) || '0.0000'} | 
                Lon: {points[points.length-1]?.[1].toFixed(4) || '0.0000'}
              </div>
            </div>

            {isLive ? (
              <div className="status-badge flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <Wifi size={14} />
                <span className="text-xs font-bold">Active</span>
              </div>
            ) : isOffline ? (
              <div className="status-badge flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/10 text-gray-400 border border-white/10">
                <WifiOff size={14} />
                <span className="text-xs font-bold">Offline</span>
              </div>
            ) : (
              <div className="status-badge flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30">
                <Navigation size={14} className="animate-bounce" />
                <span className="text-xs font-bold">Signal Weak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAP ================= */}
      <div className="flex-1 relative">
        <div id="live-map" className="absolute inset-0" />

        {/* Floating Controls */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
            <div className="map-btn p-4 rounded-2xl">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Sync Clock</p>
                <p className="text-sm font-mono text-purple-400">{formatTs(lastUpdate)}</p>
                {sseError && <p className="text-[10px] text-pink-500 mt-1 animate-pulse font-bold">!! {sseError} !!</p>}
            </div>
        </div>

        {/* Recenter Button */}
        <button
          onClick={() => {
            setFollow(true);
            if (points.length && mapRef.current) {
              mapRef.current.setView(points[points.length - 1], 16);
            }
          }}
          className={`absolute top-6 right-6 z-[1000] flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl ${
            follow
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
              : 'map-btn text-gray-300'
          }`}
        >
          <Target size={16} className={follow ? "animate-spin-slow" : ""} />
          {follow ? 'Auto-Lock' : 'Recenter'}
        </button>

        {/* Branding */}
        <div className="absolute bottom-10 right-6 z-[1000]">
          <a
            href="https://www.intute.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="map-btn block px-5 py-3 rounded-xl text-purple-400 font-black text-xs tracking-tighter hover:text-pink-400 transition-all border border-purple-500/20"
          >
            INTUTE.CORE v2.4
          </a>
        </div>
      </div>
    </div>
  );
}