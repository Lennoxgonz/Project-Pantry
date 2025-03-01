import { Modal, Form, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import { InventoryItem } from "../types";

type MaterialFormData = Omit<InventoryItem, "id" | "created_at" | "updated_at">;

interface MaterialModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (material: MaterialFormData) => void;
  userId: string;
  title?: string;
  initialValues?: InventoryItem;
}

function MaterialModal({
  show,
  onHide,
  onSubmit,
  userId,
  title = "Add New Material",
  initialValues,
}: MaterialModalProps) {
  const [material, setMaterial] = useState<MaterialFormData>({
    user_id: userId,
    name: "",
    description: "",
    quantity: 0,
    unit: "",
    unit_cost: 0,
  });

  useEffect(() => {
    if (initialValues) {
      setMaterial({
        user_id: userId,
        name: initialValues.name,
        description: initialValues.description || "",
        quantity: initialValues.quantity,
        unit: initialValues.unit,
        unit_cost: initialValues.unit_cost,
      });
    } else {
      setMaterial({
        user_id: userId,
        name: "",
        description: "",
        quantity: 0,
        unit: "",
        unit_cost: 0,
      });
    }
  }, [initialValues, show, userId]);

  const commonMaterials = [
    { name: "2x4 Lumber", unit: "feet" },
    { name: "Wood Screws", unit: "pieces" },
    { name: "Wood Glue", unit: "bottles" },
    { name: "Paint", unit: "gallons" },
    { name: "Sandpaper", unit: "sheets" },
  ];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(material);
  }

  function handleSuggestionClick(suggestion: (typeof commonMaterials)[0]) {
    setMaterial({
      ...material,
      name: suggestion.name,
      unit: suggestion.unit,
    });
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {!initialValues && (
            <Form.Group className="mb-3">
              <Form.Label>Common Materials</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {commonMaterials.map((material, index) => (
                  <Button
                    key={index}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleSuggestionClick(material)}
                  >
                    {material.name}
                  </Button>
                ))}
              </div>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Material Name</Form.Label>
            <Form.Control
              type="text"
              value={material.name}
              onChange={(e) =>
                setMaterial({ ...material, name: e.target.value })
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={material.description || ""}
              onChange={(e) =>
                setMaterial({ ...material, description: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={material.quantity}
              onChange={(e) =>
                setMaterial({ ...material, quantity: Number(e.target.value) })
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Unit</Form.Label>
            <Form.Control
              type="text"
              value={material.unit}
              onChange={(e) =>
                setMaterial({ ...material, unit: e.target.value })
              }
              required
              placeholder="pieces, feet, gallons, etc."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cost per Unit</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={material.unit_cost}
              onChange={(e) =>
                setMaterial({ ...material, unit_cost: Number(e.target.value) })
              }
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {initialValues ? "Save Changes" : "Add Material"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default MaterialModal;
