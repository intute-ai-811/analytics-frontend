// // src/components/LoginModal.jsx
// import React, { useState } from "react";
// import { Eye, EyeOff, Lock, User, LogIn, AlertCircle } from "lucide-react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// import intuteLogo from "../assets/IntuteAIYellow.png";

// // VITE_API_URL = bare origin only, no trailing /api
// //   production : VITE_API_URL=""
// //   local dev  : VITE_API_URL=http://localhost:5000
// const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// export default function LoginModal({ onClose, onAuth }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();

//   const handleLogin = async () => {
//     if (!email || !password) {
//       setError("Both email and password are required.");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const { data } = await axios.post(
//         `${API_BASE_URL}/api/auth/login`,
//         { email, password },
//         { headers: { "Content-Type": "application/json" } }
//       );

//       const { token, user } = data;

//       localStorage.setItem("token", token);

//       const authPayload = {
//         token,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       };
//       localStorage.setItem("user", JSON.stringify(authPayload));
//       localStorage.setItem("loginPassword", password);

//       if (typeof onAuth === "function") {
//         try {
//           onAuth({ token, user });
//         } catch (e) {
//           console.error(e);
//         }
//       }

//       try {
//         window.dispatchEvent(
//           new CustomEvent("auth:login", { detail: { token, user } })
//         );
//       } catch (e) {
//         console.error(e);
//       }

//       const isAdmin = user.role === "admin";
//       const target = isAdmin ? "/admin/splash" : "/customer/splash";

//       navigate(target, {
//         replace: true,
//         state: { fromLogin: true, ts: Date.now() },
//       });

//       setTimeout(() => {
//         if (window.location.pathname !== target) {
//           window.location.replace(target);
//         }
//       }, 50);

//       onClose?.();
//     } catch (err) {
//       const message =
//         err?.response?.data?.error ||
//         err?.response?.data?.message ||
//         "Invalid credentials. Please try again.";
//       setError(message);
//       console.error("Login failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !loading) handleLogin();
//   };

//   const handleReset = () => {
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     localStorage.removeItem("loginPassword");
//     setEmail("");
//     setPassword("");
//     setError("");
//   };

//   const animationStyles = `
//     @keyframes grid-move {
//       0%   { transform: translate(0, 0); }
//       100% { transform: translate(50px, 50px); }
//     }
//     @keyframes spin-slow {
//       from { transform: rotate(0deg); }
//       to   { transform: rotate(360deg); }
//     }
//     @keyframes pulse-slow {
//       0%, 100% { opacity: 0.3; }
//       50%       { opacity: 0.6; }
//     }
//     .animate-spin-slow  { animation: spin-slow  15s linear      infinite; }
//     .animate-pulse-slow { animation: pulse-slow  4s ease-in-out infinite; }
//   `;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center p-6">
//       <style>{animationStyles}</style>

//       <div className="absolute inset-0 opacity-10">
//         <div
//           className="absolute inset-0"
//           style={{
//             backgroundImage: `
//               linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
//               linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)
//             `,
//             backgroundSize: "50px 50px",
//             animation: "grid-move 20s linear infinite",
//           }}
//         />
//       </div>

//       <div className="absolute inset-0 pointer-events-none">
//         <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-2 border-orange-500/20 animate-spin-slow" />
//         <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-orange-500/10 to-red-500/10 animate-pulse-slow" />
//       </div>

//       <div className="relative w-full max-w-md">
//         <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl border-2 border-orange-500/30 shadow-2xl overflow-hidden">
//           <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />

//           {loading && (
//             <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-3xl z-50">
//               <div className="flex flex-col items-center space-y-4">
//                 <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
//                 <span className="text-white font-medium text-lg">
//                   Authenticating...
//                 </span>
//               </div>
//             </div>
//           )}

//           <div className="pt-12 pb-10 px-8">
//             <div className="flex flex-col items-center mb-10">
//               <img
//                 src={intuteLogo}
//                 alt="INTUTE"
//                 className="h-20 md:h-24 lg:h-28 w-auto mx-auto object-contain"
//               />
//             </div>

