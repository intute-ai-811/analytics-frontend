// // src/components/Header.jsx
// import React, { useState } from "react";
// import {
//   Power,
//   Database,
//   ArrowRight,
//   LayoutDashboard,
//   User,
//   Key,
//   Loader2,
//   CheckCircle,
//   XCircle,
//   Eye,
//   EyeOff,
//   Settings,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// // VITE_API_URL = bare origin only, no trailing /api
// //   production : VITE_API_URL=""
// //   local dev  : VITE_API_URL=http://localhost:5000
// const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// function Header({ user, onLogout }) {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [showMastersModal, setShowMastersModal] = useState(false);
//   const [showProfileModal, setShowProfileModal] = useState(false);

//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const [showCurrent, setShowCurrent] = useState(false);
//   const [showNew, setShowNew] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ text: "", type: "" });

//   const navigate = useNavigate();

//   const isAdmin = user?.role === "admin";
//   const isCustomer = user?.role === "customer";
//   const showSidebar = isAdmin || isCustomer;

//   const handleLogout = () => {
//     if (onLogout) onLogout();
//     navigate("/", { replace: true });
//   };

//   const toggleSidebar = () => setIsSidebarOpen((s) => !s);

//   const masters = [
//     { key: "customers",     label: "Customer Database",              to: "/masters/customers" },
//     { key: "vehicle-types", label: "Vehicle Type Master Database",   to: "/masters/vehicle-types" },
//     { key: "vcu",           label: "VCU Master Database",            to: "/masters/vcu" },
//     { key: "hmi",           label: "HMI Master Database",            to: "/masters/hmi" },
//     { key: "vehicles",      label: "Vehicle Master Database",        to: "/masters/vehicles" },
//   ];

//   const goTo = (to) => {
//     setShowMastersModal(false);
//     navigate(to);
//   };

//   const goToDashboard = () => {
//     setIsSidebarOpen(false);
//     if (isAdmin) navigate("/admin");
//     else if (isCustomer) navigate("/dashboard");
//   };

//   const handleChangePassword = async (e) => {
//     e.preventDefault();
//     setMessage({ text: "", type: "" });

//     if (newPassword !== confirmPassword) {
//       setMessage({ text: "New passwords do not match", type: "error" });
//       return;
//     }

//     if (newPassword.length < 8) {
//       setMessage({ text: "New password must be at least 8 characters", type: "error" });
//       return;
//     }

//     setLoading(true);

//     try {
//       const token = localStorage.getItem("token") || user?.token;

//       const res = await fetch(`${API_BASE_URL}/api/user/change-password`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           current_password: currentPassword,
//           new_password: newPassword,
//           confirm_password: confirmPassword,
//         }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         setMessage({ text: "Password changed successfully!", type: "success" });
//         setTimeout(() => {
//           setShowProfileModal(false);
//           setCurrentPassword("");
//           setNewPassword("");
//           setConfirmPassword("");
//           setMessage({ text: "", type: "" });
//         }, 2000);
//       } else {
//         setMessage({ text: data.error || "Failed to change password", type: "error" });
//       }
//     } catch (err) {
//       setMessage({ text: "Network error. Please try again.", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!user) return null;

//   return (
//     <>
//       {/* HEADER BAR */}
//       <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white shadow-2xl sticky top-0 z-20 border-b-2 border-orange-500/30">
//         <div className="max-w-[1200px] mx-auto flex items-center justify-between p-4 relative">
//           {showSidebar && (
//             <button
//               onClick={toggleSidebar}
//               className="p-3 rounded-xl bg-gray-800/50 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-all border border-orange-500/20"
//               aria-label="Open menu"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
//               </svg>
//             </button>
//           )}

//           <div className="ml-auto flex items-center gap-6">
//             <div className="text-right">
//               <p className="text-sm font-semibold text-orange-300">{user.name}</p>
//               <p className="text-xs text-orange-200/70">{user.email}</p>
//             </div>

