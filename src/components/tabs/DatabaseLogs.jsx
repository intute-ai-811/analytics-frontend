import React, { useMemo, useState, useEffect } from "react";

/* ========================= DATABASE / LOGS (REAL DATA) ========================= */
export default function DatabaseLogs({ vehicleId }) {
  const today = new Date();
  const d7 = new Date(today);
  d7.setDate(today.getDate() - 6);

  const [start, setStart] = useState(fmtDate(d7));
  const [end, setEnd] = useState(fmtDate(today));

  const [data, setData] = useState([]);         // Raw data from backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COLUMNS = [
    { key: "battery_kwh", label: "Battery kWh (daily)" },
    { key: "motor_kwh", label: "Motor kWh (derived)" },
    { key: "motor_temp_range", label: "Motor Temp Range (°C)" },
    { key: "mcu_temp_range", label: "MCU Temp Range (°C)" },
    { key: "battery_temp_range", label: "Battery Temp Range (°C)" },
    { key: "oil_temp_range", label: "Hydraulic Oil Temp Range (°C)" },
    { key: "charging_sessions", label: "Charging Sessions" },
  ];

  const [selectedCols, setSelectedCols] = useState(
    new Set(COLUMNS.map((c) => c.key))
  );

  // Fetch data whenever start, end, or vehicleId changes
  useEffect(() => {
    if (!vehicleId) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/database-logs/${vehicleId}?start=${start}&end=${end}`,
          {
            credentials: "include", // if using cookie-based auth
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token") || ""}`, // adjust based on your auth method
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const rows = await res.json();

        // Transform raw rows to formatted display (temp ranges as strings)
        const formatted = rows.map((row) => ({
          date: fmtDate(new Date(row.day)),
          battery_kwh: row.battery_kwh ? Number(row.battery_kwh.toFixed(1)) : null,
          motor_kwh: row.motor_kwh ? Number(row.motor_kwh.toFixed(2)) : null,
          motor_temp_range:
            row.motor_temp_min !== null && row.motor_temp_max !== null
              ? `${Math.round(row.motor_temp_min)}-${Math.round(row.motor_temp_max)}`
              : "-",
          mcu_temp_range:
            row.mcu_temp_min !== null && row.mcu_temp_max !== null
              ? `${Math.round(row.mcu_temp_min)}-${Math.round(row.mcu_temp_max)}`
              : "-",
          battery_temp_range:
            row.battery_temp_min !== null && row.battery_temp_max !== null
              ? `${Math.round(row.battery_temp_min)}-${Math.round(row.battery_temp_max)}`
              : "-",
          oil_temp_range:
            row.oil_temp_min !== null && row.oil_temp_max !== null
              ? `${Math.round(row.oil_temp_min)}-${Math.round(row.oil_temp_max)}`
              : "-",
          charging_sessions: row.charging_sessions || 0,
        }));

        setData(formatted);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load logs");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [vehicleId, start, end]);

  const toggleCol = (k) =>
    setSelectedCols((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const exportCSV = () => {
    const enabled = COLUMNS.filter((c) => selectedCols.has(c.key));
    const header = ["Date", ...enabled.map((c) => c.label)];

    const dataRows = data.map((r) => [
      r.date,
      ...enabled.map((c) => String(r[c.key] ?? "")),
    ]);

    const csv = [header, ...dataRows]
      .map((line) => line.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${vehicleId}_${start}_to_${end}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-orange-300 text-center">
        Database / Logs
      </h2>

      <div className="border border-orange-500/30 rounded-xl bg-black/30 p-6">
        <div className="flex flex-col space-y-4">
          <div>
            <div className="mb-2 text-orange-300 font-medium">
              Select Time Range
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                max={fmtDate(today)}
                className="px-3 py-2 rounded-lg bg-black/40 border border-orange-500/30 text-orange-100"
              />
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                max={fmtDate(today)}
                className="px-3 py-2 rounded-lg bg-black/40 border border-orange-500/30 text-orange-100"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-orange-300 font-medium">
              Select Columns
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COLUMNS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/40 border border-orange-500/20 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCols.has(c.key)}
                    onChange={() => toggleCol(c.key)}
                    className="accent-orange-500"
                  />
                  <span className="text-orange-100 text-sm">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={exportCSV}
            disabled={loading || data.length === 0}
            className="px-5 py-2 bg-orange-600/30 border border-orange-500/40 rounded-md text-orange-200 font-semibold hover:bg-orange-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export as CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-orange-500/30 bg-black/30 overflow-x-auto">
        {loading && (
          <div className="p-8 text-center text-orange-200">
            Loading logs...
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-400">
            Error: {error}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="p-8 text-center text-orange-300">
            No data available for the selected range.
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <table className="min-w-full text-sm">
            <thead className="bg-black/40">
              <tr>
                <th className="px-4 py-3 text-left text-orange-200/90">Date</th>
                {Array.from(selectedCols).map((key) => {
                  const col = COLUMNS.find((c) => c.key === key);
                  return (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-orange-200/90"
                    >
                      {col?.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-500/10">
              {data.map((r) => (
                <tr key={r.date}>
                  <td className="px-4 py-2 text-orange-100">{r.date}</td>
                  {Array.from(selectedCols).map((key) => (
                    <td key={key} className="px-4 py-2 text-orange-100">
                      {r[key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ===== HELPERS ===== */
const fmtDate = (d) => {
  if (!(d instanceof Date)) d = new Date(d);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const escapeCSV = (v) => `"${String(v).replace(/"/g, '""')}"`;