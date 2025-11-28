import React from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, Battery, Settings, AlertCircle, Car } from "lucide-react";

function Dashboard({ user }) {
  const navigate = useNavigate();
  const selectedVehicle = localStorage.getItem("selectedVehicle") || "VCL001";

  const cards = [
    {
      title: "Battery (Stefen)",
      description: "Monitor SOC, voltages, and temperatures in real-time.",
      icon: <Battery className="w-10 h-10 text-blue-400" />,
      path: `/battery/${selectedVehicle}`,
      gradient: "from-blue-500/20 to-indigo-600/20",
    },
    {
      title: "Motor (CETL)",
      description: "Track torque, speed, and temperatures.",
      icon: <Gauge className="w-10 h-10 text-green-400" />,
      path: `/motor/${selectedVehicle}`,
      gradient: "from-green-500/20 to-emerald-600/20",
    },
    {
      title: "Motor Faults",
      description: "View active/inactive faults with alerts.",
      icon: <AlertCircle className="w-10 h-10 text-red-400" />,
      path: `/faults/${selectedVehicle}`,
      gradient: "from-red-500/20 to-rose-600/20",
    },
    {
      title: "Vehicle Data",
      description: "View detailed vehicle performance and diagnostics.",
      icon: <Car className="w-10 h-10 text-purple-400" />,
      path: `/vehicle-data/${selectedVehicle}`,
      gradient: "from-purple-500/20 to-violet-600/20",
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-700 to-transparent"></div>
        <div className="absolute top-1/4 right-10 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-10 w-3 h-3 bg-green-500 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-2000"></div>
      </div>
      <div className="relative z-10 p-8 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent mb-12">
          Dashboard - {selectedVehicle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl w-full">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.gradient} p-10 rounded-2xl border-2 border-orange-500/30 shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex flex-col items-center justify-center text-center`}
            >
              <div className="flex items-center space-x-3 mb-6">
                {card.icon}
                <h3 className="text-2xl font-bold text-white">{card.title}</h3>
              </div>
              <p className="text-gray-300 mb-8 text-lg">{card.description}</p>
              <button
                onClick={() => handleNavigate(card.path)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 font-medium text-base"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;