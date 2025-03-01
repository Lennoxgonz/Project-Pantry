import { useState, useEffect } from "react";
import {
  Container,
  Spinner,
  Alert,
  Button,
  Row,
  Col,
  Form,
  InputGroup,
} from "react-bootstrap";

import { Search, Plus, FileText } from "lucide-react";
import ProjectGrid from "../components/ProjectGrid";
import ProjectReport from "../components/ProjectReport";
import { useProjects } from "../hooks/useProjects";

function ProjectsPage(): JSX.Element {
  const { projects, error, loading, getProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        await getProjects();
      } catch (error) {
        if (mounted) {
          console.error("Error loading projects:", error);
        }
      }
    };

    loadProjects();

    return () => {
      mounted = false;
    };
  }, [getProjects]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading projects...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">Error: {error}</Alert>
      </Container>
    );
  }

  const hasProjects = projects && projects.length > 0;
  const filteredProjects = hasProjects
    ? projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      )
    : [];

  return (
    <Container className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="mb-0">My Projects</h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          {hasProjects && (
            <Button
              variant="primary"
              onClick={() => setShowReport(true)}
              className="d-flex align-items-center gap-2"
            >
              <FileText size={20} />
              Generate Report
            </Button>
          )}
          <Button
            variant="success"
            href="/projects/new"
            className="d-flex align-items-center gap-2"
          >
            <Plus size={20} />
            New Project
          </Button>
        </Col>
      </Row>

      {hasProjects && (
        <Row className="mb-4">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <Search className="text-muted" size={20} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0 shadow-none"
              />
            </InputGroup>
          </Col>
        </Row>
      )}

      {filteredProjects.length > 0 ? (
        <ProjectGrid projects={filteredProjects} />
      ) : (
        <Alert variant="info" className="text-center">
          {searchTerm ? "No projects match your search" : "No projects yet"}
        </Alert>
      )}

      {hasProjects && showReport && (
        <ProjectReport
          show={showReport}
          onHide={() => setShowReport(false)}
          projects={projects}
        />
      )}
    </Container>
  );
}

export default ProjectsPage;
