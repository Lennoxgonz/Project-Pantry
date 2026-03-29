import { useState, useCallback } from "react";
import { Project, CreateProject } from "../types";
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
  getProjects: () => Promise<void>;
  getProjectById: (id: string) => Promise<Project | null>;
  createProject: (project: CreateProject) => Promise<string | null>;
  updateProject: (project: Partial<Project> & { id: string }) => Promise<void>;
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

  const getProjects = useCallback(async () => {
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

  const getProjectById = useCallback(async (id: string) => {
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

  const createProject = useCallback(
    async (project: CreateProject): Promise<string | null> => {
      try {
        setError(null);
        const { data, error } = await supabaseClient
          .from("projects")
          .insert(project)
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error("Failed to create project");

        setProjects((prev) => (prev ? [data, ...prev] : [data]));
        return data.id;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create project"
        );
        return null;
      }
    },
    []
  );

  const updateProject = useCallback(
    async (project: Partial<Project> & { id: string }) => {
      try {
        setError(null);
        const { error } = await supabaseClient
          .from("projects")
          .update(project)
          .eq("id", project.id);

        if (error) throw error;

        setProjects((prev) =>
          prev
            ? prev.map((p) => (p.id === project.id ? { ...p, ...project } : p))
            : prev
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update project"
        );
        throw err;
      }
    },
    []
  );

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
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    createProjectWithDetails,
    updateProjectWithDetails,
    deleteProject,
  };
}
