import { Subproject } from "../types";
import supabaseClient from "../utils/supabaseClient";
import { toDataAccessError } from "./data-access-error";

/**
 * Fetches all subprojects for one project in display order.
 */
export async function fetchSubprojectsByProjectId(
  projectId: string
): Promise<Subproject[]> {
  try {
    const { data, error } = await supabaseClient
      .from("subprojects")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index");

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw toDataAccessError(error, "Failed to fetch subprojects");
  }
}
