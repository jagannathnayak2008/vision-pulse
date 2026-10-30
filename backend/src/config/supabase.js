import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isConfigured = Boolean(supabaseUrl && supabaseUrl.includes("supabase.co"));

if (!isConfigured) {
  console.log("ℹ️  [Supabase Server] SUPABASE_URL not configured. Supabase cloud sync running in passive mode.");
}

// 1. Standard Client (Anon Key)
export const supabaseAnon = isConfigured && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 2. Admin Service Role Client (Bypasses RLS for secure backend operations & storage buckets)
export const supabaseAdmin = isConfigured && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Upload an image buffer to Supabase Storage bucket 'optiguard-inspections'
 */
export async function uploadImageToStorage(buffer, filename, mimeType = "image/jpeg") {
  const client = supabaseAdmin || supabaseAnon;
  if (!client) {
    return { success: false, message: "Supabase client not configured" };
  }

  try {
    const filePath = `uploads/${Date.now()}_${filename}`;
    const { data, error } = await client.storage
      .from("optiguard-inspections")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = client.storage
      .from("optiguard-inspections")
      .getPublicUrl(data.path);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.warn("[Supabase Storage Error]", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Health check for Supabase connection
 */
export async function checkSupabaseHealth() {
  if (!isConfigured) {
    return { status: "not_configured" };
  }

  try {
    const client = supabaseAdmin || supabaseAnon;
    const { error } = await client.from("users").select("id").limit(1);
    if (error && error.code !== "PGRST116") {
      return { status: "error", message: error.message };
    }
    return { status: "connected", url: supabaseUrl };
  } catch (err) {
    return { status: "unreachable", message: err.message };
  }
}

