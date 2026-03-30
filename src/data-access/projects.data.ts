import { Project } from "../types";
import {
  SaveNewProjectPayload,
  SaveProjectRpcResult,
  UpdateProjectPayload,
} from "../types/project-edit.types";
import supabaseClient from "../utils/supabaseClient";
import { toDataAccessError } from "./data-access-error";

/**
 * Fetches all projects ordered by creation date descending.
 */
export async function fetchProjectsData(): Promise<Project[]> {
  try {
    const { data, error } = await supabaseClient
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw toDataAccessError(error, "Failed to fetch projects");
  }
}

/**
 * Fetches one project by id.
 */
export async function fetchProjectByIdData(id: string): Promise<Project> {
  try {
    const { data, error } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw toDataAccessError(error, "Failed to fetch project");
  }
}

/**
 * Saves a new project through the existing transactional RPC.
 */
export async function createProjectWithDetailsData(
  userId: string,
  payload: SaveNewProjectPayload
): Promise<string> {
  try {
    const { data, error } = await supabaseClient.rpc(
      "save_new_project_with_materials_and_subprojects",
      {
        p_user_id: userId,
        p_payload: payload,
      }
    );

    if (error) {
      throw error;
    }

    const result = data as SaveProjectRpcResult | null;
    if (!result?.success || !result.project_id) {
      throw new Error(result?.error || "Failed to save project");
    }

    return result.project_id;
  } catch (error) {
    throw toDataAccessError(error, "Failed to save project");
  }
}

/**
 * Updates an existing project through the existing transactional RPC.
 */
export async function updateProjectWithDetailsData(
  userId: string,
  payload: UpdateProjectPayload
): Promise<void> {
  try {
    const { data, error } = await supabaseClient.rpc(
      "update_project_with_materials_and_subprojects",
      {
        p_project_id: payload.id,
        p_user_id: userId,
        p_payload: payload,
      }
    );

    if (error) {
      throw error;
    }

    const result = data as SaveProjectRpcResult | null;
    if (!result?.success) {
      throw new Error(result?.error || "Failed to update project");
    }
  } catch (error) {
    throw toDataAccessError(error, "Failed to update project");
  }
}

/**
 * Deletes one project by id.
 */
export async function deleteProjectData(id: string): Promise<void> {
  try {
    const { error } = await supabaseClient.from("projects").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toDataAccessError(error, "Failed to delete project");
  }
}
