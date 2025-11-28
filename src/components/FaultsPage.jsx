import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, AlertTriangle, Zap, Activity } from 'lucide-react';
// import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function FaultsPage({ user }) {
  const selectedVehicle = window.location.pathname.split('/')[2] || 'VCL001';
  const [data, setData] = useState({ faults: {}, config: null });
  const [allFaults, setAllFaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [historicalFaults, setHistoricalFaults] = useState([]);
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const faultParameters = [
    'Hardware driver failure',
    'Hardware overcurrent fault',
    'Zero offset fault',
    'Fan failure',
    'Temperature difference failure',
    'AC Hall failure',
    'Stall failure',
    'Low voltage undervoltage fault',
    'Software overcurrent fault',
    'Hardware overvoltage fault',
    'Total hardware failure',
    'Bus overvoltage fault',
    'Busbar undervoltage fault',
    'Module over temperature fault',
    'Module over temperature warning',
    'Overspeed fault',
    'OverRpmAlarm_Flag',
    'Motor over temperature warning',
    'Motor over temperature fault',
    'CAN offline failure',
    'Encoder failure'
  ];

  const fetchConfig = async () => {
    try {
      console.log('Fetching config with token:', user?.token);
      const response = await fetch(`${API_BASE_URL}/api/config?device_id=${selectedVehicle}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      console.log('Config response status:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      const configData = await response.json();
      console.log('Config received:', configData);
      return configData;
    } catch (err) {
      console.error(`Config fetch error: ${err.message}`);
      return {
        canMappings: {
          faults: {
            faultCode: 'x401',
            faultDescription: 'x402',
            faultSeverity: 'x403',
            faultTimestamp: 'x404',
            faultStatus: 'x405',
          },
        },
      };
    }
  };

  const fetchFaults = async () => {
    try {
      console.log('Fetching faults with token:', user?.token);
      const response = await fetch(`${API_BASE_URL}/api/faults?device_id=${selectedVehicle}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      console.log('Faults response status:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Failed to fetch faults: ${response.status} ${response.statusText}`);
      const faultsData = await response.json();
      console.log('Faults received:', faultsData);

      let latestFault;
      if (Array.isArray(faultsData)) {
        if (faultsData.length === 0) {
          throw new Error('Faults data array is empty');
        }
        latestFault = faultsData.reduce((latest, current) => {
          return (!latest.faultTimestamp || (current.faultTimestamp && current.faultTimestamp > latest.faultTimestamp)) ? current : latest;
        }, faultsData[0]);
      } else {
        latestFault = faultsData;
      }
      latestFault = { ...latestFault, faultTimestamp: latestFault.faultTimestamp || Date.now() };

      // Update allFaults state with known faults, defaulting others to Inactive
      const updatedFaults = faultParameters.reduce((acc, fault) => {
        acc[fault] = (latestFault.faultDescription === fault && latestFault.faultStatus === 'Active') ? 'Active' : 'Inactive';
        return acc;
      }, {});
      setAllFaults(updatedFaults);

      return latestFault;
    } catch (err) {
      console.error(`Faults fetch error: ${err.message}`);
      const defaultFaults = faultParameters.reduce((acc, fault) => {
        acc[fault] = 'Inactive';
        return acc;
      }, {});
      setAllFaults(defaultFaults);
      return {
        faultCode: 'F000',
        faultDescription: 'No active faults',
        faultSeverity: 'Normal',
        faultTimestamp: Date.now(),
        faultStatus: 'Inactive',
      };
    }
  };

  const connectWebSocket = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`WebSocket already connected for ${selectedVehicle}`);
      return;
    }

    try {
      setLoading(true);
      const configData = await fetchConfig();
      const initialFaultsData = await fetchFaults();
      setData({ faults: initialFaultsData, config: configData });

      setHistoricalFaults(prev => {
        const newData = [
          ...prev,
          {
            time: new Date(initialFaultsData.faultTimestamp || Date.now()).toLocaleTimeString(),
            severity: initialFaultsData.faultSeverity === 'Critical' ? 3 : initialFaultsData.faultSeverity === 'Warning' ? 2 : 1,
          },
        ];
        return newData.slice(-10);
      });

      const wsUrl = `ws://localhost:5000?device_id=${selectedVehicle}&token=${user?.token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`WebSocket connected for ${selectedVehicle}`);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          const { faults } = message;
          if (faults) {
            const latestFault = Array.isArray(faults)
              ? faults.reduce((latest, current) => {
                  return (!latest.faultTimestamp || (current.faultTimestamp && current.faultTimestamp > latest.faultTimestamp)) ? current : latest;
                }, faults[0]) || faults[0]
              : faults;

            setData(prevData => ({
              faults: {
                ...latestFault,
                faultTimestamp: latestFault.faultTimestamp || Date.now(),
              },
              config: prevData.config,
            }));

            // Update allFaults based on WebSocket data
            setAllFaults(prev => {
              const updatedFaults = { ...prev };
              faultParameters.forEach(fault => {
                updatedFaults[fault] = (latestFault.faultDescription === fault && latestFault.faultStatus === 'Active') ? 'Active' : 'Inactive';
              });
              return updatedFaults;
            });

            setHistoricalFaults(prev => {
              const newData = [
                ...prev,
                {
                  time: new Date(latestFault.faultTimestamp || Date.now()).toLocaleTimeString(),
                  severity: latestFault.faultSeverity === 'Critical' ? 3 : latestFault.faultSeverity === 'Warning' ? 2 : 1,
                },
              ];
              return newData.slice(-10);
            });

            if (isInitialLoad) {
              setIsInitialLoad(false);
              setLoading(false);
            }
          }
        } catch (err) {
          console.error(`Failed to parse WebSocket data: ${err.message}`);
          setError(`Failed to parse WebSocket data: ${err.message}`);
          if (isInitialLoad) {
            setLoading(false);
          }
        }
      };

      wsRef.current.onerror = (err) => {
        console.error(`WebSocket error for ${selectedVehicle}:`, err);
        setError(`WebSocket error: ${err.message || 'Connection failed'}`);
        setLoading(false);
      };

      wsRef.current.onclose = () => {
        console.log(`WebSocket closed for ${selectedVehicle}.`);
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
          console.log(`Reconnecting in ${delay}ms... Attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts}`);
          setTimeout(() => {
            reconnectAttempts.current += 1;
            connectWebSocket();
          }, delay);
        } else {
          setError('Max WebSocket reconnection attempts reached');
          setLoading(false);
        }
      };
    } catch (err) {
      console.error(`WebSocket connection error: ${err.message}`);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      console.log('useEffect triggered with token:', user?.token, 'vehicle:', selectedVehicle);
      connectWebSocket();
    } else {
      setError('No authentication token provided');
      setLoading(false);
      setAllFaults(faultParameters.reduce((acc, fault) => {
        acc[fault] = 'Inactive';
        return acc;
      }, {}));
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.token, selectedVehicle]);

  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 w-32 h-32 border-4 border-orange-500/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 w-28 h-28 border-4 border-orange-400/40 rounded-full animate-spin"></div>
          <div className="absolute inset-4 w-24 h-24 border-4 border-orange-300/60 rounded-full animate-ping"></div>
          <div className="w-32 h-32 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-orange-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute mt-48">
          <span className="text-white font-medium text-xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Initializing Faults Data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-red-500/30 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="text-red-400 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-red-400';
      case 'inactive': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <AlertTriangle className="w-5 h-5" />;
      case 'inactive': return <CheckCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const activeFaults = Object.entries(allFaults).filter(([_, status]) => status === 'Active');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-1/4 w-24 h-full bg-gradient-to-b from-blue-400 to-transparent opacity-50"></div>
        <div className="absolute top-0 left-1/4 w-16 h-full bg-gradient-to-b from-green-400 to-transparent opacity-30"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="relative p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110 hover:rotate-3 shadow-2xl"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
            </button>
            <div className="relative">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent animate-pulse">
                Faults Monitor
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <p className="text-gray-300 text-lg mt-2 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400 animate-pulse" />
                {selectedVehicle} - Fault Diagnostics
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-green-500/30">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-green-400 font-medium">
                  LIVE • {new Date(data.faults.faultTimestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className={`flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 border transition-all duration-300 ${
              activeFaults.length > 0 ? 'border-red-500/30' : 'border-green-500/30'
            }`}>
              <div className="relative">
                {activeFaults.length > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
                <div className={`absolute inset-0 rounded-full animate-ping ${
                  activeFaults.length > 0 ? 'bg-red-400/30' : 'bg-green-400/30'
                }`}></div>
              </div>
              <span className={`font-bold text-xl ${
                activeFaults.length > 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {activeFaults.length > 0 ? `${activeFaults.length} ACTIVE FAULTS` : 'SYSTEM CLEAR'}
              </span>
            </div>
          </div>
        </div>

        {/* Active Faults Section */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-red-500/30 shadow-2xl p-6 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 rounded-t-3xl"></div>
            
            <h3 className="text-white font-bold text-2xl flex items-center mb-6">
              <div className="relative mr-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-red-400/30 rounded-full animate-pulse"></div>
              </div>
              Active Faults
              <div className="ml-auto text-sm text-gray-400">({activeFaults.length} Active)</div>
            </h3>

            {activeFaults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFaults.map(([key, status], index) => (
                  <div key={index} className="bg-black/40 rounded-2xl p-4 border border-red-500/20 hover:border-red-400/40 transition-all duration-300 backdrop-blur-sm hover:transform hover:scale-105">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                          {getStatusIcon(status)}
                        </div>
                        <div>
                          <div className="text-gray-300 font-medium text-sm">{data.faults.faultCode}</div>
                          <div className="text-gray-400 text-xs">{key}</div>
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="relative inline-block">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <div className="absolute inset-0 w-12 h-12 border-2 border-green-400/30 rounded-full animate-ping mx-auto"></div>
                </div>
                <p className="text-green-400 text-lg font-semibold">No active faults—all systems operational!</p>
              </div>
            )}
          </div>
        </div>

        {/* All Faults Status */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-purple-500/30 shadow-2xl p-6 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-t-3xl"></div>
            
            <h3 className="text-white font-bold text-2xl flex items-center mb-6">
              <div className="relative mr-3">
                <AlertTriangle className="w-8 h-8 text-purple-400" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-purple-400/30 rounded-full animate-pulse"></div>
              </div>
              All Faults Status
              <div className="ml-auto text-sm text-gray-400">Real-time Diagnostics</div>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(allFaults).map(([key, status], index) => (
                <div key={index} className="bg-black/40 rounded-2xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm hover:transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${status === 'Active' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {getStatusIcon(status)}
                      </div>
                      <span className="text-gray-300 font-medium">{key}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`font-bold px-3 py-1 rounded-full text-sm ${status === 'Active' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                        {status}
                      </span>
                      <div className={`w-3 h-3 rounded-full animate-pulse ${status === 'Active' ? 'bg-red-400' : 'bg-green-400'}`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fault History Section */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-cyan-500/30 shadow-2xl p-6 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-t-3xl"></div>

            <h3 className="text-white font-bold text-2xl flex items-center mb-6">
              <div className="relative mr-3">
                <Activity className="w-8 h-8 text-cyan-400" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-cyan-400/30 rounded-full animate-pulse"></div>
              </div>
              Fault History
              <div className="ml-auto text-sm text-gray-400">Real-time Diagnostics</div>
            </h3>

            {historicalFaults.length > 0 && (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalFaults}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Line type="monotone" dataKey="severity" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaultsPage;