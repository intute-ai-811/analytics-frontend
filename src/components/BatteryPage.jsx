import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Thermometer, Battery, Zap, Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Bolt, ArrowLeft, Cpu } from 'lucide-react';
// import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

function BatteryPage({ user }) {
  const selectedVehicle = window.location.pathname.split('/')[2] || 'VCL001';
  const [data, setData] = useState({ battery: {}, config: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [historicalData, setHistoricalData] = useState([]);
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      const config = await response.json();
      console.log('Config received:', config);
      return config;
    } catch (err) {
      console.error(`Config fetch error: ${err.message}`);
      return {
        canMappings: {
          battery: {
            moduleTemps: {},
            cellVoltages: {},
          },
        },
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
      const config = await fetchConfig();
      const wsUrl = `ws://localhost:5000?device_id=${selectedVehicle}&token=${user?.token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`WebSocket connected for ${selectedVehicle}`);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { battery, timestamp } = message;

          setData(prevData => ({
            battery: {
              ...battery,
              timestamp: timestamp || Date.now(),
            },
            config,
          }));

          setHistoricalData(prev => {
            const newData = [
              ...prev,
              {
                time: new Date(timestamp || Date.now()).toLocaleTimeString(),
                soc: parseFloat(battery.soc) || 0,
                stackVoltage: parseFloat(battery.stackVoltage) || 0,
                avgTemp: parseFloat(battery.avgTemp) || 0,
              },
            ];
            return newData.slice(-10);
          });

          if (isInitialLoad) {
            setIsInitialLoad(false);
            setLoading(false);
          }
        } catch (err) {
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
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      connectWebSocket();
    } else {
      setError('No authentication token provided');
      setLoading(false);
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
            <Cpu className="w-12 h-12 text-orange-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute mt-48">
          <span className="text-white font-medium text-xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Initializing Battery Systems...
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

  const socData = [
    { name: 'Used', value: parseFloat(data.battery.soc) || 0, fill: '#10b981' },
    { name: 'Available', value: 100 - (parseFloat(data.battery.soc) || 0), fill: '#374151' },
  ];

  const voltageData = [
    { name: 'Max', value: parseFloat(data.battery.maxVoltage) || 595.187, fill: '#f59e0b' },
    { name: 'Avg', value: parseFloat(data.battery.avgVoltage) || 595.187, fill: '#3b82f6' },
    { name: 'Min', value: parseFloat(data.battery.minVoltage) || 595.187, fill: '#ef4444' },
  ];

  const tempData = [
    { name: 'Max', value: parseFloat(data.battery.maxTemp) || 0, fill: '#ef4444' },
    { name: 'Avg', value: parseFloat(data.battery.avgTemp) || 0, fill: '#f59e0b' },
    { name: 'Min', value: parseFloat(data.battery.minTemp) || 0, fill: '#10b981' },
  ];

  const currentData = [
    { name: 'Current', value: parseFloat(data.battery.current) || 0, unit: 'A', color: '#3b82f6' },
    { name: 'Charger Current', value: parseFloat(data.battery.chargerCurrentDemand) || 0, unit: 'A', color: '#f59e0b' },
    { name: 'Charger Voltage', value: parseFloat(data.battery.chargerVoltageDemand) || 0, unit: 'V', color: '#10b981' },
  ];

  const moduleData = Object.entries(data.config?.canMappings.battery.moduleTemps || {}).map(([module, _]) => ({
    name: module.replace('module', 'M'),
    temp: parseFloat(data.battery[`${module}Temps`]?.split(', ')[0]) || 0,
    voltage: parseFloat(data.battery[`${module}CellsAvg`]) || 0,
  }));

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-green-400';
      case 'charging': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <CheckCircle className="w-6 h-6" />;
      case 'charging': return <Zap className="w-6 h-6" />;
      case 'warning': return <AlertTriangle className="w-6 h-6" />;
      case 'error': return <AlertTriangle className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const socPercentage = parseFloat(data.battery.soc).toFixed(1);
  const voltagePercentage = ((parseFloat(data.battery.stackVoltage) / 800) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
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
                Battery Control Center
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <p className="text-gray-300 text-lg mt-2 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400 animate-pulse" />
                {selectedVehicle} - Stefen Battery System
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
                  LIVE • {new Date(data.battery.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Metrics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* State of Charge */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-green-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-t-3xl"></div>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-xl flex items-center">
                  <div className="relative mr-3">
                    <Battery className="w-7 h-7 text-green-400 animate-pulse" />
                    <div className="absolute inset-0 w-7 h-7 border-2 border-green-400/30 rounded-full animate-ping"></div>
                  </div>
                  State of Charge
                </h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Capacity</div>
                  <div className="text-lg font-bold text-green-400">{socPercentage}%</div>
                </div>
              </div>

              <div className="relative h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={socData}
                      innerRadius={60}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {socData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">{data.battery.soc}</div>
                    <div className="text-green-400 text-sm">% SOC</div>
                    <div className="text-xs text-gray-400">Charge Level</div>
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative"
                  style={{width: `${socPercentage}%`}}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-400">Current Charge Level</div>
            </div>
          </div>

          {/* Voltage Analysis */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-blue-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-t-3xl"></div>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-xl flex items-center">
                  <div className="relative mr-3">
                    <Gauge className="w-7 h-7 text-blue-400" />
                    <div className="absolute inset-0 w-7 h-7 border-2 border-blue-400/50 rounded-full animate-pulse"></div>
                  </div>
                  Voltage Analysis
                </h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Stack</div>
                  <div className="text-lg font-bold text-blue-400">{voltagePercentage}%</div>
                </div>
              </div>

              <div className="relative h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={voltageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 800]} tickFormatter={(value) => value.toFixed(1)} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      formatter={(value) => `${value.toFixed(3)} V`}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {voltageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">{parseFloat(data.battery.stackVoltage).toFixed(3)} V</div>
                <div className="text-blue-400 text-sm">Stack Voltage</div>
              </div>
            </div>
          </div>

          {/* Temperature Monitor */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-orange-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-red-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-3xl"></div>
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-xl flex items-center">
                  <div className="relative mr-3">
                    <Thermometer className="w-7 h-7 text-red-400" />
                    <div className="absolute inset-0 w-7 h-7 border-2 border-red-400/50 rounded-full animate-pulse"></div>
                  </div>
                  Thermal Status
                </h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Peak</div>
                  <div className="text-lg font-bold text-red-400">{data.battery.maxTemp}°C</div>
                </div>
              </div>

              <div className="space-y-4">
                {tempData.map((temp, index) => (
                  <div key={index} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">{temp.name}</span>
                      <span className="text-white font-bold">{temp.value}°C</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{
                          width: `${(temp.value / 50) * 100}%`,
                          background: `linear-gradient(to right, ${temp.fill}, ${temp.fill}dd)`
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="text-xs text-gray-400 text-center">Thermal Management Active</div>
                <div className="flex justify-center items-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-400">Cooling System Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Secondary Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Flow */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-purple-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-t-3xl"></div>
              
              <h3 className="text-white font-bold text-2xl flex items-center mb-6">
                <div className="relative mr-3">
                  <Bolt className="w-8 h-8 text-purple-400" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-purple-400/30 rounded-full animate-ping"></div>
                </div>
                Current Flow
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {currentData.map((item, index) => (
                  <div key={index} className="bg-black/40 rounded-2xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full animate-pulse" 
                          style={{backgroundColor: item.color}}
                        ></div>
                        <span className="text-gray-300 font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{item.value}</div>
                        <div className="text-sm text-purple-400">{item.unit}</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{
                          width: `${(item.value / (item.unit === 'V' ? 800 : 20)) * 100}%`,
                          backgroundColor: item.color
                        }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Module Performance */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-green-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-t-3xl"></div>
              
              <h3 className="text-white font-bold text-2xl flex items-center mb-6">
                <div className="relative mr-3">
                  <BarChart3 className="w-8 h-8 text-green-400" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-green-400/30 rounded-full animate-pulse"></div>
                </div>
                Module Performance
              </h3>

              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis yAxisId="temp" orientation="left" stroke="#f59e0b" fontSize={12} />
                    <YAxis yAxisId="voltage" orientation="right" stroke="#3b82f6" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Bar yAxisId="temp" dataKey="temp" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="voltage" dataKey="voltage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-cyan-500/30 shadow-2xl p-6 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-t-3xl"></div>
            
            <h3 className="text-white font-bold text-2xl flex items-center mb-6">
              <div className="relative mr-3">
                <TrendingUp className="w-8 h-8 text-cyan-400" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-cyan-400/30 rounded-full animate-pulse"></div>
              </div>
              Performance Trends
              <div className="ml-auto text-sm text-gray-400">Real-time Analytics</div>
            </h3>

            {historicalData.length > 0 && (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 800]} tickFormatter={(value) => value.toFixed(1)} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => name === 'stackVoltage' ? `${value.toFixed(3)} V` : value}
                    />
                    <Line type="monotone" dataKey="soc" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                    <Line type="monotone" dataKey="stackVoltage" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                    <Line type="monotone" dataKey="avgTemp" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'SOC', value: `${data.battery.soc}%`, color: 'text-green-400', bg: 'bg-green-500/20' },
                { label: 'Stack Voltage', value: `${parseFloat(data.battery.stackVoltage).toFixed(3)} V`, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Temperature', value: `${data.battery.avgTemp}°C`, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
              ].map((metric, index) => (
                <div key={index} className={`${metric.bg} rounded-xl p-3 border border-gray-600/30`}>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                  <div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Module Statistics */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-indigo-500/30 shadow-2xl p-6 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>
            
            <h3 className="text-white font-bold text-2xl flex items-center mb-6">
              <div className="relative mr-3">
                <Cpu className="w-8 h-8 text-indigo-400" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-indigo-400/30 rounded-full animate-pulse"></div>
              </div>
              Module Statistics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {Object.entries(data.config?.canMappings.battery.moduleTemps || {}).map(([module, _], index) => (
                <div key={module} className="relative group/config">
                  <div className="bg-black/40 rounded-2xl p-6 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 backdrop-blur-sm hover:transform hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 bg-opacity-20`}>
                        <div className="bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          <Battery className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <h4 className="text-indigo-400 font-semibold text-lg mb-2">{module.toUpperCase()}</h4>
                    <div className="text-white text-xl font-bold mb-2">{data.battery[`${module}CellsAvg`]} V</div>
                    <div className="text-gray-400 text-sm mb-2">Avg Cell Voltage</div>
                    <div className="text-gray-400 text-sm">Temps: {(data.battery[`${module}Temps`] || '').split(', ').join('°, ')}°C</div>
                    
                    <div className="mt-4 w-full bg-gray-700 rounded-full h-1">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatteryPage;