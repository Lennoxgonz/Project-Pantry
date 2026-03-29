import { useState, useCallback } from "react";
import { Subproject } from "../types";
import supabaseClient from "../utils/supabaseClient";

interface UseSubprojectsReturn {
  subprojects: Subproject[] | null;
  error: string | null;
  loading: boolean;
  fetchSubprojects: (projectId: string) => Promise<void>;
}

export function useSubprojects(): UseSubprojectsReturn {
  const [subprojects, setSubprojects] = useState<Subproject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSubprojects = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabaseClient
        .from("subprojects")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index");

      if (error) throw error;
      setSubprojects(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subprojects"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    subprojects,
    error,
    loading,
    fetchSubprojects,
  };
}
