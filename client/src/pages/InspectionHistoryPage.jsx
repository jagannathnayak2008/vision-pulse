import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { inspectionApi } from "../services/api";
import {
  History,
  Search,
  Filter,
  ArrowRight,
  Download,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Loader2,
} from "lucide-react";

export default function InspectionHistoryPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadInspections();
  }, [domainFilter, verdictFilter, statusFilter]);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const params = {};
      if (domainFilter) params.domain = domainFilter;
      if (verdictFilter) params.verdict = verdictFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await inspectionApi.getAll(params);
      setInspections(res.data.inspections || []);
    } catch (err) {
      console.error("Error loading inspections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInspections();
  };

  const getVerdictStyle = (verdict) => {
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

  const exportAllJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inspections, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `optiguard_inspections_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AUDIT LOG & COMPLIANCE LEDGER
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            Visual Inspection Audit History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Searchable log of all analyzed asset scans, spatial anomalies, and remediation statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={exportAllJson}
          disabled={inspections.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export All ({inspections.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, asset ID, or facility location..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Domain Filter */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Domains</option>
            <option value="MANUFACTURING_QC">Manufacturing QC</option>
            <option value="INFRASTRUCTURE_CIVIL">Civil Infrastructure</option>
            <option value="WORKPLACE_SAFETY_EHS">Workplace Safety & EHS</option>
            <option value="DOCUMENT_GAUGE_OCR">Document & Gauge OCR</option>
          </select>

          {/* Verdict Filter */}
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Verdicts</option>
            <option value="PASS">PASS</option>
            <option value="CONDITIONAL_WARNING">CONDITIONAL_WARNING</option>
            <option value="FAIL_CRITICAL">FAIL_CRITICAL</option>
          </select>

          {/* Workflow Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Workflow Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table / List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <span className="text-xs font-mono">LOADING AUDIT RECORDS...</span>
          </div>
        ) : inspections.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <History className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs">No inspection reports match the selected filters.</p>
            <Link
              to="/inspect/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20"
            >
              Run New Visual Inspection
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950">
                  <th className="p-3.5">Asset / Snapshot</th>
                  <th className="p-3.5">Domain & Standard</th>
                  <th className="p-3.5">Verdict</th>
                  <th className="p-3.5">Health</th>
                  <th className="p-3.5">Defects</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-850/50 transition">
                    {/* Asset & Thumbnail */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={insp.image_data_url}
                          alt={insp.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-200 block truncate max-w-xs">
                            {insp.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {insp.asset_identifier} • {insp.facility_location}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Domain & Standard */}
                    <td className="p-3.5 font-mono text-[11px]">
                      <span className="text-slate-200 block">{insp.domain}</span>
                      <span className="text-slate-400">{insp.compliance_standard}</span>
                    </td>

                    {/* Verdict */}
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getVerdictStyle(
                          insp.verdict
                        )}`}
                      >
                        {insp.verdict}
                      </span>
                    </td>

                    {/* Health Score */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {insp.health_score}
                        </span>
                        <div className="w-14 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              insp.health_score >= 80
                                ? "bg-emerald-500"
                                : insp.health_score >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${insp.health_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Defect count */}
                    <td className="p-3.5 font-mono text-cyan-400">
                      {insp.anomaly_count || 0}
                    </td>

                    {/* Workflow status */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {insp.workflow_status}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/inspections/${insp.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

