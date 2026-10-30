import React from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  HelpCircle,
  Wrench,
  Search,
  Check,
} from "lucide-react";

export default function AnomalyDiagnosticList({
  anomalies = [],
  selectedAnomalyId,
  hoveredAnomalyId,
  onSelectAnomaly,
  onHoverAnomaly,
  onToggleAcknowledge,
}) {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          icon: AlertOctagon,
        };
      case "HIGH":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: AlertTriangle,
        };
      case "MEDIUM":
        return {
          bg: "bg-yellow-400/10 border-yellow-400/30 text-yellow-300",
          icon: AlertTriangle,
        };
      case "LOW":
      default:
        return {
          bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
          icon: Info,
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          Localized Visual Anomalies ({anomalies.length})
        </h4>
        <span className="text-[11px] font-mono text-slate-400">
          Click card to highlight box
        </span>
      </div>

      {anomalies.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          No visual anomalies detected in this asset region.
        </div>
      ) : (
        anomalies.map((anomaly, idx) => {
          const badge = getSeverityBadge(anomaly.severity);
          const Icon = badge.icon;
          const isSelected = selectedAnomalyId === anomaly.id;
          const isHovered = hoveredAnomalyId === anomaly.id;

          return (
            <div
              key={anomaly.id}
              onClick={() => onSelectAnomaly && onSelectAnomaly(anomaly.id)}
              onMouseEnter={() => onHoverAnomaly && onHoverAnomaly(anomaly.id)}
              onMouseLeave={() => onHoverAnomaly && onHoverAnomaly(null)}
              className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                isSelected || isHovered
                  ? "bg-slate-850 border-cyan-500 shadow-md shadow-cyan-500/10"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Header with Severity & Confidence */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${badge.bg}`}
                  >
                    <Icon className="w-3 h-3" />
                    {anomaly.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {anomaly.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    {Math.round(anomaly.confidence)}% Conf.
                  </span>
                  {onToggleAcknowledge && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleAcknowledge(anomaly.id);
                      }}
                      title={anomaly.is_acknowledged ? "Marked Acknowledged" : "Click to Acknowledge"}
                      className={`p-1 rounded-md text-[10px] transition ${
                        anomaly.is_acknowledged
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bounding Box Coordinates */}
              <div className="mt-1.5 flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span>Category: {anomaly.category}</span>
                <span>•</span>
                <span>
                  BBox: [{anomaly.box_ymin}, {anomaly.box_xmin}, {anomaly.box_ymax}, {anomaly.box_xmax}]
                </span>
              </div>

              {/* Technical Description */}
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {anomaly.description}
              </p>

              {/* Root Cause Hypothesis Callout */}
              {anomaly.root_cause_hypothesis && (
                <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <HelpCircle className="w-3 h-3" />
                    Root-Cause Hypothesis:
                  </div>
                  <p className="text-slate-300 pl-4">{anomaly.root_cause_hypothesis}</p>
                </div>
              )}

              {/* Recommended Action */}
              {anomaly.recommended_action && (
                <div className="mt-2 p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                    <Wrench className="w-3 h-3" />
                    Recommended Action:
                  </div>
                  <p className="text-slate-200 pl-4">{anomaly.recommended_action}</p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