//             {error && (
//               <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3">
//                 <AlertCircle className="w-5 h-5 text-red-400" />
//                 <span className="text-red-300 text-sm">{error}</span>
//               </div>
//             )}

//             <div className="mb-6">
//               <div className="relative">
//                 <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
//                 <input
//                   type="email"
//                   placeholder="Email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   onKeyDown={handleKeyPress}
//                   className="w-full pl-12 pr-4 py-4 bg-black/40 border border-orange-500/30 rounded-xl focus:border-orange-400 text-white placeholder-gray-400"
//                   disabled={loading}
//                   autoComplete="username"
//                 />
//               </div>
//             </div>

//             <div className="mb-8">
//               <div className="relative">
//                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   onKeyDown={handleKeyPress}
//                   className="w-full pl-12 pr-14 py-4 bg-black/40 border border-orange-500/30 rounded-xl focus:border-orange-400 text-white placeholder-gray-400"
//                   disabled={loading}
//                   autoComplete="current-password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400"
//                   disabled={loading}
//                 >
//                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>
//             </div>

//             <button
//               onClick={handleLogin}
//               disabled={loading}
//               className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
//             >
//               <LogIn className="w-5 h-5" />
//               {loading ? "Logging in..." : "Login"}
//             </button>

//             <button
//               onClick={handleReset}
//               className="w-full mt-4 py-3 text-orange-300 border border-orange-500/30 rounded-xl hover:bg-orange-500/10 transition-colors"
//               disabled={loading}
//             >
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// src/components/LoginModal.jsx
// src/components/LoginModal.jsx
import React, { useState } from "react";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_TOKEN } from "../demo/demoData";
import { installDemoInterceptor } from "../demo/interceptor";

// Note: Ensure this path matches your file structure
import IntuteLogo from "../assets/Intute.png";

