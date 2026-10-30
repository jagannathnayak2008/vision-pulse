import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { inspectionApi } from "../services/api";
import BoundingBoxCanvas from "../components/BoundingBoxCanvas";
import AnomalyDiagnosticList from "../components/AnomalyDiagnosticList";
import RemediationTimeline from "../components/RemediationTimeline";
import VisualCopilotDrawer from "../components/VisualCopilotDrawer";
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Building,
  Tag,
  Shield,
  FileText,
  Trash2,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnomalyId, setSelectedAnomalyId] = useState(null);
  const [hoveredAnomalyId, setHoveredAnomalyId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await inspectionApi.getById(id);
        setReport(res.data.report);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Inspection report not found or access denied.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await inspectionApi.updateStatus(id, { workflowStatus: newStatus });
      setReport((prev) => ({
        ...prev,
        workflow_status: newStatus,
      }));
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update inspection workflow status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleToggleAcknowledge = async (anomalyId) => {
    try {
      await inspectionApi.updateStatus(id, { acknowledgeAnomalyId: anomalyId });
      setReport((prev) => ({
        ...prev,
        anomalies: prev.anomalies.map((a) =>
          a.id === anomalyId ? { ...a, is_acknowledged: !a.is_acknowledged } : a
        ),
      }));
    } catch (err) {
      console.error("Error toggling acknowledgment:", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this inspection report?")) {
      try {
        await inspectionApi.delete(id);
        navigate("/inspections");
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Could not delete report.");
      }
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `optiguard_report_${report.asset_identifier}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case "PASS":
        return {
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
          text: "VERDICT: OPERATIONAL PASS",
        };
      case "CONDITIONAL_WARNING":
        return {
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
          text: "VERDICT: CONDITIONAL WARNING",
        };
      case "FAIL_CRITICAL":
      default:
        return {
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: AlertOctagon,
          text: "VERDICT: CRITICAL FAILURE",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="mt-3 text-xs font-mono text-slate-400">LOADING INSPECTION REPORT...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm text-slate-300">{error || "Report not found"}</p>
        <Link
          to="/inspections"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-cyan-400 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Audit Log</span>
        </Link>
      </div>
    );
  }

  const verdictMeta = getVerdictStyle(report.verdict);
  const VerdictIcon = verdictMeta.icon;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/inspections"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {report.domain}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {report.asset_identifier}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {report.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Workflow Status Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-slate-400 px-2 font-mono text-[11px]">Workflow:</span>
            <select
              value={report.workflow_status}
              disabled={statusUpdating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5 transition"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5 transition"
            title="Print Audit Report"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs transition"
            title="Delete Inspection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Verdict Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Verdict Badge Card */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${verdictMeta.badge}`}>
          <div className="w-10 h-10 rounded-xl bg-slate-950/60 flex items-center justify-center flex-shrink-0">
            <VerdictIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-wider">{verdictMeta.text}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Standard: {report.compliance_standard}
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-mono">Asset Health Score</span>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {report.health_score}/100
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
            {report.health_score >= 80 ? "A" : report.health_score >= 60 ? "B" : "F"}
          </div>
        </div>

        {/* AI Confidence */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-mono">AI Model Confidence</span>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
              {report.confidence_score}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Facility & Date */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-mono">Facility Location</span>
          <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
            {report.facility_location}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {new Date(report.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Visual Canvas & Diagnostic Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Bounding Box Canvas + Scene & OCR */}
        <div className="lg:col-span-7 space-y-6">
          <BoundingBoxCanvas
            imageUrl={report.image_data_url}
            anomalies={report.anomalies || []}
            selectedAnomalyId={selectedAnomalyId}
            hoveredAnomalyId={hoveredAnomalyId}
            onSelectAnomaly={setSelectedAnomalyId}
            onHoverAnomaly={setHoveredAnomalyId}
          />

          {/* Scene Summary & Environmental Assessment */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Automated Visual Understanding & Scene Context
            </h4>

            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <span className="font-mono text-slate-400 font-semibold block mb-1">
                  EXECUTIVE SCENE SUMMARY:
                </span>
                <p className="text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {report.scene_summary}
                </p>
              </div>

              <div>
                <span className="font-mono text-rose-400 font-semibold block mb-1">
                  OPERATIONAL RISK ASSESSMENT:
                </span>
                <p className="text-rose-200/90 bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
                  {report.operational_risk_summary}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="font-mono text-slate-400 font-semibold block mb-1">
                    OPTICAL OCR TELEMETRY:
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
                    {report.extracted_text_ocr || "None detected"}
                  </div>
                </div>

                <div>
                  <span className="font-mono text-slate-400 font-semibold block mb-1">
                    ENVIRONMENTAL LIGHTING & CLARITY:
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    {report.environmental_lighting || "Optimal"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remediation Timeline Plan */}
          <RemediationTimeline remediationPlan={report.remediation_plan || []} />
        </div>

        {/* Right Column (5 cols): Anomaly Diagnostic List & AI Visual Copilot */}
        <div className="lg:col-span-5 space-y-6">
          <AnomalyDiagnosticList
            anomalies={report.anomalies || []}
            selectedAnomalyId={selectedAnomalyId}
            hoveredAnomalyId={hoveredAnomalyId}
            onSelectAnomaly={setSelectedAnomalyId}
            onHoverAnomaly={setHoveredAnomalyId}
            onToggleAcknowledge={handleToggleAcknowledge}
          />

          <VisualCopilotDrawer
            inspectionId={report.id}
            initialMessages={report.chat_messages || []}
          />
        </div>
      </div>
    </div>
  );
}

