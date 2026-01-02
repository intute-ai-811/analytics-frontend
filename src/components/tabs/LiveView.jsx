import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

/* =========================
   BACKEND SOCKET URL — FINAL VERSION
   Works perfectly in local development AND production
   - Local (localhost): connects directly to backend on port 5000
   - Production: connects to the same domain (Nginx proxies /socket.io/)
========================= */
const SOCKET_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : window.location.origin;

export default function LiveView() {
  const { id } = useParams();

  const [live, setLive] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("REST"); // REST | SOCKET

  const latestLiveRef = useRef(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid vehicle ID");
      setLoading(false);
      return;
    }

    let socket;
    let renderTimer;
    let fallbackTimer;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view live data");
      setLoading(false);
      return;
    }

    /* =========================
       INITIAL SNAPSHOT (REST)
    ========================= */
    const fetchLiveOnce = async () => {
      try {
        const res = await fetch(`/api/vehicles/${id}/live`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text || "Unknown error"}`);
        }

        const data = await res.json();
        latestLiveRef.current = data;
        setLive(data || {});
        setError(null);
        setMode("REST");
      } catch (err) {
        console.error("REST fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveOnce();

    /* =========================
       SOCKET.IO CONNECTION (ROBUST)
    ========================= */
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("subscribe_vehicle", { vehicleId: id });
      setMode("SOCKET");

      // Clear fallback polling if socket connects
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    });

    socket.on("live_update", (data) => {
      latestLiveRef.current = data;
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
      setMode("REST");

      // Start fallback polling if not already running
      if (!fallbackTimer) {
        fallbackTimer = setInterval(fetchLiveOnce, 1000);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      setMode("REST");
    });

    /* =========================
       UI RENDER LOOP (1Hz update)
    ========================= */
    renderTimer = setInterval(() => {
      if (latestLiveRef.current) {
        setLive({ ...latestLiveRef.current });
      }
    }, 1000);

    /* =========================
       CLEANUP
    ========================= */
    return () => {
      socket?.disconnect();
      clearInterval(renderTimer);
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [id]);

  /* ========================= UI HELPERS ========================= */
  const Val = ({ v, unit = "", fixed = 2 }) => (
    <span className="text-orange-300 font-semibold">
      {v == null ? "–" : `${Number(v).toFixed(fixed)}${unit}`}
    </span>
  );

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

  /* ========================= EARLY RETURNS ========================= */
  if (loading && !Object.keys(live).length) {
    return (
      <div className="text-center py-12 text-orange-200">
        Loading live data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        Error: {error}
      </div>
    );
  }

  /* ========================= MAIN RENDER ========================= */
  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-semibold text-orange-300 mb-4 text-center">
        Live Vehicle Data
      </h2>

      <div className="text-center mb-6">
        <span
          className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
            mode === "SOCKET"
              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
              : "bg-yellow-600/30 text-yellow-300 border border-yellow-500/50"
          }`}
        >
          {mode === "SOCKET" ? "● LIVE (WebSocket)" : "◷ Fallback (REST Polling)"}
        </span>
      </div>

      {/* === GRID LAYOUT === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Battery / BTMS / Charger */}
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

        {/* Motor & MCU */}
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

        {/* Peripherals */}
        <Section title="Peripherals Live Data">
          <Item name="Radiator Temperature" value={<Val v={live.radiator_temp_c} unit="°C" fixed={1} />} />
          <Item name="Hydraulic Oil Temperature" value="–" />
          <Item name="Hydraulic Pump RPM" value="–" />
        </Section>

        {/* ODO / Trip */}
        <Section title="ODO / Trip Details">
          <Item name="Total Running Hours" value={<Val v={live.total_hours} fixed={2} unit=" h" />} />
          <Item name="Last Trip Hours" value={<Val v={live.last_trip_hrs} fixed={2} unit=" h" />} />
          <Item name="Total kWh Consumed" value={<Val v={live.total_kwh} fixed={1} unit=" kWh" />} />
          <Item name="kWh Used in Last Trip" value={<Val v={live.last_trip_kwh} fixed={1} unit=" kWh" />} />
        </Section>

        {/* DC-DC Converter */}
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

        {/* Alarms & Warnings */}
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
            <div className="text-gray-500 text-center py-4">
              No alarm data available
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}