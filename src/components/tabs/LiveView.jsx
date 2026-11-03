import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { isDemoMode, makeLiveSnapshot } from "../../demo/demoData";

const LIVE_THRESHOLD_MS = 15000;

// ─── Color helpers (matching mobile app exactly) ─────────────────────────────
const tempColor = (t) => {
  if (t == null || !Number.isFinite(t)) return "#94a3b8";
  if (t <= 45) return "#22c55e";
  if (t <= 55) return "#facc15";
  return "#ef4444";
};

const cellBoxColor = (v, avg) => {
  if (v == null || avg == null) return "#94a3b8";
  const delta = v - avg;
  if (delta >  0.10) return "#ef4444";
  if (delta >  0.05) return "#f59e0b";
  if (delta < -0.10) return "#3b82f6";
  if (delta < -0.05) return "#22c55e";
  return "#94a3b8";
};

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmt1 = (n) => (n == null || !Number.isFinite(n) ? "–" : n.toFixed(1));
const fmt2 = (n) => (n == null || !Number.isFinite(n) ? "–" : n.toFixed(2));
const fmt3 = (n) => (n == null || !Number.isFinite(n) ? "–" : n.toFixed(3));

// ─── BTMS Mode label helper ───────────────────────────────────────────────────
const btmsModeLabel = (v) =>
  ({
    0: "Shutdown Mode",
    1: "Cooling Mode",
    2: "Heating Mode",
    3: "Self Circulating Mode",
  }[v] ?? "–");

