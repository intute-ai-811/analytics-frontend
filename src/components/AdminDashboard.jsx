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

/** 💠 Memoized Pill */
const Pill = React.memo(({ children }) => (
  <span className="px-2 py-1 text-xs rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-200">
    {children}
  </span>
));

/** Table Columns */
const columns = [
  { key: "index", label: "S.No", width: "w-20", sortable: false },
  { key: "vehicleType", label: "Vehicle Type", width: "w-44", sortable: true },
  { key: "capacity", label: "Vehicle Capacity", width: "w-28", sortable: false },
  { key: "vehicleNo", label: "Vehicle Number", width: "w-44", sortable: true },
  { key: "customer", label: "Customer Name", width: "w-56", sortable: true },
  // { key: "vcu", label: "VCU Model", width: "w-48", sortable: false },
  // { key: "hmi", label: "HMI Model", width: "w-48", sortable: false },
  // { key: "delivery", label: "Delivery Date", width: "w-40", sortable: false },
  { key: "totalHours", label: "Total Hours", width: "w-32", sortable: false },
  { key: "totalKwh", label: "Total kWh", width: "w-32", sortable: false },
  { key: "avgKwh", label: "Avg kWh", width: "w-28", sortable: false },
  { key: "track", label: "Track Location", width: "w-40", sortable: false },
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

  /* =========================
     FETCH DATA
  ========================= */
  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/vehicle-master`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = res.data.map((row) => ({
        id: row.vehicle_master_id,

        vehicleType:
          `${row.vehicle_make || ""} ${row.vehicle_model || ""}`.trim() || "—",
        capacity: row.vehicle_capacity || "—",
        vehicleNo: row.vehicle_reg_no || "—",
        customer: row.company_name || "—",

        // vcu:
        //   row.vcu_make && row.vcu_model
        //     ? `${row.vcu_make} ${row.vcu_model}`
        //     : "—",

        // hmi:
        //   row.hmi_make && row.hmi_model
        //     ? `${row.hmi_make} ${row.hmi_model}`
        //     : "—",

        // delivery: row.date_of_deployment
        //   ? new Date(row.date_of_deployment).toLocaleDateString("en-IN")
        //   : "—",

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

  /* =========================
     REFRESH
  ========================= */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  /* =========================
     SORT
  ========================= */
  const onSort = (key, enabled) => {
    if (!enabled) return;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  /* =========================
     FILTER + SORT
  ========================= */
  const filtered = useMemo(() => {
    let data = [...rows];
    const q = query.trim().toLowerCase();

    if (q) {
      data = data.filter((r) =>
        [r.customer, r.vehicleType, r.capacity, r.vehicleNo].some((v) =>
          v?.toLowerCase().includes(q)
        )
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

  /* =========================
     PAGINATION
  ========================= */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  /* =========================
     ROW CLICK
  ========================= */
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

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-orange-200/80 text-sm">
            Manage all registered vehicles
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative w-full md:w-[520px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Customer, Vehicle, VCU, HMI..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-orange-500/30 text-white"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 text-white"
          >
            {refreshing ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500 rounded-xl flex gap-2">
            <AlertCircle className="text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* TABLE */}
        <div className="rounded-2xl border border-orange-500/30 bg-gray-800/40 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-black/40">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-5 py-4 text-orange-200 uppercase text-sm"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center">
                    <Loader2 className="animate-spin mx-auto text-orange-400" />
                  </td>
                </tr>
              )}

              {!loading &&
                paged.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-orange-500/10 cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <Pill>{row.vehicleType}</Pill>
                    </td>
                    <td className="px-5 py-4 text-sm">{row.capacity}</td>
                    <td className="px-5 py-4">{row.vehicleNo}</td>
                    <td className="px-5 py-4">{row.customer}</td>
                    {/* <td className="px-5 py-4 text-xs">{row.vcu}</td>
                    <td className="px-5 py-4 text-xs">{row.hmi}</td>
                    <td className="px-5 py-4">{row.delivery}</td> */}
                    <td className="px-5 py-4">{row.totalHours}</td>
                    <td className="px-5 py-4">{row.totalKwh}</td>
                    <td className="px-5 py-4">{row.avgKwh}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/vehicle/${row.id}/track`);
                        }}
                        className="px-3 py-1 rounded-lg text-sm bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