/**
 * Environment Configuration
 * production : VITE_API_URL=""
 * local dev  : VITE_API_URL=http://localhost:5000
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// Theme Constants
const C = {
  purple: "#8b5cf6",
  pink: "#ec4899",
  bg: "radial-gradient(circle at 20% 20%, #1a0f2e, #050509)",
  card: "rgba(20,15,35,0.85)",
  border: "rgba(255,255,255,0.08)",
  text: "#e5e7eb",
  muted: "#9ca3af",
};

export default function LoginModal({ onClose, onAuth }) {
  // --- State Management ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // --- Login Logic (Integrated from Snippet 1) ---
  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault(); // Handle form submission

    if (!email || !password) {
      setError("Both email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    // ── Demo mode bypass ──────────────────────────────────────────────────────
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const demoUser = { name: "Demo User", email: DEMO_EMAIL, role: "admin" };
      const authPayload = { token: DEMO_TOKEN, ...demoUser };
      localStorage.setItem("token", DEMO_TOKEN);
      localStorage.setItem("user", JSON.stringify(authPayload));
      localStorage.setItem("loginPassword", DEMO_PASSWORD);
      installDemoInterceptor();
      try {
        window.dispatchEvent(new CustomEvent("auth:login", { detail: { token: DEMO_TOKEN, user: demoUser } }));
      } catch (e) { /* ignore */ }
      const target = "/admin/splash";
      navigate(target, { replace: true, state: { fromLogin: true, ts: Date.now() } });
      setTimeout(() => {
        if (window.location.pathname !== target) window.location.replace(target);
      }, 50);
      setLoading(false);
      onClose?.();
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { token, user } = data;

      // 1. Persist to Local Storage
      localStorage.setItem("token", token);
      const authPayload = {
        token,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      localStorage.setItem("user", JSON.stringify(authPayload));
      localStorage.setItem("loginPassword", password);

      // 2. Trigger onAuth Callback
      if (typeof onAuth === "function") {
        try {
          onAuth({ token, user });
        } catch (e) {
          console.error("onAuth callback error:", e);
        }
      }

      // 3. Dispatch Custom Event
      try {
        window.dispatchEvent(
          new CustomEvent("auth:login", { detail: { token, user } })
        );
      } catch (e) {
        console.error("CustomEvent dispatch error:", e);
      }

      // 4. Role-based Navigation
      const isAdmin = user.role === "admin";
      const target = isAdmin ? "/admin/splash" : "/customer/splash";

      navigate(target, {
        replace: true,
        state: { fromLogin: true, ts: Date.now() },
      });

      // Fallback redirect if navigation fails to trigger
      setTimeout(() => {
        if (window.location.pathname !== target) {
          window.location.replace(target);
        }
      }, 50);

      onClose?.();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Invalid credentials. Please try again.";
      setError(message);
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Reset Logic ---
  const handleReset = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("loginPassword");
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        color: C.text,
      }}
    >
      {/* Dynamic Styles Injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=Space+Grotesk:wght@500;700&display=swap');
        
        .login-root { font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; display: flex; justify-content: center; }
        
        .header-text {
          font-family: 'Space Grotesk', sans-serif;
          background: linear-gradient(to bottom, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }

        .login-card {
          background: ${C.card};
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 32px;
          border: 1px solid ${C.border};
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
          width: 90%;
          max-width: 400px;
          padding: 40px; 
          position: relative;
          z-index: 10;
        }

        .login-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 32px; padding: 1px;
          background: linear-gradient(135deg, ${C.purple}80, ${C.pink}80);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude; pointer-events: none;
        }

        .input-group-modern {
          margin-bottom: 18px;
          position: relative;
        }

        .input-group-modern label {
          display: block;
          color: ${C.muted};
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          margin-left: 2px;
        }

        .input-group-modern input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 14px 18px;
          color: #fff;
          font-size: 14px;
          transition: all 0.25s ease;
          outline: none;
          box-sizing: border-box;
        }

        .input-group-modern input:focus {
          border-color: ${C.purple};
          background: rgba(139, 92, 246, 0.08);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 36px;
          background: none;
          border: none;
          color: ${C.muted};
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .btn-submit {
          background: #fff;
          color: #050509;
          border: none;
          border-radius: 14px;
          padding: 16px;
          width: 100%;
          font-weight: 700;
          font-size: 14px;
          margin-top: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 15px 30px -10px rgba(255,255,255,0.2);
        }

        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-reset {
          background: none;
          border: 1px solid ${C.border};
          color: ${C.muted};
          border-radius: 12px;
          padding: 10px;
          width: 100%;
          font-weight: 500;
          font-size: 12px;
          margin-top: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-reset:hover:not(:disabled) {
          background: rgba(255,255,255,0.03);
          color: #fff;
        }

        .blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; z-index: 0; }
      `}</style>

      {/* Decorative BG Blobs */}
      <div
        className="blob"
        style={{
          width: "40vw",
          height: "40vw",
          background: C.purple,
          top: "-10%",
          right: "-10%",
        }}
      />
      <div
        className="blob"
        style={{
          width: "35vw",
          height: "35vw",
          background: C.pink,
          bottom: "-10%",
          left: "-10%",
        }}
      />

      <div className="login-root">
        <div className="login-card">
          {/* Logo and Header */}
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div
              style={{
                background: `${C.purple}20`,
                width: 90,
                height: 48,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                border: `1px solid ${C.purple}40`,
              }}
            >
              <img
                src={IntuteLogo}
                alt="INTUTE"
                style={{
                  width: 80,
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 8px rgba(139,92,246,0.3))",
                }}
              />
            </div>
            <h2 className="header-text">Terminal Access</h2>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
              Identity verification required
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                color: "#fca5a5",
                fontSize: 12,
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="input-group-modern">
              <label>Administrator ID</label>
              <input
                type="email"
                placeholder="admin@intuteai.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div className="input-group-modern">
              <label>Passcode</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Security Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Action Buttons */}
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? (
                "Authorizing..."
              ) : (
                <>
                  <LogIn size={18} /> Continue
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn-reset"
              disabled={loading}
            >
              Clear Session
            </button>
          </form>

          {/* Encryption Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 30,
              opacity: 0.3,
              justifyContent: "center",
            }}
          >
            <div style={{ height: 1, background: C.muted, flex: 1 }} />
            <span
              style={{
                fontSize: 9,
                color: C.muted,
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              ENCRYPTED SESSION
            </span>
            <div style={{ height: 1, background: C.muted, flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );
}