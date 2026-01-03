import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : window.location.origin;

const LIVE_THRESHOLD_MS = 15000; // 15 seconds

export default function LiveView() {
  const { id } = useParams();
  const [live, setLive] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const lastActivityRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid vehicle ID");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view live data");
      setLoading(false);
      return;
    }

    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`/api/vehicles/${id}/live`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text || "Failed to fetch"}`);
        }
        const data = await res.json();
        setLive(data);
        if (data.recorded_at) {
          const t = new Date(data.recorded_at);
          setLastUpdateTime(t);
          lastActivityRef.current = t.getTime();
        }
        setError(null);
      } catch (err) {
        console.error("REST fetch error:", err);
        setError(err.message || "Failed to load live data");
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();

    // Prevent duplicate socket connections
    if (socketRef.current) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsSocketConnected(true);
      socket.emit("subscribe_vehicle", { vehicleId: id });
      fetchSnapshot(); // Ensure fresh data on reconnect
    });

    socket.on("live_update", (data) => {
      setLive((prev) => ({
        ...prev,
        ...data, // Partial merge – preserves existing fields
      }));
      if (data.recorded_at) {
        const t = new Date(data.recorded_at);
        setLastUpdateTime(t);
        lastActivityRef.current = Date.now(); // Mark fresh activity
      }
    });

    socket.on("disconnect", () => {
      console.warn("WebSocket disconnected");
      setIsSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setIsSocketConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsSocketConnected(false);
    };
  }, [id]);

  const isActivelyLive =
    isSocketConnected &&
    lastActivityRef.current &&
    Date.now() - lastActivityRef.current < LIVE_THRESHOLD_MS;

  const formatTimestamp = (date) => {
    if (!date) return "–";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const Val = ({ v, unit = "", fixed = 2 }) => (
    <span className="text-orange-300 font-semibold">
      {v == null ? "–" : `${Number(v).toFixed(fixed)}${unit}`}
    </span>
  );

  const HoursToHrMin = ({ hours }) => {
    if (hours == null || hours === 0) {
      return <span className="text-orange-300 font-semibold">0 hr 0 mins</span>;
    }
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return <span className="text-orange-300 font-semibold">{mins} mins</span>;
    return (
      <span className="text-orange-300 font-semibold">
        {hrs} hr{mins > 0 ? ` ${mins} mins` : ""}
      </span>
    );
  };

  const Section = ({ title, children }) => (
    <div className="bg-gray-900/60 rounded-lg p-5 border border-orange-500/30">
      <h3 className="text-lg font-medium text-orange-400 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const Item = ({ name, value }) => (
    <div className="flex justify-between items-center bg-gray-800/30 px-4 py-2 rounded-md">
      <span className="text-gray-300">{name}</span>
      <span className="text-orange-300 font-medium">{value ?? "–"}</span>
    </div>
  );

  if (loading && !Object.keys(live).length) {
    return <div className="text-center py-12 text-orange-200">Loading live data…</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Elegant Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-lg">
            Live Vehicle Data
          </span>
        </h1>
        <div className="flex justify-center">
          <div className="h-1 w-40 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
        </div>
      </div>

      {/* Live Status Indicator */}
      <div className="text-center mb-10 space-y-5">
        <div>
          <span
            className={`inline-block px-10 py-5 rounded-full text-xl font-bold shadow-2xl transition-all duration-500 ${
              isActivelyLive
                ? "bg-emerald-600/30 text-emerald-300 border-3 border-emerald-500/80 animate-pulse"
                : "bg-gray-700/40 text-gray-400 border-3 border-gray-600/60"
            }`}
          >
            {isActivelyLive ? "● LIVE (Real-time)" : "○ Last Known Data"}
          </span>
        </div>
        <div className="text-lg text-gray-300">
          Data updated at:{" "}
          <span className="text-orange-300 font-bold">
            {formatTimestamp(lastUpdateTime)}
          </span>
        </div>
      </div>

      {/* Data Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Battery / BTMS / Charger">
          <Item name="State of Charge" value={<Val v={live.soc_percent} unit="%" fixed={1} />} />
          <Item name="Battery Status" value={live.battery_status ?? "–"} />
          <Item name="Stack Voltage" value={<Val v={live.stack_voltage_v} unit="V" />} />
          <Item name="DC Output Current" value={<Val v={live.dc_current_a} unit="A" />} />
          <Item name="Output Power" value={<Val v={live.output_power_kw} unit="kW" />} />
          <Item name="Charging Current" value={<Val v={live.charging_current_a} unit="A" />} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Item
              key={`temp-${i}`}
              name={`Temp Sensor Module ${i + 1}`}
              value={<Val v={live.temp_sensors?.[i]} unit="°C" />}
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <Item
              key={`volt-${i}`}
              name={`Cell Voltage Module ${i + 1}`}
              value={<Val v={live.cell_voltages?.[i]} unit="V" fixed={3} />}
            />
          ))}
        </Section>

        <Section title="Motor & MCU">
          <Item name="Torque" value={<Val v={live.motor_torque_nm} unit="Nm" />} />
          <Item name="Operation Mode" value={live.motor_operation_mode ?? "–"} />
          <Item name="Speed" value={<Val v={live.motor_speed_rpm} fixed={0} unit="RPM" />} />
          <Item name="AC Current" value={<Val v={live.ac_current_a} unit="A" />} />
          <Item name="Torque Limit" value={<Val v={live.motor_torque_limit} unit="Nm" />} />
          <Item name="Rotation Direction" value={live.motor_rotation_dir ?? "–"} />
          <Item name="Motor Temperature" value={<Val v={live.motor_temp_c} unit="°C" />} />
          <Item name="AC Voltage" value={<Val v={live.motor_ac_voltage_v} unit="V" />} />
          <Item name="MCU Enable State" value={live.mcu_enable_state ?? "–"} />
          <Item name="MCU Temperature" value={<Val v={live.mcu_temp_c} unit="°C" />} />
        </Section>

        <Section title="Peripherals Live Data">
          <Item name="Radiator Temperature" value={<Val v={live.radiator_temp_c} unit="°C" fixed={1} />} />
          <Item name="Hydraulic Oil Temperature" value="–" />
          <Item name="Hydraulic Pump RPM" value="–" />
        </Section>

        <Section title="ODO / Trip Details">
          <Item name="Total Running Hours" value={<HoursToHrMin hours={live.total_hours} />} />
          <Item name="Last Trip Hours" value={<HoursToHrMin hours={live.last_trip_hrs} />} />
          <Item name="Total kWh Consumed" value={<Val v={live.total_kwh} fixed={1} unit=" kWh" />} />
          <Item name="kWh Used in Last Trip" value={<Val v={live.last_trip_kwh} fixed={1} unit=" kWh" />} />
        </Section>

        <Section title="DC-DC Converter">
          <Item name="Input Voltage" value={<Val v={live.dcdc_input_voltage_v} unit="V" />} />
          <Item name="Input Current" value={<Val v={live.dcdc_input_current_a} unit="A" />} />
          <Item
            name="Input Power"
            value={
              live.dcdc_input_voltage_v != null && live.dcdc_input_current_a != null
                ? <Val v={(live.dcdc_input_voltage_v * live.dcdc_input_current_a) / 1000} unit="kW" />
                : "–"
            }
          />
          <Item name="Output Voltage" value={<Val v={live.dcdc_output_voltage_v} unit="V" />} />
          <Item name="Output Current" value={<Val v={live.dcdc_output_current_a} unit="A" />} />
          <Item name="Pri A MOSFET Temp" value={<Val v={live.dcdc_pri_a_mosfet_temp_c} unit="°C" />} />
          <Item name="Pri C MOSFET Temp" value={<Val v={live.dcdc_pri_c_mosfet_temp_c} unit="°C" />} />
          <Item name="Sec LS MOSFET Temp" value={<Val v={live.dcdc_sec_ls_mosfet_temp_c} unit="°C" />} />
          <Item name="Sec HS MOSFET Temp" value={<Val v={live.dcdc_sec_hs_mosfet_temp_c} unit="°C" />} />
          <Item name="Overcurrent Fault Count" value={live.dcdc_occurrence_count ?? "–"} />
        </Section>

        <Section title="Alarms & Warnings">
          {Object.entries(live)
            .filter(([key]) => key.startsWith("alarms_"))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center bg-gray-800/40 px-3 py-2 rounded-md text-sm border border-orange-500/20"
              >
                <span className="text-gray-300 capitalize">
                  {key.replace("alarms_", "").replace(/_/g, " ")}
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    value
                      ? "bg-red-600/20 text-red-300"
                      : "bg-emerald-600/20 text-emerald-300"
                  }`}
                >
                  {value ? "ACTIVE" : "OK"}
                </span>
              </div>
            ))}
          {Object.keys(live).filter((k) => k.startsWith("alarms_")).length === 0 && (
            <div className="text-gray-500 text-center py-4">No alarm data available</div>
          )}
        </Section>
      </div>
    </div>
  );
}