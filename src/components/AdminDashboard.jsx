// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  Search,
  RefreshCcw,
  Loader2,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/** 💠 Memoized Pill – prevents rerenders */
const Pill = React.memo(({ children }) => (
  <span className="px-2 py-1 text-xs rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-200">
    {children}
  </span>
));

/** Table Columns */
const columns = [
  { key: "index", label: "S.No", width: "w-20", sortable: false },
  { key: "vehicleType", label: "Vehicle Type", width: "w-44", sortable: true },
  { key: "vehicleNo", label: "Vehicle Number", width: "w-44", sortable: true },
  { key: "customer", label: "Customer Name", width: "w-56", sortable: true },
  { key: "vcuId", label: "VCU Model", width: "w-48", sortable: false },
  { key: "hmiId", label: "HMI Model", width: "w-48", sortable: false },
  { key: "delivery", label: "Delivery Date", width: "w-40", sortable: false },
  { key: "totalHours", label: "Total Hours", width: "w-32", sortable: false },
  { key: "totalKwh", label: "Total kWh", width: "w-32", sortable: false },
  { key: "avgKwh", label: "Avg kWh", width: "w-28", sortable: false },
  { key: "actions", label: "Actions", width: "w-32", sortable: false },
];

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "vehicleType", dir: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;

  /** 🔥 Fetch data (FAST now) */
  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/vehicle-master`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = res.data.map((row) => ({
        id: row.vehicle_master_id,
        vehicleType: `${row.vehicle_make || ""} ${row.vehicle_model || ""}`.trim() || "—",
        vehicleNo: row.vehicle_reg_no || "—",
        customer: row.company_name || "—",
        vcuId: row.vcu_display || "—",
        hmiId: row.hmi_display || "—",
        delivery: row.date_of_deployment
          ? new Date(row.date_of_deployment).toLocaleDateString("en-IN")
          : "—",
        totalHours: 0,
        totalKwh: 0,
        avgKwh: 0,
      }));

      setRows(mapped);
    } catch (e) {
      console.error("Fetch error:", e);
      setError("Failed to load vehicles. Please try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
    else {
      setError("Not authenticated. Please log in.");
      setLoading(false);
    }
  }, [token]);

  /** Refresh */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  /** Sorting */
  const onSort = (key, enabled) => {
    if (!enabled) return;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  /** Search + sorting */
  const filtered = useMemo(() => {
    let data = [...rows];
    const q = query.trim().toLowerCase();

    if (q) {
      data = data.filter((r) =>
        [r.customer, r.vehicleType, r.vehicleNo, r.vcuId, r.hmiId]
          .some((v) => v?.toString().toLowerCase().includes(q))
      );
    }

    if (["customer", "vehicleType", "vehicleNo"].includes(sort.key)) {
      const dir = sort.dir === "asc" ? 1 : -1;
      data.sort((a, b) => {
        const A = (a[sort.key] ?? "").toLowerCase();
        const B = (b[sort.key] ?? "").toLowerCase();
        return A.localeCompare(B) * dir;
      });
    }

    return data;
  }, [rows, query, sort]);

  /** Pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  /** Row click */
  const handleRowClick = (row) => {
    localStorage.setItem(
      "selectedVehicle",
      JSON.stringify({
        id: row.id,
        vehicleNo: row.vehicleNo,
        vehicleType: row.vehicleType,
        customer: row.customer,
      })
    );
    navigate(`/vehicle/${row.id}`);
  };

  /** CREATE */
  const handleCreate = async () => {
    const vehicle_unique_id = prompt("Enter Vehicle Unique ID:");
    if (!vehicle_unique_id) return;

    const customer_id = prompt("Enter Customer ID:");
    if (!customer_id) return;

    const vtype_id = prompt("Enter Vehicle Type ID:");
    if (!vtype_id) return;

    const vcu_hmi_id = prompt("Enter VCU+HMI ID (optional):");
    const vehicle_reg_no = prompt("Enter Vehicle Reg No (optional):");
    const date_of_deployment = prompt("Enter Date (YYYY-MM-DD):");

    try {
      await axios.post(
        `${API_BASE_URL}/vehicle-master`,
        {
          vehicle_unique_id,
          customer_id: parseInt(customer_id),
          vtype_id: parseInt(vtype_id),
          vcu_hmi_id: vcu_hmi_id ? parseInt(vcu_hmi_id) : null,
          vehicle_reg_no: vehicle_reg_no || null,
          date_of_deployment: date_of_deployment || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      setError("Vehicle created successfully!");
    } catch (e) {
      setError(e.response?.data?.error || "Failed to create vehicle");
    }
  };

  /** UPDATE */
  const handleUpdate = async (id) => {
    const reg = prompt("New Registration No:");
    const date = prompt("New Date (YYYY-MM-DD):");

    const updates = {};
    if (reg) updates.vehicle_reg_no = reg;
    if (date) updates.date_of_deployment = date;

    try {
      await axios.put(`${API_BASE_URL}/vehicle-master/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      setError("Vehicle updated!");
    } catch (e) {
      setError(e.response?.data?.error || "Update failed");
    }
  };

  /** DELETE */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete permanently?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/vehicle-master/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      setError("Vehicle deleted.");
    } catch (e) {
      setError(e.response?.data?.error || "Delete failed");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black overflow-x-hidden">

      {/* 🌟 Background Animation → only AFTER loading */}
      {!loading && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-10">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
            w-[120vmax] h-[120vmax] rounded-full border border-orange-500/10 
            animate-[spin_60s_linear_infinite]"
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
            w-[140vmax] h-[140vmax] rounded-full border border-red-500/10 
            animate-[spin_80s_linear_infinite_reverse]"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold 
            bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-orange-200/80">
            Manage all registered vehicles
          </p>
        </header>

        
        {/* Controls */}
{/* Controls */}
<div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">

  {/* 🔍 Bigger, Wider Search Bar */}
  <div className="relative w-full md:w-[480px] lg:w-[560px]">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300/70" />

    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search by Customer, Vehicle Type, Reg No, VCU, HMI..."
      className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-orange-500/30 
      text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 
      shadow-lg text-base"
    />
  </div>

  {/* 🔄 Refresh + ➕ Add Vehicle (old style restored) */}
  <div className="flex items-center gap-3">

    {/* Refresh Button */}
    <button
      onClick={onRefresh}
      disabled={refreshing}
      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 
      text-white font-semibold border border-orange-500/40 shadow-xl hover:shadow-2xl hover:scale-[1.03] 
      transition-all disabled:opacity-50"
    >
      {refreshing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCcw className="w-4 h-4" />
      )}
      Refresh
    </button>

    {/* Add Vehicle */}
    <button
      onClick={handleCreate}
      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold 
      border border-green-700 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all"
    >
      <Plus className="w-4 h-4" />
      Add Vehicle
    </button>

  </div>
</div>



        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border-2 border-orange-500/30 bg-gray-800/40 backdrop-blur shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-black/40 backdrop-blur">
  <tr className="text-left">
    {columns.map((c) => (
      <th
        key={c.key}
        className={`px-5 py-4 text-sm font-semibold uppercase tracking-wider text-orange-200/90 ${c.width} relative`}
      >
        <button
          className={`w-full flex items-center justify-center ${
            c.sortable ? "hover:text-white transition" : "cursor-default"
          }`}
          onClick={() => onSort(c.key, c.sortable)}
        >
          {/* Column Title */}
          <span>{c.label}</span>

          {/* Sort Icon — positioned at center-right */}
          {c.sortable && (
            <ArrowUpDown
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                sort.key === c.key ? "opacity-100" : "opacity-40"
              }`}
            />
          )}
        </button>
      </th>
    ))}
  </tr>
</thead>


              <tbody className="divide-y divide-orange-500/10">

                {/* 🔥 SUPER FAST LOADING ROW */}
                {loading && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-10 text-center text-orange-200/70"
                    >
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
                      <div className="mt-2">Loading data...</div>
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!loading && paged.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="py-10 text-center text-orange-200/80">
                      No vehicles found.
                    </td>
                  </tr>
                )}

                {/* Rows */}
                {!loading &&
                  paged.map((row, idx) => (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      className="cursor-pointer hover:bg-orange-500/5 transition"
                    >
                      <td className="px-5 py-4">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <Pill>{row.vehicleType}</Pill>
                      </td>
                      <td className="px-5 py-4">{row.vehicleNo}</td>
                      <td className="px-5 py-4">{row.customer}</td>
                      <td className="px-5 py-4 text-xs">{row.vcuId}</td>
                      <td className="px-5 py-4 text-xs">{row.hmiId}</td>
                      <td className="px-5 py-4">{row.delivery}</td>
                      <td className="px-5 py-4">{row.totalHours}</td>
                      <td className="px-5 py-4">{row.totalKwh}</td>
                      <td className="px-5 py-4">{row.avgKwh}</td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleUpdate(row.id)} className="text-blue-400 hover:text-blue-300">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center px-5 py-4 bg-black/40">
            <span className="text-xs text-orange-200/70">
              Showing {paged.length} of {filtered.length} results
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border border-orange-500/30 text-orange-200 disabled:opacity-50 hover:bg-orange-500/10"
              >
                Prev
              </button>

              <span className="text-orange-200/80">
                Page <b>{page}</b> / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border border-orange-500/30 text-orange-200 disabled:opacity-50 hover:bg-orange-500/10"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-[spin_60s_linear_infinite] {
          animation: spin 60s linear infinite;
        }
        .animate-[spin_80s_linear_infinite_reverse] {
          animation: spin 80s linear infinite reverse;
        }
      `}</style>
    </div>
  );
}
