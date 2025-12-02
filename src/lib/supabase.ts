import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ntbglzejaczqccetnkti.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YmdsemVqYWN6cWNjZXRua3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Mzk4NzUsImV4cCI6MjA3OTAxNTg3NX0.-oVAOea2ekn1hYbx88E2xIhbF13ZI-TgQ6FTQUUYJj0";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Always return true since keys are hardcoded
export const isSupabaseConfigured = () => {
  return true;
};
