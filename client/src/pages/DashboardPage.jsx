import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { analyticsApi, inspectionApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ScanEye,
  GitCompare,
  AlertOctagon,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  FileText,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentInspections, setRecentInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [summaryRes, recentRes] = await Promise.all([
          analyticsApi.getSummary(),
          inspectionApi.getAll({ limit: 5 }),
        ]);

        setMetrics(summaryRes.data.metrics);
        setRecentInspections(recentRes.data.inspections || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case "PASS":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "CONDITIONAL_WARNING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "FAIL_CRITICAL":
      default:
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0e1e36] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              OPERATIONAL HUB
            </span>
            <span className="text-xs text-slate-400 font-mono">
              TENANT: {user?.organization || "OptiGuard Ops"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
            Welcome back, {user?.fullName || "Inspector"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Live multimodal Computer Vision engine active. Review detected micro-defects, execute
            Before/After visual deltas, or inspect new component batches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/inspect/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition"
          >
            <ScanEye className="w-4 h-4" />
            <span>New Visual Scan</span>
          </Link>
          <Link
            to="/inspect/compare"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <span>Delta Analyzer</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inspections */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Scans Run</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ScanEye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {metrics ? metrics.totalInspections : "—"}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">audits stored</span>
          </div>
          <div className="mt-3 text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
            <span>+100% Isolated to your tenant</span>
          </div>
        </div>

        {/* Card 2: Critical Failure Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Critical Failure Rate</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">
              {metrics ? `${metrics.criticalFailureRate}%` : "—"}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({metrics?.verdictBreakdown?.FAIL_CRITICAL || 0} flagged)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Requires active engineering rework</span>
          </div>
        </div>

        {/* Card 3: Average Asset Health Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg. Asset Health Score</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {metrics ? `${metrics.averageHealthScore}/100` : "—"}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics?.averageHealthScore || 0}%` }}
            />
          </div>
        </div>

        {/* Card 4: Mean AI Confidence */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Mean AI Confidence</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {metrics ? `${metrics.averageConfidence}%` : "—"}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 font-mono">
            Calibrated against gemini-2.5-flash
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Inspections & Domain Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Inspections Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Visual Inspections</h3>
              <p className="text-xs text-slate-400">Latest spatial scans across your facility</p>
            </div>
            <Link
              to="/inspections"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInspections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <ScanEye className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">No inspections performed yet.</p>
              <Link
                to="/inspect/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20"
              >
                Launch First Scan
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentInspections.map((insp) => (
                <Link
                  key={insp.id}
                  to={`/inspections/${insp.id}`}
                  className="py-3 px-2 rounded-xl hover:bg-slate-850/60 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={insp.image_data_url}
                      alt={insp.title}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                          {insp.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${getVerdictBadge(
                            insp.verdict
                          )}`}
                        >
                          {insp.verdict}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                        <span>{insp.asset_identifier}</span>
                        <span>•</span>
                        <span>{insp.facility_location}</span>
                        <span>•</span>
                        <span>Health: {insp.health_score}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-cyan-400 flex-shrink-0">
                    <span className="text-xs font-mono hidden sm:inline">
                      {insp.anomaly_count || 0} defects
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Domain Breakdown & Quick Launch */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Inspections by Domain</h3>
            <div className="space-y-3">
              {[
                {
                  key: "MANUFACTURING_QC",
                  label: "Manufacturing & PCB QC",
                  color: "bg-emerald-500",
                },
                {
                  key: "INFRASTRUCTURE_CIVIL",
                  label: "Civil Infrastructure",
                  color: "bg-blue-500",
                },
                {
                  key: "WORKPLACE_SAFETY_EHS",
                  label: "Workplace Safety & EHS",
                  color: "bg-rose-500",
                },
                {
                  key: "DOCUMENT_GAUGE_OCR",
                  label: "Document & Gauge OCR",
                  color: "bg-amber-500",
                },
              ].map((domain) => {
                const count = metrics?.domainBreakdown?.[domain.key] || 0;
                const total = metrics?.totalInspections || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={domain.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{domain.label}</span>
                      <span className="font-mono text-slate-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`${domain.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Preset Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              1-Click Benchmark Studio
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Test PCB micro-solder bridging, bridge concrete fractures, warehouse PPE checks, or
              analog pressure dials instantly without uploading local files.
            </p>
            <Link
              to="/inspect/new"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition"
            >
              <span>Explore Benchmark Presets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

