// import React, { useEffect, useState } from "react";

// /* ===== TAB IMPORTS ===== */
// import LiveView from "./tabs/LiveView";
// import MotorAnalytics from "./tabs/MotorAnalytics";
// import BatteryAnalytics from "./tabs/BatteryAnalytics";
// import MotorFaults from "./tabs/MotorFaults";
// import DatabaseLogs from "./tabs/DatabaseLogs";
// import DatabaseModuleExport from "./tabs/DatabaseModuleExport";
// import LiveCharts from "./tabs/LiveCharts"; // ✅ NEW

// /* ========================= PAGE SHELL ========================= */
// export default function VehicleDetails() {
//   const [vehicle, setVehicle] = useState(null);
//   const [user, setUser] = useState(null);
//   const [activeTab, setActiveTab] = useState("Live View");

//   useEffect(() => {
//     const vehicleData = localStorage.getItem("selectedVehicle");
//     if (vehicleData) setVehicle(JSON.parse(vehicleData));

//     const userData = localStorage.getItem("user");
//     if (userData) {
//       const parsed = JSON.parse(userData);
//       setUser(parsed);
//     }
//   }, []);

//   if (!vehicle) return null;

//   const isCustomer = user?.role === "customer";

//   /* ========================= CUSTOMER VIEW ========================= */
//   if (isCustomer) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
//         <div className="px-6 pt-10 pb-6 border-b border-orange-500/20">
//           <div className="max-w-6xl mx-auto">
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent">
//               {vehicle.company_name || vehicle.customer || "My Vehicle"}
//             </h1>
//             <p className="mt-2 text-lg text-orange-200/90">
//               {vehicle.vehicleType || `${vehicle.make} ${vehicle.model}`} •{" "}
//               {vehicle.vehicle_reg_no || vehicle.vehicleNo}
//             </p>
//             <p className="mt-4 text-sm text-orange-300/70 font-medium">
//               Live Vehicle Monitoring
//             </p>
//           </div>
//         </div>
//         <div className="px-6 py-10">
//           <div className="max-w-6xl mx-auto">
//             <LiveView />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   /* ========================= ADMIN VIEW ========================= */
//   const tabs = [
//     "Live View",
//     "Live Charts",      // ✅ NEW TAB
//     "Motor Analytics",
//     "Battery Analytics",
//     "Faults",
//     "Database / Log",
//     "Module Export",
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
//       {/* ===== HEADER ===== */}
//       <div className="px-6 pt-10 pb-6 border-b border-orange-500/20">
//         <div className="max-w-6xl mx-auto">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent">
//             {vehicle.company_name || vehicle.customer || "Vehicle Details"}
//           </h1>
//           <p className="mt-2 text-lg text-orange-200/90">
//             {vehicle.vehicleType || `${vehicle.make} ${vehicle.model}`} •{" "}
//             {vehicle.vehicle_reg_no || vehicle.vehicleNo}
//           </p>
//         </div>
//       </div>

//       {/* ===== STICKY TABS ===== */}
//       <div className="sticky top-[73px] z-10 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-sm border-b border-orange-500/20 shadow-lg">
//         <div className="px-6 py-4">
//           <div className="max-w-6xl mx-auto flex flex-wrap gap-3">
//             {tabs.map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`px-4 py-2 rounded-lg border transition font-medium shadow ${
//                   activeTab === tab
//                     ? "border-orange-500 bg-orange-500/20 text-orange-300"
//                     : "border-orange-500/30 text-orange-200 bg-black/40 hover:bg-orange-500/10"
//                 }`}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ===== TAB CONTENT ===== */}
//       <div className="px-6 py-10">
//         <div className="max-w-6xl mx-auto">
//           {activeTab === "Live View"         && <LiveView />}
//           {activeTab === "Live Charts"       && <LiveCharts />}  {/* ✅ */}
//           {activeTab === "Motor Analytics"   && <MotorAnalytics />}
//           {activeTab === "Battery Analytics" && <BatteryAnalytics />}
//           {activeTab === "Faults"      && <MotorFaults />}
//           {activeTab === "Database / Log"    && <DatabaseLogs />}
//           {activeTab === "Module Export"     && <DatabaseModuleExport />}
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import { ArrowLeft } from "lucide-react"; // 2. Import back icon

/* ===== TAB IMPORTS ===== */
import LiveView from "./tabs/LiveView";
import MotorAnalytics from "./tabs/MotorAnalytics";
import BatteryAnalytics from "./tabs/BatteryAnalytics";
import MotorFaults from "./tabs/MotorFaults";
import DatabaseLogs from "./tabs/DatabaseLogs";
import DatabaseModuleExport from "./tabs/DatabaseModuleExport";
import LiveCharts from "./tabs/LiveCharts";

