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

export function isProjectMaterial(material: ProjectMaterial): boolean {
  return material.project_id !== null && material.subproject_id === null;
}

export function isSubprojectMaterial(material: ProjectMaterial): boolean {
  return material.project_id === null && material.subproject_id !== null;
}

export type CreateProjectMaterial = Omit<
  ProjectMaterial,
  "id" | "created_at" | "updated_at"
>;
