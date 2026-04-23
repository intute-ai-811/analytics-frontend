// import React, { useEffect, useMemo, useState } from "react";
// import { useParams } from "react-router-dom";

// // VITE_API_URL = bare origin only, no trailing /api
// //   production : VITE_API_URL=""
// //   local dev  : VITE_API_URL=http://localhost:5000
// const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// /* ========================= BATTERY ANALYTICS ========================= */
// export default function BatteryAnalytics() {
//   const { id } = useParams();

//   const [data, setData] = useState([]);
//   const [selectedDate, setSelectedDate] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   /* ===== FETCH DATA ===== */
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem("token");
//         if (!token) throw new Error("Not authenticated");

//         const url = selectedDate
//           ? `${API_BASE_URL}/api/battery/analytics/${id}?date=${selectedDate}`
//           : `${API_BASE_URL}/api/battery/analytics/${id}?days=30`;

//         const res = await fetch(url, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         if (!res.ok) throw new Error("Failed to load battery analytics");

//         const rows = await res.json();
//         setData(rows || []);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) fetchData();
//   }, [id, selectedDate]);

//   /* ===== ODO SUMMARY (ONLY FOR 30 DAYS VIEW) ===== */
//   const odo = useMemo(() => {
//     if (!data.length || selectedDate)
//       return { energyUsed: null, maxCurrent: 0, maxTemp: 0, avgTemp: null };

//     const energyUsed = data
//       .map(d => Number(d.total_kwh_consumed || 0))
//       .reduce((a, b) => a + b, 0);

//     const validAvgTemps = data
//       .map(d => Number(d.avg_cell_temp_c ?? 0))
//       .filter(v => v > 0);
//     const avgTemp = validAvgTemps.length
//       ? validAvgTemps.reduce((a, b) => a + b, 0) / validAvgTemps.length
//       : null;

//     return {
//       energyUsed: energyUsed || null,
//       maxCurrent: Math.max(...data.map(d => Number(d.max_op_dc_current_a ?? 0))),
//       maxTemp: Math.max(...data.map(d => Number(d.max_cell_temp_c ?? 0))),
//       avgTemp,
//     };
//   }, [data, selectedDate]);

//   /* ===== LATEST / SELECTED DAY ===== */
//   const latestTrip = useMemo(() => {
//     if (!data.length) return {};
//     return data[0];
//   }, [data]);

//   /* ===== CHART DATA (ASC ORDER) ===== */
//   const chartData = useMemo(() => [...data].reverse(), [data]);

//   const handleClearDate = () => setSelectedDate("");

//   if (loading)
//     return (
//       <div className="text-center py-16 text-orange-300">
//         Loading battery analytics…
//       </div>
//     );

//   if (error)
//     return (
//       <div className="text-center py-16 text-red-400">
//         Error: {error}
//       </div>
//     );

//   return (
//     <div className="space-y-8 pb-8">
//       {/* ===== CENTERED TITLE ===== */}
//       <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent mb-3">
//         Battery Analytics
//       </h2>

//       {/* ===== DATE FILTER ===== */}
//       <div className="flex justify-center items-center gap-4 flex-wrap">
//         <label className="text-orange-300 text-sm font-medium">View by Date:</label>
//         <input
//           type="date"
//           value={selectedDate}
//           onChange={e => setSelectedDate(e.target.value)}
//           className="bg-gray-900/80 border border-orange-500/40 text-orange-200 rounded-lg px-4 py-2 focus:border-orange-500 focus:outline-none transition"
//         />
//         {selectedDate && (
//           <button
//             onClick={handleClearDate}
//             className="text-orange-400 hover:text-orange-300 underline text-sm transition"
//           >
//             Show last 30 days
//           </button>
//         )}
//       </div>

//       {/* ===== SUMMARY ===== */}
//       {!selectedDate && data.length > 0 && (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Section title="ODO Summary (Last 30 Days)">
//             <Stat label="Energy Used" value={odo.energyUsed} unit="kWh" />
//             <Stat label="Max DC Current" value={odo.maxCurrent} unit="A" />
//             <Stat label="Max Cell Temperature" value={odo.maxTemp} unit="°C" warn={45} danger={55} />
//             <Stat label="Avg Cell Temperature" value={odo.avgTemp} unit="°C" warn={42} danger={52} />
//           </Section>

