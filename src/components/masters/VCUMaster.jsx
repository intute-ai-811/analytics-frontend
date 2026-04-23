// import React, { useEffect, useMemo, useState } from "react";
// import { Search, Download, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
// import axios from "axios";

// /* ===================== API ===================== */
// // VITE_API_URL = bare origin only, no trailing /api
// //   production : VITE_API_URL=""
// //   local dev  : VITE_API_URL=http://localhost:5000
// const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api/vcu`;

// const getAuthHeaders = () => {
//   const user = JSON.parse(localStorage.getItem("user") || "{}");
//   return user.token ? { Authorization: `Bearer ${user.token}` } : {};
// };

// export default function VCUMaster() {
//   const [rows, setRows] = useState([]);
//   const [query, setQuery] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [showModal, setShowModal] = useState(false);
//   const [editing, setEditing] = useState(null);

//   const [form, setForm] = useState({
//     vcu_make: "",
//     vcu_model: "",
//     serial_number: "",
//     vcu_specs: "",
//   });

//   /* ===================== FETCH ===================== */
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const { data } = await axios.get(API_BASE, { headers: getAuthHeaders() });
//       setRows(Array.isArray(data) ? data : []);
//     } catch (e) {
//       setError(e.response?.data?.error || "Failed to load VCUs");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   /* ===================== SEARCH ===================== */
//   const filtered = useMemo(() => {
//     if (!query.trim()) return rows;
//     const q = query.toLowerCase();
//     return rows.filter((r) =>
//       `${r.vcu_make} ${r.vcu_model} ${r.serial_number}`.toLowerCase().includes(q)
//     );
//   }, [rows, query]);

//   /* ===================== MODAL ===================== */
//   const openNew = () => {
//     setEditing(null);
//     setForm({ vcu_make: "", vcu_model: "", serial_number: "", vcu_specs: "" });
//     setShowModal(true);
//   };

//   const openEdit = (r) => {
//     setEditing(r);
//     setForm({
//       vcu_make: r.vcu_make || "",
//       vcu_model: r.vcu_model || "",
//       serial_number: r.serial_number?.toUpperCase() || "",
//       vcu_specs: r.vcu_specs || "",
//     });
//     setShowModal(true);
//   };

//   /* ===================== SAVE ===================== */
//   const saveForm = async () => {
//     if (!form.vcu_make.trim() || !form.vcu_model.trim()) {
//       return alert("VCU Make and Model are required");
//     }
//     if (!form.serial_number.trim()) {
//       return alert("Serial number is required");
//     }

//     const payload = {
//       vcu_make: form.vcu_make.trim().toUpperCase(),
//       vcu_model: form.vcu_model.trim(),
//       serial_number: form.serial_number.trim().toUpperCase(),
//       vcu_specs: form.vcu_specs?.trim() || null,
//     };

//     try {
//       if (!editing) {
//         const { data } = await axios.post(API_BASE, payload, { headers: getAuthHeaders() });
//         setRows((prev) => [{ ...payload, vcu_id: data.vcu_id }, ...prev]);
//       } else {
//         await axios.put(`${API_BASE}/${editing.vcu_id}`, payload, { headers: getAuthHeaders() });
//         setRows((prev) =>
//           prev.map((r) => r.vcu_id === editing.vcu_id ? { ...r, ...payload } : r)
//         );
//       }
//       setShowModal(false);
//     } catch (e) {
//       alert(e.response?.data?.error || "Save failed");
//     }
//   };

//   /* ===================== DELETE ===================== */
//   const removeRow = async (id) => {
//     if (!confirm("Delete this VCU?")) return;
//     try {
//       await axios.delete(`${API_BASE}/${id}`, { headers: getAuthHeaders() });
//       setRows((prev) => prev.filter((r) => r.vcu_id !== id));
//     } catch (e) {
//       alert(e.response?.data?.error || "Cannot delete VCU");
//     }
//   };

//   /* ===================== CSV ===================== */
//   const exportCSV = () => {
//     const headers = "VCU Make,VCU Model,Serial Number,VCU Specs\n";
//     const csv = rows
//       .map((r) =>
//         [r.vcu_make, r.vcu_model, r.serial_number, r.vcu_specs || ""]
//           .map((v) => `"${v}"`)
//           .join(",")
//       )
//       .join("\n");

