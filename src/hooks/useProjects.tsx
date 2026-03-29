import { useState, useCallback } from "react";
import { Project } from "../types";
import {
  SaveNewProjectPayload,
  SaveProjectRpcResult,
  UpdateProjectPayload,
} from "../types/project-edit.types";
import supabaseClient from "../utils/supabaseClient";

interface UseProjectsReturn {
  projects: Project[] | null;
  error: string | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<Project | null>;
  createProjectWithDetails: (
    userId: string,
    payload: SaveNewProjectPayload
  ) => Promise<string>;
  updateProjectWithDetails: (
    userId: string,
    payload: UpdateProjectPayload
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectById = useCallback(async (id: string) => {
    try {
      setError(null);
      const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project");
      return null;
    }
  }, []);

  const createProjectWithDetails = useCallback(
    async (userId: string, payload: SaveNewProjectPayload): Promise<string> => {
      try {
        setError(null);
        const { data, error } = await supabaseClient.rpc(
          "save_new_project_with_materials_and_subprojects",
          {
            p_user_id: userId,
            p_payload: payload,
          }
        );

        if (error) throw error;

        const result = data as SaveProjectRpcResult | null;
        if (!result?.success || !result.project_id) {
          throw new Error(result?.error || "Failed to save project");
        }

        return result.project_id;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save project";
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const updateProjectWithDetails = useCallback(
    async (userId: string, payload: UpdateProjectPayload): Promise<void> => {
      try {
        setError(null);
        const { data, error } = await supabaseClient.rpc(
          "update_project_with_materials_and_subprojects",
          {
            p_project_id: payload.id,
            p_user_id: userId,
            p_payload: payload,
          }
        );

        if (error) throw error;

        const result = data as SaveProjectRpcResult | null;
        if (!result?.success) {
          throw new Error(result?.error || "Failed to update project");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update project";
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    try {
      setError(null);
      const { error } = await supabaseClient
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setProjects((prev) =>
        prev ? prev.filter((project) => project.id !== id) : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  }, []);

  return {
    projects,
    error,
    loading,
    fetchProjects,
    fetchProjectById,
    createProjectWithDetails,
    updateProjectWithDetails,
    deleteProject,
  };
}