//           <Section title="Latest Day">
//             <Stat label="Energy Used" value={latestTrip.total_kwh_consumed} unit="kWh" />
//             <Stat label="Max DC Current" value={latestTrip.max_op_dc_current_a} unit="A" />
//             <Stat label="Max Cell Temperature" value={latestTrip.max_cell_temp_c} unit="°C" warn={45} danger={55} />
//             <Stat label="Avg Cell Temperature" value={latestTrip.avg_cell_temp_c} unit="°C" warn={42} danger={52} />
//           </Section>
//         </div>
//       )}

//       {/* ===== NO DATA ===== */}
//       {data.length === 0 && (
//         <div className="text-center py-12 text-orange-300/70">
//           No battery analytics data available for the selected period.
//         </div>
//       )}

//       {/* ===== CHARTS ===== */}
//       {data.length > 0 && (
//         <>
//           {!selectedDate ? (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <ChartCard title="Energy Consumption Trend (kWh)">
//                 <LineChart
//                   data={chartData.map(d => ({ x: d.day, y: Number(d.total_kwh_consumed ?? 0) }))}
//                 />
//               </ChartCard>

//               <ChartCard title="Max Cell Temperature Trend (°C)">
//                 <LineChart
//                   data={chartData.map(d => ({ x: d.day, y: Number(d.max_cell_temp_c ?? 0) }))}
//                   band={{ warn: 45, danger: 55 }}
//                 />
//               </ChartCard>

//               <ChartCard title="Avg Cell Temperature Trend (°C)">
//                 <LineChart
//                   data={chartData.map(d => ({ x: d.day, y: Number(d.avg_cell_temp_c ?? 0) }))}
//                   band={{ warn: 42, danger: 52 }}
//                 />
//               </ChartCard>

//               <ChartCard title="Max DC Current Trend (A)">
//                 <LineChart
//                   data={chartData.map(d => ({ x: d.day, y: Number(d.max_op_dc_current_a ?? 0) }))}
//                 />
//               </ChartCard>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <Section title={`Data on ${selectedDate}`}>
//                 <Stat label="Energy Used" value={latestTrip.total_kwh_consumed} unit="kWh" />
//                 <Stat label="Max DC Current" value={latestTrip.max_op_dc_current_a} unit="A" />
//                 <Stat label="Max Cell Temperature" value={latestTrip.max_cell_temp_c} unit="°C" warn={45} danger={55} />
//                 <Stat label="Avg Cell Temperature" value={latestTrip.avg_cell_temp_c} unit="°C" warn={42} danger={52} />
//               </Section>

//               <ChartCard title={`Battery Metrics on ${selectedDate}`}>
//                 <BarChart
//                   data={[
//                     { x: "Energy",     y: Number(latestTrip.total_kwh_consumed ?? 0) },
//                     { x: "DC Current", y: Number(latestTrip.max_op_dc_current_a ?? 0) },
//                     { x: "Max Temp",   y: Number(latestTrip.max_cell_temp_c ?? 0) },
//                     { x: "Avg Temp",   y: Number(latestTrip.avg_cell_temp_c ?? 0) },
//                   ]}
//                   band={{ warn: 45, danger: 55 }}
//                 />
//               </ChartCard>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// /* ========================= UI HELPERS ========================= */

// function Section({ title, children }) {
//   return (
//     <div className="border border-orange-500/30 p-6 rounded-xl bg-gradient-to-br from-gray-900/90 to-black/80 backdrop-blur-sm shadow-lg">
//       <h3 className="font-bold text-orange-400 mb-5 text-lg border-b border-orange-500/20 pb-3">{title}</h3>
//       <div className="space-y-3">{children}</div>
//     </div>
//   );
// }

