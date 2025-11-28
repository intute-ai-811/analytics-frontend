import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Settings, Thermometer, AlertTriangle, Activity, ArrowLeft, Bolt, BarChart3, TrendingUp, CheckCircle, Zap, Cpu } from 'lucide-react';
// import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

function MotorPage({ user }) {
  const selectedVehicle = window.location.pathname.split('/')[2] || 'VCL001';
  const [data, setData] = useState({ motor: {}, config: null });
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
      const configData = await response.json();
      console.log('Config received:', configData);
      return configData;
    } catch (err) {
      console.error(`Config fetch error: ${err.message}`);
      return {
        canMappings: {
          motor: {
            torqueLimit: 'x301',
            torqueValue: 'x302',
            motorSpeed: 'x303',
            rotationDirection: 'x304',
            operationMode: 'x305',
            mcuEnable: 'x306',
            mcuDrivePermit: 'x307',
            mcuOffPermit: 'x308',
            totalFaultStatus: 'x309',
            acCurrent: 'x310',
            acVoltage: 'x311',
            dcVoltage: 'x312',
            motorTemp: 'x313',
            mcuTemp: 'x314',
            radiatorTemp: 'x315',
            motorQuantity: 'x316',
            motorNum: 'x317',
            mcuManufacturer: 'x318',
          },
        },
      };
    }
  };

  const fetchMotorData = async () => {
    try {
      console.log('Fetching motor data with token:', user?.token);
      const response = await fetch(`${API_BASE_URL}/api/motor?device_id=${selectedVehicle}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      console.log('Motor response status:', response.status, response.statusText);
      if (!response.ok) throw new Error(`Failed to fetch motor data: ${response.status} ${response.statusText}`);
      const motorData = await response.json();
      console.log('Motor data received:', motorData);
     
      if (Array.isArray(motorData)) {
        if (motorData.length === 0) {
          throw new Error('Motor data array is empty');
        }
        const latestMotorData = motorData.reduce((latest, current) => {
          return (!latest.timestamp || (current.timestamp && current.timestamp > latest.timestamp)) ? current : latest;
        }, motorData[0]);
        return { ...latestMotorData, timestamp: latestMotorData.timestamp || Date.now() };
      }
      return { ...motorData, timestamp: motorData.timestamp || Date.now() };
    } catch (err) {
      console.error(`Motor fetch error: ${err.message}`);
      return {
        torqueLimit: 200,
        torqueValue: 150,
        motorSpeed: 3000,
        rotationDirection: 'Forward',
        operationMode: 'Drive',
        mcuEnable: 'Enabled',
        mcuDrivePermit: 'Permitted',
        mcuOffPermit: 'Permitted',
        totalFaultStatus: 'Normal',
        acCurrent: 100,
        acVoltage: 400,
        dcVoltage: 48,
        motorTemp: 60,
        mcuTemp: 50,
        radiatorTemp: 45,
        motorQuantity: selectedVehicle === 'VCL001' ? 2 : 1,
        motorNum: selectedVehicle === 'VCL001' ? 'Motor 1' : 'Motor A',
        mcuManufacturer: selectedVehicle === 'VCL001' ? 'CETL Corp' : 'MotorTech Inc',
        timestamp: Date.now(),
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
      const initialMotorData = await fetchMotorData();
      setData({ motor: initialMotorData, config: configData });
      setHistoricalData(prev => {
        const newData = [
          ...prev,
          {
            time: new Date(initialMotorData.timestamp || Date.now()).toLocaleTimeString(),
            torque: parseFloat(initialMotorData.torqueValue) || 0,
            speed: parseFloat(initialMotorData.motorSpeed) || 0,
            temp: parseFloat(initialMotorData.motorTemp) || 0,
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
          const { motor } = message;
          if (motor) {
            const latestMotor = Array.isArray(motor)
              ? motor.reduce((latest, current) => {
                  return (!latest.timestamp || (current.timestamp && current.timestamp > latest.timestamp)) ? current : latest;
                }, motor[0]) || motor[0]
              : motor;
            setData(prevData => ({
              motor: {
                ...latestMotor,
                timestamp: latestMotor.timestamp || Date.now(),
              },
              config: prevData.config,
            }));
            setHistoricalData(prev => {
              const newData = [
                ...prev,
                {
                  time: new Date(latestMotor.timestamp || Date.now()).toLocaleTimeString(),
                  torque: parseFloat(latestMotor.torqueValue) || 0,
                  speed: parseFloat(latestMotor.motorSpeed) || 0,
                  temp: parseFloat(latestMotor.motorTemp) || 0,
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
            Initializing Motor Systems...
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

  const torqueData = [
    { name: 'Used', value: parseFloat(data.motor.torqueValue) || 0, fill: '#f59e0b' },
    { name: 'Available', value: (parseFloat(data.motor.torqueLimit) || 0) - (parseFloat(data.motor.torqueValue) || 0), fill: '#374151' },
  ];
  const speedData = [
    { name: 'Current Speed', value: parseFloat(data.motor.motorSpeed) || 0, fill: '#3b82f6' },
  ];
  const tempData = [
    { name: 'Motor', value: parseFloat(data.motor.motorTemp) || 0, fill: '#ef4444' },
    { name: 'MCU', value: parseFloat(data.motor.mcuTemp) || 0, fill: '#f59e0b' },
    { name: 'Radiator', value: parseFloat(data.motor.radiatorTemp) || 0, fill: '#10b981' },
  ];
  const electricalData = [
    { name: 'AC Current', value: parseFloat(data.motor.acCurrent) || 0, unit: 'A', color: '#3b82f6' },
    { name: 'AC Voltage', value: parseFloat(data.motor.acVoltage) || 0, unit: 'V', color: '#f59e0b' },
    { name: 'DC Voltage', value: parseFloat(data.motor.dcVoltage) || 0, unit: 'V', color: '#10b981' },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'normal': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'normal': return <CheckCircle className="w-6 h-6" />;
      case 'warning': return <AlertTriangle className="w-6 h-6" />;
      case 'error': return <AlertTriangle className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const torquePercentage = ((parseFloat(data.motor.torqueValue) / parseFloat(data.motor.torqueLimit)) * 100).toFixed(1);
  const speedPercentage = ((parseFloat(data.motor.motorSpeed) / 5000) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <div className="relative z-10 p-6">
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
                Motor Control Center
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <p className="text-gray-300 text-lg mt-2 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400 animate-pulse" />
                {selectedVehicle} - CETL Advanced Motor System
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
                  LIVE • {new Date(data.motor.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div
              className={`flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 border transition-all duration-300 ${
                data.motor.totalFaultStatus === 'Normal' ? 'border-green-500/30' :
                data.motor.totalFaultStatus === 'Warning' ? 'border-yellow-500/30' : 'border-red-500/30'
              }`}
            >
              <div className="relative">
                {getStatusIcon(data.motor.totalFaultStatus)}
                <div
                  className={`absolute inset-0 rounded-full animate-ping ${getStatusColor(data.motor.totalFaultStatus).replace('text-', 'bg-')}`}
                ></div>
              </div>
              <span className={`font-bold text-xl ${getStatusColor(data.motor.totalFaultStatus)}`}>
                SYSTEM {data.motor.totalFaultStatus?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-green-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-t-3xl"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-xl flex items-center">
                  <div className="relative mr-3">
                    <Settings className="w-7 h-7 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-0 w-7 h-7 border-2 border-green-400/30 rounded-full animate-ping"></div>
                  </div>
                  Torque Performance
                </h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Efficiency</div>
                  <div className="text-lg font-bold text-green-400">{torquePercentage}%</div>
                </div>
              </div>
              <div className="relative h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={torqueData}
                      innerRadius={60}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {torqueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">{data.motor.torqueValue}</div>
                    <div className="text-green-400 text-sm">Nm</div>
                    <div className="text-xs text-gray-400">of {data.motor.torqueLimit} Nm</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${torquePercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-400">Current Output Level</div>
            </div>
          </div>
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
                  Motor Velocity
                </h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Load</div>
                  <div className="text-lg font-bold text-blue-400">{speedPercentage}%</div>
                </div>
              </div>
              <div className="relative h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart data={speedData} innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0}>
                    <RadialBar dataKey="value" cornerRadius="10" fill="#3b82f6" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">{data.motor.motorSpeed}</div>
                    <div className="text-blue-400 text-sm">RPM</div>
                    <div className="text-xs text-gray-400">Rotation Speed</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${data.motor.rotationDirection === 'Forward' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-sm text-gray-300">{data.motor.rotationDirection}</span>
                <div className={`w-3 h-3 rounded-full ${data.motor.rotationDirection === 'Reverse' ? 'bg-red-400 animate-pulse' : 'bg-gray-600'}`}></div>
              </div>
            </div>
          </div>
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
                  <div className="text-lg font-bold text-red-400">{Math.max(parseFloat(data.motor.motorTemp) || 0, parseFloat(data.motor.mcuTemp) || 0, parseFloat(data.motor.radiatorTemp) || 0)}°C</div>
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
                          width: `${(temp.value / 100) * 100}%`,
                          background: `linear-gradient(to right, ${temp.fill}, ${temp.fill}dd)`,
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-purple-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-t-3xl"></div>
              <h3 className="text-white font-bold text-2xl flex items-center mb-6">
                <div className="relative mr-3">
                  <Bolt className="w-8 h-8 text-purple-400" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-purple-400/30 rounded-full animate-ping"></div>
                </div>
                Electrical Subsystem
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {electricalData.map((item, index) => (
                  <div key={index} className="bg-black/40 rounded-2xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: item.color }}></div>
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
                          width: `${(item.value / (item.name.includes('Voltage') ? 500 : 150)) * 100}%`,
                          backgroundColor: item.color,
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
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-green-500/30 shadow-2xl p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-t-3xl"></div>
              <h3 className="text-white font-bold text-2xl flex items-center mb-6">
                <div className="relative mr-3">
                  <BarChart3 className="w-8 h-8 text-green-400" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-green-400/30 rounded-full animate-pulse"></div>
                </div>
                System Status
              </h3>
              <div className="space-y-4">
                {[
                  {
                    id: 'Operation Mode',
                    value: data.motor.operationMode,
                    icon: <Activity className="w-5 h-5" />,
                    status: data.motor.operationMode === 'Drive' ? 'active' : 'idle',
                  },
                  {
                    id: 'MCU Enable State',
                    value: data.motor.mcuEnable,
                    icon: <Cpu className="w-5 h-5" />,
                    status: data.motor.mcuEnable === 'Enabled' ? 'active' : 'inactive',
                  },
                  {
                    id: 'MCU Drive Permit',
                    value: data.motor.mcuDrivePermit,
                    icon: <CheckCircle className="w-5 h-5" />,
                    status: data.motor.mcuDrivePermit === 'Permitted' ? 'active' : 'inactive',
                  },
                  {
                    id: 'MCU Off Permit',
                    value: data.motor.mcuOffPermit,
                    icon: <AlertTriangle className="w-5 h-5" />,
                    status: data.motor.mcuOffPermit === 'Permitted' ? 'active' : 'inactive',
                  },
                ].map((param, index) => (
                  <div key={index} className="bg-black/40 rounded-2xl p-4 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 backdrop-blur-sm group/item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-xl ${
                            param.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            param.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {param.icon}
                        </div>
                        <span className="text-gray-300 font-medium">{param.id}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`font-bold px-3 py-1 rounded-full text-sm ${
                            param.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            param.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {param.value}
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full animate-pulse ${
                            param.status === 'active' ? 'bg-green-400' :
                            param.status === 'idle' ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
                    <Line type="monotone" dataKey="torque" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                    <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                    <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Torque', value: `${data.motor.torqueValue} Nm`, color: 'text-green-400', bg: 'bg-green-500/20' },
                { label: 'Speed', value: `${data.motor.motorSpeed} RPM`, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Temperature', value: `${data.motor.motorTemp}°C`, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
              ].map((metric, index) => (
                <div key={index} className={`${metric.bg} rounded-xl p-3 border border-gray-600/30`}>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                  <div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-indigo-500/30 shadow-2xl p-6 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>
            <h3 className="text-white font-bold text-2xl flex items-center mb-6">
              <div className="relative mr-3">
                <Cpu className="w-8 h-8 text-indigo-400" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-indigo-400/30 rounded-full animate-pulse"></div>
              </div>
              System Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: 'Number of Motors',
                  value: data.motor.motorQuantity,
                  icon: <Settings className="w-6 h-6" />,
                  description: 'Active motor units',
                  color: 'from-blue-400 to-cyan-400',
                },
                {
                  id: 'Motor Number',
                  value: data.motor.motorNum,
                  icon: <Activity className="w-6 h-6" />,
                  description: 'Primary motor identifier',
                  color: 'from-green-400 to-emerald-400',
                },
                {
                  id: 'MCU Manufacturer',
                  value: data.motor.mcuManufacturer,
                  icon: <Cpu className="w-6 h-6" />,
                  description: 'Control unit provider',
                  color: 'from-purple-400 to-pink-400',
                },
              ].map((config, index) => (
                <div key={index} className="relative group/config">
                  <div className="bg-black/40 rounded-2xl p-6 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 backdrop-blur-sm hover:transform hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${config.color} bg-opacity-20`}>
                        <div className={`bg-gradient-to-br ${config.color} bg-clip-text text-transparent`}>{config.icon}</div>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <h4 className="text-indigo-400 font-semibold text-lg mb-2">{config.id}</h4>
                    <div className="text-white text-xl font-bold mb-2">{config.value}</div>
                    <div className="text-gray-400 text-sm">{config.description}</div>
                    <div className="mt-4 w-full bg-gray-700 rounded-full h-1">
                      <div className={`h-full rounded-full bg-gradient-to-r ${config.color} animate-pulse`} style={{ width: '85%' }}></div>
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

export default MotorPage;