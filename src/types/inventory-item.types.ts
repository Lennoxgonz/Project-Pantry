export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_cost: number;
  created_at: string;
  updated_at: string;
}

export type CreateInventoryItem = Omit<
  InventoryItem,
  "id" | "created_at" | "updated_at"
>;