// function Stat({ label, value, unit, warn, danger }) {
//   if (value == null || isNaN(value))
//     return (
//       <div className="flex justify-between items-center bg-gray-800/50 px-5 py-4 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all">
//         <span className="text-gray-300 font-medium">{label}</span>
//         <span className="text-gray-400">–</span>
//       </div>
//     );

//   const v = Number(value).toFixed(2);
//   let color = "text-emerald-400";
//   let bgColor = "bg-emerald-500/10";

//   if (warn && danger) {
//     const n = Number(v);
//     if (n >= danger) { color = "text-red-400"; bgColor = "bg-red-500/10"; }
//     else if (n >= warn) { color = "text-yellow-400"; bgColor = "bg-yellow-500/10"; }
//   }

//   return (
//     <div className="flex justify-between items-center bg-gray-800/50 px-5 py-4 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all">
//       <span className="text-gray-300 font-medium">{label}</span>
//       <div className={`${bgColor} px-3 py-1 rounded-md`}>
//         <span className={`font-bold text-lg ${color}`}>
//           {v} <span className="text-sm opacity-70 font-normal">{unit}</span>
//         </span>
//       </div>
//     </div>
//   );
// }

// function ChartCard({ title, children }) {
//   return (
//     <div className="border border-orange-500/30 rounded-xl p-5 bg-gradient-to-br from-gray-900/90 to-black/80 backdrop-blur-sm shadow-lg">
//       <h3 className="text-orange-400 font-bold mb-4 text-center text-base">{title}</h3>
//       <div className="flex justify-center bg-black/30 rounded-lg p-4">{children}</div>
//     </div>
//   );
// }

// /* ========================= CHARTS ========================= */

// function LineChart({ data, band }) {
//   if (!data || data.length === 0)
//     return <div className="h-48 flex items-center justify-center text-gray-500">No data</div>;

//   const width = 600, height = 220, pad = 40;
//   const values = data.map(d => d.y);
//   const maxY = Math.max(...values, band?.danger || 100, 10);
//   const minY = Math.min(...values, 0);

//   const points = data.map((d, i) => {
//     const x = pad + (i / (data.length - 1)) * (width - pad * 2);
//     const y = height - pad - ((d.y - minY) / (maxY - minY)) * (height - pad * 2);
//     return `${x},${y}`;
//   }).join(" ");

//   const areaPoints = `${pad},${height - pad} ${points} ${width - pad},${height - pad}`;

//   return (
//     <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
//       <defs>
//         <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
//           <stop offset="0%" stopColor="rgb(251,146,60)" stopOpacity="0.3" />
//           <stop offset="100%" stopColor="rgb(251,146,60)" stopOpacity="0.05" />
//         </linearGradient>
//       </defs>
//       {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
//         const y = height - pad - ratio * (height - pad * 2);
//         return (
//           <g key={ratio}>
//             <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="rgba(251,146,60,0.15)" strokeWidth="1" strokeDasharray="4,4" />
//             <text x={pad - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgb(156,163,175)">
//               {(minY + ratio * (maxY - minY)).toFixed(1)}
//             </text>
//           </g>
//         );
//       })}
//       <polygon fill="url(#lineGradient)" points={areaPoints} />
//       <polyline fill="none" stroke="rgb(251,146,60)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
//       {data.map((d, i) => {
//         const x = pad + (i / (data.length - 1)) * (width - pad * 2);
//         const y = height - pad - ((d.y - minY) / (maxY - minY)) * (height - pad * 2);
//         let fill = "rgb(251,146,60)";
//         if (band) {
//           if (d.y >= band.danger) fill = "rgb(239,68,68)";
//           else if (d.y >= band.warn) fill = "rgb(234,179,8)";
//         }
//         return (
//           <g key={i}>
//             <circle cx={x} cy={y} r="5" fill="rgba(0,0,0,0.6)" />
//             <circle cx={x} cy={y} r="4" fill={fill} />
//             <title>{`${d.x}: ${d.y.toFixed(2)}`}</title>
//           </g>
//         );
//       })}
//     </svg>
//   );
// }

// function BarChart({ data, band }) {
//   if (!data || data.length === 0)
//     return <div className="h-48 flex items-center justify-center text-gray-500">No data</div>;

