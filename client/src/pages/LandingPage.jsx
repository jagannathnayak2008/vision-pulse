import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ScanEye,
  Cpu,
  Zap,
  Target,
  FileCheck2,
  GitCompare,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const domains = [
    {
      title: "Manufacturing Quality Control",
      subtitle: "PCBs, Weld Seams & Precision Assembly",
      desc: "Micro-defect detection for solder bridges, cold joints, surface fissures, and component placement tolerances under IPC-A-610.",
      icon: Cpu,
      color: "from-emerald-500/20 to-cyan-500/10 border-emerald-500/30 text-emerald-400",
    },
    {
      title: "Civil Infrastructure & Integrity",
      subtitle: "Bridges, Towers, Concrete & Pipelines",
      desc: "Automated crack propagation tracking, spalling assessment, corrosion mapping, and structural degradation under ASTM-E284 standards.",
      icon: Layers,
      color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
    },
    {
      title: "Workplace Safety & EHS Auditing",
      subtitle: "PPE Enforcement & Machinery Hazards",
      desc: "Real-time compliance monitoring for ANSI hardhats, high-vis vests, machine pinch guards, and blocked emergency fire exit corridors.",
      icon: ShieldCheck,
      color: "from-rose-500/20 to-amber-500/10 border-rose-500/30 text-rose-400",
    },
    {
      title: "Technical Document & Gauge OCR",
      subtitle: "Analog Dials, Schematics & Nameplates",
      desc: "Instant dial needle telemetry, out-of-bounds pressure warnings, NIST calibration badge auditing, and serial barcode digitizing.",
      icon: FileCheck2,
      color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px]">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                OptiGuard
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                AI VISION
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
          >
            <span>Launch Workbench</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Radar & Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-6 shadow-sm shadow-cyan-500/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>GEMINI 2.5 FLASH MULTIMODAL COMPUTER VISION ENGINE</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Automated Visual Inspection, Spatial Anomaly Localization &{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Operational Intelligence
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Eliminate subjective manual inspection bottlenecks. Transform raw photos, live webcam
          feeds, and technical scans into normalized 2D bounding boxes, root-cause diagnostics, and
          actionable engineering workflows in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/inspect/new"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition flex items-center gap-2"
          >
            <ScanEye className="w-4 h-4" />
            <span>Start Live Visual Inspection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Use 1-Click Demo Account</span>
          </Link>
        </div>

        {/* Live Interactive Benchmark Mockup Preview */}
        <div className="mt-14 w-full max-w-4xl p-2 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-2xl">
          <div className="p-4 bg-[#070b14] rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 text-slate-200 font-semibold">
                  SURFACE DEFECT MAPPING ENGINE [IPC-A-610 CLASS 3]
                </span>
              </span>
              <span className="text-cyan-400">STATUS: FAIL_CRITICAL (42/100)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="md:col-span-2 relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-4 min-h-[220px] flex items-center justify-center">
                <div className="relative border-2 border-emerald-500/60 p-6 rounded-lg bg-emerald-950/20 text-center">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400 mb-2">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <span className="font-mono text-xs text-slate-300">
                    ARM CORTEX-M7 [PCB-SMT-44091-B]
                  </span>
                  {/* Highlighted Bounding Box */}
                  <div className="absolute top-2 right-2 border-2 border-rose-500 bg-rose-500/20 px-2 py-1 rounded text-[10px] font-mono font-bold text-rose-300 animate-pulse">
                    Solder Bridge Short (98.4%)
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-3">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  Root-Cause Diagnostic
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Excessive solder paste deposition in stencil aperture or thermal over-dwell during
                  reflow cycle.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-cyan-400 flex items-center justify-between">
                  <span>Remediation:</span>
                  <span className="text-slate-300">Microscope Wick Rework</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Specialized Domains */}
      <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Tailored Computer Vision Across Four Industrial Domains
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Each domain dynamically adjusts AI detection sensitivities, compliance standards, and
            remediation workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {domains.map((d, idx) => {
            const Icon = d.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${d.color} border flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{d.title}</h3>
                  <p className="text-xs font-mono text-cyan-400 mt-1">{d.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{d.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 px-6 text-center text-xs text-slate-400 font-mono">
        OptiGuard AI • Automated Visual Inspection & Operational Intelligence Platform • Powered by
        Google Gemini Vision (@google/genai)
      </footer>
    </div>
  );
}

