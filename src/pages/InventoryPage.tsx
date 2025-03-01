import { useState, useEffect } from "react";
import { Container, Table, Form, Button, Alert } from "react-bootstrap";
import supabaseClient from "../utils/supabaseClient";
import { InventoryItem } from "../types";
import MaterialModal from "../components/MaterialModal";

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
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("No user logged in");

        setUserId(user.id);

        const { data, error } = await supabaseClient
          .from("inventory_items")
          .select("*")
          .order("name");

        if (error) throw error;
        setInventory(data || []);
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
      const { data, error } = await supabaseClient
        .from("inventory_items")
        .insert([material])
        .select();

      if (error) throw error;

      setInventory([...inventory, data[0]]);
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
      const { error } = await supabaseClient
        .from("inventory_items")
        .update(material)
        .eq("id", editingItem.id);

      if (error) throw error;

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
      const { error } = await supabaseClient
        .from("inventory_items")
        .update({ quantity: newQuantity })
        .eq("id", id);

      if (error) throw error;

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
      const { error } = await supabaseClient
        .from("inventory_items")
        .delete()
        .eq("id", id);
  
      if (error) {
        if (error.code === "23503") { // foreign key constraint error code
          setError("Cannot delete material that is being used in projects");
          return;
        }
        throw error;
      }
  
      setInventory(inventory.filter((item) => item.id !== id));
    } catch (err) {
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
