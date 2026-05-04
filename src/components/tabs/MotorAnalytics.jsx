import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function MotorAnalytics() {
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
          ? `${API_BASE_URL}/api/motor/analytics/${id}?date=${selectedDate}`
          : `${API_BASE_URL}/api/motor/analytics/${id}?days=30`;

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to load motor analytics");

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
      return { maxPower: 0, maxTorque: 0, maxTemp: 0, maxRpm: 0 };
    return {
      maxPower:  Math.max(...data.map(d => Number(d.max_op_power_kw   ?? 0))),
      maxTorque: Math.max(...data.map(d => Number(d.max_op_torque_nm  ?? 0))),
      maxTemp:   Math.max(...data.map(d => Number(d.max_motor_temp_c  ?? 0))),
      maxRpm:    Math.max(...data.map(d => Number(d.max_motor_speed_rpm ?? 0))),
    };
  }, [data, selectedDate]);

  const latestTrip = useMemo(() => data.length ? data[0] : {}, [data]);
  const chartData  = useMemo(() => [...data].reverse(), [data]);

  if (loading) return <div className="text-center py-16 text-purple-300">Loading motor analytics…</div>;
  if (error)   return <div className="text-center py-16 text-red-400">Error: {error}</div>;

  const tempColor =
    odo.maxTemp >= 95 ? "#ef4444" :
    odo.maxTemp >= 80 ? "#f59e0b" : "#34d399";

  return (
    <div className="space-y-8 pb-8">
      <h2 className="text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8 uppercase tracking-widest">
        Motor Analytics
      </h2>

      {/* Date filter */}
      <div className="flex justify-center items-center gap-4 flex-wrap">
        <label className="text-purple-300 text-sm font-medium">View by Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-gray-900/80 border border-purple-500/40 text-purple-200 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none transition"
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate("")}
            className="text-purple-400 hover:text-purple-300 underline text-sm transition"
          >
            ← Back to 30-day view
          </button>
        )}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-purple-300/70">
          No motor analytics data available for the selected period.
        </div>
      )}

      {/* ── 30-day view ── */}
      {!selectedDate && data.length > 0 && (
        <>
          {/* ── ODO Summary + Last Day sections ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="ODO Summary (Last 30 Days)">
              <Stat label="Max Output Power"      value={odo.maxPower}  unit="kW" />
              <Stat label="Max Output Torque"     value={odo.maxTorque} unit="Nm" />
              <Stat label="Max Motor Temperature" value={odo.maxTemp}   unit="°C"  warn={80} danger={95} />
              <Stat label="Max Motor Speed"       value={odo.maxRpm}    unit="RPM" isRpm />
            </Section>

            <Section title="Last Day">
              <Stat label="Max Output Power"      value={latestTrip.max_op_power_kw    ?? 0} unit="kW" />
              <Stat label="Max Output Torque"     value={latestTrip.max_op_torque_nm   ?? 0} unit="Nm" />
              <Stat label="Max Motor Temperature" value={latestTrip.max_motor_temp_c   ?? 0} unit="°C"  warn={80} danger={95} />
              <Stat label="Max Motor Speed"       value={latestTrip.max_motor_speed_rpm ?? 0} unit="RPM" isRpm />
            </Section>
          </div>

          {/* Trend charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Max Output Power Trend" unit="kW" color="#f97316">
              <TrendAreaChart
                data={chartData} dataKey="max_op_power_kw"
                unit="kW" color="#f97316" gradId="motor_power"
              />
            </ChartCard>
            <ChartCard title="Max Output Torque Trend" unit="Nm" color="#a78bfa">
              <TrendAreaChart
                data={chartData} dataKey="max_op_torque_nm"
                unit="Nm" color="#a78bfa" gradId="motor_torque"
              />
            </ChartCard>
            <ChartCard title="Max Motor Temperature Trend" unit="°C" color="#fbbf24" warnVal={80} dangerVal={95}>
              <TrendAreaChart
                data={chartData} dataKey="max_motor_temp_c"
                unit="°C" color="#fbbf24" gradId="motor_temp"
                warnVal={80} dangerVal={95}
              />
            </ChartCard>
            <ChartCard title="Max Motor Speed Trend" unit="RPM" color="#38bdf8">
              <TrendAreaChart
                data={chartData} dataKey="max_motor_speed_rpm"
                unit="RPM" color="#38bdf8" gradId="motor_rpm"
              />
            </ChartCard>
          </div>
        </>
      )}

      {/* ── Single-day view ── */}
      {selectedDate && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title={`Trip on ${selectedDate}`}>
            <Stat label="Max Output Power"      value={latestTrip.max_op_power_kw    ?? 0} unit="kW" />
            <Stat label="Max Output Torque"     value={latestTrip.max_op_torque_nm   ?? 0} unit="Nm" />
            <Stat label="Max Motor Temperature" value={latestTrip.max_motor_temp_c   ?? 0} unit="°C"  warn={80} danger={95} />
            <Stat label="Max Motor Speed"       value={latestTrip.max_motor_speed_rpm ?? 0} unit="RPM" isRpm />
          </Section>
          <ChartCard title="Motor Performance" unit={selectedDate} color="#a78bfa">
            <DayBarChart items={[
              { name: "Power",  value: Number(latestTrip.max_op_power_kw    ?? 0), unit: "kW"  },
              { name: "Torque", value: Number(latestTrip.max_op_torque_nm   ?? 0), unit: "Nm"  },
              { name: "Speed",  value: Number(latestTrip.max_motor_speed_rpm ?? 0), unit: "RPM" },
              { name: "Temp",   value: Number(latestTrip.max_motor_temp_c   ?? 0), unit: "°C"  },
            ]} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────── */
const fmtDay = (d) => (d ? d.slice(5).replace("-", "/") : "");
const fmtNum = (v, dec = 1) =>
  v == null || isNaN(v) ? "–" : Number(v).toFixed(dec);

/* ── Section container ── */
function Section({ title, children }) {
  return (
    <div
      className="rounded-2xl p-6 shadow-2xl"
      style={{
        background: "linear-gradient(150deg,rgba(13,13,22,0.95),rgba(20,18,35,0.95))",
        border: "1px solid rgba(139,92,246,0.25)",
      }}
    >
      <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-5 border-b border-purple-500/20 pb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ── Stat row inside a Section ── */
function Stat({ label, value, unit, warn, danger, isRpm }) {
  const n = Number(value ?? 0);
  let color = isRpm ? "#38bdf8" : "#34d399";
  if (warn && danger) {
    if (n >= danger)   color = "#ef4444";
    else if (n >= warn) color = "#f59e0b";
  }
  const display = Number.isFinite(n) ? fmtNum(n, isRpm ? 0 : 2) : "–";
  return (
    <div
      className="flex justify-between items-center px-4 py-3 rounded-xl border"
      style={{
        background: color + "08",
        borderColor: color + "22",
      }}
    >
      <span className="text-gray-300 text-sm">{label}</span>
      <span className="font-bold" style={{ color }}>
        {display}
        <span className="text-xs text-gray-500 ml-1 font-normal">{unit}</span>
      </span>
    </div>
  );
}

/* ── KPI card (top row) ── */
function KpiCard({ label, value, unit, color, sub, warnVal, dangerVal }) {
  const n = Number(value ?? 0);
  let c = color;
  if (warnVal && dangerVal) {
    if (n >= dangerVal)   c = "#ef4444";
    else if (n >= warnVal) c = "#f59e0b";
  }
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{
        background: "linear-gradient(150deg,rgba(13,13,22,0.95),rgba(20,18,35,0.95))",
        border: `1px solid ${c}30`,
      }}
    >
      <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-black tabular-nums" style={{ color: c }}>
        {fmtNum(n, 1)}
      </span>
      <span className="text-xs font-semibold" style={{ color: c + "90" }}>{unit}</span>
      {sub && <span className="text-[10px] text-gray-600 mt-1">{sub}</span>}
    </div>
  );
}

/* ── Chart section wrapper ── */
function ChartCard({ title, unit, color, warnVal, dangerVal, children }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-2xl"
      style={{
        background: "linear-gradient(150deg,rgba(13,13,22,0.95),rgba(20,18,35,0.95))",
        border: "1px solid rgba(139,92,246,0.18)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color }}>
          {title}
        </h3>
        <span className="text-xs text-gray-600 font-mono">{unit}</span>
      </div>
      {warnVal && (
        <div className="flex gap-3 mb-2 text-[10px]">
          <span className="text-amber-400">▲ Warn {warnVal}</span>
          <span className="text-red-400">▲ Crit {dangerVal}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/* ── 30-day area trend chart ── */
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
      <div
        className="rounded-xl px-4 py-3 shadow-2xl border text-xs"
        style={{ background: "rgba(8,8,20,0.97)", borderColor: color + "50" }}
      >
        <div className="text-gray-500 mb-1 font-mono">{payload[0]?.payload?.day}</div>
        <div className="text-xl font-black tabular-nums" style={{ color: tc }}>
          {fmtNum(v, 2)}
          <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>
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
          <XAxis
            dataKey="day"
            tickFormatter={fmtDay}
            tick={{ fill: "#4b5563", fontSize: 9, angle: -45, textAnchor: "end", dy: 4 }}
            interval={0}
            axisLine={false}
            tickLine={false}
            height={50}
          />
          <YAxis
            domain={[Math.max(0, minV - pad), maxV + pad]}
            tick={{ fill: "#4b5563", fontSize: 10 }}
            tickFormatter={v => v.toFixed(0)}
            width={38}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<TooltipUI />} />
          {/* avg reference line */}
          <ReferenceLine y={avgV} stroke={color} strokeDasharray="3 3" strokeOpacity={0.35} />
          {warnVal   && <ReferenceLine y={warnVal}   stroke="#f59e0b" strokeDasharray="4 3" label={{ value: `${warnVal}`,   fill: "#f59e0b", fontSize: 9, position: "insideTopRight" }} />}
          {dangerVal && <ReferenceLine y={dangerVal} stroke="#ef4444" strokeDasharray="4 3" label={{ value: `${dangerVal}`, fill: "#ef4444", fontSize: 9, position: "insideTopRight" }} />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

/* ── Single-day bar chart ── */
function DayBarChart({ items }) {
  if (!items?.length)
    return <div className="h-52 flex items-center justify-center text-gray-600 text-sm">No data</div>;

  const COLORS = ["#f97316", "#a78bfa", "#38bdf8", "#fbbf24"];

  const TooltipUI = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, unit } = payload[0]?.payload ?? {};
    return (
      <div
        className="rounded-xl px-4 py-3 border text-xs"
        style={{ background: "rgba(8,8,20,0.97)", borderColor: "#8b5cf650" }}
      >
        <div className="text-gray-400 mb-1">{name}</div>
        <div className="text-lg font-black text-purple-300">
          {fmtNum(value, 2)}
          <span className="text-xs text-gray-500 ml-1">{unit}</span>
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
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          label={{ position: "top", fill: "#9ca3af", fontSize: 11, formatter: v => fmtNum(v, 1) }}
        >
          {items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}