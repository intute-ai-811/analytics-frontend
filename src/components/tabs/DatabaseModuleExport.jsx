// import React, { useState } from "react";
// import { useParams } from "react-router-dom";

// // VITE_API_URL = bare origin only, no trailing /api
// //   production : VITE_API_URL=""
// //   local dev  : VITE_API_URL=http://localhost:5000
// const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// /* ========================= PAGE ========================= */
// export default function DatabaseModuleExport() {
//   const { id } = useParams();
//   const vehicleId = id;

//   if (!vehicleId) {
//     return (
//       <div className="flex items-center justify-center h-96 text-orange-400 text-xl font-medium">
//         No vehicle selected
//       </div>
//     );
//   }

//   const today = new Date();
//   const todayStr = fmtDate(today);

//   const [exportMode, setExportMode]         = useState("today");
//   const [customStart, setCustomStart]       = useState(todayStr);
//   const [customEnd, setCustomEnd]           = useState(todayStr);
//   const [exporting, setExporting]           = useState(false);
//   const [exportType, setExportType]         = useState(null);
//   const [exportProgress, setExportProgress] = useState(0);
//   const [exportTotal, setExportTotal]       = useState(0);
//   const [exportCurrent, setExportCurrent]   = useState(0);
//   const [error, setError]                   = useState(null);

//   /* ========================= BUILD QUERY ========================= */
//   const buildQuery = () => {
//     switch (exportMode) {
//       case "today":
//         return "period=today";
//       case "custom":
//         if (!customStart || !customEnd) throw new Error("Select both start and end dates");
//         return `start=${customStart}&end=${customEnd}`;
//       default:
//         return "period=today";
//     }
//   };

//   /* ========================= DOWNLOAD WITH PROGRESS ========================= */
//   const downloadCsv = async (type) => {
//     setExporting(true);
//     setExportType(type);
//     setExportProgress(0);
//     setExportTotal(0);
//     setExportCurrent(0);
//     setError(null);

//     const abortController = new AbortController();

//     try {
//       const query = buildQuery();
//       const token = localStorage.getItem("token");
//       const headers = token ? { Authorization: `Bearer ${token}` } : {};

//       // Step 1: Get total count
//       setError("⏳ Counting total rows...");
//       const countRes = await fetch(
//         `${API_BASE_URL}/api/database-logs/${vehicleId}/export/${type}/count?${query}`,
//         { headers, signal: abortController.signal }
//       );

//       if (!countRes.ok) throw new Error("Failed to get row count");

//       const { total } = await countRes.json();
//       setExportTotal(total);

//       if (total === 0) {
//         alert(`No ${type === "cells" ? "cell voltage" : "temperature"} data available for the selected range`);
//         setExporting(false);
//         setError(null);
//         return;
//       }

//       // Step 2: Streaming export
//       setError(`📊 Exporting ${total.toLocaleString()} rows of ${type === "cells" ? "cell voltage" : "temperature"} data...`);

//       const exportRes = await fetch(
//         `${API_BASE_URL}/api/database-logs/${vehicleId}/export/${type}?${query}`,
//         { headers, signal: abortController.signal }
//       );

//       if (!exportRes.ok) throw new Error(`Export failed (${exportRes.status})`);

//       setError(null);

//       const totalFromHeader = exportRes.headers.get("X-Total-Rows");
//       if (totalFromHeader) setExportTotal(parseInt(totalFromHeader, 10));

//       const reader = exportRes.body.getReader();
//       const chunks = [];
//       let receivedLength = 0;
//       const avgBytesPerRow = type === "cells" ? 300 : 200;

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         chunks.push(value);
//         receivedLength += value.length;

//         const estimatedRows = Math.floor(receivedLength / avgBytesPerRow);
//         setExportCurrent(Math.min(estimatedRows, total));
//         setExportProgress(total > 0 ? Math.min((estimatedRows / total) * 100, 99) : 0);
//       }

//       const blob = new Blob(chunks, { type: "text/csv" });
//       const blobUrl = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = blobUrl;
//       a.download = type === "cells"
//         ? `vehicle_${vehicleId}_cell_voltages.csv`
//         : `vehicle_${vehicleId}_temperature_sensors.csv`;

//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(blobUrl);

//       setExportProgress(100);
//       setExportCurrent(total);

//       setTimeout(() => {
//         setExportProgress(0);
//         setExportTotal(0);
//         setExportCurrent(0);
//         setExportType(null);
//       }, 3000);

//     } catch (err) {
//       if (err.name === "AbortError") {
//         console.log("Export cancelled by user");
//       } else {
//         console.error("Export error:", err);
//         setError(err.message || "Export failed");
//       }
//     } finally {
//       setExporting(false);
//     }
//   };

//   /* ========================= RENDER ========================= */
//   return (
//     <div className="space-y-6 pb-8 max-w-3xl mx-auto">
//       <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
//         Module Data Export
//       </h2>

