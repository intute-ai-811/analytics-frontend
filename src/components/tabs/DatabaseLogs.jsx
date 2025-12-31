import React, { useEffect, useState } from "react";

/* ========================= DATABASE / LOGS (RAW TELEMETRY DATA) ========================= */
export default function DatabaseLogs({ vehicleId }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(fmtDate(today));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COLUMNS = [
    { key: "recorded_at", label: "Timestamp" },
    { key: "soc_percent", label: "SOC (%)" },
    { key: "stack_voltage_v", label: "Stack Voltage (V)" },
    { key: "battery_status", label: "Battery Status" },
    { key: "max_voltage_v", label: "Max Cell Voltage (V)" },
    { key: "min_voltage_v", label: "Min Cell Voltage (V)" },
    { key: "avg_voltage_v", label: "Avg Cell Voltage (V)" },
    { key: "max_temp_c", label: "Max Battery Temp (°C)" },
    { key: "min_temp_c", label: "Min Battery Temp (°C)" },
    { key: "avg_temp_c", label: "Avg Battery Temp (°C)" },
    { key: "battery_current_a", label: "Battery Current (A)" },
    { key: "charger_current_demand_a", label: "Charger Current Demand (A)" },
    { key: "charger_voltage_demand_v", label: "Charger Voltage Demand (V)" },
    { key: "motor_torque_limit", label: "Motor Torque Limit (Nm)" },
    { key: "motor_torque_value", label: "Motor Torque Value (Nm)" },
    { key: "motor_speed_rpm", label: "Motor Speed (RPM)" },
    { key: "motor_rotation_dir", label: "Motor Rotation Dir" },
    { key: "motor_operation_mode", label: "Motor Operation Mode" },
    { key: "mcu_enable_state", label: "MCU Enable State" },
    { key: "motor_ac_current_a", label: "Motor AC Current (A)" },
    { key: "motor_ac_voltage_v", label: "Motor AC Voltage (V)" },
    { key: "dc_side_voltage_v", label: "DC Side Voltage (V)" },
    { key: "motor_temp_c", label: "Motor Temp (°C)" },
    { key: "mcu_temp_c", label: "MCU Temp (°C)" },
    { key: "radiator_temp_c", label: "Radiator Temp (°C)" },
    { key: "total_running_hrs", label: "Total Running Hours" },
    { key: "last_trip_hrs", label: "Last Trip Hours" },
    { key: "total_kwh_consumed", label: "Total kWh Consumed" },
    { key: "last_trip_kwh", label: "Last Trip kWh" },
    { key: "dcdc_input_voltage_v", label: "DCDC Input Voltage (V)" },
    { key: "dcdc_input_current_a", label: "DCDC Input Current (A)" },
    { key: "dcdc_output_voltage_v", label: "DCDC Output Voltage (V)" },
    { key: "dcdc_output_current_a", label: "DCDC Output Current (A)" },
    { key: "dcdc_occurence_count", label: "DCDC Occurrence Count" },
    { key: "dcdc_pri_a_mosfet_temp_c", label: "DCDC Pri A MOSFET Temp (°C)" },
    { key: "dcdc_sec_ls_mosfet_temp_c", label: "DCDC Sec LS MOSFET Temp (°C)" },
    { key: "dcdc_sec_hs_mosfet_temp_c", label: "DCDC Sec HS MOSFET Temp (°C)" },
    { key: "dcdc_pri_c_mosfet_temp_c", label: "DCDC Pri C MOSFET Temp (°C)" },
  ];

  const [selectedCols, setSelectedCols] = useState(
    new Set(COLUMNS.map((c) => c.key))
  );

  useEffect(() => {
    if (!vehicleId || !selectedDate) {
      setData([]);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(
          `/api/database-logs/${vehicleId}?date=${selectedDate}`,
          { headers }
        );

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(`Failed: ${res.status} ${msg || res.statusText}`);
        }

        const rawRows = await res.json();

        // Format complex fields for display
        const formatted = rawRows.map((row) => ({
          ...row,
          recorded_at: row.recorded_at
            ? new Date(row.recorded_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })
            : "-",
          cell_voltages: row.cell_voltages?.join(", ") || "-",
          temp_sensors: row.temp_sensors?.join(", ") || "-",
          alarms: row.alarms ? JSON.stringify(row.alarms, null, 2) : "{}",
          total_running_hrs: row.total_running_hrs || "-",
          last_trip_hrs: row.last_trip_hrs || "-",
        }));

        setData(formatted);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [vehicleId, selectedDate]);

  const toggleCol = (key) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const exportCSV = () => {
    if (data.length === 0) return;

    const visibleCols = COLUMNS.filter((c) => selectedCols.has(c.key));
    const headers = ["Timestamp", ...visibleCols.map((c) => c.label)];

    const rows = data.map((row) => [
      row.recorded_at,
      ...visibleCols.map((c) => {
        const val = row[c.key];
        if (Array.isArray(val)) return val.join(" | ");
        if (typeof val === "object") return JSON.stringify(val);
        return String(val ?? "");
      }),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `raw_telemetry_${vehicleId}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-8">
      <h2 className="text-2xl font-bold text-orange-300 text-center">
        Raw Telemetry Logs
      </h2>

      {/* Controls */}
      <div className="border border-orange-500/30 rounded-2xl bg-black/40 backdrop-blur-sm p-6">
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <label className="text-orange-300 font-medium">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={fmtDate(today)}
              className="px-4 py-2 rounded-lg bg-gray-900/70 border border-orange-500/40 text-orange-100 focus:border-orange-500 transition"
            />
          </div>

          {/* Column Selection */}
          <div>
            <h3 className="text-orange-300 font-semibold mb-3">
              Select Columns to Display
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/50 border border-orange-500/30 cursor-pointer hover:bg-gray-800/70 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span className="text-orange-100 text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <button
              onClick={exportCSV}
              disabled={loading || data.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 transition"
            >
              Export Raw Data (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-orange-500/30 bg-black/40 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading && (
            <div className="p-12 text-center text-orange-300">
              Loading all telemetry for {selectedDate}...
            </div>
          )}

          {error && (
            <div className="p-12 text-center text-red-400">
              Error: {error}
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="p-12 text-center text-orange-300/70">
              No telemetry data available for {selectedDate}.
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <table className="w-full min-w-max text-sm">
              <thead className="bg-black/50 sticky top-0 border-b border-orange-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-orange-200 font-semibold">
                    Timestamp
                  </th>
                  {COLUMNS.filter((c) => selectedCols.has(c.key)).map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-4 text-left text-orange-200 font-semibold min-w-[140px]"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-500/10">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-orange-500/5 transition">
                    <td className="px-6 py-4 font-medium text-orange-100">
                      {row.recorded_at}
                    </td>
                    {COLUMNS.filter((c) => selectedCols.has(c.key)).map((col) => (
                      <td key={col.key} className="px-6 py-4 text-orange-100 text-xs">
                        <pre className="whitespace-pre-wrap break-words">
                          {formatValue(row[col.key])}
                        </pre>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== HELPERS ===== */
const fmtDate = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatValue = (val) => {
  if (val == null) return "-";
  if (Array.isArray(val)) return val.join(" | ");
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  if (typeof val === "string" && val.includes(":")) return val; // interval
  return String(val);
};