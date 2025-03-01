import { useState, useEffect } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import {
  CreateProject,
  CreateSubproject,
  InventoryItem,
  ProjectMaterial,
} from "../types";
import { SubprojectFormData } from "../types/project-edit.types";
import supabaseClient from "../utils/supabaseClient";
import ProjectForm from "../components/ProjectForm";
import SubprojectForm from "../components/SubprojectForm";

function NewProjectPage() {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectTime, setProjectTime] = useState<number>(0);
  const [isPublic, setIsPublic] = useState(false);
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterial[]>(
    []
  );
  const [subprojects, setSubprojects] = useState<SubprojectFormData[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession();
      if (sessionError || !session?.user)
        throw new Error("Authentication required");

      const projectData: CreateProject = {
        user_id: session.user.id,
        name: projectName,
        description: projectDescription || null,
        estimated_time: projectTime || null,
        is_public: isPublic,
      };

      const { data: project, error: projectError } = await supabaseClient
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;
      if (!project) throw new Error("Failed to create project");

      if (projectMaterials.length > 0) {
        const projectMaterialsData = projectMaterials.map((material) => ({
          project_id: project.id,
          subproject_id: null,
          inventory_item_id: material.inventory_item_id,
          quantity_needed: material.quantity_needed,
          is_fulfilled: false,
        }));

        const { error: projectMaterialsError } = await supabaseClient
          .from("project_materials")
          .insert(projectMaterialsData);

        if (projectMaterialsError) throw projectMaterialsError;
      }

      if (subprojects.length > 0) {
        const subprojectData: CreateSubproject[] = subprojects.map((sub) => ({
          project_id: project.id,
          name: sub.name,
          description: sub.description || null,
          estimated_time: sub.estimated_time || null,
          order_index: sub.order_index,
        }));

        const { data: insertedSubprojects, error: subprojectError } =
          await supabaseClient
            .from("subprojects")
            .insert(subprojectData)
            .select();

        if (subprojectError) throw subprojectError;

        for (let i = 0; i < insertedSubprojects.length; i++) {
          const subprojectMaterials = subprojects[i].materials.map(
            (material) => ({
              subproject_id: insertedSubprojects[i].id,
              project_id: null,
              inventory_item_id: material.inventory_item_id,
              quantity_needed: material.quantity_needed,
              is_fulfilled: false,
            })
          );

          if (subprojectMaterials.length > 0) {
            const { error: materialError } = await supabaseClient
              .from("project_materials")
              .insert(subprojectMaterials);

            if (materialError) throw materialError;
          }
        }
      }

      setSuccess(true);
      setProjectName("");
      setProjectDescription("");
      setProjectTime(0);
      setIsPublic(false);
      setProjectMaterials([]);
      setSubprojects([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <Container className="py-4">
      <h1>Create New Project</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && (
        <Alert variant="success">Project created successfully!</Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <ProjectForm
          projectName={projectName}
          projectDescription={projectDescription}
          projectTime={projectTime}
          isPublic={isPublic}
          materials={projectMaterials}
          inventoryItems={inventoryItems}
          onNameChange={setProjectName}
          onDescriptionChange={setProjectDescription}
          onTimeChange={setProjectTime}
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
          <Button variant="primary" type="submit">
            Create Project
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default NewProjectPage;
