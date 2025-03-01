import { Form } from "react-bootstrap";
import { ProjectFormProps } from "../types/project-edit.types";
import MaterialsSection from "./MaterialsSection";
import { ProjectMaterial } from "../types";

function ProjectForm({
  projectName,
  projectDescription,
  projectTime,
  isPublic,
  materials,
  inventoryItems,
  onNameChange,
  onDescriptionChange,
  onTimeChange,
  onPublicChange,
  onMaterialsChange,
}: ProjectFormProps) {
  function handleAddMaterial() {
    onMaterialsChange([
      ...materials,
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
  }

  function handleUpdateMaterial(
    materialIndex: number,
    field: keyof ProjectMaterial,
    value: any
  ) {
    const updatedMaterials = materials.map((material, index) =>
      index === materialIndex ? { ...material, [field]: value } : material
    );
    onMaterialsChange(updatedMaterials);
  }

  function handleRemoveMaterial(materialIndex: number) {
    const updatedMaterials = materials.filter(
      (_, index) => index !== materialIndex
    );
    onMaterialsChange(updatedMaterials);
  }

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Project Name</Form.Label>
        <Form.Control
          type="text"
          value={projectName}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={projectDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Estimated Time (hours)</Form.Label>
        <Form.Control
          type="number"
          value={projectTime}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          min="0"
          step="0.5"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Make Project Public"
          checked={isPublic}
          onChange={(e) => onPublicChange(e.target.checked)}
        />
      </Form.Group>

      <MaterialsSection
        title="Project Materials"
        materials={materials}
        inventoryItems={inventoryItems}
        onAddMaterial={handleAddMaterial}
        onUpdateMaterial={handleUpdateMaterial}
        onRemoveMaterial={handleRemoveMaterial}
      />
    </>
  );
}

export default ProjectForm;
