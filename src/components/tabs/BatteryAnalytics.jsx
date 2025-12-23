import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

/* ========================= BATTERY ANALYTICS ========================= */
export default function BatteryAnalytics() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===== FETCH ===== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(
          `/api/battery/analytics/${id}?days=30`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to load battery analytics");

        const rows = await res.json();
        setData(Array.isArray(rows) ? rows : []);
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
    if (data.length < 2) {
      return {
        energyUsed: null,
        maxCurrent: 0,
        maxTemp: 0,
        avgTemp: null,
      };
    }

    const newest = data[0];
    const oldest = data[data.length - 1];

    let energyUsed = null;
    if (
      newest.total_kwh_consumed != null &&
      oldest.total_kwh_consumed != null &&
      newest.total_kwh_consumed >= oldest.total_kwh_consumed
    ) {
      energyUsed =
        newest.total_kwh_consumed - oldest.total_kwh_consumed;
    }

    const currents = data
      .map(d => d.max_op_dc_current_a)
      .filter(v => v != null);

    const maxTemps = data
      .map(d => d.max_cell_temp_c)
      .filter(v => v != null);

    const avgTemps = data
      .map(d => d.avg_cell_temp_c)
      .filter(v => v != null);

    return {
      energyUsed,
      maxCurrent: currents.length ? Math.max(...currents) : 0,
      maxTemp: maxTemps.length ? Math.max(...maxTemps) : 0,
      avgTemp: avgTemps.length
        ? avgTemps.reduce((s, v) => s + v, 0) / avgTemps.length
        : null,
    };
  }, [data]);

  /* ===== LATEST TRIP ===== */
  const latestTrip = useMemo(() => data[0] || {}, [data]);

  /* ===== CHART DATA (ASC) ===== */
  const chartData = useMemo(() => [...data].reverse(), [data]);

  if (loading)
    return (
      <div className="text-center py-12 text-orange-200">
        Loading battery analytics…
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
        Battery Analytics
      </h2>

      {/* ===== SUMMARY ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="ODO Summary (Last 30 Days)">
          <Stat label="Energy Used" value={odo.energyUsed} unit="kWh" />
          <Stat label="Max DC Current" value={odo.maxCurrent} unit="A" />
          <Stat
            label="Max Cell Temperature"
            value={odo.maxTemp}
            unit="°C"
            warn={45}
            danger={55}
          />
          <Stat
            label="Avg Cell Temperature"
            value={odo.avgTemp}
            unit="°C"
            warn={42}
            danger={52}
          />
        </Section>

        <Section title="Latest Trip">
          <Stat
            label="Energy Used (Trip)"
            value={latestTrip.kwh_last_trip}
            unit="kWh"
          />
          <Stat
            label="Max Cell Temp (Trip)"
            value={latestTrip.max_cell_temp_last_trip}
            unit="°C"
            warn={45}
            danger={55}
          />
          <Stat
            label="Avg Cell Temp (Trip)"
            value={latestTrip.avg_cell_temp_last_trip}
            unit="°C"
            warn={42}
            danger={52}
          />
        </Section>
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Cumulative Energy (kWh)">
          <BarChart
            data={chartData.map(d => ({
              x: d.day,
              y: d.total_kwh_consumed,
            }))}
          />
        </ChartCard>

        <ChartCard title="Max Cell Temperature (°C)">
          <BarChart
            data={chartData.map(d => ({
              x: d.day,
              y: d.max_cell_temp_c,
            }))}
            band={{ warn: 45, danger: 55 }}
          />
        </ChartCard>

        <ChartCard title="Avg Cell Temperature (°C)">
          <BarChart
            data={chartData.map(d => ({
              x: d.day,
              y: d.avg_cell_temp_c,
            }))}
            band={{ warn: 42, danger: 52 }}
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
  if (value == null)
    return (
      <div className="flex justify-between bg-gray-800/40 px-4 py-3 rounded-md border border-orange-500/20">
        <span className="text-gray-300 text-sm">{label}</span>
        <span className="text-gray-400 font-semibold">–</span>
      </div>
    );

  const v = Number(value);
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
        const barH = ((d.y || 0) / maxY) * h;
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
