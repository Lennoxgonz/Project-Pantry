import { createClient } from "@supabase/supabase-js";

const getRequiredEnvVar = (name: string): string => {
  const value = import.meta.env[name];

  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `[supabaseClient] Missing required environment variable: ${name}. ` +
        "Add it to your .env file and restart the dev server."
    );
  }

  return value.trim();
};

const getRequiredUrlEnvVar = (name: string): string => {
  const value = getRequiredEnvVar(name);

  try {
    new URL(value);
  } catch {
    throw new Error(
      `[supabaseClient] Invalid URL in environment variable: ${name}. ` +
        `Received: "${value}".`
    );
  }

  return value;
};

const supabaseUrl = getRequiredUrlEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getRequiredEnvVar("VITE_SUPABASE_ANON_KEY");

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabaseClient;
