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
} from "react-bootstrap";

import { Project, Subproject } from "../types";
import { useProjects } from "../hooks/useProjects";
import { fetchSubprojectsByProjectId } from "../data-access/subprojects.data";
import {
  fetchProjectMaterialsWithInventory,
  ProjectMaterialWithInventory,
  fetchSubprojectMaterialsWithInventory,
  fulfillMaterialsByIds,
} from "../data-access/materials.data";
import ProjectMaterialsList, {
  MaterialWithInventory,
} from "../components/ProjectMaterialsList";

function groupMaterialsBySubproject(
  materials: ProjectMaterialWithInventory[]
): Record<string, MaterialWithInventory[]> {
  return materials.reduce(
    (materialsBySubproject, material) => {
      const subprojectId = material.subproject_id;
      if (!subprojectId) {
        return materialsBySubproject;
      }

      if (!materialsBySubproject[subprojectId]) {
        materialsBySubproject[subprojectId] = [];
      }

      materialsBySubproject[subprojectId].push(material);
      return materialsBySubproject;
    },
    {} as Record<string, MaterialWithInventory[]>
  );
}

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectMaterials, setProjectMaterials] = useState<
    MaterialWithInventory[]
  >([]);
  const [subprojectMaterials, setSubprojectMaterials] = useState<
    Record<string, MaterialWithInventory[]>
  >({});
  const [fulfillError, setFulfillError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [subprojects, setSubprojects] = useState<Subproject[] | null>(null);
  const [subprojectsLoading, setSubprojectsLoading] = useState(false);

  const {
    fetchProjectById,
    deleteProject,
    loading: projectLoading,
    error: projectError,
  } = useProjects();

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setPageError(null);
      setSubprojectsLoading(true);
      const projectData = await fetchProjectById(id);
      if (projectData) {
        setProject(projectData);
        const [loadedSubprojects, projectMaterialsData, subMaterialsData] =
          await Promise.all([
            fetchSubprojectsByProjectId(id),
            fetchProjectMaterialsWithInventory(id),
            fetchSubprojectMaterialsWithInventory(),
          ]);

        setSubprojects(loadedSubprojects);
        setProjectMaterials(projectMaterialsData);
        setSubprojectMaterials(
          groupMaterialsBySubproject(subMaterialsData)
        );
      } else {
        setProject(null);
      }
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load project data."
      );
    } finally {
      setSubprojectsLoading(false);
    }
  }, [id, fetchProjectById]);

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (!isMounted) return;
      await loadData();
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [loadData]);

  async function handleDeleteProject() {
    if (!id) return;
    try {
      setIsDeleting(true);
      setPageError(null);
      await deleteProject(id);
      navigate("/projects");
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to delete project."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleFulfillMaterials(materialIds: string[]) {
    setFulfillError(null);
    try {
      await fulfillMaterialsByIds(materialIds);
      await loadData();
    } catch (err) {
      setFulfillError(
        err instanceof Error ? err.message : "Failed to fulfill materials"
      );
    }
  }

  const loading = projectLoading || subprojectsLoading;
  const error = projectError || fulfillError || pageError;

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
              <ProjectMaterialsList
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
                        <ProjectMaterialsList
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