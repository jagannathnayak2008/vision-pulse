import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Supabase client instance using public anonymous key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Upload an inspection image directly to Supabase Storage bucket 'optiguard-inspections'
 */
export async function uploadImageToSupabase(file, path) {
  try {
    const filePath = path || `inspections/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("optiguard-inspections")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("optiguard-inspections")
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl, path: data.path };
  } catch (err) {
    console.warn("[Supabase Storage] Client upload skipped or failed:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe to realtime inspection updates in Supabase
 */
export function subscribeToInspectionChanges(onInsert, onUpdate) {
  try {
    return supabase
      .channel("public:inspection_reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inspection_reports" },
        (payload) => onInsert && onInsert(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "inspection_reports" },
        (payload) => onUpdate && onUpdate(payload.new)
      )
      .subscribe();
  } catch (err) {
    console.warn("[Supabase Realtime] Subscription inactive:", err.message);
    return null;
  }
}

export default supabase;

