import { useState, useEffect } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { InventoryItem, ProjectMaterial } from "../types";
import { SubprojectFormData } from "../types/project-edit.types";
import supabaseClient from "../utils/supabaseClient";
import ProjectForm from "../components/ProjectForm";
import SubprojectForm from "../components/SubprojectForm";
import { useProjects } from "../hooks/useProjects";

function toCreateMaterialInputs(materials: ProjectMaterial[]) {
  return materials
    .filter(
      (material) =>
        material.inventory_item_id.trim() !== "" && material.quantity_needed > 0
    )
    .map((material) => ({
      inventory_item_id: material.inventory_item_id,
      quantity_needed: material.quantity_needed,
      is_fulfilled: material.is_fulfilled,
    }));
}

function NewProjectPage() {
  const { createProjectWithDetails, error: projectHookError } = useProjects();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [isPublic, setIsPublic] = useState(false);
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterial[]>(
    []
  );
  const [subprojects, setSubprojects] = useState<SubprojectFormData[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(function loadInventory() {
    async function fetchInventory() {
      try {
        const { data, error } = await supabaseClient
          .from("inventory_items")
          .select("*")
          .order("name");

        if (error) throw error;
        setInventoryItems(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }

    fetchInventory();
  }, []);

  function addSubproject() {
    setSubprojects([
      ...subprojects,
      {
        project_id: "",
        name: "",
        description: "",
        estimated_time: 0,
        order_index: subprojects.length,
        materials: [],
      },
    ]);
  }

  function updateSubproject(
    index: number,
    field: keyof Omit<SubprojectFormData, "materials">,
    value: string | number
  ) {
    const updatedSubprojects = [...subprojects];
    updatedSubprojects[index] = {
      ...updatedSubprojects[index],
      [field]: value,
    };
    setSubprojects(updatedSubprojects);
  }

  function removeSubproject(index: number) {
    const updatedSubprojects = subprojects.filter((_, i) => i !== index);
    const reorderedSubprojects = updatedSubprojects.map((subproject, i) => ({
      ...subproject,
      order_index: i,
    }));
    setSubprojects(reorderedSubprojects);
  }

  function handleSubprojectChange(
    index: number,
    updatedSubproject: SubprojectFormData
  ) {
    const newSubprojects = [...subprojects];
    newSubprojects[index] = updatedSubproject;
    setSubprojects(newSubprojects);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession();
      if (sessionError || !session?.user)
        throw new Error("Authentication required");

      if (projectName.trim().length === 0) {
        throw new Error("Project name is required");
      }

      await createProjectWithDetails(session.user.id, {
        name: projectName,
        description: projectDescription,
        estimated_time: estimatedHours,
        is_public: isPublic,
        materials: toCreateMaterialInputs(projectMaterials),
        subprojects: subprojects.map((sub, index) => ({
          name: sub.name,
          description: sub.description || "",
          estimated_time: sub.estimated_time || 0,
          order_index: index,
          materials: toCreateMaterialInputs(sub.materials),
        })),
      });

      setSuccess(true);
      setProjectName("");
      setProjectDescription("");
      setEstimatedHours(0);
      setIsPublic(false);
      setProjectMaterials([]);
      setSubprojects([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  const combinedError = error || projectHookError;

  return (
    <Container className="py-4">
      <h1>Create New Project</h1>
      {combinedError && <Alert variant="danger">{combinedError}</Alert>}
      {success && (
        <Alert variant="success">Project created successfully!</Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <ProjectForm
          projectName={projectName}
          projectDescription={projectDescription}
          estimatedHours={estimatedHours}
          isPublic={isPublic}
          materials={projectMaterials}
          inventoryItems={inventoryItems}
          onNameChange={setProjectName}
          onDescriptionChange={setProjectDescription}
          onEstimatedHoursChange={setEstimatedHours}
          onPublicChange={setIsPublic}
          onMaterialsChange={setProjectMaterials}
        />

        <h2>Subprojects</h2>
        {subprojects.map((subproject, index) => (
          <SubprojectForm
            key={index}
            subproject={subproject}
            subprojectIndex={index}
            inventoryItems={inventoryItems}
            onUpdate={updateSubproject}
            onRemove={removeSubproject}
            onChange={handleSubprojectChange}
          />
        ))}

        <div className="d-flex justify-content-between mb-3">
          <Button variant="secondary" type="button" onClick={addSubproject}>
            Add Subproject
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Create Project"}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default NewProjectPage;