//   const width = 560, height = 220, pad = 50;
//   const maxY = Math.max(...data.map(d => d.y), band?.danger || 100, 10);
//   const barWidth = (width - pad * 2) / data.length - 30;

//   return (
//     <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
//       <defs>
//         {data.map((d, i) => {
//           let c1 = "rgb(251,146,60)", c2 = "rgb(251,191,36)";
//           if (band && (d.x.includes("Temp") || d.x === "Max Temp" || d.x === "Avg Temp")) {
//             if (d.y >= band.danger) { c1 = "rgb(239,68,68)"; c2 = "rgb(220,38,38)"; }
//             else if (d.y >= band.warn) { c1 = "rgb(234,179,8)"; c2 = "rgb(202,138,4)"; }
//           }
//           return (
//             <linearGradient key={i} id={`barGradient${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
//               <stop offset="0%" stopColor={c1} />
//               <stop offset="100%" stopColor={c2} />
//             </linearGradient>
//           );
//         })}
//       </defs>
//       {[0.25, 0.5, 0.75].map(ratio => (
//         <line key={ratio} x1={pad} y1={height - pad - ratio * (height - pad * 2)} x2={width - pad} y2={height - pad - ratio * (height - pad * 2)} stroke="rgba(251,146,60,0.1)" strokeDasharray="4,4" />
//       ))}
//       {data.map((d, i) => {
//         const barHeight = (d.y / maxY) * (height - pad * 2);
//         const y = height - pad - barHeight;
//         const x = pad + i * (barWidth + 30) + 15;
//         return (
//           <g key={i}>
//             <rect x={x + 2} y={y + 2} width={barWidth} height={barHeight} rx="8" fill="rgba(0,0,0,0.3)" />
//             <rect x={x} y={y} width={barWidth} height={barHeight} rx="8" fill={`url(#barGradient${i})`} />
//             <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="13" fill="rgb(209,213,219)" fontWeight="600">{d.x}</text>
//             <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fontSize="15" fill="rgb(251,146,60)" fontWeight="bold">{d.y.toFixed(1)}</text>
//           </g>
//         );
//       })}
//     </svg>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

