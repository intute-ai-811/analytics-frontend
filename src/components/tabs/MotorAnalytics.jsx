import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

/* ========================= MOTOR ANALYTICS ========================= */
export default function MotorAnalytics() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===== FETCH DATA ===== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(
          `/api/motor/analytics/${id}?days=30`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to load motor analytics");

        const rows = await res.json();
        setData(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  /* ===== ODO SUMMARY (30 DAYS) ===== */
  const odo = useMemo(() => {
    if (!data.length)
      return { maxPower: 0, maxTorque: 0, maxTemp: 0 };

    return {
      maxPower: Math.max(...data.map(d => d.max_op_power_kw || 0)),
      maxTorque: Math.max(...data.map(d => d.max_op_torque_nm || 0)),
      maxTemp: Math.max(...data.map(d => d.max_motor_temp_c || 0)),
    };
  }, [data]);

  /* ===== LATEST DAY SUMMARY ===== */
  const latest = useMemo(() => data[0] || {}, [data]);

  /* ===== CHART DATA (ASC for UX) ===== */
  const chartData = useMemo(() => [...data].reverse(), [data]);

  if (loading)
    return (
      <div className="text-center py-12 text-orange-200">
        Loading motor analytics…
      </div>
    );

  if (error)
    return (
      <div className="text-center py-12 text-red-400">
        Error: {error}
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-orange-300 text-center">
        Motor Analytics
      </h2>

      {/* ===== SUMMARY ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="ODO Summary (Last 30 Days)">
          <Stat label="Max O/P Power" value={odo.maxPower} unit="kW" />
          <Stat label="Max O/P Torque" value={odo.maxTorque} unit="Nm" />
          <Stat
            label="Max Motor Temperature"
            value={odo.maxTemp}
            unit="°C"
            warn={80}
            danger={95}
          />
        </Section>

        <Section title="Latest Day">
          <Stat
            label="Max O/P Power"
            value={latest.max_op_power_kw}
            unit="kW"
          />
          <Stat
            label="Max O/P Torque"
            value={latest.max_op_torque_nm}
            unit="Nm"
          />
          <Stat
            label="Max Motor Temperature"
            value={latest.max_motor_temp_c}
            unit="°C"
            warn={80}
            danger={95}
          />
        </Section>
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Max Power (kW) — Last 30 Days">
          <BarChart
            data={chartData.map(d => ({
              x: d.day,
              y: d.max_op_power_kw,
            }))}
          />
        </ChartCard>

        <ChartCard title="Max Torque (Nm) — Last 30 Days">
          <BarChart
            data={chartData.map(d => ({
              x: d.day,
              y: d.max_op_torque_nm,
            }))}
          />
        </ChartCard>

        <ChartCard title="Max Motor Temp (°C) — Last 30 Days">
          <BarChart
            data={chartData.map(d => ({
              x: d.day,
              y: d.max_motor_temp_c,
            }))}
            band={{ warn: 80, danger: 95 }}
          />
        </ChartCard>
      </div>
    </div>
  );
}

/* ========================= LOCAL UI HELPERS ========================= */

function Section({ title, children }) {
  return (
    <div className="border border-orange-500/30 p-4 rounded-xl bg-black/30">
      <h3 className="font-semibold text-orange-300 mb-3">{title}</h3>
      <div className="grid grid-cols-1 gap-2">{children}</div>
    </div>
  );
}

function Stat({ label, value, unit, warn, danger }) {
  const v = Number(value || 0);
  let color = "text-emerald-300";

  if (warn && danger) {
    if (v >= danger) color = "text-red-300";
    else if (v >= warn) color = "text-yellow-200";
  }

  return (
    <div className="flex justify-between bg-gray-800/40 px-4 py-3 rounded-md border border-orange-500/20">
      <span className="text-gray-300 text-sm">{label}</span>
      <span className={`font-bold ${color}`}>
        {v.toFixed(2)}{" "}
        <span className="opacity-70 text-sm">{unit}</span>
      </span>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="border border-orange-500/30 rounded-xl p-3 bg-black/30">
      <div className="text-orange-300 font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function BarChart({ data, band }) {
  if (!data.length)
    return (
      <div className="h-40 flex items-center justify-center text-orange-200/60">
        No data
      </div>
    );

  const width = 560;
  const height = 160;
  const pad = 12;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const maxY = Math.max(...data.map(d => d.y || 0), 1);

  const barWidth = (w / data.length) * 0.8;
  const gap = (w / data.length) * 0.2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[160px]">
      {data.map((d, i) => {
        const x = pad + i * (barWidth + gap);
        const barH = (d.y / maxY) * h;
        const y = pad + h - barH;

        let fill = "rgb(251,146,60)";
        if (band) {
          if (d.y >= band.danger) fill = "rgb(239,68,68)";
          else if (d.y >= band.warn) fill = "rgb(234,179,8)";
        }

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx="4"
            fill={fill}
          />
        );
      })}
    </svg>
  );
}