//     const blob = new Blob([headers + csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "vcu_master.csv";
//     a.click();
//   };

//   /* ===================== UI ===================== */
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
//       <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
//         <div className="text-center">
//           <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
//             VCU Master
//           </h1>
//           <p className="text-orange-300">Physical Vehicle Control Units</p>
//         </div>

//         {/* Toolbar */}
//         <div className="flex gap-4">
//           <div className="flex-1 relative max-w-md">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
//             <input
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search by make, model, or serial..."
//               className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-orange-500/30"
//             />
//           </div>
//           <button onClick={exportCSV} className="px-4 py-3 rounded-xl bg-gray-800 border border-orange-500/30 flex gap-2">
//             <Download className="w-4 h-4" /> Export
//           </button>
//           <button onClick={openNew} className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-bold flex gap-2">
//             <Plus className="w-5 h-5" /> Add VCU
//           </button>
//         </div>

//         {loading && <div className="text-center py-8">Loading VCUs…</div>}
//         {error && (
//           <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl flex gap-2">
//             <AlertCircle /> {error}
//           </div>
//         )}

//         {/* Table */}
//         <div className="bg-gray-800/50 rounded-2xl border border-orange-500/30 overflow-hidden">
//           <table className="w-full">
//             <thead className="bg-black/50">
//               <tr>
//                 {["Make", "Model", "Serial Number", "Specs", "Actions"].map((h) => (
//                   <th key={h} className="px-6 py-4 text-left text-orange-200">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="text-center py-16 text-orange-400">No VCUs found</td>
//                 </tr>
//               ) : (
//                 filtered.map((r) => (
//                   <tr key={r.vcu_id} className="border-t border-orange-500/10">
//                     <td className="px-6 py-4 font-bold">{r.vcu_make}</td>
//                     <td className="px-6 py-4">{r.vcu_model}</td>
//                     <td className="px-6 py-4 font-mono text-sm uppercase">{r.serial_number}</td>
//                     <td className="px-6 py-4 text-sm">{r.vcu_specs || "-"}</td>
//                     <td className="px-6 py-4">
//                       <button onClick={() => openEdit(r)} className="p-2 hover:bg-orange-500/20 rounded">
//                         <Pencil className="w-4 h-4" />
//                       </button>
//                       <button onClick={() => removeRow(r.vcu_id)} className="p-2 hover:bg-red-500/20 rounded ml-2">
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Modal */}
//         {showModal && (
//           <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
//             <div className="bg-gray-900 p-8 rounded-2xl border-2 border-orange-500 w-full max-w-3xl">
//               <h2 className="text-2xl font-bold text-orange-300 mb-6">
//                 {editing ? "Edit" : "Add"} VCU
//               </h2>

//               <div className="grid grid-cols-2 gap-4">
//                 <Input
//                   label="VCU Make *"
//                   value={form.vcu_make}
//                   onChange={(v) => setForm({ ...form, vcu_make: v.toUpperCase() })}
//                   className="uppercase tracking-wide"
//                 />
//                 <Input
//                   label="VCU Model *"
//                   value={form.vcu_model}
//                   onChange={(v) => setForm({ ...form, vcu_model: v })}
//                 />
//                 <Input
//                   label="Serial Number *"
//                   value={form.serial_number}
//                   onChange={(v) => {
//                     const cleaned = v.replace(/[^A-Z0-9\-_.:/]/gi, "").toUpperCase();
//                     setForm({ ...form, serial_number: cleaned });
//                   }}
//                   className="uppercase font-mono tracking-wide"
//                   placeholder="e.g. VCU-01/2025.A"
//                 />
//                 <TextArea
//                   label="VCU Specs"
//                   value={form.vcu_specs}
//                   onChange={(v) => setForm({ ...form, vcu_specs: v })}
//                 />
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl border border-orange-500/30">
//                   Cancel
//                 </button>
//                 <button onClick={saveForm} className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-bold">
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ===================== Reusable Components ===================== */
// function Input({ label, value, onChange, className = "", ...props }) {
//   return (
//     <label className="block">
//       <span className="text-orange-300 text-sm">{label}</span>
//       <input
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className={`mt-1 w-full px-4 py-2 rounded-lg bg-gray-800 border border-orange-500/30 text-white ${className}`}
//         {...props}
//       />
//     </label>
//   );
// }

