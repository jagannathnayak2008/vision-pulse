import React, { useState, useEffect } from "react";
import { inspectionApi } from "../services/api";
import {
  GitCompare,
  Upload,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertOctagon,
  Sparkles,
  CheckCircle2,
  ListChecks,
  Loader2,
  Layers,
  History,
} from "lucide-react";

export default function CompareInspectionPage() {
  const [formData, setFormData] = useState({
    title: "Bridge Pier 3 Crack Repair Verification Audit",
    domain: "INFRASTRUCTURE_CIVIL",
    assetIdentifier: "ASSET-BRG-PIER-03",
    comparisonObjective: "REPAIR_VERIFICATION",
  });

  const [baselinePreview, setBaselinePreview] = useState(null);
  const [baselineFile, setBaselineFile] = useState(null);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [savedComparisons, setSavedComparisons] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSavedComparisons();
  }, []);

  const loadSavedComparisons = async () => {
    try {
      const res = await inspectionApi.getComparisons();
      setSavedComparisons(res.data.comparisons || []);
    } catch (err) {
      console.error("Error loading comparisons:", err);
    }
  };

  const handleBaselineUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBaselineFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setBaselinePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCurrentUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCurrentPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // 1-Click Dual Sample Loader
  const loadBenchmarkPair = () => {
    const baseSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%231e293b'/><rect x='100' y='50' width='400' height='300' fill='%2364748b' stroke='%23334155' stroke-width='4'/><path d='M200 120 Q260 220 230 300' stroke='%230f172a' stroke-width='8' fill='none'/><rect x='120' y='70' width='160' height='30' fill='%23090d16' rx='4'/><text x='130' y='90' fill='%2338bdf8' font-family='monospace' font-size='12'>BEFORE: CRACKED STATE</text></svg>`;
    const currSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%231e293b'/><rect x='100' y='50' width='400' height='300' fill='%2364748b' stroke='%23334155' stroke-width='4'/><path d='M200 120 Q260 220 230 300' stroke='%2338bdf8' stroke-width='10' fill='none' opacity='0.7'/><rect x='120' y='70' width='180' height='30' fill='%23064e3b' rx='4'/><text x='130' y='90' fill='%2334d399' font-family='monospace' font-size='12'>AFTER: RESIN INJECTED</text></svg>`;

    setBaselinePreview(baseSvg);
    setBaselineFile(null);
    setCurrentPreview(currSvg);
    setCurrentFile(null);

    setFormData({
      title: "Bridge Pier 3 Structural Epoxy Repair Verification",
      domain: "INFRASTRUCTURE_CIVIL",
      assetIdentifier: "ASSET-BRG-PIER-03",
      comparisonObjective: "REPAIR_VERIFICATION",
    });
  };

  const handleRunComparison = async (e) => {
    e.preventDefault();
    if (!baselinePreview || !currentPreview) {
      setError("Please stage both Baseline (Before) and Current (After) visual frames.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let response;
      if (baselineFile && currentFile) {
        const data = new FormData();
        data.append("baselineImage", baselineFile);
        data.append("currentImage", currentFile);
        data.append("title", formData.title);
        data.append("domain", formData.domain);
        data.append("assetIdentifier", formData.assetIdentifier);
        data.append("comparisonObjective", formData.comparisonObjective);
        response = await inspectionApi.compare(data, true);
      } else {
        const payload = {
          title: formData.title,
          domain: formData.domain,
          assetIdentifier: formData.assetIdentifier,
          comparisonObjective: formData.comparisonObjective,
          baselineImageBase64: baselinePreview,
          currentImageBase64: currentPreview,
        };
        response = await inspectionApi.compare(payload, false);
      }

      setComparisonResult(response.data.comparison);
      loadSavedComparisons();
    } catch (err) {
      console.error("Comparison error:", err);
      setError(
        err.response?.data?.message || "Failed to analyze visual delta. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case "IMPROVED":
        return {
          class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: TrendingUp,
        };
      case "DEGRADED":
        return {
          class: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: TrendingDown,
        };
      case "CRITICAL_REGRESSION":
        return {
          class: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: AlertOctagon,
        };
      case "UNCHANGED":
      default:
        return {
          class: "bg-slate-800 text-slate-300 border-slate-700",
          icon: Minus,
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              LONGITUDINAL TRACKING
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            Before / After Visual Delta Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multimodal comparative intelligence to quantify structural repair completion, asset
            degradation, or assembly progress.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBenchmarkPair}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold transition"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Load Sample Before/After Pair</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Dual Upload Studio */}
      <form onSubmit={handleRunComparison} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Baseline Upload Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                1. Baseline State (Before / Reference)
              </span>
              {baselinePreview && (
                <span className="text-[10px] text-emerald-400 font-mono">Image Staged</span>
              )}
            </div>

            <div
              onClick={() => document.getElementById("baselineInput").click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/50 rounded-xl p-4 min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition overflow-hidden relative"
            >
              <input
                id="baselineInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleBaselineUpload}
              />
              {baselinePreview ? (
                <img
                  src={baselinePreview}
                  alt="Baseline Preview"
                  className="max-h-[200px] w-auto object-contain rounded-lg shadow"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-cyan-400" />
                  <p className="text-xs font-medium text-slate-200">
                    Click to upload Baseline / Reference Image
                  </p>
                  <p className="text-[11px] text-slate-400">Prior maintenance state or engineering drawing</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Upload Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                2. Current State (After / Inspection)
              </span>
              {currentPreview && (
                <span className="text-[10px] text-emerald-400 font-mono">Image Staged</span>
              )}
            </div>

            <div
              onClick={() => document.getElementById("currentInput").click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/50 rounded-xl p-4 min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition overflow-hidden relative"
            >
              <input
                id="currentInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCurrentUpload}
              />
              {currentPreview ? (
                <img
                  src={currentPreview}
                  alt="Current Preview"
                  className="max-h-[200px] w-auto object-contain rounded-lg shadow"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-blue-400" />
                  <p className="text-xs font-medium text-slate-200">
                    Click to upload Current / Post-Work Image
                  </p>
                  <p className="text-[11px] text-slate-400">Latest field photo or completed rework snapshot</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Parameters */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Comparison Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operational Domain
              </label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="MANUFACTURING_QC">Manufacturing & PCB QC</option>
                <option value="INFRASTRUCTURE_CIVIL">Civil Infrastructure</option>
                <option value="WORKPLACE_SAFETY_EHS">Workplace Safety & EHS</option>
                <option value="DOCUMENT_GAUGE_OCR">Document & Gauge OCR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Asset Identifier
              </label>
              <input
                type="text"
                required
                value={formData.assetIdentifier}
                onChange={(e) => setFormData({ ...formData, assetIdentifier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Comparison Objective
              </label>
              <select
                value={formData.comparisonObjective}
                onChange={(e) => setFormData({ ...formData, comparisonObjective: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="REPAIR_VERIFICATION">Repair Verification</option>
                <option value="DEGRADATION_MONITORING">Degradation Monitoring</option>
                <option value="ASSEMBLY_COMPLETION">Assembly Completion</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading || !baselinePreview || !currentPreview}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Comparing Visual States with Gemini Vision...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  <span>Execute Visual Delta Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Comparison Results Card */}
      {comparisonResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                MULTIMODAL DELTA REPORT
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {comparisonResult.title}
              </h3>
            </div>

            {/* Verdict Badge & Delta Score */}
            <div className="flex items-center gap-3">
              {(() => {
                const badge = getVerdictBadge(comparisonResult.change_verdict);
                const Icon = badge.icon;
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${badge.class}`}
                  >
                    <Icon className="w-4 h-4" />
                    {comparisonResult.change_verdict}
                  </span>
                );
              })()}

              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 mr-1.5">Delta Score:</span>
                <span
                  className={`font-bold ${
                    comparisonResult.delta_score > 0
                      ? "text-emerald-400"
                      : comparisonResult.delta_score < 0
                      ? "text-rose-400"
                      : "text-slate-300"
                  }`}
                >
                  {comparisonResult.delta_score > 0 ? `+${comparisonResult.delta_score}` : comparisonResult.delta_score}
                </span>
              </div>
            </div>
          </div>

          {/* Executive Comparison Summary */}
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase">
              Executive Comparative Summary:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              {comparisonResult.executive_comparison_summary}
            </p>
          </div>

          {/* Key Differences Matrix */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase">
              Itemized Feature Delta Matrix:
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950">
                    <th className="p-2.5">Feature Area</th>
                    <th className="p-2.5">Baseline State</th>
                    <th className="p-2.5">Current State</th>
                    <th className="p-2.5">Impact Assessment</th>
                    <th className="p-2.5">Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {comparisonResult.key_differences?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/40">
                      <td className="p-2.5 font-semibold text-slate-200">{item.featureArea}</td>
                      <td className="p-2.5 text-slate-400">{item.baselineState}</td>
                      <td className="p-2.5 text-slate-200">{item.currentState}</td>
                      <td className="p-2.5 text-slate-300">{item.impactAssessment}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.significance === "HIGH"
                              ? "bg-rose-500/20 text-rose-300"
                              : item.significance === "MEDIUM"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {item.significance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Next Steps Checklist */}
          {comparisonResult.next_steps?.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-cyan-400" />
                Recommended Operational Next Steps:
              </span>
              <ul className="space-y-1.5 pl-2 text-xs text-slate-300">
                {comparisonResult.next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Saved Comparisons Ledger */}
      {savedComparisons.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Saved Visual Comparisons ({savedComparisons.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedComparisons.map((c) => (
              <div
                key={c.id}
                onClick={() => setComparisonResult(c)}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 truncate">{c.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                    {c.change_verdict}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {c.executive_comparison_summary}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-850">
                  <span>Asset: {c.asset_identifier}</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

