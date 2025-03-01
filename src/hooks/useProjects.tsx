import { useState, useCallback } from "react";
import { Project, CreateProject } from "../types";
import supabaseClient from "../utils/supabaseClient";

interface UseProjectsReturn {
  projects: Project[] | null;
  error: string | null;
  loading: boolean;
  getProjects: () => Promise<void>;
  getProjectById: (id: string) => Promise<Project | null>;
  createProject: (project: CreateProject) => Promise<string | null>;
  updateProject: (project: Partial<Project> & { id: string }) => Promise<void>;
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
      console.error("Error fetching projects:", err);
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
      console.error("Error fetching project:", err);
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
        console.error("Error creating project:", err);
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
        console.error("Error updating project:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update project"
        );
        throw err;
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
      console.error("Error deleting project:", err);
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
    deleteProject,
  };
}