//             <button
//               onClick={handleLogout}
//               className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white font-medium transition-all shadow-lg hover:shadow-xl"
//             >
//               <Power className="w-4 h-4" />
//               <span className="hidden sm:inline">Logout</span>
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* SIDEBAR */}
//       {showSidebar && (
//         <>
//           <div
//             className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white transform ${
//               isSidebarOpen ? "translate-x-0" : "-translate-x-full"
//             } transition-transform duration-300 ease-in-out z-30 shadow-2xl border-r-2 border-orange-500/30`}
//           >
//             <div className="flex items-center justify-between p-6 border-b border-orange-500/20">
//               <h2 className="text-lg font-bold">Menu</h2>
//               <button
//                 onClick={toggleSidebar}
//                 className="p-2 rounded-lg bg-gray-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <nav className="p-4 space-y-3">
//               {isAdmin && (
//                 <button
//                   onClick={() => setShowMastersModal(true)}
//                   className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-orange-500/30 bg-gray-900/40 text-white hover:bg-orange-500/10 transition group"
//                 >
//                   <div className="flex items-center gap-3">
//                     <Database className="w-5 h-5 text-orange-400 group-hover:text-orange-300" />
//                     <span className="font-medium">Edit Master Database</span>
//                   </div>
//                   <ArrowRight className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
//                 </button>
//               )}

//               <button
//                 onClick={goToDashboard}
//                 className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-orange-500/30 bg-gray-900/40 text-white hover:bg-orange-500/10 transition group"
//               >
//                 <div className="flex items-center gap-3">
//                   <LayoutDashboard className="w-5 h-5 text-orange-400 group-hover:text-orange-300" />
//                   <span className="font-medium">Go to Dashboard</span>
//                 </div>
//                 <ArrowRight className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
//               </button>

//               <button
//                 onClick={() => {
//                   setShowProfileModal(true);
//                   setIsSidebarOpen(false);
//                 }}
//                 className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-orange-500/30 bg-gray-900/40 text-white hover:bg-orange-500/10 transition group"
//               >
//                 <div className="flex items-center gap-3">
//                   <User className="w-5 h-5 text-orange-400 group-hover:text-orange-300" />
//                   <span className="font-medium">Edit Profile</span>
//                 </div>
//                 <ArrowRight className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
//               </button>
//             </nav>
//           </div>

//           {isSidebarOpen && (
//             <div className="fixed inset-0 bg-black/60 z-20" onClick={toggleSidebar} />
//           )}
//         </>
//       )}

//       {/* MASTERS MODAL */}
//       {isAdmin && showMastersModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div
//             className="absolute inset-0 bg-black/70"
//             onClick={() => setShowMastersModal(false)}
//           />
//           <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-2xl border border-orange-500/40 p-8 shadow-2xl">
//             <div className="flex items-center justify-between mb-8">
//               <div className="flex items-center gap-4">
//                 <Database className="w-8 h-8 text-orange-400" />
//                 <h3 className="text-2xl font-bold text-white">Master Databases</h3>
//               </div>
//               <button
//                 onClick={() => setShowMastersModal(false)}
//                 className="p-2 rounded-lg bg-gray-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <div className="space-y-4">
//               {masters.map((master) => (
//                 <button
//                   key={master.key}
//                   onClick={() => goTo(master.to)}
//                   className="w-full flex items-center gap-4 px-6 py-5 rounded-xl bg-gray-800/50 border border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-400 transition-all group"
//                 >
//                   <Settings className="w-6 h-6 text-orange-400 group-hover:text-orange-300" />
//                   <span className="text-left text-white font-medium flex-1">{master.label}</span>
//                   <ArrowRight className="w-5 h-5 text-orange-400 group-hover:text-orange-300 group-hover:translate-x-1 transition" />
//                 </button>
//               ))}
//             </div>

//             <div className="mt-8 text-center">
//               <button
//                 onClick={() => setShowMastersModal(false)}
//                 className="px-8 py-3 bg-gray-800 border border-orange-500/30 rounded-xl text-orange-200 hover:bg-gray-700 transition"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* EDIT PROFILE MODAL */}
//       {showProfileModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="absolute inset-0 bg-black/70" onClick={() => setShowProfileModal(false)} />
//           <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-2xl border border-orange-500/30 p-8 shadow-2xl">
//             <div className="flex items-center gap-3 mb-6">
//               <Key className="w-6 h-6 text-orange-400" />
//               <h3 className="text-2xl font-bold text-white">Change Password</h3>
//             </div>

