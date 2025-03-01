import { createClient } from "@supabase/supabase-js";

const supaBaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supaBaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseClient = createClient(supaBaseUrl, supaBaseAnonKey);

export default supabaseClient;
