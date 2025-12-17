import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

/* ========================= LIVE VIEW ========================= */
export default function LiveView() {
  const { id } = useParams();
  const [live, setLive] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchLive = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please log in");

        const res = await fetch(`/api/vehicles/${id}/live`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        const data = await res.json();
        setLive(data || {});
        setError(null);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 500);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [id]);

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

  if (loading && Object.keys(live).length === 0)
    return <div className="text-center py-12 text-orange-200">Loading live data…</div>;

  if (error)
    return <div className="text-center py-12 text-red-400">Error: {error}</div>;

  const dcCurrent = live.dc_current_a;
  const stackVoltage = live.stack_voltage_v;
  const outputPowerKw =
    dcCurrent != null && stackVoltage != null
      ? (dcCurrent * stackVoltage) / 1000
      : null;

  const dcdcInputPowerKw =
    live.dcdc_input_voltage_v != null && live.dcdc_input_current_a != null
      ? (live.dcdc_input_voltage_v * live.dcdc_input_current_a) / 1000
      : null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-orange-300 mb-4 text-center">
        Live Data (Auto refresh every 500ms)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* === BATTERY / CHARGER === */}
        <Section title="Battery / BTMS / Charger Live Data">
          <Item name="State of Charge %" value={<Val v={live.soc_percent} fixed={1} />} />
          <Item name="State of Charge (kWh)" value={<Val v={live.battery_kwh} unit=" kWh" />} />
          <Item name="Battery Status" value={live.battery_status ?? "–"} />
          <Item name="BTMS Status" value={live.btms_status ?? "–"} />
          <Item name="Charger Status (gun connected/disconnected)" value={live.charger_connected ?? "–"} />

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
          <Item name="BTMS Temperature" value={<Val v={live.hyd_oil_temp_c} unit="°C" />} />
          <Item name="Charging Current" value={<Val v={live.charging_current_a} unit=" A" />} />
        </Section>

        {/* === MOTOR & MCU === */}
        <Section title="Motor & MCU Live Data">
          <Item name="Motor Torque" value={<Val v={live.motor_torque_nm} unit=" Nm" />} />
          <Item name="Operation Mode" value={live.motor_operation_mode ?? "–"} />
          <Item name="Motor Speed (RPM)" value={<Val v={live.motor_speed_rpm} fixed={0} />} />
          <Item name="Motor AC Side Current" value={<Val v={live.ac_current_a} unit=" A" />} />
          <Item name="Motor Torque Limit Value" value={<Val v={live.motor_torque_limit} unit=" Nm" />} />
          <Item name="Motor Rotation Direction" value={live.motor_rotation_dir ?? "–"} />
          <Item name="Motor Temperature" value={<Val v={live.motor_temp_c} unit="°C" />} />
          <Item name="Motor AC Side Voltage" value={<Val v={live.motor_ac_voltage_v} unit=" V" />} />
          <Item name="MCU Enable State" value={live.mcu_enable_state ?? "–"} />
          <Item name="MCU Temperature" value={<Val v={live.mcu_temp_c} unit="°C" />} />
        </Section>

        {/* === PERIPHERALS === */}
        <Section title="Peripherals Live Data">
          <Item name="Radiator Temperature" value={<Val v={live.radiator_temp_c} unit="°C" />} />
          <Item name="Hydraulic Oil Temperature" value={<Val v={live.hyd_oil_temp_c} unit="°C" />} />
          <Item name="Hydraulic Pump RPM" value={<Val v={live.hyd_pump_rpm} fixed={0} />} />
          <Item name="Hydraulic Pump Motor Temperature" value={<Val v={live.motor_temp_c} unit="°C" />} />
          <Item name="DC/DC Converter Output Current" value={<Val v={live.dc_dc_current_a} unit=" A" />} />
          <Item name="DC/DC Converter Status" value={live.dc_dc_status ?? "–"} />
        </Section>

        {/* === ODO / TRIP === */}
        <Section title="ODO / Trip Details">
          <Item name="Total Running Hours" value={<Val v={live.total_hours} fixed={1} unit=" h" />} />
          <Item name="Last Trip Hours" value={<Val v={live.last_trip_hrs} fixed={1} unit=" h" />} />
          <Item name="Total kWh Consumed" value={<Val v={live.total_kwh} unit=" kWh" />} />
          <Item name="kWh Used in Last Trip" value={<Val v={live.last_trip_kwh} unit=" kWh" />} />
        </Section>

        {/* === DC-DC CONVERTER === */}
        <Section title="DC-DC Converter">
          <Item name="DC-DC Input Voltage" value={<Val v={live.dcdc_input_voltage_v} unit=" V" />} />
          <Item name="DC-DC Input Current" value={<Val v={live.dcdc_input_current_a} unit=" A" />} />
          <Item name="DC-DC Input Power" value={<Val v={dcdcInputPowerKw} unit=" kW" />} />
          <Item name="DC-DC Output Voltage" value={<Val v={live.dcdc_output_voltage_v} unit=" V" />} />
          <Item name="DC-DC Output Current" value={<Val v={live.dcdc_output_current_a} unit=" A" />} />
          <Item name="Pri A MOSFET Temperature" value={<Val v={live.dcdc_pri_a_mosfet_temp_c} unit="°C" />} />
          <Item name="Pri C MOSFET Temperature" value={<Val v={live.dcdc_pri_c_mosfet_temp_c} unit="°C" />} />
          <Item name="Sec LS MOSFET Temperature" value={<Val v={live.dcdc_sec_ls_mosfet_temp_c} unit="°C" />} />
          <Item name="Sec HS MOSFET Temperature" value={<Val v={live.dcdc_sec_hs_mosfet_temp_c} unit="°C" />} />
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
                <span className="text-gray-300">{k.replace("alarms_", "").replace(/_/g, " ")}</span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    v ? "bg-red-600/20 text-red-300" : "bg-emerald-600/20 text-emerald-300"
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