import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  CheckCircle,
} from "lucide-react";

export default function BoundingBoxCanvas({
  imageUrl,
  anomalies = [],
  selectedAnomalyId,
  hoveredAnomalyId,
  onSelectAnomaly,
  onHoverAnomaly,
}) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [zoomLevel, setZoomLevel] = useState(1); // 1, 1.25, 1.5, 2

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return {
          border: "border-rose-500",
          bg: "bg-rose-500/20",
          tag: "bg-rose-500 text-slate-950",
          shadow: "shadow-rose-500/40",
        };
      case "HIGH":
        return {
          border: "border-amber-500",
          bg: "bg-amber-500/20",
          tag: "bg-amber-500 text-slate-950",
          shadow: "shadow-amber-500/40",
        };
      case "MEDIUM":
        return {
          border: "border-yellow-400",
          bg: "bg-yellow-400/20",
          tag: "bg-yellow-400 text-slate-950",
          shadow: "shadow-yellow-400/40",
        };
      case "LOW":
      default:
        return {
          border: "border-cyan-400",
          bg: "bg-cyan-400/20",
          tag: "bg-cyan-400 text-slate-950",
          shadow: "shadow-cyan-400/40",
        };
    }
  };

  const filteredAnomalies = anomalies.filter((a) => {
    if (severityFilter === "ALL") return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Canvas Action Bar */}
      <div className="p-3 border-b border-slate-800 bg-[#0d1322] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Interactive Spatial Overlay
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {filteredAnomalies.length} Regions
          </span>
        </div>

        {/* Controls: Visibility, Zoom, Filter */}
        <div className="flex items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-1" />
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  severityFilter === sev
                    ? "bg-slate-800 text-cyan-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Visibility Toggle */}
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition ${
              showBoxes
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showBoxes ? "Boxes ON" : "Boxes OFF"}</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-1 text-[10px] text-cyan-400 hover:underline border-l border-slate-800"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Image Container */}
      <div className="relative overflow-auto max-h-[600px] flex items-center justify-center p-4 bg-[#070b14] bg-grid-pattern select-none">
        <div
          className="relative inline-block transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
        >
          {/* Main Inspection Image */}
          <img
            src={imageUrl}
            alt="Asset Inspection"
            className="max-h-[500px] w-auto rounded-lg shadow-lg border border-slate-800/80 block object-contain"
          />

          {/* Normalized 2D Bounding Boxes */}
          {showBoxes &&
            filteredAnomalies.map((anomaly) => {
              const top = anomaly.box_ymin / 10;
              const left = anomaly.box_xmin / 10;
              const height = (anomaly.box_ymax - anomaly.box_ymin) / 10;
              const width = (anomaly.box_xmax - anomaly.box_xmin) / 10;

              const isSelected = selectedAnomalyId === anomaly.id;
              const isHovered = hoveredAnomalyId === anomaly.id;
              const styleTheme = getSeverityColor(anomaly.severity);

              return (
                <div
                  key={anomaly.id}
                  onClick={() => onSelectAnomaly && onSelectAnomaly(anomaly.id)}
                  onMouseEnter={() => onHoverAnomaly && onHoverAnomaly(anomaly.id)}
                  onMouseLeave={() => onHoverAnomaly && onHoverAnomaly(null)}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    height: `${height}%`,
                    width: `${width}%`,
                  }}
                  className={`absolute border-2 cursor-pointer transition-all duration-150 ${styleTheme.border} ${styleTheme.bg} ${
                    isSelected || isHovered
                      ? `ring-4 ring-white/50 z-30 scale-[1.02] ${styleTheme.shadow} shadow-lg`
                      : "z-10 hover:z-20"
                  }`}
                >
                  {/* Bounding Box Label Tag */}
                  <div
                    className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shadow flex items-center gap-1 ${styleTheme.tag}`}
                  >
                    <span>{anomaly.label}</span>
                    <span className="opacity-80">({Math.round(anomaly.confidence)}%)</span>
                  </div>

                  {/* Corner Targets */}
                  <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                  <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                  <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

