import { Router } from "express";
import { supabaseAnon, supabaseAdmin, checkSupabaseHealth, uploadImageToStorage } from "../config/supabaseClient.js";

const router = Router();

// GET /api/supabase/status
router.get("/status", async (req, res) => {
  const health = await checkSupabaseHealth();
  const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== "your_supabase_anon_key_here");
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== "your_supabase_service_role_key_here");
  const hasUrl = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_URL !== "https://your-project-id.supabase.co");

  res.json({
    success: true,
    supabase: {
      configured: hasUrl && hasAnonKey,
      serviceRoleConfigured: hasServiceKey,
      url: process.env.SUPABASE_URL || "not configured",
      health,
    },
  });
});

// POST /api/supabase/test-storage
router.post("/test-storage", async (req, res) => {
  const dummyBuffer = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#06b6d4"/></svg>`
  );

  const result = await uploadImageToStorage(dummyBuffer, "test_connectivity.svg", "image/svg+xml");
  res.json({
    success: result.success,
    result,
  });
});

export default router;
