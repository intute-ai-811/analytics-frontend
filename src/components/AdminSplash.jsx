// src/components/AdminSplash.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import veloConnectLogo from "../assets/VeloConnect.png";

export default function AdminSplash() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out just before navigation
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1800); // fade after 1.8 sec

    const timer = setTimeout(() => {
      navigate("/admin", { replace: true });
    }, 2500); // navigate after 2.5 sec

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
        background:
          "radial-gradient(circle at top, #1a1f35, #0a0d14, #000000)",
      }}
    >
      {/* Decorative Background Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-orange-500/20 blur-3xl opacity-40 animate-pulse"></div>

      <div className="relative flex flex-col items-center animate-logo-enter">
        {/* Glow under the logo */}
        <div className="absolute w-72 h-72 bg-orange-500/30 blur-3xl rounded-full -z-10"></div>

        <img
          src={veloConnectLogo}
          alt="VeloConnect Pro"
          className="w-72 h-auto object-contain drop-shadow-2xl"
        />
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes logo-enter {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-logo-enter {
          animation: logo-enter 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
