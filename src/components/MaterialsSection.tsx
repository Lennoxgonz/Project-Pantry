import { Button, Form } from "react-bootstrap";
import { ProjectMaterial, InventoryItem } from "../types";

interface MaterialsSectionProps {
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

function MaterialsSection({
  title = "Materials",
  materials,
  inventoryItems,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
}: MaterialsSectionProps) {
  return (
    <div className="mt-4">
      <h4>{title}</h4>
      {materials.map((material, materialIndex) => (
        <div key={materialIndex} className="border-top pt-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Material {materialIndex + 1}</h5>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onRemoveMaterial(materialIndex)}
            >
              Remove Material
            </Button>
          </div>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Material</Form.Label>
                <Form.Select
                  value={material.inventory_item_id}
                  onChange={(e) =>
                    onUpdateMaterial(
                      materialIndex,
                      "inventory_item_id",
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">Select Material</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit} available)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Quantity Needed</Form.Label>
                <Form.Control
                  type="number"
                  value={material.quantity_needed}
                  onChange={(e) =>
                    onUpdateMaterial(
                      materialIndex,
                      "quantity_needed",
                      Number(e.target.value)
                    )
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </Form.Group>
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={onAddMaterial}
        className="mb-3"
      >
        Add Material
      </Button>
    </div>
  );
}

export default MaterialsSection;
