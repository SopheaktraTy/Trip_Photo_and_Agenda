import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Treat placeholder / missing values identically
const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-project-id") &&
  !supabaseAnonKey.includes("your-supabase");

if (!isConfigured) {
  console.warn(
    "⚠️  Supabase is not configured yet. " +
    "Open .env.local and replace the placeholder values with your real project URL and anon key."
  );
}

// Export a flag so components can show a friendly message instead of crashing
export const supabaseReady = Boolean(isConfigured);

export const supabase = createClient(
  isConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isConfigured ? supabaseAnonKey : "placeholder-key"
);
