import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

/* ========================= MOTOR FAULTS ========================= */
export default function MotorFaults() {
  const { id } = useParams();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [selectedCodes, setSelectedCodes] = useState(new Set());

  /* ========================= FETCH ========================= */
  useEffect(() => {
    const fetchFaults = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const url = selectedDate
          ? `/api/faults/${id}?date=${selectedDate}`
          : `/api/faults/${id}?days=30`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load faults");

        const rows = await res.json();
        setLogs(rows || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFaults();
  }, [id, selectedDate]);

  /* ========================= HELPERS ========================= */
  const pretty = (code) =>
    code
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  /* ========================= COUNTS ========================= */
  const counts = useMemo(() => {
    const map = new Map();
    logs.forEach((l) => {
      map.set(l.code, (map.get(l.code) || 0) + 1);
    });
    return map;
  }, [logs]);

  /* ========================= FILTERED LOGS ========================= */
  const filtered = useMemo(() => {
    let list = logs;

    // Apply code filter
    if (selectedCodes.size > 0) {
      list = list.filter((l) => selectedCodes.has(l.code));
    }

    // Sort: Active first, then newest
    return [...list].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "ACTIVE" ? -1 : 1;
      }
      return new Date(b.recorded_at) - new Date(a.recorded_at);
    });
  }, [logs, selectedCodes]);

  const toggleCode = (code) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const clearDate = () => setSelectedDate("");

  /* ========================= CSV EXPORT ========================= */
  const exportCSV = () => {
    const rows = [
      ["Timestamp", "Code", "Description", "Status"],
      ...filtered.map((l) => [
        new Date(l.recorded_at).toLocaleString(),
        l.code,
        pretty(l.code),
        l.status,
      ]),
    ];

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `motor_faults_${selectedDate || "30days"}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ========================= UI STATES ========================= */
  if (loading)
    return (
      <div className="text-center py-16 text-orange-300">
        Loading faults…
      </div>
    );

  if (error)
    return (
      <div className="text-center py-16 text-red-400">
        Error: {error}
      </div>
    );

  const uniqueCodes = [...new Set(logs.map((l) => l.code))];

  return (
    <div className="space-y-8 pb-8">
      <h2 className="text-2xl font-bold text-orange-300 text-center">
        Motor Faults History
      </h2>

      {/* ===== DATE FILTER ===== */}
      <div className="flex justify-center items-center gap-4 flex-wrap">
        <label className="text-orange-300 text-sm font-medium">Filter by Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-900/80 border border-orange-500/40 text-orange-200 rounded-lg px-4 py-2 focus:border-orange-500 focus:outline-none transition"
        />
        {selectedDate && (
          <button
            onClick={clearDate}
            className="text-orange-400 hover:text-orange-300 underline text-sm transition"
          >
            Show last 30 days
          </button>
        )}
      </div>

      {/* ===== FAULT TYPE FILTER BUTTONS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedCodes(new Set())}
          className={`px-5 py-3 rounded-xl border font-medium transition ${
            selectedCodes.size === 0
              ? "border-orange-500 bg-orange-500/20 text-orange-300 shadow-md"
              : "border-orange-500/30 text-orange-200 bg-black/40 hover:bg-orange-500/10"
          }`}
        >
          All Faults ({logs.length})
        </button>

        {uniqueCodes.map((code) => (
          <button
            key={code}
            onClick={() => toggleCode(code)}
            className={`flex justify-between items-center px-5 py-3 rounded-xl border font-medium transition ${
              selectedCodes.has(code)
                ? "border-orange-500 bg-orange-500/20 text-orange-300 shadow-md"
                : "border-orange-500/30 text-orange-200 bg-black/40 hover:bg-orange-500/10"
            }`}
          >
            <span>{pretty(code)}</span>
            <span className="ml-3 text-xs px-2.5 py-1 rounded-full bg-orange-600/30 border border-orange-500/50">
              {counts.get(code) || 0}
            </span>
          </button>
        ))}
      </div>

      {/* ===== EXPORT BUTTON ===== */}
      <div className="flex justify-end">
        <button
          onClick={exportCSV}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition"
        >
          Export as CSV
        </button>
      </div>

      {/* ===== LOG TABLE ===== */}
      <div className="rounded-2xl border border-orange-500/30 bg-black/40 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 text-orange-200 border-b border-orange-500/20 flex justify-between items-center">
          <div>
            Showing <strong>{filtered.length}</strong> fault log{filtered.length !== 1 ? "s" : ""}
            {selectedDate && ` on ${selectedDate}`}
            {selectedCodes.size > 0 && " (filtered by type)"}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-orange-500/10">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-orange-300/70">
              No fault logs found for the selected filters.
            </div>
          ) : (
            filtered.map((l) => (
              <div
                key={l.dtc_id}
                className="px-6 py-4 flex justify-between items-center hover:bg-orange-500/5 transition"
              >
                <div>
                  <div className="font-medium text-orange-100">
                    {pretty(l.code)}
                  </div>
                  {l.description && (
                    <div className="text-sm text-orange-200/60 mt-1">
                      {l.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <span
                    className={`px-3 py-1.5 rounded-full font-medium text-xs border ${
                      l.status === "ACTIVE"
                        ? "bg-red-600/20 text-red-300 border-red-600/40"
                        : "bg-emerald-600/20 text-emerald-300 border-emerald-600/40"
                    }`}
                  >
                    {l.status}
                  </span>

                  <span className="text-orange-200/70">
                    {new Date(l.recorded_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}