export default function LiveView() {
  const { id } = useParams();
  const [live, setLive] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Modals
  const [showTempModal,          setShowTempModal]          = useState(false);
  const [showVoltageModal,       setShowVoltageModal]       = useState(false);

  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!id) { setError("Invalid vehicle ID"); setLoading(false); return; }

    const fetchSnapshot = async () => {
      try {
        const { data } = await axios.get(`/api/vehicles/${id}/live`);
        setLive(data);
        if (data.recorded_at) setLastUpdateTime(new Date(data.recorded_at));
        setError(null);
      } catch (err) {
        console.error("Snapshot error:", err);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();

    // Demo mode: simulate SSE with an interval instead of opening a real EventSource
    if (isDemoMode()) {
      let tick = 1;
      const intervalId = setInterval(() => {
        const data = makeLiveSnapshot(id, tick++);
        setLive(data);
        if (data.recorded_at) setLastUpdateTime(new Date(data.recorded_at));
        setError(null);
      }, 3000);
      return () => clearInterval(intervalId);
    }

    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource(`/api/vehicles/${id}/stream`, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLive(data);
        if (data.recorded_at) setLastUpdateTime(new Date(data.recorded_at));
        setError(null);
      } catch (e) { console.error("Parse error:", e); }
    };

    es.onerror = () => {
      console.warn("SSE disconnected – refreshing auth then reconnecting");
      setError("Live stream lost – showing last known data");
      // Proactively refresh the access_token so the SSE auto-reconnect succeeds
      axios.get("/api/auth/me").catch(() => {});
    };

    es.onopen = () => { console.log("SSE connected"); setError(null); };

    return () => {
      if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
    };
  }, [id]);

  const isActivelyLive = lastUpdateTime
    ? Date.now() - lastUpdateTime.getTime() < LIVE_THRESHOLD_MS
    : false;

  const formatTimestamp = (date) =>
    date
      ? date.toLocaleString(undefined, {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        })
      : "–";

  // ─── Reusable sub-components ──────────────────────────────────────────────
  const HoursToHrMin = ({ hours }) => {
    if (hours == null || hours === 0)
      return <span className="text-brand-300 font-semibold">0 hr 0 mins</span>;
    const totalMinutes = Math.round(hours * 60);
    const hrs  = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return <span className="text-brand-300 font-semibold">{mins} mins</span>;
    return <span className="text-brand-300 font-semibold">{hrs} hr{mins > 0 ? ` ${mins} mins` : ""}</span>;
  };

  const Val = ({ v, unit = "", fixed = 2 }) => (
    <span className="text-brand-300 font-semibold">
      {v == null ? "–" : `${Number(v).toFixed(fixed)}${unit}`}
    </span>
  );

  const Section = ({ title, children }) => (
    <div className="bg-gray-900/60 rounded-lg p-5 border border-brand-500/30">
      <h3 className="text-lg font-medium text-brand-400 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const Item = ({ name, value }) => (
    <div className="flex justify-between items-center bg-gray-800/30 px-4 py-2 rounded-md">
      <span className="text-gray-300">{name}</span>
      <span className="text-brand-300 font-medium">{value ?? "–"}</span>
    </div>
  );

  const Divider = ({ label }) => (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <div className="flex-1 h-px bg-brand-500/20" />
      {label && <span className="text-[11px] text-brand-500/60 uppercase tracking-widest">{label}</span>}
      <div className="flex-1 h-px bg-brand-500/20" />
    </div>
  );

  // ─── EVCC1 helpers ────────────────────────────────────────────────────────
  const cpStatLabel     = (v) => ({ 0:"A – Standby", 1:"B – Connected", 2:"C – Charging", 3:"D – Charging (vent)", 4:"E – No power", 5:"F – Error" }[v] ?? (v != null ? `State ${v}` : "–"));
  const flagLabel       = (v) => (v === 1 ? "Yes" : v === 0 ? "No" : "–");
  const numLabel        = (v) => (v != null ? String(v) : "–");
  const isolLabel       = (v) => ({ 0:"Invalid", 1:"Valid", 2:"Warning", 3:"Fault" }[v] ?? numLabel(v));
  const transferLabel   = (v) => ({ 0:"–", 1:"AC", 2:"DC" }[v] ?? numLabel(v));
  const lockLabel       = (v) => (v === 1 ? "Locked" : v === 0 ? "Unlocked" : "–");
  const pwrDeliveryLabel = (v) => ({ 0:"Idle", 1:"Starting", 2:"Active", 3:"Stopping" }[v] ?? numLabel(v));

  // ─── Derived data shortcuts ───────────────────────────────────────────────
  const tempPackStats        = live.temp_pack_stats        ?? {};
  const voltagePackStats     = live.cell_pack_stats        ?? {};

  if (loading && !Object.keys(live).length)
    return <div className="text-center py-12 text-brand-200">Loading live data…</div>;

  if (error && !Object.keys(live).length)
    return <div className="text-center py-12 text-red-400">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-brand-400 via-brand-500 to-amber-500 bg-clip-text text-transparent mb-3">
          Live Vehicle Data
        </h1>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
            isActivelyLive
              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/80"
              : "bg-gray-700/40 text-gray-400 border border-gray-600/60"
          }`}>
            <span className={isActivelyLive ? "animate-pulse" : ""}>●</span>
            {isActivelyLive ? "LIVE" : "Last Known"}
          </span>
          <div className="text-right">
            <div className="text-xs text-gray-500">Updated</div>
            <div className="text-sm text-brand-300 font-medium">{formatTimestamp(lastUpdateTime)}</div>
          </div>
        </div>
        {error && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 mt-3">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Battery / BMS / Charger ───────────────────────────────────────── */}
        <Section title="Battery / BMS / Charger">
          <Item name="State of Charge" value={<Val v={live.soc_percent} unit="%" fixed={1} />} />
          <Item name="Battery Status"  value={live.battery_status ?? "–"} />
          <Item name="Stack Voltage"   value={<Val v={live.stack_voltage_v} unit="V" />} />
          <Item name="DC Output Current" value={<Val v={live.dc_current_a} unit="A" />} />
          <Item name="Battery Power"   value={<Val v={live.output_power_kw} unit="kW" />} />
          <Item name="Charging Current" value={<Val v={live.charging_current_a} unit="A" />} />

          <Item
            name="Temperature Sensors"
            value={
              <button onClick={() => setShowTempModal(true)}
                className="text-brand-400 font-semibold underline hover:text-brand-300 transition">
                View All → Modules
              </button>
            }
          />
          <Item
            name="Cell Voltages"
            value={
              <button onClick={() => setShowVoltageModal(true)}
                className="text-emerald-400 font-semibold underline hover:text-emerald-300 transition">
                View All → Modules
              </button>
            }
          />

          {/* BMS-reported pack voltage stats */}
          <Divider label="Pack Voltage (BMS)" />
          <Item name="Max Cell Voltage" value={<Val v={live.max_voltage_v} unit="V" fixed={3} />} />
          <Item name="Min Cell Voltage" value={<Val v={live.min_voltage_v} unit="V" fixed={3} />} />
          <Item name="Avg Cell Voltage" value={<Val v={live.avg_voltage_v} unit="V" fixed={3} />} />

          {/* BMS-reported pack temperature stats */}
          <Divider label="Pack Temperature (BMS)" />
          <Item name="Max Temperature" value={<Val v={live.max_temp_c} unit="°C" fixed={1} />} />
          <Item name="Min Temperature" value={<Val v={live.min_temp_c} unit="°C" fixed={1} />} />
          <Item name="Avg Temperature" value={<Val v={live.avg_temp_c} unit="°C" fixed={1} />} />
        </Section>

        {/* ── Motor & MCU ──────────────────────────────────────────────────── */}
        <Section title="Motor & MCU">
          <Item name="Torque"            value={<Val v={live.motor_torque_nm}      unit="Nm" />} />
          <Item name="Operation Mode"    value={live.motor_operation_mode ?? "–"} />
          <Item name="Speed"             value={<Val v={live.motor_speed_rpm}      fixed={0} unit=" RPM" />} />
          <Item name="AC Current"        value={<Val v={live.ac_current_a}         unit="A" />} />
          <Item name="Torque Limit"      value={<Val v={live.motor_torque_limit}   unit="Nm" />} />
          <Item name="Rotation Direction" value={live.motor_rotation_dir ?? "–"} />
          <Item name="Motor Temperature" value={<Val v={live.motor_temp_c}        unit="°C" />} />
          <Item name="AC Voltage"        value={<Val v={live.motor_ac_voltage_v}  unit="V" />} />
          <Item name="MCU Enable State"  value={live.mcu_enable_state ?? "–"} />
          <Item name="MCU Temperature"   value={<Val v={live.mcu_temp_c}          unit="°C" />} />
          <Item name="DC Side Voltage"   value={<Val v={live.dc_side_voltage_v}   unit="V" />} />
          <Item name="Status Word"       value={live.motor_status_word ?? "–"} />
          <Item name="Frequency Raw"     value={live.motor_freq_raw ?? "–"} />
          <Item name="Total Wattage"     value={<Val v={live.motor_total_wattage_w} unit="W" fixed={0} />} />
        </Section>

        {/* ── Peripherals ──────────────────────────────────────────────────── */}
        <Section title="Peripherals Live Data">
          <Item name="Radiator Temperature"     value={<Val v={live.radiator_temp_c}      unit="°C" fixed={1} />} />
          <Item name="Hydraulic Oil Temperature" value={<Val v={live.hydraulic_oil_temp_c} unit="°C" fixed={1} />} />
          <Item name="Hydraulic Pump RPM"        value="–" />
        </Section>

        {/* ── ODO / Trip ───────────────────────────────────────────────────── */}
        <Section title="ODO / Trip Details">
          <Item name="Total Running Hours"  value={<HoursToHrMin hours={live.total_hours} />} />
          <Item name="Last Trip Hours"      value={<HoursToHrMin hours={live.last_trip_hrs} />} />
          <Item name="Total kWh Consumed"   value={<Val v={live.total_kwh}     fixed={1} unit=" kWh" />} />
          <Item name="kWh Used in Last Trip" value={<Val v={live.last_trip_kwh} fixed={1} unit=" kWh" />} />
        </Section>

        {/* ── DC-DC Converter ──────────────────────────────────────────────── */}
        <Section title="DC-DC Converter">
          <Item name="Input Voltage"  value={<Val v={live.dcdc_input_voltage_v}  unit="V" />} />
          <Item name="Input Current"  value={<Val v={live.dcdc_input_current_a}  unit="A" />} />
          <Item name="Input Power"
            value={
              live.dcdc_input_voltage_v != null && live.dcdc_input_current_a != null
                ? <Val v={(live.dcdc_input_voltage_v * live.dcdc_input_current_a) / 1000} unit="kW" />
                : "–"
            }
          />
          <Item name="Output Voltage" value={<Val v={live.dcdc_output_voltage_v} unit="V" />} />
          <Item name="Output Current" value={<Val v={live.dcdc_output_current_a} unit="A" />} />
          <Item name="Max Temperature"       value={<Val v={live.dcdc_max_temp_c}           unit="°C" />} />
          <Item name="Pri A MOSFET Temp"     value={<Val v={live.dcdc_pri_a_mosfet_temp_c}  unit="°C" />} />
          <Item name="Pri C MOSFET Temp"     value={<Val v={live.dcdc_pri_c_mosfet_temp_c}  unit="°C" />} />
          <Item name="Sec LS MOSFET Temp"    value={<Val v={live.dcdc_sec_ls_mosfet_temp_c} unit="°C" />} />
          <Item name="Sec HS MOSFET Temp"    value={<Val v={live.dcdc_sec_hs_mosfet_temp_c} unit="°C" />} />
          <Item name="Overcurrent Fault Count" value={live.dcdc_occurrence_count ?? "–"} />
        </Section>

        {/* ── BTMS ─────────────────────────────────────────────────────────── */}
        <Section title="BTMS (Thermal Management)">
          <Item name="Command Mode"  value={btmsModeLabel(live.btms_command_mode)} />
          <Item name="Status Mode"   value={btmsModeLabel(live.btms_status_mode)} />
          <Item name="HV Request"    value={live.btms_hv_request   === 0 ? "ON"  : live.btms_hv_request === 1 ? "OFF" : "–"} />
          <Item name="Charge Status" value={live.btms_charge_status === 0 ? "Discharge" : live.btms_charge_status === 1 ? "Charge" : "–"} />
          <Item name="HV Relay State (BMS)"  value={live.bms_hv_relay_state  === 1 ? "CLOSED" : live.bms_hv_relay_state  === 0 ? "OPEN" : "–"} />
          <Item name="HV Relay State (BTMS)" value={live.btms_hv_relay_state === 1 ? "CLOSED" : live.btms_hv_relay_state === 0 ? "OPEN" : "–"} />
          <Item name="Set Temp"     value={<Val v={live.btms_target_temp_c} unit="°C" />} />
          <Item name="Inlet Temp"   value={<Val v={live.btms_inlet_temp_c}  unit="°C" />} />
          <Item name="Outlet Temp"  value={<Val v={live.btms_outlet_temp_c} unit="°C" />} />
          <Item name="Demand Power" value={<Val v={live.btms_demand_power_kw} unit="kW" fixed={1} />} />
          <Item name="Pack Voltage (BMS)" value={<Val v={live.bms_pack_voltage_v} unit="V" />} />
          <Item name="BMS Life Counter"   value={live.bms_life_counter ?? "–"} />
        </Section>

        {/* ── Air Compressor — full-width row so the 2-column card pairing is unchanged ── */}
        <div className="md:col-span-2">
          <Section title="Air Compressor">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <Item name="Input Voltage"  value={<Val v={live.compressor_input_voltage_v}  unit="V" />} />
              <Item name="Input Current"  value={<Val v={live.compressor_input_current_a}  unit="A" />} />
              <Item name="Input Power"
                value={
                  live.compressor_input_voltage_v != null && live.compressor_input_current_a != null
                    ? <Val v={(live.compressor_input_voltage_v * live.compressor_input_current_a) / 1000} unit="kW" />
                    : "–"
                }
              />
              <Item name="Output Voltage" value={<Val v={live.compressor_output_voltage_v} unit="V" />} />
              <Item name="Output Current" value={<Val v={live.compressor_output_current_a} unit="A" />} />
              <Item name="Output Power"
                value={
                  live.compressor_output_voltage_v != null && live.compressor_output_current_a != null
                    ? <Val v={(live.compressor_output_voltage_v * live.compressor_output_current_a) / 1000} unit="kW" />
                    : "–"
                }
              />
            </div>
          </Section>
        </div>

        {/* ── EVCC1 ────────────────────────────────────────────────────────── */}
        <div className="md:col-span-2">
          <Section title="EVCC1 — EV Charging Controller">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="space-y-3">
                <Divider label="Status & State" />
                <Item name="Power Status"      value={numLabel(live.evcc1_pwr_stat)} />
                <Item name="Socket Status"     value={numLabel(live.evcc1_socket_stat)} />
                <Item name="EVSE Status"       value={numLabel(live.evcc1_evse_stat)} />
                <Item name="CP State"          value={cpStatLabel(live.evcc1_cp_stat)} />
                <Item name="S2 Switch"         value={flagLabel(live.evcc1_s2_on_stat)} />
                <Item name="PD Status"         value={numLabel(live.evcc1_pd_stat)} />
                <Item name="Step Number"       value={numLabel(live.evcc1_step_num)} />
                <Item name="DC/AC Charge Mode" value={numLabel(live.evcc1_dcac_chg_mode)} />
                <Divider label="Charging Flags" />
                <Item name="Charge Finished (EVCC)"  value={flagLabel(live.evcc1_chg_finished)} />
                <Item name="Charge Finished (EVSE)"  value={flagLabel(live.evcc1_evse_chg_finished)} />
                <Item name="Charge Finished (Joint)" value={flagLabel(live.evcc1_evse_evcc_chg_finished)} />
                <Item name="EVSE Processing"         value={flagLabel(live.evcc1_evse_processing)} />
                <Item name="Power Delivery"          value={pwrDeliveryLabel(live.evcc1_evse_pwr_delivery)} />
              </div>

              <div className="space-y-3">
                <Divider label="EVSE Limits" />
                <Item name="Max Voltage" value={<Val v={live.evcc1_evse_max_volt_v} unit="V" fixed={1} />} />
                <Item name="Min Voltage" value={<Val v={live.evcc1_evse_min_volt_v} unit="V" fixed={1} />} />
                <Item name="Max Current" value={<Val v={live.evcc1_evse_max_curr_a} unit="A" fixed={1} />} />
                <Item name="Min Current" value={<Val v={live.evcc1_evse_min_curr_a} unit="A" fixed={1} />} />
                <Item name="Max Power"   value={<Val v={live.evcc1_evse_max_pwr_w != null ? live.evcc1_evse_max_pwr_w / 1000 : null} unit="kW" fixed={2} />} />
                <Item name="Max Delay"   value={<Val v={live.evcc1_evse_max_delay_s} unit="s" fixed={0} />} />
                <Divider label="EVSE Output" />
                <Item name="Output Voltage" value={<Val v={live.evcc1_evse_out_volt_v} unit="V" fixed={1} />} />
                <Item name="Output Current" value={<Val v={live.evcc1_evse_out_curr_a} unit="A" fixed={1} />} />
                <Item name="Output Power"
                  value={
                    live.evcc1_evse_out_volt_v != null && live.evcc1_evse_out_curr_a != null
                      ? <Val v={(live.evcc1_evse_out_volt_v * live.evcc1_evse_out_curr_a) / 1000} unit="kW" />
                      : "–"
                  }
                />
                <Item name="AC Max Current" value={<Val v={live.evcc1_ac_max_current_value_a} unit="A" fixed={1} />} />
                <Item name="Duty Value"     value={<Val v={live.evcc1_duty_value} unit="%" fixed={1} />} />
                <Item name="AAG Value"      value={<Val v={live.evcc1_aag_value} fixed={1} />} />
              </div>

              <div className="space-y-3">
                <Divider label="Isolation" />
                <Item name="Isolation Status"  value={isolLabel(live.evcc1_evse_isol_stat)} />
                <Item name="Transfer Type"     value={transferLabel(live.evcc1_evse_transfer_type)} />
                <Item name="EVSE Notification" value={numLabel(live.evcc1_evse_notification)} />
                <Divider label="Lock" />
                <Item name="Lock Command" value={lockLabel(live.evcc1_lock_stat)} />
                <Item name="Lock Status"  value={lockLabel(live.evcc1_lock_status)} />
                <Item name="Lock Alarm"
                  value={
                    <span className={live.evcc1_lock_alarm === 1 ? "text-red-400 font-semibold" : ""}>
                      {live.evcc1_lock_alarm === 1 ? "ACTIVE" : live.evcc1_lock_alarm === 0 ? "OK" : "–"}
                    </span>
                  }
                />
                <Divider label="Errors" />
                <Item name="Error Code"
                  value={
                    live.evcc1_error_code != null
                      ? <span className={live.evcc1_error_code !== 0 ? "text-red-400 font-semibold" : "text-emerald-400"}>
                          {live.evcc1_error_code !== 0 ? `0x${live.evcc1_error_code.toString(16).toUpperCase().padStart(4, "0")}` : "None"}
                        </span>
                      : "–"
                  }
                />
              </div>
            </div>
          </Section>
        </div>

        {/* ── Alarms ───────────────────────────────────────────────────────── */}
        <div className="md:col-span-2">
          <Section title="Alarms & Warnings">
            {Object.entries(live)
              .filter(([key]) => key.startsWith("alarms_"))
              .sort(([a, aVal], [b, bVal]) => (!!bVal - !!aVal) || a.localeCompare(b))
              .map(([key, value]) => (
                <div key={key} className="flex justify-between items-center bg-gray-800/40 px-3 py-2 rounded-md text-sm border border-brand-500/20">
                  <span className="text-gray-300 capitalize">{key.replace("alarms_", "").replace(/_/g, " ")}</span>
                  <span className={`px-3 py-1 rounded-md text-xs font-semibold ${value ? "bg-red-600/20 text-red-300" : "bg-emerald-600/20 text-emerald-300"}`}>
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

      {/* =============== TEMPERATURE SENSORS MODAL =============== */}
      {showTempModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTempModal(false)}>
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-brand-950/30 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-brand-500/40 shadow-2xl shadow-brand-500/20" onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 py-5 bg-gradient-to-r from-brand-900/40 via-gray-800/70 to-amber-900/40 border-b border-brand-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-300 via-brand-400 to-amber-400 bg-clip-text text-transparent">Temperature Sensors</h2>
                  <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
                    {(live.temp_modules?.length ?? 0)} Modules
                  </p>
                </div>
                <button onClick={() => setShowTempModal(false)} className="text-gray-400 hover:text-white hover:rotate-90 transition-all duration-300 text-3xl leading-none">✕</button>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-b from-gray-800/60 to-gray-800/30 border-b border-brand-500/20">
              <div className="flex flex-wrap gap-3 justify-center mb-3">
                {[["Max", tempPackStats.max_c], ["Avg", tempPackStats.avg_c], ["Min", tempPackStats.min_c]].map(([label, val]) => (
                  <div key={label} className="px-4 py-2 rounded-lg border-2 bg-gray-800/80" style={{ borderColor: tempColor(val) }}>
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className="text-lg font-bold" style={{ color: tempColor(val) }}>{fmt1(val)}°C</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[58vh] p-4">
              {(live.temp_modules ?? []).map((moduleValues, i) => {
                const ms = live.temp_module_stats?.[i] ?? {};
                const border = ms.status === "CRITICAL" ? "border-red-500" : ms.status === "WARN" ? "border-yellow-500/70" : "border-green-500/60";
                return (
                  <div key={i} className={`mb-5 bg-gray-800/40 rounded-lg p-4 border-2 ${border}`}>
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                      <h3 className="text-base font-bold text-brand-300">Module {i + 1}</h3>
                      <div className="flex gap-2 text-xs flex-wrap">
                        <span className="px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/30">Min: {fmt1(ms.min_c)}°C</span>
                        <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30">Max: {fmt1(ms.max_c)}°C</span>
                        {ms.status && (
                          <span className={`px-3 py-1 rounded text-xs font-medium ${ms.status === "CRITICAL" ? "bg-red-600/30 text-red-300 border border-red-500/40" : ms.status === "WARN" ? "bg-yellow-600/30 text-yellow-300 border border-yellow-500/40" : "bg-green-600/30 text-green-300 border border-green-500/40"}`}>
                            {ms.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                      {moduleValues.map((t, j) => (
                        <div key={j} className="bg-gray-900/60 border-2 rounded-md px-1.5 py-1.5 text-center hover:scale-105 transition-all" style={{ borderColor: tempColor(t) }}>
                          <div className="text-[9px] text-gray-500">#{j + 1}</div>
                          <div className="text-xs font-bold" style={{ color: tempColor(t) }}>{fmt1(t)}</div>
                          <div className="text-[8px] text-gray-500">°C</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(live.temp_modules ?? []).length === 0 && <div className="text-center text-gray-500 py-12">No temperature module data available</div>}
            </div>
          </div>
        </div>
      )}

      {/* =============== CELL VOLTAGES MODAL =============== */}
      {showVoltageModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowVoltageModal(false)}>
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/30 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-emerald-500/40 shadow-2xl shadow-emerald-500/20" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-900/40 via-gray-800/70 to-teal-900/40 border-b border-emerald-500/30 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent">Cell Voltages</h2>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  {(live.cell_modules?.length ?? 0)} Modules
                </p>
              </div>
              <button onClick={() => setShowVoltageModal(false)} className="text-gray-400 hover:text-white hover:rotate-90 transition-all duration-300 text-3xl leading-none">✕</button>
            </div>
            <div className="p-4 bg-gradient-to-b from-gray-800/60 to-gray-800/30 border-b border-emerald-500/20">
              <div className="flex flex-wrap gap-3 justify-center mb-3">
                <div className="px-4 py-2 rounded-lg border-2 border-red-500 bg-gray-800/80"><div className="text-xs text-gray-400">Max</div><div className="text-lg font-bold text-red-400">{fmt3(voltagePackStats.max_v)}V</div></div>
                <div className="px-4 py-2 rounded-lg border-2 border-yellow-400 bg-gray-800/80"><div className="text-xs text-gray-400">Avg</div><div className="text-lg font-bold text-yellow-400">{fmt3(voltagePackStats.avg_v)}V</div></div>
                <div className="px-4 py-2 rounded-lg border-2 border-green-500 bg-gray-800/80"><div className="text-xs text-gray-400">Min</div><div className="text-lg font-bold text-green-400">{fmt3(voltagePackStats.min_v)}V</div></div>
                <div className="px-4 py-2 rounded-lg border-2 border-red-500 bg-gray-800/80"><div className="text-xs text-gray-400">Outliers</div><div className="text-lg font-bold text-red-400">±0.10V: {voltagePackStats.outliers ?? 0}</div></div>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[58vh] p-4">
              {(live.cell_modules ?? []).map((moduleValues, i) => {
                const ms = live.cell_module_stats?.[i] ?? {};
                return (
                  <div key={i} className="mb-5 bg-gray-800/40 rounded-lg p-4 border border-emerald-500/20">
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                      <h3 className="text-base font-bold text-emerald-300">Module {i + 1}</h3>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/30">Min: {fmt3(ms.min_v)}V</span>
                        <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30">Max: {fmt3(ms.max_v)}V</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                      {moduleValues.map((v, j) => (
                        <div key={j} className="bg-gray-900/60 border-2 rounded-md px-1.5 py-1.5 text-center hover:scale-105 transition-all" style={{ borderColor: "#94a3b8" }}>
                          <div className="text-[9px] text-gray-500">#{j + 1}</div>
                          <div className="text-xs font-bold" style={{ color: "#94a3b8" }}>{fmt3(v)}</div>
                          <div className="text-[8px] text-gray-500">V</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(live.cell_modules ?? []).length === 0 && <div className="text-center text-gray-500 py-12">No cell voltage module data available</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}