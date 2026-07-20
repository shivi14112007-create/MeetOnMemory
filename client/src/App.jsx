import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Routes ---
import PublicRoutes from "./routes/PublicRoutes.jsx";
import ProtectedRoutes from "./routes/ProtectedRoutes.jsx";

import Home from "./pages/Home.jsx"; // 👈 Fallback page

import Navbar from "./components/Navbar";
import ScrollNavigator from "./components/ScrollNavigator";

// --- Components ---
import Footer from "./components/Footer.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const App = () => {
  const location = useLocation();

  const hideFooterRoutes = ["/login"];
  const shouldShowFooter = !hideFooterRoutes.includes(location.pathname);

  // Only activate navigation controller panel when exactly on the landing page fold
  const shouldShowScrollNavigator = location.pathname === "/";

  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsMobile(!mediaQuery.matches);
    if (!mediaQuery.matches) return;

    // Keep track of real mouse coordinates and rendering coordinates
    const mouse = { x: 0, y: 0 };
    const dot = { x: 0, y: 0 };
    const ring = { x: 0, y: 0 };

    // DOM references obtained directly for maximum frames-per-second performance
    let dotEl = null;
    let ringEl = null;
    let animationFrameId = null;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!dotEl) dotEl = document.querySelector(".custom-cursor");
      if (!ringEl) ringEl = document.querySelector(".custom-cursor-ring");
      if (dotEl && ringEl) {
        dotEl.style.opacity = "1";
        ringEl.style.opacity = "1";
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button"
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => {
      if (dotEl && ringEl) {
        dotEl.style.opacity = "0";
        ringEl.style.opacity = "0";
      }
    };

    const handleMouseEnter = () => {
      if (dotEl && ringEl) {
        dotEl.style.opacity = "1";
        ringEl.style.opacity = "1";
      }
    };

    // The Tick function handles the fluid physics loop
    const tick = () => {
      if (!dotEl) dotEl = document.querySelector(".custom-cursor");
      if (!ringEl) ringEl = document.querySelector(".custom-cursor-ring");

      if (dotEl && ringEl) {
        // Inner dot follows instantly (1:1 ratio)
        dot.x = mouse.x;
        dot.y = mouse.y;
        dotEl.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%)`;

        // Outer circle glides smoothly lagging behind (using 15% interpolation speed)
        ring.x += (mouse.x - ring.x) * 0.15;
        ring.y += (mouse.y - ring.y) * 0.15;
        ringEl.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <ErrorBoundary>
        {/* Toast Notifications */}
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        <Routes>
          {PublicRoutes}
          {ProtectedRoutes}
          {/* ✅ Fallback route — send unknown routes to Home */}
          <Route path="*" element={<Home />} />
        </Routes>

        {/* Floating Section Controller overlay */}
        {shouldShowScrollNavigator && <ScrollNavigator />}

        {/* Global Footer */}
        {shouldShowFooter && <Footer />}

        {!isMobile && (
          <>
            <div className={`custom-cursor ${isHovered ? "hovered" : ""}`} />
            <div
              className={`custom-cursor-ring ${isHovered ? "hovered" : ""}`}
            />
          </>
        )}
      </ErrorBoundary>
    </div>
  );
};

export default App;
