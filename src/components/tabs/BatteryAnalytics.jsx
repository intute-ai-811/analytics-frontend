import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

/* ========================= BATTERY ANALYTICS ========================= */
export default function BatteryAnalytics() {
  const { id } = useParams();

  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===== FETCH DATA ===== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const url = selectedDate
          ? `/api/battery/analytics/${id}?date=${selectedDate}`
          : `/api/battery/analytics/${id}?days=30`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load battery analytics");

        const rows = await res.json();
        setData(rows || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, selectedDate]);

  /* ===== ODO SUMMARY (ONLY FOR 30 DAYS VIEW) ===== */
  const odo = useMemo(() => {
    if (!data.length || selectedDate)
      return { energyUsed: null, maxCurrent: 0, maxTemp: 0, avgTemp: null };

    const newest = data[0];
    const oldest = data[data.length - 1];

    let energyUsed = null;
    const newKwh = Number(newest.total_kwh_consumed ?? 0);
    const oldKwh = Number(oldest.total_kwh_consumed ?? 0);

    if (newKwh >= oldKwh) {
      energyUsed = newKwh - oldKwh;
    }

    const validAvgTemps = data
      .map(d => Number(d.avg_cell_temp_c ?? 0))
      .filter(v => v > 0);
    const avgTemp = validAvgTemps.length
      ? validAvgTemps.reduce((a, b) => a + b, 0) / validAvgTemps.length
      : null;

    return {
      energyUsed,
      maxCurrent: Math.max(...data.map(d => Number(d.max_op_dc_current_a ?? 0))),
      maxTemp: Math.max(...data.map(d => Number(d.max_cell_temp_c ?? 0))),
      avgTemp,
    };
  }, [data, selectedDate]);

  /* ===== LATEST / SELECTED DAY ===== */
  const latestTrip = useMemo(() => {
    if (!data.length) return {};
    return data[0];
  }, [data]);

  /* ===== CHART DATA (ASC ORDER) ===== */
  const chartData = useMemo(() => [...data].reverse(), [data]);

  const handleClearDate = () => setSelectedDate("");

  if (loading)
    return (
      <div className="text-center py-16 text-orange-300">
        Loading battery analytics…
      </div>
    );

  if (error)
    return (
      <div className="text-center py-16 text-red-400">
        Error: {error}
      </div>
    );

  return (
    <div className="space-y-8 pb-8">
      <h2 className="text-2xl font-bold text-orange-300 text-center">
        Battery Analytics
      </h2>

      {/* ===== DATE FILTER ===== */}
      <div className="flex justify-center items-center gap-4 flex-wrap">
        <label className="text-orange-300 text-sm font-medium">View by Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-gray-900/80 border border-orange-500/40 text-orange-200 rounded-lg px-4 py-2 focus:border-orange-500 focus:outline-none transition"
        />
        {selectedDate && (
          <button
            onClick={handleClearDate}
            className="text-orange-400 hover:text-orange-300 underline text-sm transition"
          >
            Show last 30 days
          </button>
        )}
      </div>

      {/* ===== SUMMARY ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!selectedDate && data.length > 0 && (
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
        )}

        {data.length > 0 && (
          <Section title={selectedDate ? `Data on ${selectedDate}` : "Latest Trip"}>
            <Stat
              label="Energy Used"
              value={latestTrip.kwh_last_trip ?? latestTrip.total_kwh_consumed}
              unit="kWh"
            />
            <Stat
              label="Max Cell Temperature"
              value={latestTrip.max_cell_temp_last_trip ?? latestTrip.max_cell_temp_c}
              unit="°C"
              warn={45}
              danger={55}
            />
            <Stat
              label="Avg Cell Temperature"
              value={latestTrip.avg_cell_temp_last_trip ?? latestTrip.avg_cell_temp_c}
              unit="°C"
              warn={42}
              danger={52}
            />
          </Section>
        )}
      </div>

      {/* ===== NO DATA ===== */}
      {data.length === 0 && (
        <div className="text-center py-12 text-orange-300/70">
          No battery analytics data available for the selected period.
        </div>
      )}

      {/* ===== CHARTS ===== */}
      {data.length > 0 && (
        <>
          {!selectedDate ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Energy Consumption Trend (kWh)">
                <LineChart
                  data={chartData.map(d => ({
                    x: d.day,
                    y: Number(d.total_kwh_consumed ?? 0),
                  }))}
                />
              </ChartCard>

              <ChartCard title="Max Cell Temperature Trend (°C)">
                <LineChart
                  data={chartData.map(d => ({
                    x: d.day,
                    y: Number(d.max_cell_temp_c ?? 0),
                  }))}
                  band={{ warn: 45, danger: 55 }}
                />
              </ChartCard>

              <ChartCard title="Avg Cell Temperature Trend (°C)">
                <LineChart
                  data={chartData.map(d => ({
                    x: d.day,
                    y: Number(d.avg_cell_temp_c ?? 0),
                  }))}
                  band={{ warn: 42, danger: 52 }}
                />
              </ChartCard>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <ChartCard title={`Battery Metrics on ${selectedDate}`}>
                <BarChart
                  data={[
                    {
                      x: "Energy",
                      y: Number(latestTrip.kwh_last_trip ?? latestTrip.total_kwh_consumed ?? 0),
                    },
                    {
                      x: "Max Temp",
                      y: Number(latestTrip.max_cell_temp_last_trip ?? latestTrip.max_cell_temp_c ?? 0),
                    },
                    {
                      x: "Avg Temp",
                      y: Number(latestTrip.avg_cell_temp_last_trip ?? latestTrip.avg_cell_temp_c ?? 0),
                    },
                  ]}
                  band={{ warn: 45, danger: 55 }}
                />
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ========================= UI HELPERS ========================= */

function Section({ title, children }) {
  return (
    <div className="border border-orange-500/30 p-5 rounded-xl bg-black/40 backdrop-blur-sm">
      <h3 className="font-bold text-orange-300 mb-4 text-lg">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, unit, warn, danger }) {
  if (value == null || isNaN(value))
    return (
      <div className="flex justify-between items-center bg-gray-800/50 px-5 py-4 rounded-lg border border-orange-500/20">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">–</span>
      </div>
    );

  const v = Number(value).toFixed(2);
  let color = "text-emerald-300";

  if (warn && danger) {
    const n = Number(v);
    if (n >= danger) color = "text-red-300";
    else if (n >= warn) color = "text-yellow-300";
  }

  return (
    <div className="flex justify-between items-center bg-gray-800/50 px-5 py-4 rounded-lg border border-orange-500/20">
      <span className="text-gray-300">{label}</span>
      <span className={`font-bold text-lg ${color}`}>
        {v} <span className="text-sm opacity-70 font-normal">{unit}</span>
      </span>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="border border-orange-500/30 rounded-xl p-4 bg-black/40 backdrop-blur-sm">
      <h3 className="text-orange-300 font-bold mb-3 text-center">{title}</h3>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}

/* ========================= CRASH-PROOF CHARTS (SAME AS MOTOR) ========================= */

function LineChart({ data, band }) {
  if (!data || data.length === 0)
    return <div className="h-48 flex items-center justify-center text-gray-500">No data</div>;

  const width = 580;
  const height = 200;
  const pad = 30;

  const values = data.map(d => d.y);
  const maxY = Math.max(...values, band?.danger || 100, 10);

  const points = data.map((d, i) => {
    const val = d.y;
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - (val / maxY) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Subtle grid */}
      {[0.25, 0.5, 0.75].map(ratio => (
        <line
          key={ratio}
          x1={pad}
          y1={height - pad - ratio * (height - pad * 2)}
          x2={width - pad}
          y2={height - pad - ratio * (height - pad * 2)}
          stroke="rgba(251,146,60,0.1)"
          strokeDasharray="4,4"
        />
      ))}

      {/* Trend line */}
      <polyline
        fill="none"
        stroke="rgb(251,146,60)"
        strokeWidth="3"
        points={points}
      />

      {/* Data points */}
      {data.map((d, i) => {
        const val = d.y;
        const x = pad + (i / (data.length - 1)) * (width - pad * 2);
        const y = height - pad - (val / maxY) * (height - pad * 2);

        let fill = "rgb(251,146,60)";
        if (band) {
          if (val >= band.danger) fill = "rgb(239,68,68)";
          else if (val >= band.warn) fill = "rgb(234,179,8)";
        }

        return (
          <g key={i}>
            <circle cx={x} cy={y} r="6" fill={fill} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
            <title>{`${d.x}: ${val.toFixed(2)}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({ data, band }) {
  if (!data || data.length === 0)
    return <div className="h-48 flex items-center justify-center text-gray-500">No data</div>;

  const width = 560;
  const height = 200;
  const pad = 40;

  const values = data.map(d => d.y);
  const maxY = Math.max(...values, band?.danger || 100, 10);

  const barWidth = (width - pad * 2) / data.length - 20;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {data.map((d, i) => {
        const val = d.y;
        const barHeight = (val / maxY) * (height - pad * 2);
        const y = height - pad - barHeight;

        let fill = "rgb(251,146,60)";
        if (band && (d.x.includes("Temp") || d.x === "Max Temp" || d.x === "Avg Temp")) {
          if (val >= band.danger) fill = "rgb(239,68,68)";
          else if (val >= band.warn) fill = "rgb(234,179,8)";
        }

        return (
          <g key={i}>
            <rect
              x={pad + i * (barWidth + 20)}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="8"
              fill={fill}
            />
            <text
              x={pad + i * (barWidth + 20) + barWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fill="rgb(209,213,219)"
            >
              {d.x}
            </text>
            <text
              x={pad + i * (barWidth + 20) + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              fontSize="14"
              fill="white"
              fontWeight="bold"
            >
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}