import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Camera,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Video,
  X,
} from "lucide-react";
import { SAMPLE_BENCHMARKS } from "../utils/sampleScenarios";

export default function VisualCaptureWorkbench({ onImageSelected, currentPreview, onReset }) {
  const [activeTab, setActiveTab] = useState("file"); // "file" | "camera" | "presets"
  const [dragActive, setDragActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not access video camera. Please verify device permissions or use File Upload or Benchmark Presets."
      );
      setIsCameraActive(false);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    stopCamera();

    // Convert dataURL to File for consistent multipart submission
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `webcam_frame_${Date.now()}.jpg`, { type: "image/jpeg" });
        onImageSelected({
          file,
          dataUrl,
          mimeType: "image/jpeg",
          source: "camera",
        });
      });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Invalid file format. Please upload JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10 MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onImageSelected({
        file,
        dataUrl: event.target.result,
        mimeType: file.type,
        source: "upload",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset) => {
    stopCamera();
    onImageSelected({
      file: null,
      dataUrl: preset.imageDataUrl,
      mimeType: preset.mimeType,
      source: "preset",
      preset,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
      {/* Studio Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FileImage className="w-5 h-5 text-cyan-400" />
            Visual Acquisition Studio
          </h3>
          <p className="text-xs text-slate-400">
            Select high-res image source for automated Computer Vision localization
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("file");
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              activeTab === "file"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              startCamera();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              activeTab === "camera"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("presets");
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              activeTab === "presets"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Benchmark Presets</span>
          </button>
        </div>
      </div>

      {/* Selected Image Active Preview Bar */}
      {currentPreview && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <img
              src={currentPreview}
              alt="Preview"
              className="w-12 h-12 rounded-lg object-cover border border-cyan-500/40 shadow"
            />
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Image Loaded & Staged
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Ready for Gemini Multimodal Analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
          >
            <X className="w-3.5 h-3.5" />
            Change
          </button>
        </div>
      )}

      {/* Tab 1: Drag-and-Drop Uploader */}
      {activeTab === "file" && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
            dragActive
              ? "border-cyan-400 bg-cyan-500/10"
              : "border-slate-700 hover:border-slate-500 bg-slate-950/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Click to browse or drag and drop inspection photo
          </p>
          <p className="text-xs text-slate-400 mt-1">
            JPEG, PNG, or WebP (up to 10 MB) • High resolution recommended
          </p>
        </div>
      )}

      {/* Tab 2: Live HTML5 Camera */}
      {activeTab === "camera" && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[280px] flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-rose-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p className="text-xs">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[360px] object-contain"
                />
                {isCameraActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE FEED
                  </div>
                )}
              </>
            )}
          </div>

          {isCameraActive && (
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={captureFrame}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition"
              >
                <Camera className="w-4 h-4" />
                Capture Frame for Inspection
              </button>
              <button
                type="button"
                onClick={startCamera}
                title="Restart stream"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Benchmark Presets Gallery */}
      {activeTab === "presets" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Click any industrial preset to instantly load and test:</span>
            <span className="font-mono text-cyan-400">4 Scenarios Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_BENCHMARKS.map((benchmark) => (
              <div
                key={benchmark.id}
                onClick={() => handleSelectPreset(benchmark)}
                className="group p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-cyan-950/20 cursor-pointer transition flex items-start gap-3"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-700 group-hover:border-cyan-500/40">
                  <img
                    src={benchmark.imageDataUrl}
                    alt={benchmark.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                      {benchmark.badge}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {benchmark.domain.split("_")[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {benchmark.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

