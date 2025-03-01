import { useState, useCallback } from "react";
import { Subproject, CreateSubproject } from "../types";
import supabaseClient from "../utils/supabaseClient";

interface UseSubprojectsReturn {
  subprojects: Subproject[] | null;
  error: string | null;
  loading: boolean;
  getSubprojects: (projectId: string) => Promise<void>;
  createSubproject: (subproject: CreateSubproject) => Promise<string | null>;
  deleteSubproject: (id: string) => Promise<void>;
}

export function useSubprojects(): UseSubprojectsReturn {
  const [subprojects, setSubprojects] = useState<Subproject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getSubprojects = useCallback(async (projectId: string) => {
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
      console.error("Error fetching subprojects:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch subprojects"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubproject = useCallback(async (subproject: CreateSubproject) => {
    try {
      setError(null);
      const { data, error } = await supabaseClient
        .from("subprojects")
        .insert(subproject)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create subproject");

      setSubprojects((prev) => (prev ? [...prev, data] : [data]));
      return data.id;
    } catch (err) {
      console.error("Error creating subproject:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create subproject"
      );
      return null;
    }
  }, []);

  const deleteSubproject = useCallback(async (id: string) => {
    try {
      setError(null);
      const { error } = await supabaseClient
        .from("subprojects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSubprojects((prev) =>
        prev ? prev.filter((subproject) => subproject.id !== id) : null
      );
    } catch (err) {
      console.error("Error deleting subproject:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete subproject"
      );
    }
  }, []);

  return {
    subprojects,
    error,
    loading,
    getSubprojects,
    createSubproject,
    deleteSubproject,
  };
}
