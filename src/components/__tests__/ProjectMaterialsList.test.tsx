import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProjectMaterialsList, {
  MaterialWithInventory,
} from "../ProjectMaterialsList";

function createMaterial(
  id: string,
  isFulfilled: boolean
): MaterialWithInventory {
  return {
    id,
    project_id: "project-1",
    subproject_id: null,
    inventory_item_id: `inventory-${id}`,
    quantity_needed: 2,
    is_fulfilled: isFulfilled,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    inventory_item: {
      id: `inventory-${id}`,
      user_id: "user-1",
      name: `Material ${id}`,
      description: null,
      quantity: 10,
      unit: "pcs",
      unit_cost: 5,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
  };
}

describe("ProjectMaterialsList", () => {
  it("calls onFulfill with unfulfilled material ids", () => {
    const onFulfill = vi.fn();

    render(
      <ProjectMaterialsList
        materials={[createMaterial("1", false), createMaterial("2", true)]}
        onFulfill={onFulfill}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Fulfill Materials" }));

    expect(onFulfill).toHaveBeenCalledWith(["1"]);
  });

  it("calls onUnfulfill with fulfilled material ids", () => {
    const onUnfulfill = vi.fn();

    render(
      <ProjectMaterialsList
        materials={[createMaterial("1", false), createMaterial("2", true)]}
        onUnfulfill={onUnfulfill}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Unfulfill Materials" }));

    expect(onUnfulfill).toHaveBeenCalledWith(["2"]);
  });
});
