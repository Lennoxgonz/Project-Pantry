import { useState, useEffect, useCallback } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { InventoryItem, ProjectMaterial } from "../types";
import { SubprojectFormData } from "../types/project-edit.types";
import ProjectForm from "../components/ProjectForm";
import SubprojectForm from "../components/SubprojectForm";
import { useProjects } from "../hooks/useProjects";
import supabaseClient from "../utils/supabaseClient";

function toUpdateMaterialInputs(materials: ProjectMaterial[]) {
  return materials
    .filter(
      (material) =>
        material.inventory_item_id.trim() !== "" && material.quantity_needed > 0
    )
    .map((material) => ({
      id: material.id || undefined,
      inventory_item_id: material.inventory_item_id,
      quantity_needed: material.quantity_needed,
      is_fulfilled: material.is_fulfilled,
    }));
}

function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    fetchProjectById,
    updateProjectWithDetails,
    error: projectHookError,
  } = useProjects();

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [isPublic, setIsPublic] = useState(false);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterial[]>([]);
  const [subprojects, setSubprojects] = useState<SubprojectFormData[]>([]);

  const loadInventoryItems = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from("inventory_items")
        .select("*")
        .order("name");

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory items");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProjectData() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const projectData = await fetchProjectById(id);
        if (!projectData) throw new Error("Project not found");

        if (!isMounted) return;

        setProjectName(projectData.name);
        setProjectDescription(projectData.description || "");
        setEstimatedHours(projectData.estimated_time || 0);
        setIsPublic(projectData.is_public);

        const { data: materialsData, error: materialsError } = await supabaseClient
          .from("project_materials")
          .select("*")
          .eq("project_id", id)
          .is("subproject_id", null);

        if (materialsError) throw materialsError;
        if (!isMounted) return;

        setProjectMaterials(materialsData || []);

        const { data: loadedSubprojects, error: subprojectsError } =
          await supabaseClient
          .from("subprojects")
          .select("*")
          .eq("project_id", id)
          .order("order_index");

        if (subprojectsError) throw subprojectsError;

        if (loadedSubprojects && loadedSubprojects.length > 0) {
          const subprojectsWithMaterials = await Promise.all(
            loadedSubprojects.map(async (sub) => {
              const { data: subMaterials, error: subMaterialsError } = await supabaseClient
                .from("project_materials")
                .select("*")
                .eq("subproject_id", sub.id);

              if (subMaterialsError) throw subMaterialsError;

              return {
                id: sub.id,
                project_id: sub.project_id,
                name: sub.name,
                description: sub.description || "",
                estimated_time: sub.estimated_time || 0,
                order_index: sub.order_index,
                materials: subMaterials || [],
              };
            })
          );

          if (!isMounted) return;
          setSubprojects(subprojectsWithMaterials);
        } else {
          setSubprojects([]);
        }

        await loadInventoryItems();
        if (!isMounted) return;

        setLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setLoading(false);
        }
      }
    }

    loadProjectData();

    return () => {
      isMounted = false;
    };
  }, [id, fetchProjectById, loadInventoryItems]);

  function addSubproject() {
    setSubprojects((previousSubprojects) => [
      ...previousSubprojects,
      {
        project_id: id!,
        name: "",
        description: "",
        estimated_time: 0,
        order_index: previousSubprojects.length,
        materials: [],
      },
    ]);
  }

  function updateSubproject(
    index: number,
    field: keyof Omit<SubprojectFormData, "materials">,
    value: string | number
  ) {
    setSubprojects((previousSubprojects) => {
      const updated = [...previousSubprojects];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  }

  function handleSubprojectChange(
    index: number,
    updatedSubproject: SubprojectFormData
  ) {
    setSubprojects((previousSubprojects) => {
      const updated = [...previousSubprojects];
      updated[index] = updatedSubproject;
      return updated;
    });
  }

  function removeSubproject(index: number) {
    setSubprojects((previousSubprojects) => {
      const filtered = previousSubprojects.filter((_, i) => i !== index);
      return filtered.map((subproject, i) => ({
        ...subproject,
        order_index: i,
      }));
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    if (event) {
      event.preventDefault();
    }
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      if (!id) throw new Error("Project ID is required");
      if (projectName.trim().length === 0) {
        throw new Error("Project name is required");
      }
      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error("Authentication required");
      }

      await updateProjectWithDetails(session.user.id, {
        id,
        name: projectName,
        description: projectDescription,
        estimated_time: estimatedHours,
        is_public: isPublic,
        materials: toUpdateMaterialInputs(projectMaterials),
        subprojects: subprojects.map((subproject, index) => ({
          id: subproject.id,
          name: subproject.name,
          description: subproject.description || "",
          estimated_time: subproject.estimated_time || 0,
          order_index: index,
          materials: toUpdateMaterialInputs(subproject.materials),
        })),
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        navigate(`/projects/${id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading project details...</span>
        </Spinner>
      </Container>
    );
  }

  const combinedError = error || projectHookError;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Project</h1>
        <div>
          <Button
            variant="outline-primary"
            onClick={() => navigate(`/projects/${id}`)}
            className="me-2"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {combinedError && <Alert variant="danger">{combinedError}</Alert>}
      {success && <Alert variant="success">Project updated successfully!</Alert>}

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

        <h2 className="mt-4">Subprojects</h2>
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

        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="secondary" type="button" onClick={addSubproject}>
            Add Subproject
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default EditProjectPage;