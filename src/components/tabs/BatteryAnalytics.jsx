import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

/* ========================= BATTERY ANALYTICS ========================= */
export default function BatteryAnalytics() {
  const { id } = useParams();

  const [data,         setData]         = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const url = selectedDate
          ? `${API_BASE_URL}/api/battery/analytics/${id}?date=${selectedDate}`
          : `${API_BASE_URL}/api/battery/analytics/${id}?days=30`;

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to load battery analytics");

        setData((await res.json()) || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, selectedDate]);

  const odo = useMemo(() => {
    if (!data.length || selectedDate)
      return { energyUsed: null, maxCurrent: 0, maxTemp: 0, avgTemp: null };

    const energyUsed = data
      .map(d => Number(d.total_kwh_consumed || 0))
      .reduce((a, b) => a + b, 0);

    const validAvgTemps = data
      .map(d => Number(d.avg_cell_temp_c ?? 0))
      .filter(v => v > 0);
    const avgTemp = validAvgTemps.length
      ? validAvgTemps.reduce((a, b) => a + b, 0) / validAvgTemps.length
      : null;

    return {
      energyUsed: energyUsed || null,
      maxCurrent: Math.max(...data.map(d => Number(d.max_op_dc_current_a ?? 0))),
      maxTemp:    Math.max(...data.map(d => Number(d.max_cell_temp_c ?? 0))),
      avgTemp,
    };
  }, [data, selectedDate]);

  const latestTrip = useMemo(() => data.length ? data[0] : {}, [data]);
  const chartData  = useMemo(() => [...data].reverse(), [data]);

  if (loading)
    return <div className="text-center py-16 text-purple-400 font-mono">Loading battery analytics…</div>;
  if (error)
    return <div className="text-center py-16 text-pink-500 font-mono">Error: {error}</div>;

  const energyColor  = "#34d399";
  const currentColor = "#f97316";
  const voltColor    = "#38bdf8";

  return (
    <div className="space-y-8 pb-8 text-purple-100">
      <h2 className="text-2xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em] mb-3">
        Battery Analytics
      </h2>

      {/* Date filter */}
      <div className="flex justify-center items-center gap-4 flex-wrap">
        <label className="text-purple-300/70 text-xs font-bold uppercase tracking-widest">Date Query:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-black border border-purple-500/30 text-purple-100 rounded px-4 py-2 focus:border-pink-500 outline-none transition"
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate("")}
            className="text-pink-400 hover:text-pink-300 underline text-xs uppercase tracking-widest transition"
          >
            ← Back to 30-day view
          </button>
        )}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-purple-500/50 uppercase tracking-widest text-sm">
          No data for selected period.
        </div>
      )}

      {/* ── 30-day view ── */}
      {!selectedDate && data.length > 0 && (
        <>
          {/* ODO Summary + Latest Session */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="ODO Summary — Last 30 Days">
              <Stat label="Total Energy"   value={odo.energyUsed}  unit="kWh" />
              <Stat label="Peak DC Current" value={odo.maxCurrent}  unit="A" />
              <Stat label="Peak Cell Temp"  value={odo.maxTemp}     unit="°C" warn={45} danger={55} />
              <Stat label="Avg Cell Temp"   value={odo.avgTemp}     unit="°C" warn={42} danger={52} />
            </Section>

            <Section title="Latest Session">
              <Stat label="Energy Used"    value={latestTrip.total_kwh_consumed}  unit="kWh" />
              <Stat label="Max DC Current" value={latestTrip.max_op_dc_current_a} unit="A" />
              <Stat label="Max Cell Temp"  value={latestTrip.max_cell_temp_c}     unit="°C" warn={45} danger={55} />
              <Stat label="Avg Cell Temp"  value={latestTrip.avg_cell_temp_c}     unit="°C" warn={42} danger={52} />
            </Section>
          </div>

          {/* Trend charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Energy Consumption" unit="kWh" color={energyColor}>
              <TrendAreaChart data={chartData} dataKey="total_kwh_consumed"  unit="kWh" color={energyColor}  gradId="batt_energy" />
            </ChartCard>
            <ChartCard title="Peak DC Current" unit="A" color={currentColor}>
              <TrendAreaChart data={chartData} dataKey="max_op_dc_current_a" unit="A"   color={currentColor} gradId="batt_current" />
            </ChartCard>
            <ChartCard title="Cell Temperature" unit="°C" color="#fbbf24" warnVal={45} dangerVal={55}>
              <TrendAreaChart data={chartData} dataKey="max_cell_temp_c" unit="°C" color="#fbbf24" gradId="batt_temp" warnVal={45} dangerVal={55} />
            </ChartCard>
            <ChartCard title="Cell Voltage Range" unit="V" color={voltColor}>
              <VoltageRangeChart data={chartData} color={voltColor} />
            </ChartCard>
          </div>
        </>
      )}

      {/* ── Single-day view ── */}
      {selectedDate && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title={`Session: ${selectedDate}`}>
            <Stat label="Energy Used"      value={latestTrip.total_kwh_consumed}  unit="kWh" />
            <Stat label="Max DC Current"   value={latestTrip.max_op_dc_current_a} unit="A" />
            <Stat label="Max Cell Temp"    value={latestTrip.max_cell_temp_c}     unit="°C" warn={45} danger={55} />
            <Stat label="Avg Cell Temp"    value={latestTrip.avg_cell_temp_c}     unit="°C" warn={42} danger={52} />
            <Stat label="Min Cell Voltage" value={latestTrip.min_cell_voltage_v}  unit="V" />
            <Stat label="Max Cell Voltage" value={latestTrip.max_cell_voltage_v}  unit="V" />
          </Section>
          <ChartCard title="Session Metrics" unit={selectedDate} color="#a78bfa">
            <DayBarChart items={[
              { name: "Energy",   value: Number(latestTrip.total_kwh_consumed  ?? 0), unit: "kWh" },
              { name: "DC Curr",  value: Number(latestTrip.max_op_dc_current_a ?? 0), unit: "A"   },
              { name: "Max Temp", value: Number(latestTrip.max_cell_temp_c     ?? 0), unit: "°C"  },
              { name: "Avg Temp", value: Number(latestTrip.avg_cell_temp_c     ?? 0), unit: "°C"  },
            ]} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

/* ========================= UI HELPERS ========================= */

const fmtDay = (d) => (d ? d.slice(5).replace("-", "/") : "");
const fmtNum = (v, dec = 1) => (v == null || isNaN(v) ? "–" : Number(v).toFixed(dec));

function Section({ title, children }) {
  return (
    <div
      className="rounded-2xl p-6 shadow-2xl"
      style={{
        background: "linear-gradient(150deg,rgba(13,13,22,0.95),rgba(20,18,35,0.95))",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
    >
      <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-5 border-b border-purple-500/20 pb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, unit, warn, danger }) {
  const n = Number(value ?? 0);
  let color = "#34d399";
  if (warn && danger) {
    if (n >= danger)    color = "#ef4444";
    else if (n >= warn) color = "#f59e0b";
  }
  return (
    <div className="flex justify-between items-center bg-white/[0.03] px-4 py-3 rounded-xl border border-white/[0.05]">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-bold tabular-nums" style={{ color }}>
        {fmtNum(n, 2)}
        <span className="text-xs text-gray-500 ml-1 font-normal">{unit}</span>
      </span>
    </div>
  );
}

function ChartCard({ title, unit, color, warnVal, dangerVal, children }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-2xl"
      style={{
        background: "linear-gradient(150deg,rgba(13,13,22,0.95),rgba(20,18,35,0.95))",
        border: "1px solid rgba(139,92,246,0.18)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: color || "#a78bfa" }}>
          {title}
        </h3>
        <span className="text-xs text-gray-600 font-mono">{unit}</span>
      </div>
      {warnVal && (
        <div className="flex gap-3 mb-3 text-[10px]">
          <span className="text-amber-400">▲ Warn {warnVal}</span>
          <span className="text-red-400">▲ Crit {dangerVal}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/* ========================= CHARTS ========================= */

function TrendAreaChart({ data, dataKey, unit, color, gradId, warnVal, dangerVal }) {
  if (!data?.length)
    return <div className="h-52 flex items-center justify-center text-gray-600 text-sm">No data</div>;

  const values = data.map(d => Number(d[dataKey] ?? 0)).filter(v => Number.isFinite(v));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const avgV = values.reduce((a, b) => a + b, 0) / values.length;
  const pad  = (maxV - minV) * 0.18 || 1;

  const TooltipUI = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0]?.value;
    let tc = color;
    if (dangerVal && v >= dangerVal) tc = "#ef4444";
    else if (warnVal && v >= warnVal) tc = "#f59e0b";
    return (
      <div className="rounded-xl px-4 py-3 shadow-2xl border text-xs" style={{ background: "rgba(8,8,20,0.97)", borderColor: color + "50" }}>
        <div className="text-gray-500 mb-1 font-mono">{payload[0]?.payload?.day}</div>
        <div className="text-xl font-black tabular-nums" style={{ color: tc }}>
          {fmtNum(v, 2)}<span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex gap-5 mb-3 text-xs text-gray-500">
        <span>Min <span className="font-bold" style={{ color }}>{fmtNum(minV)}</span></span>
        <span>Avg <span className="font-bold" style={{ color }}>{fmtNum(avgV)}</span></span>
        <span>Max <span className="font-bold" style={{ color }}>{fmtNum(maxV)}</span></span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 40 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: "#4b5563", fontSize: 9, angle: -45, textAnchor: "end", dy: 4 }} interval={0} axisLine={false} tickLine={false} height={50} />
          <YAxis domain={[Math.max(0, minV - pad), maxV + pad]} tick={{ fill: "#4b5563", fontSize: 10 }} tickFormatter={v => v.toFixed(0)} width={38} axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipUI />} />
          <ReferenceLine y={avgV} stroke={color} strokeDasharray="3 3" strokeOpacity={0.35} />
          {warnVal   && <ReferenceLine y={warnVal}   stroke="#f59e0b" strokeDasharray="4 3" label={{ value: `${warnVal}`,   fill: "#f59e0b", fontSize: 9, position: "insideTopRight" }} />}
          {dangerVal && <ReferenceLine y={dangerVal} stroke="#ef4444" strokeDasharray="4 3" label={{ value: `${dangerVal}`, fill: "#ef4444", fontSize: 9, position: "insideTopRight" }} />}
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 0 }} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

function VoltageRangeChart({ data, color }) {
  if (!data?.length)
    return <div className="h-52 flex items-center justify-center text-gray-600 text-sm">No data</div>;

  const TooltipUI = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl px-4 py-3 border text-xs" style={{ background: "rgba(8,8,20,0.97)", borderColor: color + "50" }}>
        <div className="text-gray-500 mb-2 font-mono">{payload[0]?.payload?.day}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="font-bold text-white">{fmtNum(p.value, 3)} V</span>
          </div>
        ))}
      </div>
    );
  };

  const allVals = data.flatMap(d => [Number(d.min_cell_voltage_v ?? 0), Number(d.max_cell_voltage_v ?? 0)]).filter(v => v > 0);
  const yMin = Math.max(0, Math.min(...allVals) - 0.02);
  const yMax = Math.max(...allVals) + 0.02;

  return (
    <>
      <div className="flex gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span style={{ background: "#38bdf8", display: "inline-block", width: 10, height: 2 }} />Max V</span>
        <span className="flex items-center gap-1.5"><span style={{ background: "#a78bfa", display: "inline-block", width: 10, height: 2 }} />Min V</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 40 }}>
          <defs>
            <linearGradient id="batt_volt_max" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="batt_volt_min" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#a78bfa" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: "#4b5563", fontSize: 9, angle: -45, textAnchor: "end", dy: 4 }} interval={0} axisLine={false} tickLine={false} height={50} />
          <YAxis domain={[yMin, yMax]} tick={{ fill: "#4b5563", fontSize: 10 }} tickFormatter={v => v.toFixed(2)} width={44} axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipUI />} />
          <Area type="monotone" dataKey="max_cell_voltage_v" name="Max" stroke="#38bdf8" strokeWidth={2} fill="url(#batt_volt_max)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="min_cell_voltage_v" name="Min" stroke="#a78bfa" strokeWidth={2} fill="url(#batt_volt_min)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

function DayBarChart({ items }) {
  if (!items?.length)
    return <div className="h-52 flex items-center justify-center text-gray-600 text-sm">No data</div>;

  const COLORS = ["#34d399", "#f97316", "#fbbf24", "#a78bfa"];

  const TooltipUI = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, unit } = payload[0]?.payload ?? {};
    return (
      <div className="rounded-xl px-4 py-3 border text-xs" style={{ background: "rgba(8,8,20,0.97)", borderColor: "#8b5cf650" }}>
        <div className="text-gray-400 mb-1">{name}</div>
        <div className="text-lg font-black text-purple-300">
          {fmtNum(value, 2)}<span className="text-xs text-gray-500 ml-1">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={items} margin={{ top: 20, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} width={38} axisLine={false} tickLine={false} />
        <Tooltip content={<TooltipUI />} cursor={{ fill: "rgba(139,92,246,0.07)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: "top", fill: "#9ca3af", fontSize: 11, formatter: v => fmtNum(v, 1) }}>
          {items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}