/* ========================= BATTERY ANALYTICS ========================= */
export default function BatteryAnalytics() {
  const { id } = useParams();

  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===== FETCH DATA ===== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const url = selectedDate
          ? `${API_BASE_URL}/api/battery/analytics/${id}?date=${selectedDate}`
          : `${API_BASE_URL}/api/battery/analytics/${id}?days=30`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load battery analytics");

        const rows = await res.json();
        setData(rows || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, selectedDate]);

  /* ===== ODO SUMMARY (ONLY FOR 30 DAYS VIEW) ===== */
  const odo = useMemo(() => {
    if (!data.length || selectedDate)
      return { energyUsed: null, maxCurrent: 0, maxTemp: 0, avgTemp: null };

    const energyUsed = data
      .map(d => Number(d.total_kwh_consumed || 0))
      .reduce((a, b) => a + b, 0);

    const validAvgTemps = data
      .map(d => Number(d.avg_cell_temp_c ?? 0))
      .filter(v => v > 0);
    const avgTemp = validAvgTemps.length
      ? validAvgTemps.reduce((a, b) => a + b, 0) / validAvgTemps.length
      : null;

    return {
      energyUsed: energyUsed || null,
      maxCurrent: Math.max(...data.map(d => Number(d.max_op_dc_current_a ?? 0))),
      maxTemp: Math.max(...data.map(d => Number(d.max_cell_temp_c ?? 0))),
      avgTemp,
    };
  }, [data, selectedDate]);

  /* ===== LATEST / SELECTED DAY ===== */
  const latestTrip = useMemo(() => {
    if (!data.length) return {};
    return data[0];
  }, [data]);

  /* ===== CHART DATA (ASC ORDER) ===== */
  const chartData = useMemo(() => [...data].reverse(), [data]);

  const handleClearDate = () => setSelectedDate("");

  if (loading)
    return <div className="text-center py-16 text-purple-400 font-mono">INITIALIZING TELEMETRY STREAM...</div>;

  if (error)
    return <div className="text-center py-16 text-pink-500 font-mono">CRITICAL ERROR: {error}</div>;

  return (
    <div className="space-y-8 pb-8 text-purple-100">
      <h2 className="text-2xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em] mb-3">
        Battery Analytics
      </h2>

      <div className="flex justify-center items-center gap-4 flex-wrap">
        <label className="text-purple-300/70 text-xs font-bold uppercase tracking-widest">Date Query:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-black border border-purple-500/30 text-purple-100 rounded px-4 py-2 focus:border-pink-500 outline-none transition"
        />
        {selectedDate && (
          <button onClick={handleClearDate} className="text-pink-400 hover:text-pink-300 underline text-xs uppercase tracking-widest transition">
            Reset to 30-Day View
          </button>
        )}
      </div>

      {!selectedDate && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="ODO Summary (Last 30 Days)">
            <Stat label="Energy Used" value={odo.energyUsed} unit="kWh" />
            <Stat label="Max DC Current" value={odo.maxCurrent} unit="A" />
            <Stat label="Max Cell Temp" value={odo.maxTemp} unit="°C" warn={45} danger={55} />
            <Stat label="Avg Cell Temp" value={odo.avgTemp} unit="°C" warn={42} danger={52} />
          </Section>

          <Section title="Latest Session">
            <Stat label="Energy Used" value={latestTrip.total_kwh_consumed} unit="kWh" />
            <Stat label="Max DC Current" value={latestTrip.max_op_dc_current_a} unit="A" />
            <Stat label="Max Cell Temp" value={latestTrip.max_cell_temp_c} unit="°C" warn={45} danger={55} />
            <Stat label="Avg Cell Temp" value={latestTrip.avg_cell_temp_c} unit="°C" warn={42} danger={52} />
          </Section>
        </div>
      )}

      {data.length === 0 && <div className="text-center py-12 text-purple-500/50 uppercase tracking-widest text-sm">No data for selected period.</div>}

      {data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {!selectedDate ? (
            <>
              <ChartCard title="Energy Consumption (kWh)"><LineChart data={chartData.map(d => ({ x: d.day, y: Number(d.total_kwh_consumed ?? 0) }))} /></ChartCard>
              <ChartCard title="Max Cell Temp (°C)"><LineChart data={chartData.map(d => ({ x: d.day, y: Number(d.max_cell_temp_c ?? 0) }))} band={{ warn: 45, danger: 55 }} /></ChartCard>
              <ChartCard title="Avg Cell Temp (°C)"><LineChart data={chartData.map(d => ({ x: d.day, y: Number(d.avg_cell_temp_c ?? 0) }))} band={{ warn: 42, danger: 52 }} /></ChartCard>
              <ChartCard title="Max DC Current (A)"><LineChart data={chartData.map(d => ({ x: d.day, y: Number(d.max_op_dc_current_a ?? 0) }))} /></ChartCard>
            </>
          ) : (
            <>
              <Section title={`Data: ${selectedDate}`}>
                <Stat label="Energy Used" value={latestTrip.total_kwh_consumed} unit="kWh" />
                <Stat label="Max DC Current" value={latestTrip.max_op_dc_current_a} unit="A" />
                <Stat label="Max Cell Temp" value={latestTrip.max_cell_temp_c} unit="°C" warn={45} danger={55} />
                <Stat label="Avg Cell Temp" value={latestTrip.avg_cell_temp_c} unit="°C" warn={42} danger={52} />
              </Section>
              <ChartCard title={`Session Metrics: ${selectedDate}`}>
                <BarChart data={[{ x: "Energy", y: Number(latestTrip.total_kwh_consumed ?? 0) }, { x: "DC Current", y: Number(latestTrip.max_op_dc_current_a ?? 0) }, { x: "Max Temp", y: Number(latestTrip.max_cell_temp_c ?? 0) }, { x: "Avg Temp", y: Number(latestTrip.avg_cell_temp_c ?? 0) }]} band={{ warn: 45, danger: 55 }} />
              </ChartCard>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ========================= UI HELPERS ========================= */
function Section({ title, children }) {
  return (
    <div className="border border-purple-500/20 p-6 rounded-lg bg-black/40 backdrop-blur-md shadow-2xl">
      <h3 className="font-black text-pink-400 mb-5 text-sm uppercase tracking-widest border-b border-purple-500/20 pb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, unit, warn, danger }) {
  if (value == null || isNaN(value))
    return (
      <div className="flex justify-between items-center bg-purple-900/10 px-5 py-3 rounded border border-purple-500/10">
        <span className="text-purple-300/70 text-xs font-bold uppercase">{label}</span>
        <span className="text-purple-700">–</span>
      </div>
    );

  const v = Number(value).toFixed(2);
  let color = "text-cyan-400";
  let bgColor = "bg-cyan-900/20";

  if (warn && danger) {
    const n = Number(v);
    if (n >= danger) { color = "text-pink-500"; bgColor = "bg-pink-900/20"; }
    else if (n >= warn) { color = "text-yellow-400"; bgColor = "bg-yellow-900/20"; }
  }

  return (
    <div className="flex justify-between items-center bg-purple-900/10 px-5 py-3 rounded border border-purple-500/10">
      <span className="text-purple-300/70 text-xs font-bold uppercase">{label}</span>
      <div className={`${bgColor} px-3 py-1 rounded`}>
        <span className={`font-black text-sm ${color}`}>
          {v} <span className="opacity-70 font-normal">{unit}</span>
        </span>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="border border-purple-500/20 rounded-lg p-5 bg-black/40 backdrop-blur-md shadow-2xl">
      <h3 className="text-purple-300 font-bold mb-4 text-center text-xs uppercase tracking-widest">{title}</h3>
      <div className="flex justify-center bg-black/20 rounded p-4">{children}</div>
    </div>
  );
}

/* ========================= CHARTS (SVG) ========================= */
function LineChart({ data, band }) {
  if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-purple-700 font-mono">NO DATA</div>;
  const width = 600, height = 220, pad = 40;
  const values = data.map(d => d.y);
  const maxY = Math.max(...values, band?.danger || 100, 10);
  const minY = Math.min(...values, 0);
  const points = data.map((d, i) => `${pad + (i / (data.length - 1)) * (width - pad * 2)},${height - pad - ((d.y - minY) / (maxY - minY)) * (height - pad * 2)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(168,85,247)" stopOpacity="0.2" /><stop offset="100%" stopColor="transparent" /></linearGradient>
      </defs>
      <polyline fill="url(#lineGradient)" points={`${pad},${height - pad} ${points} ${width - pad},${height - pad}`} />
      <polyline fill="none" stroke="rgb(168,85,247)" strokeWidth="2" points={points} />
      {data.map((d, i) => (
        <circle key={i} cx={pad + (i / (data.length - 1)) * (width - pad * 2)} cy={height - pad - ((d.y - minY) / (maxY - minY)) * (height - pad * 2)} r="3" fill={band && d.y >= band.danger ? "rgb(236,72,153)" : "rgb(34,211,238)"} />
      ))}
    </svg>
  );
}

function BarChart({ data, band }) {
  if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-purple-700 font-mono">NO DATA</div>;
  const width = 560, height = 220, pad = 50;
  const maxY = Math.max(...data.map(d => d.y), band?.danger || 100, 10);
  const barWidth = (width - pad * 2) / data.length - 30;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {data.map((d, i) => {
        const h = (d.y / maxY) * (height - pad * 2);
        return (
          <g key={i}>
            <rect x={pad + i * (barWidth + 30) + 15} y={height - pad - h} width={barWidth} height={h} rx="2" fill={band && d.y >= band.danger ? "rgb(236,72,153)" : "rgb(168,85,247)"} />
            <text x={pad + i * (barWidth + 30) + 15 + barWidth/2} y={height - 10} textAnchor="middle" fontSize="10" fill="rgb(156,163,175)" className="uppercase">{d.x}</text>
          </g>
        );
      })}
    </svg>
  );
}