import React, { useState } from "react";
import {
  ListOrdered,
  Clock,
  HardHat,
  CheckCircle,
  Circle,
  AlertCircle,
} from "lucide-react";

export default function RemediationTimeline({ remediationPlan = [] }) {
  const [completedSteps, setCompletedSteps] = useState({});

  const toggleStep = (stepNumber) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "IMMEDIATE":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "SHORT_TERM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "ROUTINE":
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-cyan-400" />
          Prioritized Corrective Action Plan
        </h4>
        <span className="text-[11px] font-mono text-slate-400">
          {remediationPlan.length} Engineering Steps
        </span>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
        {remediationPlan.map((step) => {
          const isDone = completedSteps[step.stepNumber];
          const prioStyle = getPriorityStyle(step.priority);

          return (
            <div key={step.stepNumber} className="relative flex items-start gap-4 pl-1">
              {/* Step indicator button */}
              <button
                type="button"
                onClick={() => toggleStep(step.stepNumber)}
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition border ${
                  isDone
                    ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold"
                    : "bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="font-mono text-xs">{step.stepNumber}</span>
                )}
              </button>

              {/* Step Details Box */}
              <div
                className={`flex-1 p-3.5 rounded-xl border transition ${
                  isDone
                    ? "bg-slate-950/40 border-slate-850 opacity-60 line-through"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="text-xs font-semibold text-slate-100">
                    {step.actionTitle}
                  </h5>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${prioStyle}`}
                  >
                    {step.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {step.detailedInstruction}
                </p>

                {/* Metadata tags: Time and PPE */}
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                  {step.estimatedTimeMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      ~{step.estimatedTimeMinutes} min
                    </span>
                  )}
                  {step.requiredToolsOrPpe && (
                    <span className="flex items-center gap-1">
                      <HardHat className="w-3.5 h-3.5 text-amber-400" />
                      {step.requiredToolsOrPpe}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

