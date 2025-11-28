import React, { useState, useEffect, useRef } from 'react';
import {
  Battery,
  Thermometer,
  Cpu,
  Settings,
  Zap,
  BatteryCharging,
  Wind,
  Droplet,
  Car,
  Monitor,
  SwitchCamera,
  Smartphone,
  Gauge,
  Tag,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiEndpoints = {
  'HV Battery & BMS': `${API_BASE_URL}/api/hv-battery/excavator`,
  'BTMS': `${API_BASE_URL}/api/btms/excavator`,
  'MCU': `${API_BASE_URL}/api/mcu/excavator`,
  'Transmission System': `${API_BASE_URL}/api/transmission-system/excavator`,
  'DC-DC Converter': `${API_BASE_URL}/api/dc-dc-converter/excavator`,
  'LV Battery': `${API_BASE_URL}/api/lv-battery/excavator`,
  'HVAC': `${API_BASE_URL}/api/hvac/excavator`,
  'Hydraulic System': `${API_BASE_URL}/api/hydraulic-system/excavator`,
  'Axle Oil': `${API_BASE_URL}/api/axle-oil/excavator`,
  'Vehicle Peripherals': `${API_BASE_URL}/api/vehicle-peripherals/excavator`,
  'Operator Switch Board': `${API_BASE_URL}/api/operator-switch-board/excavator`,
  'Android Display': `${API_BASE_URL}/api/android-display/excavator`,
  'Vehicle Wide Parameters': `${API_BASE_URL}/api/vehicle-wide/excavator`,
  'Machine Identification': `${API_BASE_URL}/api/machine-identification/excavator`,
};

const categoryToTableName = {
  'HV Battery & BMS': 'hv_battery',
  'BTMS': 'btms',
  'MCU': 'mcu',
  'Transmission System': 'transmission_system',
  'DC-DC Converter': 'dc_dc_converter',
  'LV Battery': 'lv_battery',
  'HVAC': 'hvac',
  'Hydraulic System': 'hydraulic_system',
  'Axle Oil': 'axle_oil',
  'Vehicle Peripherals': 'vehicle_peripherals',
  'Operator Switch Board': 'operator_switch_board',
  'Android Display': 'android_display',
  'Vehicle Wide Parameters': 'vehicle_wide',
  'Machine Identification': 'machine_identification',
};

const cache = new Map(); 

function ExcavatorParameters({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const wsRef = useRef(null);

  const cards = [
    { title: 'HV Battery & BMS', icon: <Battery className="w-8 h-8 text-blue-600" />, gradient: 'from-blue-50 to-indigo-100', textColor: 'text-blue-800' },
    { title: 'BTMS', icon: <Thermometer className="w-8 h-8 text-indigo-600" />, gradient: 'from-indigo-50 to-blue-100', textColor: 'text-indigo-800' },
    { title: 'MCU', icon: <Cpu className="w-8 h-8 text-blue-600" />, gradient: 'from-blue-50 to-indigo-100', textColor: 'text-blue-800' },
    { title: 'Transmission System', icon: <Settings className="w-8 h-8 text-indigo-600" />, gradient: 'from-indigo-50 to-blue-100', textColor: 'text-indigo-800' },
    { title: 'DC-DC Converter', icon: <Zap className="w-8 h-8 text-blue-600" />, gradient: 'from-blue-50 to-indigo-100', textColor: 'text-blue-800' },
    { title: 'LV Battery', icon: <BatteryCharging className="w-8 h-8 text-indigo-600" />, gradient: 'from-indigo-50 to-blue-100', textColor: 'text-indigo-800' },
    { title: 'HVAC', icon: <Wind className="w-8 h-8 text-blue-600" />, gradient: 'from-blue-50 to-indigo-100', textColor: 'text-blue-800' },
    { title: 'Hydraulic System', icon: <Droplet className="w-8 h-8 text-indigo-600" />, gradient: 'from-indigo-50 to-blue-100', textColor: 'text-indigo-800' },
    { title: 'Axle Oil', icon: <Car className="w-8 h-8 text-blue-600" />, gradient: 'from-blue-50 to-indigo-100', textColor: 'text-blue-800' },
    { title: 'Vehicle Peripherals', icon: <Monitor className="w-8 h-8 text-indigo-600" />, gradient: 'from-indigo-50 to-blue-100', textColor: 'text-indigo-800' },
    { title: 'Operator Switch Board', icon: <SwitchCamera className="w-8 h-8 text-blue-600" />, gradient: 'from-blue-50 to-indigo-100', textColor: 'text-blue-800' },
    { title: 'Android Display', icon: <Smartphone className="w-8 h-8 text-indigo-600" />, gradient: 'from-indigo-50 to-blue-100', textColor: 'text-indigo-800' },
    { title: 'Vehicle Wide Parameters', icon: <Gauge className="w-8 h-8 text-blue-600" />, gradient: 'from-blue-50 to-indigo-100', textColor: 'text-blue-800' },
    { title: 'Machine Identification', icon: <Tag className="w-8 h-8 text-indigo-600" />, gradient: 'from-indigo-50 to-blue-100', textColor: 'text-indigo-800' },
  ];

  const fetchParameters = async (category, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!forceRefresh && cache.has(category)) {
        setParameters(cache.get(category));
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiEndpoints[category]}${forceRefresh ? '?force_refresh=true' : ''}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Please log in again');
        } else if (response.status === 404) {
          throw new Error(`No data found for ${category}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const { data } = await response.json();

      const filteredData = category === 'Hydraulic System'
        ? data.filter(item => !['Hydraulic Oil', 'Transmission Oil'].includes(item.parameter_id))
        : data;

      const mappedData = filteredData.map(item => ({
        id: item.parameter_id,
        value: item.numeric_value ?? item.value ?? 'N/A',
        unit: item.unit || 'N/A',
        serialNo: ['Android Display', 'Machine Identification'].includes(category)
          ? item.display_sl_no || item.vehicle_id || 'veh0011'
          : item.vehicle_id || 'veh0011',
      }));

      cache.set(category, mappedData);
      setParameters(mappedData);
    } catch (err) {
      setError(`Failed to fetch parameters: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user.token || !selectedCategory) return;

    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/?token=${user.token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.table_name === categoryToTableName[selectedCategory]) {
          const filteredData = selectedCategory === 'Hydraulic System'
            ? message.data.filter(item => !['Hydraulic Oil', 'Transmission Oil'].includes(item.parameter_id))
            : message.data;

          const updatedData = filteredData.map(item => ({
            id: item.parameter_id,
            value: item.numeric_value ?? item.value ?? 'N/A',
            unit: item.unit || 'N/A',
            serialNo: ['Android Display', 'Machine Identification'].includes(selectedCategory)
              ? item.display_sl_no || item.vehicle_id || 'veh0011'
              : item.vehicle_id || 'veh0011',
          }));
          setParameters(updatedData);
          cache.set(selectedCategory, updatedData);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Real-time updates unavailable');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, [user.token, selectedCategory]);

  const handleViewDetails = (category) => {
    setSelectedCategory(category);
    fetchParameters(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setParameters([]);
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isModalOpen]);

  return (
    <div className="h-fit bg-gray-100">
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.gradient} p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[250px] flex flex-col items-center justify-center`}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                {card.icon}
                <h3 className={`text-xl font-semibold ${card.textColor} text-center`}>{card.title}</h3>
              </div>
              <p className="text-gray-600 mb-4 text-center text-sm">
                Monitor and analyze key metrics for optimal performance and maintenance.
              </p>
              <button
                className={`px-4 py-2 bg-${card.textColor.split('-')[1]}-600 text-white rounded-lg hover:bg-${card.textColor.split('-')[1]}-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-${card.textColor.split('-')[1]}-300`}
                onClick={() => handleViewDetails(card.title)}
                aria-label={`View details for ${card.title}`}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto focus:outline-none"
            ref={modalRef}
            tabIndex={-1}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id="modal-title" className="text-2xl font-bold text-gray-800">{selectedCategory}</h2>
              <button
                className="text-gray-600 hover:text-gray-800 text-2xl"
                onClick={closeModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left text-gray-700" scope="col">Parameter</th>
                      <th className="border p-3 text-left text-gray-700" scope="col">Value</th>
                      <th className="border p-3 text-left text-gray-700" scope="col">Unit</th>
                      <th className="border p-3 text-left text-gray-700" scope="col">Serial No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.length > 0 ? (
                      parameters.map((param, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border p-3">{param.id}</td>
                          <td className="border p-3">{param.value}</td>
                          <td className="border p-3">{param.unit}</td>
                          <td className="border p-3">{param.serialNo}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="border p-3 text-center text-gray-600">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcavatorParameters; 