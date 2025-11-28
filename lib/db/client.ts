import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

// Validate configuration in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  if (
    supabaseUrl === "https://your-project.supabase.co" ||
    supabaseKey === "your-anon-key"
  ) {
    console.warn(
      "⚠️ Supabase configuration may be missing. Check your .env file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  } else {
    console.log("✅ Supabase client initialized:", {
      url: supabaseUrl,
      keyPrefix: supabaseKey.substring(0, 20) + "...",
    });
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey);
