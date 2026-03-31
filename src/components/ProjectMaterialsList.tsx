import { Badge, Button, ListGroup } from "react-bootstrap";
import { InventoryItem, ProjectMaterial } from "../types";

export interface MaterialWithInventory extends ProjectMaterial {
  inventory_item: InventoryItem;
}

interface ProjectMaterialsListProps {
  materials: MaterialWithInventory[];
  onFulfill?: (materialIds: string[]) => void;
  onUnfulfill?: (materialIds: string[]) => void;
}

function ProjectMaterialsList({
  materials,
  onFulfill,
  onUnfulfill,
}: ProjectMaterialsListProps): JSX.Element {
  if (!materials || materials.length === 0) {
    return <div className="text-muted">No materials required</div>;
  }

  const unfulfilledMaterials = materials.filter((material) => !material.is_fulfilled);
  const fulfilledMaterials = materials.filter((material) => material.is_fulfilled);
  const hasUnfulfilledMaterials = unfulfilledMaterials.length > 0;
  const hasFulfilledMaterials = fulfilledMaterials.length > 0;

  return (
    <div>
      <ListGroup variant="flush" className="mb-3">
        {materials.map((material) => (
          <ListGroup.Item
            key={material.id}
            className="d-flex justify-content-between align-items-center"
          >
            <div>
              <div>{material.inventory_item.name}</div>
              <small className="text-muted">
                Needed: {material.quantity_needed} {material.inventory_item.unit}
              </small>
            </div>
            <Badge bg={material.is_fulfilled ? "success" : "warning"}>
              {material.is_fulfilled ? "Fulfilled" : "Unfulfilled"}
            </Badge>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="d-flex gap-2">
        {onFulfill && hasUnfulfilledMaterials && (
          <Button
            variant="success"
            size="sm"
            onClick={() =>
              onFulfill(unfulfilledMaterials.map((material) => material.id))
            }
          >
            Fulfill Materials
          </Button>
        )}

        {onUnfulfill && hasFulfilledMaterials && (
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() =>
              onUnfulfill(fulfilledMaterials.map((material) => material.id))
            }
          >
            Unfulfill Materials
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProjectMaterialsList;
