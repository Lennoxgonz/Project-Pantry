import { useState, useEffect } from "react";
import { Container, Table, Form, Button, Alert } from "react-bootstrap";
import { InventoryItem } from "../types";
import MaterialModal from "../components/MaterialModal";
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  updateInventoryItem,
  updateInventoryItemQuantity,
} from "../data-access/inventory.data";
import { getCurrentUser } from "../data-access/auth.data";
import { DataAccessError } from "../data-access/data-access-error";

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(function loadUserAndInventory() {
    async function fetchData() {
      try {
        const user = await getCurrentUser();
        setUserId(user.id);
        const items = await fetchInventoryItems();
        setInventory(items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load inventory"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function handleAddItem(
    material: Omit<InventoryItem, "id" | "created_at" | "updated_at">
  ) {
    setError(null);

    try {
      const createdItem = await createInventoryItem(material);
      setInventory([...inventory, createdItem]);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    }
  }

  async function handleUpdateItem(
    material: Omit<InventoryItem, "id" | "created_at" | "updated_at">
  ) {
    if (!editingItem) return;

    try {
      await updateInventoryItem(editingItem.id, material);

      setInventory(
        inventory.map((item) =>
          item.id === editingItem.id ? { ...item, ...material } : item
        )
      );
      setShowModal(false);
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  }

  async function handleUpdateQuantity(id: string, newQuantity: number) {
    try {
      await updateInventoryItemQuantity(id, newQuantity);

      setInventory(
        inventory.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update quantity"
      );
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await deleteInventoryItem(id);
      setInventory(inventory.filter((item) => item.id !== id));
    } catch (err) {
      if (err instanceof DataAccessError) {
        if (err.code === "23503") {
          setError("Cannot delete material that is being used in projects");
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  function handleEdit(item: InventoryItem) {
    setEditingItem(item);
    setShowModal(true);
  }

  if (loading || !userId)
    return <Container className="py-4">Loading inventory...</Container>;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Inventory</h1>
        <Button onClick={() => setShowModal(true)}>Add New Item</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Material</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Cost per Unit</th>
            <th>Total Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>
                <Form.Control
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleUpdateQuantity(item.id, Number(e.target.value))
                  }
                  min="0"
                  step="0.01"
                />
              </td>
              <td>{item.unit}</td>
              <td>${item.unit_cost.toFixed(2)}</td>
              <td>${(item.quantity * item.unit_cost).toFixed(2)}</td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <MaterialModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdateItem : handleAddItem}
        title={editingItem ? "Edit Material" : "Add New Material"}
        initialValues={editingItem || undefined}
        userId={userId}
      />
    </Container>
  );
}

export default InventoryPage;