//             <form onSubmit={handleChangePassword} className="space-y-5">
//               <div className="relative">
//                 <label className="block text-sm font-medium text-orange-200 mb-2">Current Password</label>
//                 <input
//                   type={showCurrent ? "text" : "password"}
//                   value={currentPassword}
//                   onChange={(e) => setCurrentPassword(e.target.value)}
//                   required
//                   className="w-full px-4 py-3 pr-12 bg-gray-800 border border-orange-500/30 rounded-lg text-white focus:border-orange-400 outline-none transition"
//                 />
//                 <button type="button" onClick={() => setShowCurrent(!showCurrent)}
//                   className="absolute right-3 top-10 text-orange-400 hover:text-orange-300 transition">
//                   {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>

//               <div className="relative">
//                 <label className="block text-sm font-medium text-orange-200 mb-2">New Password</label>
//                 <input
//                   type={showNew ? "text" : "password"}
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   required
//                   minLength="8"
//                   className="w-full px-4 py-3 pr-12 bg-gray-800 border border-orange-500/30 rounded-lg text-white focus:border-orange-400 outline-none transition"
//                 />
//                 <button type="button" onClick={() => setShowNew(!showNew)}
//                   className="absolute right-3 top-10 text-orange-400 hover:text-orange-300 transition">
//                   {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>

//               <div className="relative">
//                 <label className="block text-sm font-medium text-orange-200 mb-2">Confirm New Password</label>
//                 <input
//                   type={showConfirm ? "text" : "password"}
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   required
//                   className="w-full px-4 py-3 pr-12 bg-gray-800 border border-orange-500/30 rounded-lg text-white focus:border-orange-400 outline-none transition"
//                 />
//                 <button type="button" onClick={() => setShowConfirm(!showConfirm)}
//                   className="absolute right-3 top-10 text-orange-400 hover:text-orange-300 transition">
//                   {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>

//               {message.text && (
//                 <div className={`flex items-center gap-2 p-3 rounded-lg ${
//                   message.type === "success"
//                     ? "bg-green-500/20 text-green-300 border border-green-500/40"
//                     : "bg-red-500/20 text-red-300 border border-red-500/40"
//                 }`}>
//                   {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
//                   <span className="text-sm">{message.text}</span>
//                 </div>
//               )}

//               <div className="flex gap-3 pt-4">
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-bold text-white disabled:opacity-60 transition"
//                 >
//                   {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Changing...</> : "Change Password"}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => setShowProfileModal(false)}
//                   className="px-6 py-3 bg-gray-800 border border-orange-500/30 rounded-xl text-orange-200 hover:bg-gray-700 transition"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default Header;

