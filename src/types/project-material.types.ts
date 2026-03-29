export interface ProjectMaterial {
  id: string;
  project_id: string | null;
  subproject_id: string | null;
  inventory_item_id: string;
  quantity_needed: number;
  is_fulfilled: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateProjectMaterial = Omit<
  ProjectMaterial,
  "id" | "created_at" | "updated_at"
>;
