import React, { useEffect, useState } from "react";

/* ===== TAB IMPORTS ===== */
import LiveView from "./tabs/LiveView";
import MotorAnalytics from "./tabs/MotorAnalytics";
import BatteryAnalytics from "./tabs/BatteryAnalytics";
import MotorFaults from "./tabs/MotorFaults";
import DatabaseLogs from "./tabs/DatabaseLogs";
import Troubleshooting from "./tabs/Troubleshooting";

/* ========================= PAGE SHELL ========================= */
export default function VehicleDetails() {
  const [vehicle, setVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState("Live View");

  useEffect(() => {
    const data = localStorage.getItem("selectedVehicle");
    if (data) setVehicle(JSON.parse(data));
  }, []);

  if (!vehicle) return null;

  const tabs = [
    "Live View",
    "Motor Analytics",
    "Battery Analytics",
    "Motor Faults",
    "Database / Log",
    "Troubleshooting",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white px-6 py-10">
      {/* ===== HEADER ===== */}
      <div className="max-w-6xl mx-auto border-b border-orange-500/20 pb-6 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent">
          {vehicle.company_name || vehicle.customer}
        </h1>
        <p className="mt-2 text-lg text-orange-200/90">
          {vehicle.vehicleType || `${vehicle.make} ${vehicle.model}`} •{" "}
          {vehicle.vehicle_reg_no || vehicle.vehicleNo}
        </p>
      </div>

      {/* ===== TABS ===== */}
      <div className="max-w-6xl mx-auto flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg border transition font-medium shadow ${
              activeTab === tab
                ? "border-orange-500 bg-orange-500/20 text-orange-300"
                : "border-orange-500/30 text-orange-200 bg-black/40 hover:bg-orange-500/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="max-w-6xl mx-auto mt-10">
        {activeTab === "Live View" && <LiveView />}
        {activeTab === "Motor Analytics" && <MotorAnalytics />}
        {activeTab === "Battery Analytics" && <BatteryAnalytics />}
        {activeTab === "Motor Faults" && <MotorFaults />}
        {activeTab === "Database / Log" && <DatabaseLogs />}
        {activeTab === "Troubleshooting" && <Troubleshooting />}
      </div>
    </div>
  );
}
