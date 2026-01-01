// src/pages/customer/CustomerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  Search,
  RefreshCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PAGE_SIZE = 8;

/** Table columns — customer view */
const columns = [
  { key: "index",       label: "S.No",           width: "w-20", sortable: false },
  { key: "vehicleType", label: "Vehicle Type",   width: "w-44", sortable: true  },
  { key: "vehicleNo",   label: "Vehicle Number", width: "w-44", sortable: true  },
  { key: "vcuId",       label: "VCU Model",      width: "w-48", sortable: false },
  { key: "hmiId",       label: "HMI Model",      width: "w-48", sortable: false },
  { key: "delivery",    label: "Delivery Date",  width: "w-40", sortable: false },
  { key: "totalHours",  label: "Total Hours",    width: "w-32", sortable: false },
  { key: "totalKwh",    label: "Total kWh",      width: "w-32", sortable: false },
  { key: "avgKwh",      label: "Avg kWh",        width: "w-28", sortable: false },
];

const Pill = React.memo(({ children }) => (
  <span className="px-2 py-1 text-xs rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-200">
    {children}
  </span>
));

const safe = (v) => (v && String(v).trim() ? String(v).trim() : "—");

export default function CustomerDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "vehicleType", dir: "asc" });
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;

  /* ============================================================
     FETCH CUSTOMER VEHICLES
  ============================================================ */
  const fetchData = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/vehicle-master/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mapped = (res.data || []).map((row) => ({
        id: row.vehicle_master_id,

        vehicleType:
          `${row.vehicle_make || ""} ${row.vehicle_model || ""}`.trim() || "—",

        vehicleNo: safe(row.vehicle_reg_no),

        vcuId:
          row.vcu_make && row.vcu_model
            ? `${row.vcu_make} ${row.vcu_model}`
            : "—",

        hmiId:
          row.hmi_make && row.hmi_model
            ? `${row.hmi_make} ${row.hmi_model}`
            : "—",

        delivery: row.date_of_deployment
          ? new Date(row.date_of_deployment).toLocaleDateString("en-IN")
          : "—",

        totalHours: 0,
        totalKwh: 0,
        avgKwh: 0,
      }));

      setRows(mapped);
    } catch (err) {
      console.error("CustomerDashboard fetch error:", err);
      setError("Failed to load your vehicles.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Not authenticated. Please log in.");
      setLoading(false);
      return;
    }
    fetchData();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  /* ============================================================
     SORTING
  ============================================================ */
  const onSort = (key, enabled) => {
    if (!enabled) return;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  useEffect(() => setPage(1), [query]);

  /* ============================================================
     FILTER + SORT
  ============================================================ */
  const filtered = useMemo(() => {
    let data = [...rows];
    const q = query.trim().toLowerCase();

    if (q) {
      data = data.filter((r) =>
        [r.vehicleType, r.vehicleNo]
          .some((v) => v?.toLowerCase().includes(q))
      );
    }

    if (["vehicleType", "vehicleNo"].includes(sort.key)) {
      const dir = sort.dir === "asc" ? 1 : -1;
      data.sort((a, b) =>
        a[sort.key].localeCompare(b[sort.key]) * dir
      );
    }

    return data;
  }, [rows, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  /* ============================================================
     NAVIGATION
  ============================================================ */
  const handleRowClick = (row) => {
    localStorage.setItem(
      "selectedVehicle",
      JSON.stringify({
        id: row.id,
        vehicleNo: row.vehicleNo,
        vehicleType: row.vehicleType,
      })
    );
    navigate(`/vehicle/${row.id}`);
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
          My Vehicles
        </h1>
        <p className="text-center text-orange-200/70 mb-8">
          View and monitor your registered vehicles
        </p>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Vehicle Type or Reg No..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-orange-500/30 text-white"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-orange-500/30 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-black/40">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-orange-200">
                    <button
                      onClick={() => onSort(c.key, c.sortable)}
                      className="flex items-center gap-1"
                    >
                      {c.label}
                      {c.sortable && <ArrowUpDown className="w-4 h-4" />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10">
                    <Loader2 className="inline animate-spin text-orange-400" />
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-orange-200/70">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                paged.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-orange-500/5 cursor-pointer"
                  >
                    <td className="px-4 py-3">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3"><Pill>{row.vehicleType}</Pill></td>
                    <td className="px-4 py-3">{row.vehicleNo}</td>
                    <td className="px-4 py-3 text-xs">{row.vcuId}</td>
                    <td className="px-4 py-3 text-xs">{row.hmiId}</td>
                    <td className="px-4 py-3">{row.delivery}</td>
                    <td className="px-4 py-3">{row.totalHours}</td>
                    <td className="px-4 py-3">{row.totalKwh}</td>
                    <td className="px-4 py-3">{row.avgKwh}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-orange-200/80">
          <span>
            Showing {paged.length} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