// function TextArea({ label, value, onChange }) {
//   return (
//     <label className="block col-span-2">
//       <span className="text-orange-300 text-sm">{label}</span>
//       <textarea
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         rows={3}
//         className="mt-1 w-full px-4 py-2 rounded-lg bg-gray-800 border border-orange-500/30 text-white"
//       />
//     </label>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, Plus, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api/vcu`;

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.token ? { Authorization: `Bearer ${user.token}` } : {};
};

export default function VCUMaster() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_BASE, { headers: getAuthHeaders() });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      `${r.vcu_make} ${r.vcu_model} ${r.serial_number}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  const startAdd = () =>
    setEditing({
      vcu_make: "",
      vcu_model: "",
      serial_number: "",
      vcu_specs: "",
    });
  const startEdit = (r) => setEditing({ ...r });
  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing.vcu_make?.trim() || !editing.vcu_model?.trim())
      return alert("Make and Model required");
    try {
      if (!editing.vcu_id) {
        const { data } = await axios.post(API_BASE, editing, {
          headers: getAuthHeaders(),
        });
        setRows((prev) => [{ ...editing, vcu_id: data.vcu_id }, ...prev]);
      } else {
        await axios.put(`${API_BASE}/${editing.vcu_id}`, editing, {
          headers: getAuthHeaders(),
        });
        setRows((prev) =>
          prev.map((r) =>
            r.vcu_id === editing.vcu_id ? { ...r, ...editing } : r
          )
        );
      }
      setEditing(null);
    } catch (e) {
      alert("Save failed");
    }
  };

  const doDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${confirmId}`, {
        headers: getAuthHeaders(),
      });
      setRows((prev) => prev.filter((r) => r.vcu_id !== confirmId));
    } catch (e) {
      alert("Delete failed");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b18] via-[#111124] to-[#1a1035] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            VCU Master Database
          </h1>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search VCU units..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={startAdd}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add VCU
          </button>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl border border-purple-500/30 bg-gray-800/40 backdrop-blur-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/50 text-purple-200">
              <tr>
                {["Make", "Model", "Serial", "Specs", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {filtered.map((r) => (
                <tr key={r.vcu_id} className="hover:bg-purple-500/5">
                  <td className="px-6 py-4 text-center font-semibold text-purple-200">
                    {r.vcu_make}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-300">
                    {r.vcu_model}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-purple-300">
                    {r.serial_number}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-300">
                    {r.vcu_specs || "-"}
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmId(r.vcu_id)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODALS */}
        {editing && (
          <Modal
            title={editing.vcu_id ? "Edit VCU" : "Add VCU"}
            onClose={cancelEdit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Make *"
                value={editing.vcu_make}
                onChange={(v) => setEditing({ ...editing, vcu_make: v })}
              />
              <Input
                label="Model *"
                value={editing.vcu_model}
                onChange={(v) => setEditing({ ...editing, vcu_model: v })}
              />
              <Input
                label="Serial *"
                value={editing.serial_number}
                onChange={(v) => setEditing({ ...editing, serial_number: v })}
              />
              <div className="md:col-span-2">
                <Input
                  label="Specs"
                  value={editing.vcu_specs}
                  onChange={(v) => setEditing({ ...editing, vcu_specs: v })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelEdit}
                className="px-5 py-2 border border-purple-500/30 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl font-bold"
              >
                Save
              </button>
            </div>
          </Modal>
        )}
        {/* DELETE CONFIRMATION MODAL */}
        {confirmId && (
          <Modal title="Delete VCU?" onClose={() => setConfirmId(null)}>
            <p className="mb-6 text-purple-200">
              Are you sure you want to delete this VCU? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="px-5 py-2 border border-purple-500/30 rounded-xl hover:bg-purple-500/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition"
              >
                Delete
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-purple-500/40 p-5 z-10">
        <div className="flex justify-between mb-3">
          <h2 className="text-2xl font-bold text-purple-300">{title}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm text-purple-300">{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
      />
    </label>
  );
}
