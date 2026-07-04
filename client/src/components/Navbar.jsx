// client/src/components/Navbar.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppContent from "../context/AppContent";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { backendUrl, userData, setUserData } = useContext(AppContent);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef();
  const mobileMenuRef = useRef();

  // Detect scroll for navbar style
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const listener = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const listener = (e) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, []);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
      setUserData(null);
      localStorage.removeItem("userData");
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
      window.location.href = "/login";
    }
  };

  const handleNavLinkClick = (href) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate("/")}
            role="link"
            aria-label="MeetOnMemory Home"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/")}
          >
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              className="w-8 h-8 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-semibold text-lg text-gray-800 tracking-tight">
              MeetOnMemory
            </span>
          </div>

          {/* Desktop nav links */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavLinkClick(link.href)}
                className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side — user area */}
          <div className="flex items-center gap-3">
            {userData ? (
              <>
                {/* Role + org info */}
                <div className="text-sm text-gray-700 font-medium tracking-wide hidden sm:block">
                  <span className="capitalize">
                    {userData?.role
                      ? userData.role.charAt(0).toUpperCase() +
                        userData.role.slice(1).toLowerCase()
                      : "Member"}
                  </span>
                  {userData?.organization?.name && (
                    <>
                      {" "}
                      |{" "}
                      <span className="font-semibold text-blue-700">
                        {userData.organization.name.toUpperCase()}
                      </span>
                    </>
                  )}
                </div>

                {/* Avatar + dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((s) => !s)}
                    className="w-9 h-9 rounded-full bg-linear-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-expanded={menuOpen}
                    aria-label="Open user menu"
                  >
                    {userData?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
                      style={{ zIndex: 1000 }}
                      role="menu"
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/dashboard");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        role="menuitem"
                      >
                        Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        role="menuitem"
                      >
                        Profile
                      </button>

                      {userData?.role === "admin" && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/admin-panel");
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          role="menuitem"
                        >
                          Admin Panel
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/settings");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        role="menuitem"
                      >
                        Settings
                      </button>

                      <div className="border-t border-gray-100" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 rounded-full bg-linear-to-r from-blue-600 to-violet-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Login to MeetOnMemory"
              >
                Login
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => setMobileOpen((s) => !s)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav menu */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <nav
          className="bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-1"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavLinkClick(link.href)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              tabIndex={mobileOpen ? 0 : -1}
            >
              {link.label}
            </button>
          ))}
          {!userData && (
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate("/login?mode=signup");
              }}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:shadow-lg transition-all duration-200"
              tabIndex={mobileOpen ? 0 : -1}
            >
              Get Started — It&apos;s Free
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
