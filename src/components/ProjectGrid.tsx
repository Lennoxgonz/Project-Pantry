import { Row, Col, Card, Alert, Button } from "react-bootstrap";
import { Project } from "../types/";
import { useNavigate } from "react-router-dom";

interface ProjectGridProps {
  projects: Project[];
}

function ProjectGrid({ projects }: ProjectGridProps): JSX.Element {
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        No projects found
      </Alert>
    );
  }

  return (
    <Row xs={1} md={2} lg={3}>
      {projects.map((project) => (
        <Col key={project.id}>
          <Card className="border border-1 m-2">
            <Card.Body>
              <Card.Title>{project.name}</Card.Title>
              <Card.Text>{project.description}</Card.Text>
              <Card.Text>
                Created: {new Date(project.created_at).toLocaleDateString()}
              </Card.Text>
              <Button onClick={() => navigate(`/projects/${project.id}`)}>
                See Details
              </Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default ProjectGrid;