/* ========================= PAGE SHELL ========================= */
export default function VehicleDetails() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Live View");

  useEffect(() => {
    const vehicleData = localStorage.getItem("selectedVehicle");
    if (vehicleData) setVehicle(JSON.parse(vehicleData));

    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
    }
  }, []);

  if (!vehicle) return null;

  const isCustomer = user?.role === "customer";

  const tabs = [
    "Live View",
    "Live Charts",
    "Motor Analytics",
    "Battery Analytics",
    "Faults",
    "Database / Log",
    "Module Export",
  ];

  return (
    <div className="min-h-screen bg-[#0a0814] text-white font-sans selection:bg-purple-500/30">
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-gradient {
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .tab-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Space Grotesk', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
        }
        .active-tab {
          background: rgba(139, 92, 246, 0.15);
          border-color: #8b5cf6;
          color: #c4b5fd;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
        }
        .sticky-nav {
          background: rgba(10, 8, 20, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }
      `}</style>

      {/* ===== HEADER SECTION ===== */}
      {/* <div className="px-6 pt-12 pb-8 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[120px] -z-10" />
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-purple-400 transition-colors mb-6 group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
              Back to Dashboard
            </span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase">
              System Diagnostics
            </span>
          </div>

          <h1
            className="text-5xl font-black tracking-tighter text-gradient"
            style={{ fontFamily: "Space Grotesk" }}
          >
            {vehicle.company_name || vehicle.customer || "Vehicle Node"}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-gray-400">
            <p className="text-lg font-medium">
              {vehicle.vehicleType || `${vehicle.make} ${vehicle.model}`}
            </p>
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            <p className="text-lg font-mono text-purple-400/80">
              {vehicle.vehicle_reg_no || vehicle.vehicleNo}
            </p>
          </div>
        </div>
      </div> */}
      {/* ===== HEADER SECTION ===== */}
<div className="px-6 pt-12 pb-8 border-b border-white/5 relative overflow-hidden">
  <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[120px] -z-10" />
  
  <div className="max-w-6xl mx-auto">
    
    {/* PARALLEL LAYOUT: Back Button and Status Indicator */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold tracking-[0.3em] text-gray-300 uppercase">
          System Diagnostics
        </span>
      </div>
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Back To Dashboard</span>
      </button>

      
    </div>

    <h1 className="text-5xl font-black tracking-tighter text-gradient" style={{ fontFamily: 'Space Grotesk' }}>
      {vehicle.company_name || vehicle.customer || "Vehicle Node"}
    </h1>
    
    <div className="mt-4 flex flex-wrap items-center gap-4 text-gray-400">
      <p className="text-lg font-medium">
        {vehicle.vehicleType || `${vehicle.make} ${vehicle.model}`}
      </p>
      <span className="w-1 h-1 bg-gray-700 rounded-full" />
      <p className="text-lg font-mono text-purple-400/80">
        {vehicle.vehicle_reg_no || vehicle.vehicleNo}
      </p>
    </div>
  </div>
</div>

      {/* ===== NAVIGATION (Admin only) ===== */}
      {!isCustomer && (
        <div className="sticky top-[65px] z-30 sticky-nav">
          <div className="px-6 py-3">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-button px-5 py-2.5 rounded-lg border border-white/5 font-bold ${
                    activeTab === tab
                      ? "active-tab"
                      : "hover:bg-white/5 text-gray-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CONTENT AREA ===== */}
      <main className="px-6 py-10 relative">
        <div className="max-w-6xl mx-auto">
          {/* If Customer: Only show LiveView, else show activeTab */}
          {isCustomer ? (
            <div className="glass-panel rounded-[32px] p-8 shadow-2xl">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-purple-400">
                  Real-time Telemetry
                </h3>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                  Live Connection
                </span>
              </div>
              <LiveView />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === "Live View" && <LiveView />}
              {activeTab === "Live Charts" && <LiveCharts />}
              {activeTab === "Motor Analytics" && <MotorAnalytics />}
              {activeTab === "Battery Analytics" && <BatteryAnalytics />}
              {activeTab === "Faults" && <MotorFaults />}
              {activeTab === "Database / Log" && <DatabaseLogs />}
              {activeTab === "Module Export" && <DatabaseModuleExport />}
            </div>
          )}
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="h-20 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-px h-10 bg-gradient-to-b from-purple-500 to-transparent" />
      </div>
    </div>
  );
}
