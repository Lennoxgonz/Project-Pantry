import { Subproject, ProjectMaterial, InventoryItem } from "./index";

export interface ProjectFormData {
  name: string;
  description: string;
  estimated_time: number;
  is_public: boolean;
  materials: ProjectMaterial[];
}

export interface SubprojectFormData
  extends Omit<Subproject, "id" | "created_at" | "updated_at"> {
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
    value: any
  ) => void;
  onRemoveMaterial: (materialIndex: number) => void;
}
