import { Subproject, ProjectMaterial, InventoryItem } from "./index";

export interface ProjectFormData {
  name: string;
  description: string;
  estimated_time: number;
  is_public: boolean;
  materials: ProjectMaterial[];
}

export interface SaveMaterialInput {
  id?: string;
  inventory_item_id: string;
  quantity_needed: number;
  is_fulfilled?: boolean;
}

export interface SaveSubprojectInput {
  id?: string;
  name: string;
  description: string;
  estimated_time: number;
  order_index: number;
  materials: SaveMaterialInput[];
}

export interface SaveNewProjectPayload {
  name: string;
  description: string;
  estimated_time: number;
  is_public: boolean;
  materials: SaveMaterialInput[];
  subprojects: SaveSubprojectInput[];
}

export interface UpdateProjectPayload extends SaveNewProjectPayload {
  id: string;
}

export interface SaveProjectRpcResult {
  success: boolean;
  project_id?: string;
  error?: string;
}

export interface SubprojectFormData
  extends Omit<Subproject, "id" | "created_at" | "updated_at"> {
  id?: string;
  materials: ProjectMaterial[];
}

export interface ProjectFormProps {
  projectName: string;
  projectDescription: string;
  projectTime: number;
  isPublic: boolean;
  materials: ProjectMaterial[];
  inventoryItems: InventoryItem[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTimeChange: (time: number) => void;
  onPublicChange: (isPublic: boolean) => void;
  onMaterialsChange: (materials: ProjectMaterial[]) => void;
}

export interface MaterialsSectionProps {
  title?: string;
  materials: ProjectMaterial[];
  inventoryItems: InventoryItem[];
  onAddMaterial: () => void;
  onUpdateMaterial: (
    materialIndex: number,
    field: keyof ProjectMaterial,
    value: string | number | boolean | null
  ) => void;
  onRemoveMaterial: (materialIndex: number) => void;
}
