import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

/* ========================= LIVE VIEW (HYBRID) ========================= */
export default function LiveView() {
  const { id } = useParams();

  const [live, setLive] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("REST"); // REST | SOCKET

  // Holds fast-updating data (0.5s)
  const latestLiveRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    let socket;
    let renderTimer;
    let fallbackTimer;

    const token = localStorage.getItem("token");

    /* =========================
       INITIAL SNAPSHOT (REST)
    ========================= */
    const fetchLiveOnce = async () => {
      try {
        if (!token) throw new Error("Please log in");

        const res = await fetch(`/api/vehicles/${id}/live`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        const data = await res.json();
        latestLiveRef.current = data;
        setLive(data || {});
        setError(null);
        setMode("REST");
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveOnce();

    /* =========================
       SOCKET CONNECTION
    ========================= */
    socket = io("/", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("subscribe_vehicle", { vehicleId: id });
      setMode("SOCKET");

      // Stop REST fallback if socket is healthy
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    });

    socket.on("live_update", (data) => {
      latestLiveRef.current = data; // fast updates (0.5s)
    });

    socket.on("disconnect", () => {
      setMode("REST");

      // REST fallback every 1s
      if (!fallbackTimer) {
        fallbackTimer = setInterval(fetchLiveOnce, 1000);
      }
    });

    /* =========================
       UI RENDER LOOP (1s)
    ========================= */
    renderTimer = setInterval(() => {
      if (latestLiveRef.current) {
        setLive(latestLiveRef.current);
      }
    }, 1000);

    return () => {
      socket?.disconnect();
      clearInterval(renderTimer);
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [id]);

  /* ========================= UI HELPERS ========================= */
  const Val = ({ v, unit = "", fixed = 2 }) => (
    <span className="text-orange-300 font-semibold">
      {v === null || v === undefined ? "–" : `${Number(v).toFixed(fixed)}${unit}`}
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

  /* ========================= STATE ========================= */
  if (loading && Object.keys(live).length === 0)
    return (
      <div className="text-center py-12 text-orange-200">
        Loading live data…
      </div>
    );

  if (error)
    return (
      <div className="text-center py-12 text-red-400">
        Error: {error}
      </div>
    );

  /* ========================= DERIVED VALUES ========================= */
  const outputPowerKw =
    live.dc_current_a != null && live.stack_voltage_v != null
      ? (live.dc_current_a * live.stack_voltage_v) / 1000
      : null;

  const dcdcInputPowerKw =
    live.dcdc_input_voltage_v != null && live.dcdc_input_current_a != null
      ? (live.dcdc_input_voltage_v * live.dcdc_input_current_a) / 1000
      : null;

  /* ========================= RENDER ========================= */
  return (
    <div>
      <h2 className="text-xl font-semibold text-orange-300 mb-2 text-center">
        Live Data
      </h2>

      <div className="text-center text-xs mb-4">
        <span
          className={`px-3 py-1 rounded-full font-semibold ${
            mode === "SOCKET"
              ? "bg-emerald-600/20 text-emerald-300"
              : "bg-yellow-600/20 text-yellow-300"
          }`}
        >
          {mode === "SOCKET" ? "LIVE (WebSocket)" : "Fallback (REST)"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* === BATTERY / CHARGER === */}
        <Section title="Battery / BTMS / Charger Live Data">
          <Item name="State of Charge %" value={<Val v={live.soc_percent} fixed={1} />} />
          <Item name="Battery Status" value={live.battery_status ?? "–"} />

          {[0, 1, 2, 3, 4].map((i) => (
            <Item
              key={`temp-${i}`}
              name={`Temperature Sensors (Module ${i + 1})`}
              value={<Val v={live.temp_sensors?.[i]} unit="°C" />}
            />
          ))}

          {[0, 1, 2, 3, 4].map((i) => (
            <Item
              key={`volt-${i}`}
              name={`Cell Voltages (Module ${i + 1})`}
              value={<Val v={live.cell_voltages?.[i]} unit=" V" fixed={3} />}
            />
          ))}

          <Item name="Output Current (DC)" value={<Val v={live.dc_current_a} unit=" A" />} />
          <Item name="Stack Voltage" value={<Val v={live.stack_voltage_v} unit=" V" />} />
          <Item name="Output Power" value={<Val v={outputPowerKw} unit=" kW" />} />
          <Item name="Charging Current" value={<Val v={live.charging_current_a} unit=" A" />} />
        </Section>

        {/* === MOTOR & MCU === */}
        <Section title="Motor & MCU Live Data">
          <Item name="Motor Torque" value={<Val v={live.motor_torque_nm} unit=" Nm" />} />
          <Item name="Operation Mode" value={live.motor_operation_mode ?? "–"} />
          <Item name="Motor Speed (RPM)" value={<Val v={live.motor_speed_rpm} fixed={0} />} />
          <Item name="Motor AC Side Current" value={<Val v={live.ac_current_a} unit=" A" />} />
          <Item name="Motor Torque Limit" value={<Val v={live.motor_torque_limit} unit=" Nm" />} />
          <Item name="Motor Rotation Direction" value={live.motor_rotation_dir ?? "–"} />
          <Item name="Motor Temperature" value={<Val v={live.motor_temp_c} unit="°C" />} />
          <Item name="Motor AC Side Voltage" value={<Val v={live.motor_ac_voltage_v} unit=" V" />} />
          <Item name="MCU Enable State" value={live.mcu_enable_state ?? "–"} />
          <Item name="MCU Temperature" value={<Val v={live.mcu_temp_c} unit="°C" />} />
        </Section>

        {/* === DC-DC CONVERTER === */}
        <Section title="DC-DC Converter">
          <Item name="DC-DC Input Voltage" value={<Val v={live.dcdc_input_voltage_v} unit=" V" />} />
          <Item name="DC-DC Input Current" value={<Val v={live.dcdc_input_current_a} unit=" A" />} />
          <Item name="DC-DC Input Power" value={<Val v={dcdcInputPowerKw} unit=" kW" />} />
          <Item name="DC-DC Output Voltage" value={<Val v={live.dcdc_output_voltage_v} unit=" V" />} />
          <Item name="DC-DC Output Current" value={<Val v={live.dcdc_output_current_a} unit=" A" />} />
          <Item name="Pri A MOSFET Temp" value={<Val v={live.dcdc_pri_a_mosfet_temp_c} unit="°C" />} />
          <Item name="Pri C MOSFET Temp" value={<Val v={live.dcdc_pri_c_mosfet_temp_c} unit="°C" />} />
          <Item name="Sec LS MOSFET Temp" value={<Val v={live.dcdc_sec_ls_mosfet_temp_c} unit="°C" />} />
          <Item name="Sec HS MOSFET Temp" value={<Val v={live.dcdc_sec_hs_mosfet_temp_c} unit="°C" />} />
          <Item
            name="DC-DC Overcurrent Fault Count"
            value={live.dcdc_occurence_count ?? "–"}
          />
        </Section>

        {/* === ALARMS === */}
        <Section title="Alarms & Warnings">
          {Object.entries(live)
            .filter(([k]) => k.startsWith("alarms_"))
            .map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-center bg-gray-800/40 px-3 py-2 rounded-md text-sm border border-orange-500/20"
              >
                <span className="text-gray-300">
                  {k.replace("alarms_", "").replace(/_/g, " ")}
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    v
                      ? "bg-red-600/20 text-red-300"
                      : "bg-emerald-600/20 text-emerald-300"
                  }`}
                >
                  {v ? "YES" : "NO"}
                </span>
              </div>
            ))}
        </Section>
      </div>
    </div>
  );
}
