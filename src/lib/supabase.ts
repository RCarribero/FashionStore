import { createClient } from "@supabase/supabase-js";
import { createMockSupabaseClient } from "./mock-supabase";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("demo") &&
    !supabaseUrl.includes("placeholder") &&
    supabaseUrl.startsWith("http")
);

export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseKey)
    : (createMockSupabaseClient() as any);