//       <div className="bg-gray-900/90 border border-orange-500/30 rounded-xl p-6 shadow-lg space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="flex items-center gap-3">
//             <label className="text-orange-300 font-medium min-w-32">Export Range:</label>
//             <select
//               value={exportMode}
//               onChange={(e) => setExportMode(e.target.value)}
//               disabled={exporting}
//               className="px-4 py-2 bg-gray-800 border border-orange-500/50 rounded-lg text-orange-200 focus:border-orange-400 outline-none transition disabled:opacity-50"
//             >
//               <option value="today">Today</option>
//               <option value="custom">Custom Range</option>
//             </select>
//           </div>
//         </div>

//         {exportMode === "custom" && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-800/30 rounded-lg border border-orange-500/20">
//             <div className="flex items-center gap-3">
//               <label className="text-orange-300 font-medium">Start Date:</label>
//               <input type="date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} disabled={exporting}
//                 className="px-4 py-2 bg-gray-800 border border-orange-500/50 rounded-lg text-orange-200 focus:border-orange-400 outline-none transition disabled:opacity-50" />
//             </div>
//             <div className="flex items-center gap-3">
//               <label className="text-orange-300 font-medium">End Date:</label>
//               <input type="date" value={customEnd} min={customStart} max={todayStr} onChange={(e) => setCustomEnd(e.target.value)} disabled={exporting}
//                 className="px-4 py-2 bg-gray-800 border border-orange-500/50 rounded-lg text-orange-200 focus:border-orange-400 outline-none transition disabled:opacity-50" />
//             </div>
//           </div>
//         )}

//         <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
//           <button onClick={() => downloadCsv("cells")} disabled={exporting}
//             className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl disabled:opacity-60 transition flex items-center justify-center gap-3">
//             {exporting && exportType === "cells" ? (
//               <><SpinnerIcon />Exporting... {exportProgress > 0 ? `${exportProgress.toFixed(0)}%` : ""}</>
//             ) : exportProgress === 100 && exportType === "cells" ? (
//               <><CheckIcon />Complete!</>
//             ) : (
//               <><DownloadIcon />Export Cell Voltages</>
//             )}
//           </button>

//           <button onClick={() => downloadCsv("temps")} disabled={exporting}
//             className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl disabled:opacity-60 transition flex items-center justify-center gap-3">
//             {exporting && exportType === "temps" ? (
//               <><SpinnerIcon />Exporting... {exportProgress > 0 ? `${exportProgress.toFixed(0)}%` : ""}</>
//             ) : exportProgress === 100 && exportType === "temps" ? (
//               <><CheckIcon />Complete!</>
//             ) : (
//               <><DownloadIcon />Export Temperature Sensors</>
//             )}
//           </button>
//         </div>

//         {exporting && exportTotal > 0 && (
//           <div className="w-full pt-4">
//             <div className="flex justify-between text-sm text-orange-300 mb-2">
//               <span>{exportType === "cells" ? "Cell Voltage Data" : "Temperature Data"}: {exportCurrent.toLocaleString()} / {exportTotal.toLocaleString()} rows</span>
//               <span>{exportProgress.toFixed(1)}%</span>
//             </div>
//             <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
//               <div
//                 className={`h-full transition-all duration-300 ease-out flex items-center justify-end pr-2 ${
//                   exportType === "cells" ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-emerald-500 to-green-500"
//                 }`}
//                 style={{ width: `${exportProgress}%` }}
//               >
//                 {exportProgress > 10 && <span className="text-xs font-bold text-white drop-shadow">{exportProgress.toFixed(0)}%</span>}
//               </div>
//             </div>
//             <div className="text-center text-xs text-orange-400/70 mt-2">
//               ⏳ Large exports may take a few minutes. Your download will start automatically.
//             </div>
//           </div>
//         )}

//         {error && (
//           <div className={`p-4 rounded-lg text-center ${
//             error.includes("⏳") || error.includes("📊")
//               ? "bg-blue-500/10 border border-blue-500/30"
//               : "bg-red-500/10 border border-red-500/30"
//           }`}>
//             <p className={`text-sm ${
//               error.includes("⏳") || error.includes("📊") ? "text-blue-300" : "text-red-400 font-medium"
//             }`}>{error}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ========================= HELPERS ========================= */
// const fmtDate = (date) => {
//   if (!(date instanceof Date) || isNaN(date)) return "";
//   return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
// };

// function SpinnerIcon() {
//   return (
//     <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
//       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//     </svg>
//   );
// }

// function DownloadIcon() {
//   return (
//     <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//     </svg>
//   );
// }

// function CheckIcon() {
//   return (
//     <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//     </svg>
//   );
// }

