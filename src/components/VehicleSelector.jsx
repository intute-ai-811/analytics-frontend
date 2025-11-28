// VehicleSelector.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, ChevronRight, Gauge } from "lucide-react";

function VehicleSelector({ user }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const vehicles = [
    {
      id: "VCL001",
      name: "VCL001",
      model: "Main Vehicle",
    },
  ];

  const handleSelectVehicle = async (vehicleId) => {
    setSelectedVehicle(vehicleId);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate loading
    localStorage.setItem("selectedVehicle", vehicleId);
    navigate("/dashboard"); // Navigate to Dashboard route
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-700 to-transparent"></div>
        <div className="absolute top-1/4 right-10 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-10 w-3 h-3 bg-green-500 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-2000"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 via-red-500 to-red-700 rounded-full mb-6 shadow-2xl border-4 border-orange-400/30">
              <Gauge className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent mb-4">
              Vehicle Dashboard
            </h1>
            <p className="text-gray-300 text-xl">
              Select your vehicle to monitor performance and diagnostics
            </p>
          </div>
          <div className="flex justify-center">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-[2rem] blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl border border-orange-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5"></div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                  
                  <button
                    onClick={() => handleSelectVehicle(vehicle.id)}
                    disabled={isLoading}
                    className="relative w-full p-10 text-left transform transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && selectedVehicle === vehicle.id && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center rounded-3xl">
                        <div className="flex flex-col items-center space-y-6">
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-2 border-red-500/20 border-b-red-500 rounded-full animate-spin animate-reverse"></div>
                          </div>
                          <span className="text-white font-medium text-xl tracking-wide">Starting Engine...</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-8">
                        <div className="relative">
                          <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl blur opacity-50 animate-pulse"></div>
                          <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl border border-orange-400/30">
                            <Car className="w-12 h-12 text-white drop-shadow-lg" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                          </div>
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white shadow-lg animate-pulse">
                            <div className="absolute inset-1 bg-white/30 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent mb-2 tracking-wide">{vehicle.name}</h3>
                          <p className="text-orange-300 text-xl font-medium tracking-wide">{vehicle.model}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <ChevronRight className="w-10 h-10 text-orange-400 group-hover:text-orange-300 group-hover:translate-x-3 transition-all duration-500 drop-shadow-lg" />
                        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 rounded-2xl blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-black/40 via-gray-900/40 to-black/60 rounded-2xl p-8 border border-orange-500/20 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-2xl"></div>
                        <div className="relative text-center">
                          <p className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent tracking-wider drop-shadow-2xl">
                            Loader
                          </p>
                          <div className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-3xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/2 to-white/0 opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-3xl"></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleSelector;