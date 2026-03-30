import { ProjectMaterial, Subproject } from "../types";
import supabaseClient from "../utils/supabaseClient";
import { toDataAccessError } from "./data-access-error";

export interface ReportMaterial extends ProjectMaterial {
  inventory_items: {
    unit_cost: number | null;
  } | null;
}

export interface ProjectReportData {
  materials: ReportMaterial[];
  subprojects: Subproject[];
}

/**
 * Fetches report material and subproject records for the provided projects.
 */
export async function fetchProjectReportData(
  projectIds: string[]
): Promise<ProjectReportData> {
  if (projectIds.length === 0) {
    return { materials: [], subprojects: [] };
  }

  try {
    const [materialsResponse, subprojectsResponse] = await Promise.all([
      supabaseClient
        .from("project_materials")
        .select(
          `
            *,
            inventory_items (
              unit_cost
            )
          `
        )
        .in("project_id", projectIds),
      supabaseClient.from("subprojects").select("*").in("project_id", projectIds),
    ]);

    if (materialsResponse.error) {
      throw materialsResponse.error;
    }
    if (subprojectsResponse.error) {
      throw subprojectsResponse.error;
    }

    return {
      materials: (materialsResponse.data || []) as ReportMaterial[],
      subprojects: subprojectsResponse.data || [],
    };
  } catch (error) {
    throw toDataAccessError(error, "Failed to load report data.");
  }
}