import React, { useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

/* ========================= PAGE ========================= */
export default function DatabaseModuleExport() {
  const { id } = useParams();
  const vehicleId = id;

  if (!vehicleId) {
    return (
      <div className="flex items-center justify-center h-96 text-purple-400 text-xl font-medium">
        No vehicle selected
      </div>
    );
  }

  const today = new Date();
  const todayStr = fmtDate(today);

  const [exportMode, setExportMode]         = useState("today");
  const [customStart, setCustomStart]       = useState(todayStr);
  const [customEnd, setCustomEnd]           = useState(todayStr);
  const [exporting, setExporting]           = useState(false);
  const [exportType, setExportType]         = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTotal, setExportTotal]       = useState(0);
  const [exportCurrent, setExportCurrent]   = useState(0);
  const [error, setError]                   = useState(null);

  const buildQuery = () => {
    switch (exportMode) {
      case "today": return "period=today";
      case "custom":
        if (!customStart || !customEnd) throw new Error("Select both start and end dates");
        return `start=${customStart}&end=${customEnd}`;
      default: return "period=today";
    }
  };

  const downloadCsv = async (type) => {
    setExporting(true); setExportType(type); setExportProgress(0); setExportTotal(0); setExportCurrent(0); setError(null);
    const abortController = new AbortController();

    try {
      const query = buildQuery();
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      setError("⏳ Counting total rows...");
      const countRes = await fetch(`${API_BASE_URL}/api/database-logs/${vehicleId}/export/${type}/count?${query}`, { headers, signal: abortController.signal });
      if (!countRes.ok) throw new Error("Failed to get row count");
      const { total } = await countRes.json();
      setExportTotal(total);

      if (total === 0) {
        alert(`No ${type === "cells" ? "cell voltage" : "temperature"} data available`);
        setExporting(false); setError(null); return;
      }

      setError(`📊 Exporting ${total.toLocaleString()} rows...`);
      const exportRes = await fetch(`${API_BASE_URL}/api/database-logs/${vehicleId}/export/${type}?${query}`, { headers, signal: abortController.signal });
      if (!exportRes.ok) throw new Error(`Export failed`);
      
      setError(null);
      const reader = exportRes.body.getReader();
      const chunks = []; let receivedLength = 0;
      const avgBytesPerRow = type === "cells" ? 300 : 200;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); receivedLength += value.length;
        const estimatedRows = Math.floor(receivedLength / avgBytesPerRow);
        setExportCurrent(Math.min(estimatedRows, total));
        setExportProgress(total > 0 ? Math.min((estimatedRows / total) * 100, 99) : 0);
      }

      const blob = new Blob(chunks, { type: "text/csv" });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = `vehicle_${vehicleId}_${type}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(blobUrl);

      setExportProgress(100); setExportCurrent(total);
      setTimeout(() => { setExportProgress(0); setExportTotal(0); setExportCurrent(0); setExportType(null); }, 3000);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Export failed");
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em]">
        Module Data Export
      </h2>

      <div className="bg-[#0b0b14] border border-purple-500/30 rounded-xl p-6 shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <label className="text-purple-300 font-medium min-w-32">Export Range:</label>
            <select value={exportMode} onChange={(e) => setExportMode(e.target.value)} disabled={exporting}
              className="px-4 py-2 bg-[#1a1a2e] border border-purple-500/50 rounded-lg text-purple-200 focus:border-purple-400 outline-none transition disabled:opacity-50">
              <option value="today">Today</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {exportMode === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#1a1a2e]/50 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-3">
              <label className="text-purple-300 font-medium">Start:</label>
              <input type="date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} disabled={exporting}
                className="px-4 py-2 bg-[#0b0b14] border border-purple-500/50 rounded-lg text-purple-200 outline-none" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-purple-300 font-medium">End:</label>
              <input type="date" value={customEnd} min={customStart} max={todayStr} onChange={(e) => setCustomEnd(e.target.value)} disabled={exporting}
                className="px-4 py-2 bg-[#0b0b14] border border-purple-500/50 rounded-lg text-purple-200 outline-none" />
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
          <button onClick={() => downloadCsv("cells")} disabled={exporting}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] transition flex items-center justify-center gap-3">
            {exporting && exportType === "cells" ? "Exporting..." : "Export Cell Voltages"}
          </button>
          <button onClick={() => downloadCsv("temps")} disabled={exporting}
            className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-[0_0_15px_rgba(219,39,119,0.4)] transition flex items-center justify-center gap-3">
            {exporting && exportType === "temps" ? "Exporting..." : "Export Temperature Sensors"}
          </button>
        </div>

        {exporting && exportTotal > 0 && (
          <div className="w-full pt-4 space-y-2">
            <div className="flex justify-between text-sm text-purple-300">
              <span>{exportCurrent.toLocaleString()} / {exportTotal.toLocaleString()} rows</span>
              <span>{exportProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#1a1a2e] rounded-full h-4 overflow-hidden border border-purple-500/30">
              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        )}

        {error && <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-center">{error}</div>}
      </div>
    </div>
  );
}

const fmtDate = (date) => date.toISOString().split('T')[0];