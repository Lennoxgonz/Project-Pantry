import { useState, useCallback } from "react";
import { ProjectMaterial, CreateProjectMaterial } from "../types";
import supabaseClient from "../utils/supabaseClient";

interface UseMaterialsOptions {
  initialMaterials?: ProjectMaterial[];
}

interface UseMaterialsReturn {
  materials: ProjectMaterial[];
  loading: boolean;
  error: string | null;

  addMaterial: () => void;
  updateMaterial: (
    materialIndex: number,
    field: keyof ProjectMaterial,
    value: any
  ) => void;
  removeMaterial: (materialIndex: number) => void;

  getMaterials: (projectId: string, subprojectId?: string) => Promise<void>;
  createMaterial: (material: CreateProjectMaterial) => Promise<string | null>;
  bulkCreateMaterials: (materials: CreateProjectMaterial[]) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  fulfillMaterials: (materialIds: string[]) => Promise<void>;
  resetMaterials: (materials?: ProjectMaterial[]) => void;
}

export function useMaterials(
  options: UseMaterialsOptions = {}
): UseMaterialsReturn {
  const [materials, setMaterials] = useState<ProjectMaterial[]>(
    options.initialMaterials || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMaterial = useCallback(() => {
    setMaterials((current) => [
      ...current,
      {
        id: "",
        project_id: null,
        subproject_id: null,
        inventory_item_id: "",
        quantity_needed: 0,
        is_fulfilled: false,
        created_at: "",
        updated_at: "",
      },
    ]);
  }, []);

  const updateMaterial = useCallback(
    (materialIndex: number, field: keyof ProjectMaterial, value: any) => {
      setMaterials((current) =>
        current.map((material, index) =>
          index === materialIndex ? { ...material, [field]: value } : material
        )
      );
    },
    []
  );

  const removeMaterial = useCallback((materialIndex: number) => {
    setMaterials((current) =>
      current.filter((_, index) => index !== materialIndex)
    );
  }, []);

  const resetMaterials = useCallback((newMaterials: ProjectMaterial[] = []) => {
    setMaterials(newMaterials);
  }, []);

  const getMaterials = useCallback(
    async (projectId: string, subprojectId?: string) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabaseClient.from("project_materials").select(`
          *,
          inventory_items (
            name,
            quantity,
            unit,
            unit_cost
          )
        `);

        if (subprojectId) {
          query = query.eq("subproject_id", subprojectId);
        } else {
          query = query.eq("project_id", projectId);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;
        setMaterials(data || []);
      } catch (err) {
        console.error("Error fetching materials:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch materials"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createMaterial = useCallback(
    async (material: CreateProjectMaterial): Promise<string | null> => {
      try {
        setError(null);
        const { data, error: createError } = await supabaseClient
          .from("project_materials")
          .insert(material)
          .select()
          .single();

        if (createError) throw createError;
        if (!data) throw new Error("Failed to create material");

        setMaterials((current) => [...current, data]);
        return data.id;
      } catch (err) {
        console.error("Error creating material:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create material"
        );
        return null;
      }
    },
    []
  );

  const bulkCreateMaterials = useCallback(
    async (newMaterials: CreateProjectMaterial[]) => {
      if (newMaterials.length === 0) return;

      try {
        setError(null);
        const { data, error: createError } = await supabaseClient
          .from("project_materials")
          .insert(newMaterials)
          .select();

        if (createError) throw createError;
        if (!data) throw new Error("Failed to create materials");

        setMaterials((current) => [...current, ...data]);
      } catch (err) {
        console.error("Error creating materials:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create materials"
        );
      }
    },
    []
  );

  const deleteMaterial = useCallback(async (id: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabaseClient
        .from("project_materials")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setMaterials((current) =>
        current.filter((material) => material.id !== id)
      );
    } catch (err) {
      console.error("Error deleting material:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete material"
      );
    }
  }, []);

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

      setMaterials((current) =>
        current.map((material) =>
          materialIds.includes(material.id)
            ? { ...material, is_fulfilled: true }
            : material
        )
      );
    } catch (err) {
      console.error("Error fulfilling materials:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fulfill materials"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    materials,
    loading,
    error,

    addMaterial,
    updateMaterial,
    removeMaterial,
    resetMaterials,

    getMaterials,
    createMaterial,
    bulkCreateMaterials,
    deleteMaterial,
    fulfillMaterials,
  };
}
