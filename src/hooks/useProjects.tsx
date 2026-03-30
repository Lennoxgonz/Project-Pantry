import { useState, useCallback } from "react";
import { Project } from "../types";
import {
  SaveNewProjectPayload,
  UpdateProjectPayload,
} from "../types/project-edit.types";
import {
  createProjectWithDetailsData,
  deleteProjectData,
  fetchProjectByIdData,
  fetchProjectsData,
  updateProjectWithDetailsData,
} from "../data-access/projects.data";

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
      const data = await fetchProjectsData();
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
      const data = await fetchProjectByIdData(id);
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
        return await createProjectWithDetailsData(userId, payload);
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
        await updateProjectWithDetailsData(userId, payload);
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
      await deleteProjectData(id);
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
