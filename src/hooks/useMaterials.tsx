import { useState, useCallback } from "react";
import supabaseClient from "../utils/supabaseClient";

interface UseMaterialsReturn {
  loading: boolean;
  error: string | null;
  fulfillMaterials: (materialIds: string[]) => Promise<void>;
}

export function useMaterials(): UseMaterialsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fulfillMaterials = useCallback(async (materialIds: string[]) => {
    try {
      setError(null);
      setLoading(true);

      const { data: materialsToFulfill, error: fetchError } =
        await supabaseClient
          .from("project_materials")
          .select("*, inventory_items(*)")
          .in("id", materialIds)
          .eq("is_fulfilled", false);

      if (fetchError) throw fetchError;
      if (!materialsToFulfill || materialsToFulfill.length === 0) {
        throw new Error("No materials found to fulfill");
      }

      for (const material of materialsToFulfill) {
        const inventoryItem = material.inventory_items;
        const newQuantity = inventoryItem.quantity - material.quantity_needed;

        if (newQuantity < 0) {
          throw new Error(`Insufficient quantity for ${inventoryItem.name}`);
        }

        const { error: updateInventoryError } = await supabaseClient
          .from("inventory_items")
          .update({ quantity: newQuantity })
          .eq("id", material.inventory_item_id);

        if (updateInventoryError) throw updateInventoryError;

        const { error: updateMaterialError } = await supabaseClient
          .from("project_materials")
          .update({ is_fulfilled: true })
          .eq("id", material.id);

        if (updateMaterialError) throw updateMaterialError;
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fulfill materials"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fulfillMaterials,
  };
}
