import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { inspectionApi } from "../services/api";
import VisualCaptureWorkbench from "../components/VisualCaptureWorkbench";
import {
  ScanEye,
  Layers,
  Building,
  Tag,
  Shield,
  Sliders,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function NewInspectionPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "SMT Production Lot Quality Scan - Line 04",
    domain: "MANUFACTURING_QC",
    assetIdentifier: "PCB-SMT-44091-B",
    facilityLocation: "Austin Advanced Fab, Cleanroom 2",
    complianceStandard: "IPC-A-610 Class 3",
    sensitivityLevel: "HIGH_PRECISION",
    operatorNotes: "Automated optical check detected potential solder bridging on IC pin header.",
  });

  const [selectedImage, setSelectedImage] = useState(null); // { file, dataUrl, mimeType, source, preset }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingPhase, setLoadingPhase] = useState("Initializing Multimodal Vision Pipeline...");

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageSelected = (imageData) => {
    setSelectedImage(imageData);
    setError("");

    // If a preset was selected, auto-fill domain and metadata
    if (imageData.preset) {
      const p = imageData.preset;
      setFormData({
        title: p.title,
        domain: p.domain,
        assetIdentifier: p.assetIdentifier,
        facilityLocation: p.facilityLocation,
        complianceStandard: p.complianceStandard,
        sensitivityLevel: p.sensitivityLevel,
        operatorNotes: p.operatorNotes,
      });
    }
  };

  const handleResetImage = () => {
    setSelectedImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setError("Please capture an image, upload a file, or select a benchmark preset.");
      return;
    }

    setError("");
    setLoading(true);
    setLoadingPhase("Transferring High-Resolution Image Binary to Gemini 2.5 Flash...");

    try {
      let response;

      if (selectedImage.file) {
        // Send multipart/form-data
        const data = new FormData();
        data.append("imageFile", selectedImage.file);
        data.append("title", formData.title);
        data.append("domain", formData.domain);
        data.append("assetIdentifier", formData.assetIdentifier);
        data.append("facilityLocation", formData.facilityLocation);
        data.append("complianceStandard", formData.complianceStandard || "ISO-9001");
        data.append("sensitivityLevel", formData.sensitivityLevel);
        data.append("operatorNotes", formData.operatorNotes || "");

        setTimeout(() => setLoadingPhase("Detecting Spatial Anomalies & Normalizing 2D Bounding Boxes..."), 2000);
        setTimeout(() => setLoadingPhase("Extracting OCR Telemetry & Synthesizing Remediation Plan..."), 4500);

        response = await inspectionApi.analyze(data, true);
      } else {
        // Benchmark preset Base64 data
        const payload = {
          title: formData.title,
          domain: formData.domain,
          assetIdentifier: formData.assetIdentifier,
          facilityLocation: formData.facilityLocation,
          complianceStandard: formData.complianceStandard || "ISO-9001",
          sensitivityLevel: formData.sensitivityLevel,
          operatorNotes: formData.operatorNotes || "",
          sampleImageBase64: selectedImage.dataUrl,
          sampleMimeType: selectedImage.mimeType || "image/png",
        };

        setTimeout(() => setLoadingPhase("Detecting Spatial Anomalies & Normalizing 2D Bounding Boxes..."), 2000);
        setTimeout(() => setLoadingPhase("Extracting OCR Telemetry & Synthesizing Remediation Plan..."), 4500);

        response = await inspectionApi.analyze(payload, false);
      }

      const report = response.data.report;
      navigate(`/inspections/${report.id}`);
    } catch (err) {
      console.error("Inspection error:", err);
      setError(
        err.response?.data?.message || "Computer Vision analysis failed. Please verify image clarity and try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            MULTIMODAL WORKBENCH
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-white mt-1">
          Initiate Automated Visual Inspection
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload photo, snap live camera frame, or select an industrial benchmark for real-time spatial
          defect localization.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Modal / Radar Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-28 h-28 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-blue-500/20 border-b-blue-400 animate-spin animate-reverse" />
            <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-900 border border-slate-700 shadow-xl">
              <ScanEye className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white font-mono">
            ANALYZING VISUAL TELEMETRY
          </h3>
          <p className="text-xs text-cyan-400 font-mono mt-2 animate-pulse max-w-md">
            {loadingPhase}
          </p>
          <p className="text-[11px] text-slate-400 mt-4 font-mono">
            Target Model: gemini-2.5-flash • Spatial Coordinate Scale: 0 to 1000
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Visual Capture Studio */}
        <VisualCaptureWorkbench
          onImageSelected={handleImageSelected}
          currentPreview={selectedImage?.dataUrl}
          onReset={handleResetImage}
        />

        {/* Step 2: Inspection Metadata Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Tag className="w-4 h-4 text-cyan-400" />
            Inspection Context & Advisory Calibration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Inspection Title / Task Name *
              </label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Main Turbine Housing Weld Inspection - Unit 04"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Operational Domain */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operational Domain *
              </label>
              <select
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="MANUFACTURING_QC">Manufacturing & PCB Quality Control</option>
                <option value="INFRASTRUCTURE_CIVIL">Civil Infrastructure & Asset Integrity</option>
                <option value="WORKPLACE_SAFETY_EHS">Workplace Safety, PPE & Hazard Auditing</option>
                <option value="DOCUMENT_GAUGE_OCR">Scanned Documents, Schematics & Gauges</option>
              </select>
            </div>

            {/* Asset Identifier */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Asset / Batch Identifier *
              </label>
              <input
                type="text"
                required
                name="assetIdentifier"
                value={formData.assetIdentifier}
                onChange={handleInputChange}
                placeholder="SN-AX9920-B or LOT-2026-X"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Facility Location */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Facility / Site Location *
              </label>
              <input
                type="text"
                required
                name="facilityLocation"
                value={formData.facilityLocation}
                onChange={handleInputChange}
                placeholder="Plant 2 - Bay C or Sector 4 Overpass"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Compliance Standard */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reference Compliance Standard
              </label>
              <input
                type="text"
                name="complianceStandard"
                value={formData.complianceStandard}
                onChange={handleInputChange}
                placeholder="ISO-9001, IPC-A-610, OSHA-1910, ASTM-E284"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Sensitivity Level */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Detection Sensitivity Level *
              </label>
              <select
                name="sensitivityLevel"
                value={formData.sensitivityLevel}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="STANDARD">Standard Tolerance (Operational Defaults)</option>
                <option value="HIGH_PRECISION">High Precision (Micro-Defect Detection)</option>
                <option value="ZERO_TOLERANCE">Zero Tolerance (Life-Safety & Aerospace Spec)</option>
              </select>
            </div>

            {/* Operator Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operator Observations & Specific Areas of Concern (Optional)
              </label>
              <textarea
                name="operatorNotes"
                rows={2}
                value={formData.operatorNotes}
                onChange={handleInputChange}
                placeholder="Note any vibration symptoms, thermal hotspots, or unusual discoloration noticed during visual capture..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading || !selectedImage}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              <ScanEye className="w-4 h-4" />
              <span>Run Visual Intelligence Scan</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

