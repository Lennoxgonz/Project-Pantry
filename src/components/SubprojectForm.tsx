import { Form, Button } from "react-bootstrap";
import { SubprojectFormData, ProjectMaterial } from "../types";
import { InventoryItem } from "../types";
import MaterialsSection from "./MaterialsSection";

interface SubprojectFormProps {
  subproject: SubprojectFormData;
  subprojectIndex: number;
  inventoryItems: InventoryItem[];
  onUpdate: (
    index: number,
    field: keyof Omit<SubprojectFormData, "materials">,
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, updatedSubproject: SubprojectFormData) => void;
}

function SubprojectForm({
  subproject,
  subprojectIndex,
  inventoryItems,
  onUpdate,
  onRemove,
  onChange,
}: SubprojectFormProps) {
  function handleAddMaterial() {
    const newMaterials = [
      ...subproject.materials,
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
    ];

    onChange(subprojectIndex, {
      ...subproject,
      materials: newMaterials,
    });
  }

  function handleUpdateMaterial(
    materialIndex: number,
    field: keyof ProjectMaterial,
    value: any
  ) {
    const newMaterials = subproject.materials.map((material, index) =>
      index === materialIndex ? { ...material, [field]: value } : material
    );

    onChange(subprojectIndex, {
      ...subproject,
      materials: newMaterials,
    });
  }

  function handleRemoveMaterial(materialIndex: number) {
    const newMaterials = subproject.materials.filter(
      (_, index) => index !== materialIndex
    );

    onChange(subprojectIndex, {
      ...subproject,
      materials: newMaterials,
    });
  }

  return (
    <div className="border p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3>Subproject {subprojectIndex + 1}</h3>
        <Button variant="danger" onClick={() => onRemove(subprojectIndex)}>
          Remove
        </Button>
      </div>
      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={subproject.name}
          onChange={(e) => onUpdate(subprojectIndex, "name", e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={subproject.description || ""}
          onChange={(e) =>
            onUpdate(subprojectIndex, "description", e.target.value)
          }
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Estimated Time (hours)</Form.Label>
        <Form.Control
          type="number"
          value={subproject.estimated_time || 0}
          onChange={(e) =>
            onUpdate(subprojectIndex, "estimated_time", Number(e.target.value))
          }
          min="0"
          step="0.5"
        />
      </Form.Group>
      <MaterialsSection
        title="Subproject Materials"
        materials={subproject.materials}
        inventoryItems={inventoryItems}
        onAddMaterial={handleAddMaterial}
        onUpdateMaterial={handleUpdateMaterial}
        onRemoveMaterial={handleRemoveMaterial}
      />
    </div>
  );
}

export default SubprojectForm;
