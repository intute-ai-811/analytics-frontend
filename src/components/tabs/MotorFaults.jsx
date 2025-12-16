import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

/* ========================= MOTOR FAULTS ========================= */
export default function MotorFaults() {
  const { id } = useParams();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());

  /* ========================= FETCH ========================= */
  useEffect(() => {
    const fetchFaults = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`/api/faults/${id}?days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load faults");

        const rows = await res.json();
        setLogs(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFaults();
  }, [id]);

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
    const list = selected.size
      ? logs.filter((l) => selected.has(l.code))
      : logs;

    return [...list].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "ACTIVE" ? -1 : 1;
      }
      return new Date(b.recorded_at) - new Date(a.recorded_at);
    });
  }, [logs, selected]);

  const toggle = (code) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  };

  /* ========================= CSV EXPORT ========================= */
  const exportCSV = () => {
    const rows = [
      ["timestamp", "code", "description", "status"],
      ...filtered.map((l) => [
        new Date(l.recorded_at).toISOString(),
        l.code,
        l.description,
        l.status,
      ]),
    ];

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "faults.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ========================= UI STATES ========================= */
  if (loading)
    return (
      <div className="text-center py-12 text-orange-200">
        Loading faults…
      </div>
    );

  if (error)
    return (
      <div className="text-center py-12 text-red-400">
        Error: {error}
      </div>
    );

  const uniqueCodes = [...new Set(logs.map((l) => l.code))];

  /* ========================= RENDER ========================= */
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-orange-300 text-center">
        Faults History (Last 30 Days)
      </h2>

      {/* === FILTER BUTTONS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => setSelected(new Set())}
          className={`px-4 py-3 rounded-xl border ${
            selected.size === 0
              ? "border-orange-500 bg-orange-500/20 text-orange-300"
              : "border-orange-500/30 text-orange-200 bg-black/40 hover:bg-orange-500/10"
          }`}
        >
          All Faults
        </button>

        {uniqueCodes.map((code) => (
          <button
            key={code}
            onClick={() => toggle(code)}
            className={`flex justify-between items-center px-4 py-3 rounded-xl border ${
              selected.has(code)
                ? "border-orange-500 bg-orange-500/20 text-orange-300"
                : "border-orange-500/30 text-orange-200 bg-black/40 hover:bg-orange-500/10"
            }`}
          >
            <span>{pretty(code)}</span>
            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/40">
              {counts.get(code)}
            </span>
          </button>
        ))}
      </div>

      {/* === EXPORT === */}
      <div className="flex justify-end">
        <button
          onClick={exportCSV}
          className="px-5 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white rounded-xl font-semibold border border-orange-500/40 shadow-lg hover:shadow-xl hover:scale-[1.02] transition"
        >
          Export as CSV
        </button>
      </div>

      {/* === LOG TABLE === */}
      <div className="rounded-xl border border-orange-500/30 bg-black/30 overflow-hidden">
        <div className="px-4 py-3 text-sm text-orange-200/80 border-b border-orange-500/20">
          Showing <b>{filtered.length}</b> log(s)
          {selected.size ? " (filtered)" : ""}
        </div>

        <div className="max-h-[360px] overflow-auto divide-y divide-orange-500/10">
          {filtered.map((l) => (
            <div
              key={l.dtc_id}
              className="px-4 py-3 flex justify-between items-center"
            >
              <div className="text-orange-200">
                {pretty(l.code)}
              </div>

              <div className="flex gap-4 text-sm items-center">
                <span
                  className={`px-2 py-0.5 rounded ${
                    l.status === "ACTIVE"
                      ? "bg-red-600/20 text-red-200 border border-red-600/30"
                      : "bg-emerald-600/20 text-emerald-200 border border-emerald-600/30"
                  }`}
                >
                  {l.status}
                </span>

                <span className="text-orange-200/70">
                  {new Date(l.recorded_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-orange-200/70">
              No logs match filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
