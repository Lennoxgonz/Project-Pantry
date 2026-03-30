import { CreateInventoryItem, InventoryItem } from "../types";
import supabaseClient from "../utils/supabaseClient";
import { toDataAccessError } from "./data-access-error";

/**
 * Fetches all inventory items ordered by material name.
 */
export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabaseClient
      .from("inventory_items")
      .select("*")
      .order("name");

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw toDataAccessError(error, "Failed to load inventory");
  }
}

/**
 * Creates one inventory item and returns the inserted record.
 */
export async function createInventoryItem(
  payload: CreateInventoryItem
): Promise<InventoryItem> {
  try {
    const { data, error } = await supabaseClient
      .from("inventory_items")
      .insert([payload])
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Failed to add item");
    }

    return data[0];
  } catch (error) {
    throw toDataAccessError(error, "Failed to add item");
  }
}

/**
 * Updates an existing inventory item by id.
 */
export async function updateInventoryItem(
  id: string,
  payload: CreateInventoryItem
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from("inventory_items")
      .update(payload)
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toDataAccessError(error, "Failed to update item");
  }
}

/**
 * Updates quantity for one inventory item.
 */
export async function updateInventoryItemQuantity(
  id: string,
  quantity: number
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from("inventory_items")
      .update({ quantity })
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toDataAccessError(error, "Failed to update quantity");
  }
}

/**
 * Deletes one inventory item.
 */
export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from("inventory_items")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toDataAccessError(error, "Failed to delete item");
  }
}
