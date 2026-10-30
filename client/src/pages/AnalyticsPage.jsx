import React, { useState, useEffect } from "react";
import { analyticsApi } from "../services/api";
import {
  BarChart3,
  PieChart,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Loader2,
} from "lucide-react";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await analyticsApi.getSummary();
        setMetrics(res.data.metrics);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="mt-3 text-xs font-mono text-slate-400">COMPUTING OPERATIONAL ANALYTICS...</span>
      </div>
    );
  }

  const verdict = metrics?.verdictBreakdown || { PASS: 0, CONDITIONAL_WARNING: 0, FAIL_CRITICAL: 0 };
  const total = metrics?.totalInspections || 1;

  const passPct = Math.round((verdict.PASS / total) * 100);
  const warnPct = Math.round((verdict.CONDITIONAL_WARNING / total) * 100);
  const failPct = Math.round((verdict.FAIL_CRITICAL / total) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            QUALITY ASSURANCE INTELLIGENCE
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-white mt-1">
          Operational Analytics & Compliance Metrics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Longitudinal defect distributions, pass/fail yields, and Computer Vision confidence aggregations.
        </p>
      </div>

      {/* Top 3 High-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Total Localized Defects</span>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {metrics?.totalAnomalies || 0}
          </div>
          <span className="text-[11px] text-cyan-400 font-mono mt-2 block">
            Across {metrics?.totalInspections || 0} evaluated units
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Critical Defect Frequency</span>
          <div className="text-3xl font-extrabold text-rose-400 font-mono mt-2">
            {metrics?.criticalFailureRate || 0}%
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-2 block">
            Yield quarantine trigger rate
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-medium">Mean Optical Confidence</span>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-2">
            {metrics?.averageConfidence || 0}%
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-2 block">
            Calibrated multimodal accuracy
          </span>
        </div>
      </div>

      {/* Grid: Verdict Distribution & Top Defect Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Verdict Ratios */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            Inspection Yield & Verdict Breakdown
          </h3>

          <div className="space-y-4 pt-2">
            {/* PASS */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  PASS (Compliant)
                </span>
                <span className="font-mono text-slate-300">
                  {verdict.PASS} ({passPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${passPct}%` }} />
              </div>
            </div>

            {/* CONDITIONAL WARNING */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  CONDITIONAL_WARNING (Sub-Optimal)
                </span>
                <span className="font-mono text-slate-300">
                  {verdict.CONDITIONAL_WARNING} ({warnPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${warnPct}%` }} />
              </div>
            </div>

            {/* FAIL CRITICAL */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  FAIL_CRITICAL (Non-Compliant)
                </span>
                <span className="font-mono text-slate-300">
                  {verdict.FAIL_CRITICAL} ({failPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${failPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Top Defect Categories */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Top Detected Defect Categories
          </h3>

          <div className="space-y-3 pt-2">
            {metrics?.topDefectCategories?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No defect categories categorized yet.
              </p>
            ) : (
              metrics?.topDefectCategories?.map((cat, idx) => {
                const totalAnom = metrics.totalAnomalies || 1;
                const catPct = Math.round((cat.count / totalAnom) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-medium">{cat.category}</span>
                      <span className="font-mono text-cyan-400">
                        {cat.count} occurrences ({catPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white">Severity Level Aggregation</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "CRITICAL", key: "CRITICAL", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
            { label: "HIGH", key: "HIGH", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
            { label: "MEDIUM", key: "MEDIUM", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
            { label: "LOW", key: "LOW", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
            { label: "INFO", key: "INFO", color: "text-slate-300 border-slate-700 bg-slate-800" },
          ].map((s) => (
            <div
              key={s.key}
              className={`p-3.5 rounded-xl border text-center font-mono ${s.color}`}
            >
              <span className="text-[10px] font-bold block">{s.label}</span>
              <span className="text-xl font-extrabold mt-1 block">
                {metrics?.severityDistribution?.[s.key] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

