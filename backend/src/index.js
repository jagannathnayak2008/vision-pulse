import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { initDb, query } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import inspectionRoutes from "./routes/inspectionRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import supabaseRoutes from "./routes/supabaseRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { VISION_MODEL } from "./services/geminiService.js";
import { checkSupabaseHealth } from "./config/supabaseClient.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins in development or matching CLIENT_URL
      callback(null, true);
    },
    credentials: true,
  })
);

// Body parsers with large limits for high-resolution images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "AI rate limit reached. Please wait a few minutes before submitting new visual scans.",
  },
});

app.use("/api/", generalLimiter);
app.use("/api/inspections/analyze", aiLimiter);
app.use("/api/inspections/compare", aiLimiter);
app.use("/api/inspections/:id/chat", aiLimiter);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  let dbStatus = "healthy";
  try {
    await query("SELECT 1;");
  } catch (err) {
    dbStatus = `degraded (${err.message})`;
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_google_gemini_api_key_here");
  const supabaseHealth = await checkSupabaseHealth();

  res.json({
    status: "ok",
    service: "OptiGuard AI - Operational Intelligence Engine (Render & Supabase Backend)",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    supabase: supabaseHealth,
    gemini: {
      model: VISION_MODEL,
      configured: hasGeminiKey,
    },
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/supabase", supabaseRoutes);

// Centralized Error Handling Middleware
app.use(errorMiddleware);

// Bootstrap Database and Start Server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 OptiGuard AI Render Backend running on port ${PORT}`);
      console.log(`🛡️  Target Model: ${VISION_MODEL}`);
      console.log(`🌐 Client Origin: ${CLIENT_URL}`);
      console.log(`⚡ Supabase Service: ${process.env.SUPABASE_URL || "Passive / Local Mode"}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error("Failed to start OptiGuard AI backend:", err);
    process.exit(1);
  }
}

startServer();