// src/components/Header.jsx
import React, { useState } from "react";
import {
  Power,
  Database,
  ArrowRight,
  LayoutDashboard,
  User,
  Key,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// Theme Constants
const C = {
  purple: "#8b5cf6",
  pink: "#ec4899",
  glass: "rgba(15, 12, 33, 0.8)",
  border: "rgba(255, 255, 255, 0.1)",
  textMuted: "#9ca3af",
};

function Header({ user, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMastersModal, setShowMastersModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";
  const showSidebar = isAdmin || isCustomer;

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/", { replace: true });
  };

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);

  const masters = [
    { key: "customers", label: "Customer Database", to: "/masters/customers" },
    {
      key: "vehicle-types",
      label: "Vehicle Type Master",
      to: "/masters/vehicle-types",
    },
    { key: "vcu", label: "VCU Master Database", to: "/masters/vcu" },
    { key: "hmi", label: "HMI Master Database", to: "/masters/hmi" },
    {
      key: "vehicles",
      label: "Vehicle Master Database",
      to: "/masters/vehicles",
    },
  ];

  const goTo = (to) => {
    setShowMastersModal(false);
    navigate(to);
  };

  const goToDashboard = () => {
    setIsSidebarOpen(false);
    if (isAdmin) navigate("/admin");
    else if (isCustomer) navigate("/dashboard");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: "Must be at least 8 characters", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || user?.token;
      const res = await fetch(`${API_BASE_URL}/api/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Success! Password updated.", type: "success" });
        setTimeout(() => {
          setShowProfileModal(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setMessage({ text: "", type: "" });
        }, 2000);
      } else {
        setMessage({ text: data.error || "Update failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <style>{`
        .header-glass {
          background: ${C.glass};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid ${C.border};
        }
        .sidebar-glass {
          background: rgba(10, 8, 20, 0.95);
          backdrop-filter: blur(30px);
          border-right: 1px solid ${C.border};
        }
        .nav-item {
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .nav-item:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateX(4px);
        }
        .modal-glass {
          background: rgba(15, 12, 30, 0.9);
          backdrop-filter: blur(40px);
          border: 1px solid ${C.border};
          box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }
        .cyber-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid ${C.border};
          color: white;
          outline: none;
          transition: all 0.2s;
        }
        .cyber-input:focus {
          border-color: ${C.purple};
          background: rgba(139, 92, 246, 0.05);
        }
      `}</style>

      {/* HEADER BAR */}
      <header className="header-glass sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-3">
          {showSidebar && (
            <button
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p
                className="text-sm font-bold text-white tracking-tight"
                style={{ fontFamily: "Space Grotesk" }}
              >
                {user.name}
              </p>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
                {user.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-bold text-xs transition-all uppercase tracking-tighter"
            >
              <Power className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-80 sidebar-glass z-50 transform transition-transform duration-500 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <h2
              className="text-lg font-bold tracking-tighter uppercase"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Terminal Menu
            </h2>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:text-purple-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-6 space-y-3">
          {isAdmin && (
            <button
              onClick={() => {
                setShowMastersModal(true);
                setIsSidebarOpen(false);
              }}
              className="w-full nav-item flex items-center justify-between p-4 rounded-xl text-left"
            >
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-sm">Fleet Databases</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-30" />
            </button>
          )}

          <button
            onClick={goToDashboard}
            className="w-full nav-item flex items-center justify-between p-4 rounded-xl text-left"
          >
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-sm">Control Center</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-30" />
          </button>

          <button
            onClick={() => {
              setShowProfileModal(true);
              setIsSidebarOpen(false);
            }}
            className="w-full nav-item flex items-center justify-between p-4 rounded-xl text-left"
          >
            <div className="flex items-center gap-4">
              <User className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-sm">Security Profile</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-30" />
          </button>
        </nav>

        <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
            Authenticated as
          </p>
          <p className="text-xs font-bold text-white truncate">{user.email}</p>
        </div>
      </aside>

     {isAdmin && showMastersModal && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all"
    onClick={() => setShowMastersModal(false)} // Overlay closes modal
  >
    <div
      className="relative w-full max-w-lg modal-glass rounded-[24px] p-6 overflow-hidden"
      onClick={(e) => e.stopPropagation()} // Prevents clicking inside modal from closing it
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-[80px]" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tighter" style={{ fontFamily: "Space Grotesk" }}>
            Registry
          </h3>
          <p className="text-sm text-gray-400">Manage master system records</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // CRITICAL: Stop the event from reaching the overlay
            setShowMastersModal(false);
          }}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition cursor-pointer z-10"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {masters.map((master) => (
          <button
            key={master.key}
            onClick={() => goTo(master.to)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
          >
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white font-bold text-sm flex-1 text-left">
              {master.label}
            </span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        ))}
      </div>
    </div>
  </div>
)}

      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowProfileModal(false)}
          />
          <div
            className="relative w-full max-w-md modal-glass rounded-[32px] p-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-pink-500/10 rounded-xl">
                <Key className="w-6 h-6 text-pink-400" />
              </div>
              <h3
                className="text-2xl font-extrabold tracking-tighter"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Update Credentials
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                {
                  id: "curr",
                  label: "Current Password",
                  val: currentPassword,
                  set: setCurrentPassword,
                  show: showCurrent,
                  setShow: setShowCurrent,
                },
                {
                  id: "new",
                  label: "New Password",
                  val: newPassword,
                  set: setNewPassword,
                  show: showNew,
                  setShow: setShowNew,
                },
                {
                  id: "conf",
                  label: "Confirm New",
                  val: confirmPassword,
                  set: setConfirmPassword,
                  show: showConfirm,
                  setShow: setShowConfirm,
                },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={field.show ? "text" : "password"}
                      value={field.val}
                      onChange={(e) => field.set(e.target.value)}
                      required
                      className="w-full cyber-input px-4 py-3.5 rounded-xl text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => field.setShow(!field.show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                    >
                      {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {message.text && (
                <div
                  className={`flex items-center gap-2 p-4 rounded-xl text-xs font-bold border ${
                    message.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  {message.text}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Authorize Change"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="w-full py-3 text-gray-500 hover:text-white text-xs font-bold transition"
                >
                  Abort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
