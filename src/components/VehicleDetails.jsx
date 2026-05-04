import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/* ===== TAB IMPORTS ===== */
import LiveView from "./tabs/LiveView";
import MotorAnalytics from "./tabs/MotorAnalytics";
import BatteryAnalytics from "./tabs/BatteryAnalytics";
import MotorFaults from "./tabs/MotorFaults";
import DatabaseLogs from "./tabs/DatabaseLogs";
import DatabaseModuleExport from "./tabs/DatabaseModuleExport";
import LiveCharts from "./tabs/LiveCharts";

const TAB_CONFIG = [
  { label: "Live View",         icon: "⬤" },
  { label: "Live Charts",       icon: "⌇" },
  { label: "Motor Analytics",   icon: "⚙" },
  { label: "Battery Analytics", icon: "◈" },
  { label: "Faults",            icon: "⚠" },
  { label: "Database / Log",    icon: "▤" },
  { label: "Module Export",     icon: "⬡" },
];

export default function VehicleDetails() {
  const navigate = useNavigate();
  const [vehicle,   setVehicle]   = useState(null);
  const [user,      setUser]      = useState(null);
  const [activeTab, setActiveTab] = useState("Live View");

  useEffect(() => {
    const vehicleData = localStorage.getItem("selectedVehicle");
    if (vehicleData) setVehicle(JSON.parse(vehicleData));

    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  if (!vehicle) return null;

  const isCustomer = user?.role === "customer";

  return (
    <div className="min-h-screen bg-[#080612] text-white selection:bg-purple-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        * { font-family: 'DM Sans', system-ui, sans-serif; }

        .vehicle-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .text-gradient {
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Nav tab ── */
        .tab-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: none;
          color: #6b7280;
          background: transparent;
          cursor: pointer;
          transition: color 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .tab-btn:hover {
          color: #d1d5db;
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.07);
        }
        .tab-btn.active {
          color: #c4b5fd;
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.45);
          box-shadow: 0 0 14px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .tab-btn.active .tab-icon {
          color: #a78bfa;
        }
        .tab-btn .tab-icon {
          font-size: 0.65rem;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        /* Active underline */
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 20%;
          right: 20%;
          height: 2px;
          border-radius: 2px 2px 0 0;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          opacity: 0.9;
        }

        .sticky-nav {
          background: rgba(8, 6, 18, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(139,92,246,0.15);
        }

        .glass-panel {
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>

      {/* ── Header ── */}
      <div className="px-6 pt-12 pb-8 border-b border-white/[0.04] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-purple-700/8 blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span style={{ fontFamily: "Inter", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", color: "#6b7280", textTransform: "uppercase" }}>
                System Diagnostics
              </span>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-gray-500 hover:text-purple-400 transition-colors"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span style={{ fontFamily: "Inter", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Back to Dashboard
              </span>
            </button>
          </div>

          <h1 className="vehicle-title text-gradient" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.05 }}>
            {vehicle.company_name || vehicle.customer || "Vehicle Node"}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span style={{ fontFamily: "Inter", fontSize: "0.95rem", fontWeight: 500, color: "#9ca3af" }}>
              {vehicle.vehicleType || `${vehicle.make} ${vehicle.model}`}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span style={{ fontFamily: "Inter", fontSize: "0.95rem", fontWeight: 600, color: "#7c3aed", letterSpacing: "0.03em" }}>
              {vehicle.vehicle_reg_no || vehicle.vehicleNo}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab navigation (admin only) ── */}
      {!isCustomer && (
        <div className="sticky top-[65px] z-30 sticky-nav">
          <div className="px-6">
            <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
              {TAB_CONFIG.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(label)}
                  className={`tab-btn ${activeTab === label ? "active" : ""}`}
                >
                  <span className="tab-icon">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="px-6 py-10 relative">
        <div className="max-w-6xl mx-auto">
          {isCustomer ? (
            <div className="glass-panel rounded-[28px] p-8 shadow-2xl">
              <div className="mb-6 flex justify-between items-center">
                <h3 style={{ fontFamily: "Inter", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a78bfa" }}>
                  Real-time Telemetry
                </h3>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  Live Connection
                </span>
              </div>
              <LiveView />
            </div>
          ) : (
            <div>
              {activeTab === "Live View"         && <LiveView />}
              {activeTab === "Live Charts"       && <LiveCharts />}
              {activeTab === "Motor Analytics"   && <MotorAnalytics />}
              {activeTab === "Battery Analytics" && <BatteryAnalytics />}
              {activeTab === "Faults"            && <MotorFaults />}
              {activeTab === "Database / Log"    && <DatabaseLogs />}
              {activeTab === "Module Export"     && <DatabaseModuleExport />}
            </div>
          )}
        </div>
      </main>

      <div className="h-16 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-px h-8 bg-gradient-to-b from-purple-500 to-transparent" />
      </div>
    </div>
  );
}