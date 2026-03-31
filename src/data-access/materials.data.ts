import { InventoryItem, ProjectMaterial } from "../types";
import supabaseClient from "../utils/supabaseClient";
import { toDataAccessError } from "./data-access-error";

interface MaterialWithInventoryJoin extends ProjectMaterial {
  inventory_items: InventoryItem;
}

export interface ProjectMaterialWithInventory extends ProjectMaterial {
  inventory_item: InventoryItem;
}

function mapInventoryAlias(
  materials: MaterialWithInventoryJoin[]
): ProjectMaterialWithInventory[] {
  return materials.map(({ inventory_items, ...material }) => ({
    ...material,
    inventory_item: inventory_items,
  }));
}

/**
 * Fetches project-level materials joined with inventory details.
 */
export async function fetchProjectMaterialsWithInventory(
  projectId: string
): Promise<ProjectMaterialWithInventory[]> {
  try {
    const { data, error } = await supabaseClient
      .from("project_materials")
      .select(
        `
          *,
          inventory_items(*)
        `
      )
      .eq("project_id", projectId)
      .is("subproject_id", null);

    if (error) {
      throw error;
    }

    return mapInventoryAlias((data || []) as MaterialWithInventoryJoin[]);
  } catch (error) {
    throw toDataAccessError(error, "Failed to fetch project materials");
  }
}

/**
 * Fetches all subproject-level materials using the current filtering contract.
 */
export async function fetchSubprojectMaterialsWithInventory(): Promise<
  ProjectMaterialWithInventory[]
> {
  try {
    const { data, error } = await supabaseClient
      .from("project_materials")
      .select(
        `
          *,
          inventory_items(*)
        `
      )
      .is("project_id", null)
      .not("subproject_id", "is", null);

    if (error) {
      throw error;
    }

    return mapInventoryAlias((data || []) as MaterialWithInventoryJoin[]);
  } catch (error) {
    throw toDataAccessError(error, "Failed to fetch subproject materials");
  }
}

/**
 * Fetches project-level materials for edit forms.
 */
export async function fetchProjectMaterialsForEdit(
  projectId: string
): Promise<ProjectMaterial[]> {
  try {
    const { data, error } = await supabaseClient
      .from("project_materials")
      .select("*")
      .eq("project_id", projectId)
      .is("subproject_id", null);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw toDataAccessError(error, "Failed to load project materials");
  }
}

/**
 * Fetches subproject materials for edit forms.
 */
export async function fetchSubprojectMaterialsForEdit(
  subprojectId: string
): Promise<ProjectMaterial[]> {
  try {
    const { data, error } = await supabaseClient
      .from("project_materials")
      .select("*")
      .eq("subproject_id", subprojectId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw toDataAccessError(error, "Failed to load subproject materials");
  }
}

/**
 * Updates material fulfillment state and synchronizes inventory quantities.
 */
async function updateMaterialsFulfillmentState(
  materialIds: string[],
  nextFulfilledState: boolean
): Promise<void> {
  const shouldFulfill = nextFulfilledState;
  const expectedCurrentFulfilledState = !nextFulfilledState;
  const missingMaterialsMessage = shouldFulfill
    ? "No materials found to fulfill"
    : "No materials found to unfulfill";

  const operationFailedMessage = shouldFulfill
    ? "Failed to fulfill materials"
    : "Failed to unfulfill materials";

  try {
    const { data: materialsToUpdate, error: fetchError } = await supabaseClient
      .from("project_materials")
      .select("*, inventory_items(*)")
      .in("id", materialIds)
      .eq("is_fulfilled", expectedCurrentFulfilledState);

    if (fetchError) {
      throw fetchError;
    }

    if (!materialsToUpdate || materialsToUpdate.length === 0) {
      throw new Error(missingMaterialsMessage);
    }

    for (const material of materialsToUpdate as MaterialWithInventoryJoin[]) {
      const inventoryItem = material.inventory_items;
      const quantityChange = shouldFulfill
        ? -material.quantity_needed
        : material.quantity_needed;
      const newQuantity = inventoryItem.quantity + quantityChange;

      if (newQuantity < 0) {
        throw new Error(`Insufficient quantity for ${inventoryItem.name}`);
      }

      const { error: updateInventoryError } = await supabaseClient
        .from("inventory_items")
        .update({ quantity: newQuantity })
        .eq("id", material.inventory_item_id);

      if (updateInventoryError) {
        throw updateInventoryError;
      }

      const { error: updateMaterialError } = await supabaseClient
        .from("project_materials")
        .update({ is_fulfilled: nextFulfilledState })
        .eq("id", material.id);

      if (updateMaterialError) {
        throw updateMaterialError;
      }
    }
  } catch (error) {
    throw toDataAccessError(error, operationFailedMessage);
  }
}

/**
 * Fulfills project materials by decrementing inventory and marking fulfilled.
 */
export async function fulfillMaterialsByIds(materialIds: string[]): Promise<void> {
  await updateMaterialsFulfillmentState(materialIds, true);
}

/**
 * Unfulfills project materials by restoring inventory and marking unfulfilled.
 */
export async function unfulfillMaterialsByIds(
  materialIds: string[]
): Promise<void> {
  await updateMaterialsFulfillmentState(materialIds, false);
}
