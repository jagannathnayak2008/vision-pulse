import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  ScanEye,
  GitCompare,
  History,
  BarChart3,
  UserCheck,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Layers },
    { to: "/inspect/new", label: "New Scan", icon: ScanEye },
    { to: "/inspect/compare", label: "Delta Compare", icon: GitCompare },
    { to: "/inspections", label: "Audit Log", icon: History },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/profile", label: "Settings", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  OptiGuard
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  AI VISION
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-wider hidden sm:block">
                MULTIMODAL OPERATIONAL INTELLIGENCE
              </p>
            </div>
          </Link>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <Link
            to="/inspect/new"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition shadow-md shadow-cyan-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Visual Scan</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* User profile dropdown badge */}
          <div className="flex items-center gap-3 pl-1">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{user?.fullName || "Inspector"}</span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                {user?.organization || "OptiGuard Ops"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400">
              {user?.fullName ? user.fullName[0].toUpperCase() : "I"}
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-[#0d1322] hidden lg:flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="px-2 py-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Inspection Modules
              </span>
            </div>
            <nav className="space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Engine Status Block */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                VISION ENGINE
              </span>
              <span className="font-mono text-cyan-400 font-bold">2.5-FLASH</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Tenant Security:</span>
              <span className="text-slate-300">RLS Isolated</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-[#090d16]/95 backdrop-blur-lg lg:hidden p-6 flex flex-col justify-between">
            <nav className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-200 hover:bg-slate-800 text-base"
                  >
                    <Icon className="w-5 h-5 text-cyan-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-sm text-slate-400">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-grid-pattern p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

