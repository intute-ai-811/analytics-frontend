// // src/components/CustomerSplash.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import veloConnectLogo from "../assets/VeloConnect.png";

// export default function CustomerSplash() {
//   const navigate = useNavigate();
//   const [fadeOut, setFadeOut] = useState(false);

//   useEffect(() => {
//     const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
//     const timer = setTimeout(() => {
//       navigate("/dashboard", { replace: true });
//     }, 2500);

//     return () => {
//       clearTimeout(timer);
//       clearTimeout(fadeTimer);
//     };
//   }, [navigate]);

//   return (
//     <div
//       className={`min-h-screen flex items-center justify-center transition-opacity duration-700 ${
//         fadeOut ? "opacity-0" : "opacity-100"
//       }`}
//       style={{
//         background:
//           "radial-gradient(circle at top, #1a1f35, #0a0d14, #000000)",
//       }}
//     >
//       {/* Decorative Background Glow */}
//       <div className="absolute w-[500px] h-[500px] rounded-full bg-orange-500/20 blur-3xl opacity-40 animate-pulse" />

//       <div className="relative flex flex-col items-center animate-logo-enter">
//         {/* Glow under the logo */}
//         <div className="absolute w-72 h-72 bg-orange-500/30 blur-3xl rounded-full -z-10" />

//         <img
//           src={veloConnectLogo}
//           alt="VeloConnect"
//           className="w-72 h-auto object-contain drop-shadow-2xl"
//         />
//       </div>

//       <style>{`
//         @keyframes logo-enter {
//           0% {
//             opacity: 0;
//             transform: scale(0.8);
//           }
//           50% {
//             opacity: 1;
//             transform: scale(1.05);
//           }
//           100% {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }
//         .animate-logo-enter {
//           animation: logo-enter 1s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import veloConnectLogo from "../assets/VeloConnect.png";

export default function CustomerSplash() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const timer = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(fadeTimer);
    };
  }, [navigate]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(circle at center, #151228, #0a0814, #000000)",
      }}
    >
      {/* Neon Atmospheric Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />

      <div className="relative flex flex-col items-center animate-logo-enter">
        {/* Core Logo Glow */}
        <div className="absolute w-72 h-72 bg-pink-600/20 blur-[80px] rounded-full -z-10" />

        <img
          src={veloConnectLogo}
          alt="VeloConnect"
          className="w-72 h-auto object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]"
        />

        {/* Loading status */}
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-pink-400 opacity-60">
          Syncing Fleet Data...
        </p>
      </div>

      <style>{`
        @keyframes logo-enter {
          0% { opacity: 0; transform: scale(0.8); filter: brightness(0); }
          50% { opacity: 1; transform: scale(1.05); filter: brightness(1.2); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
        .animate-logo-enter {
          animation: logo-enter 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}