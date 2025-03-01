import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Alert,
  Card,
  ListGroup,
  Button,
  Modal,
  Spinner,
  Badge,
} from "react-bootstrap";

import { Project, ProjectMaterial, InventoryItem } from "../types";
import { useProjects } from "../hooks/useProjects";
import { useSubprojects } from "../hooks/useSubprojects";
import { useMaterials } from "../hooks/useMaterials";
import supabaseClient from "../utils/supabaseClient";

interface MaterialWithInventory extends ProjectMaterial {
  inventory_item: InventoryItem;
}

function MaterialsList({ 
  materials, 
  onFulfill 
}: { 
  materials: MaterialWithInventory[];
  onFulfill?: (materialIds: string[]) => void;
}) {
  if (!materials || materials.length === 0) {
    return <div className="text-muted">No materials required</div>;
  }

  const unfulfilledMaterials = materials.filter(m => !m.is_fulfilled);
  const allMaterialsFulfilled = unfulfilledMaterials.length === 0;

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
      {onFulfill && !allMaterialsFulfilled && (
        <Button 
          variant="success" 
          size="sm"
          onClick={() => onFulfill(unfulfilledMaterials.map(m => m.id))}
        >
          Fulfill Materials
        </Button>
      )}
    </div>
  );
}

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectMaterials, setProjectMaterials] = useState<MaterialWithInventory[]>([]);
  const [subprojectMaterials, setSubprojectMaterials] = useState<Record<string, MaterialWithInventory[]>>({});
  const [fulfillError, setFulfillError] = useState<string | null>(null);

  const {
    getProjectById,
    deleteProject,
    loading: projectLoading,
    error: projectError,
  } = useProjects();
  const {
    subprojects,
    getSubprojects,
    loading: subprojectsLoading,
    error: subprojectsError,
  } = useSubprojects();
  const { fulfillMaterials } = useMaterials();

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      const projectData = await getProjectById(id);
      if (projectData) {
        setProject(projectData);
        await getSubprojects(id);

        // Get project materials
        const { data: projectMaterialsData, error: projectMaterialsError } =
          await supabaseClient
            .from("project_materials")
            .select(`
              *,
              inventory_item:inventory_items(*)
            `)
            .eq("project_id", id)
            .is("subproject_id", null);

        if (projectMaterialsError) throw projectMaterialsError;
        setProjectMaterials(projectMaterialsData || []);

        // Get subproject materials
        const { data: subMaterialsData, error: subMaterialsError } =
          await supabaseClient
            .from("project_materials")
            .select(`
              *,
              inventory_item:inventory_items(*)
            `)
            .is("project_id", null)
            .not("subproject_id", "is", null);

        if (subMaterialsError) throw subMaterialsError;

        // Group materials by subproject
        const materialsBySubproject = (subMaterialsData || []).reduce(
          (acc, material) => {
            const subprojectId = material.subproject_id;
            if (!acc[subprojectId]) {
              acc[subprojectId] = [];
            }
            acc[subprojectId].push(material);
            return acc;
          },
          {} as Record<string, MaterialWithInventory[]>
        );

        setSubprojectMaterials(materialsBySubproject);
      } else {
        setProject(null);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
    }
  }, [id, getProjectById, getSubprojects]);

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (!mounted) return;
      await loadData();
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [loadData]);

  async function handleDeleteProject() {
    if (!id) return;
    try {
      setIsDeleting(true);
      await deleteProject(id);
      navigate("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleFulfillMaterials(materialIds: string[]) {
    setFulfillError(null);
    try {
      await fulfillMaterials(materialIds);
      await loadData(); // Reload data to show updated fulfillment status
    } catch (err) {
      setFulfillError(err instanceof Error ? err.message : "Failed to fulfill materials");
    }
  }

  const loading = projectLoading || subprojectsLoading;
  const error = projectError || subprojectsError || fulfillError;

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading project details...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error}
          <Button
            className="ms-3"
            variant="outline-primary"
            onClick={() => navigate("/projects")}
          >
            Back to Projects
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Project not found
          <Button
            className="ms-3"
            variant="outline-primary"
            onClick={() => navigate("/projects")}
          >
            Back to Projects
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex gap-2 mb-3">
          <Button variant="outline-primary" onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>

        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>{project.name}</h1>
            <div className="d-flex gap-2">
              <Button
                variant="outline-danger"
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate(`/projects/${project.id}/edit`)}
              >
                Edit Project
              </Button>
            </div>
          </div>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Project Details</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Description:</strong>{" "}
                  {project.description || "No description provided"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Estimated Time:</strong>{" "}
                  {project.estimated_time
                    ? `${project.estimated_time} hours`
                    : "Not specified"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Visibility:</strong>{" "}
                  {project.is_public ? "Public" : "Private"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Created:</strong>{" "}
                  {new Date(project.created_at).toLocaleDateString()}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(project.updated_at).toLocaleDateString()}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Project Materials</Card.Title>
              <MaterialsList 
                materials={projectMaterials} 
                onFulfill={handleFulfillMaterials}
              />
            </Card.Body>
          </Card>

          <h2>Subprojects</h2>
          {!subprojects || subprojects.length === 0 ? (
            <Alert variant="info">No subprojects found for this project.</Alert>
          ) : (
            <div>
              {subprojects.map((subproject) => (
                <Card key={subproject.id} className="mb-3">
                  <Card.Body>
                    <Card.Title>{subproject.name}</Card.Title>
                    <Card.Text>
                      {subproject.description || "No description provided"}
                    </Card.Text>
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <strong>Estimated Time:</strong>{" "}
                        {subproject.estimated_time
                          ? `${subproject.estimated_time} hours`
                          : "Not specified"}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Order:</strong> {subproject.order_index + 1}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Materials:</strong>
                        <MaterialsList 
                          materials={subprojectMaterials[subproject.id] || []}
                          onFulfill={handleFulfillMaterials}
                        />
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        show={showDeleteModal}
        onHide={() => !isDeleting && setShowDeleteModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{project.name}"? This action cannot
          be undone and will delete all subprojects associated with this
          project.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteProject}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              "Delete Project"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ProjectPage;