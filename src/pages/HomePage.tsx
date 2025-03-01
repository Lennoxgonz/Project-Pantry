import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <Container fluid className="p-0">
      <Container fluid className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="mb-4 mb-md-0">
              <h1 className="display-4 fw-bold">Welcome to Project Pantry</h1>
              <p className="lead mb-4">
                Organize, track, and manage your DIY projects with ease. Keep
                track of materials, plan your builds, and bring your creative
                visions to life.
              </p>
              <Button
                variant="light"
                size="lg"
                onClick={() => navigate("/login")}
                className="fw-semibold"
              >
                Get Started
              </Button>
            </Col>
            <Col md={6}>
              <img
                src="/images/tools-on-table.jpg"
                alt="Image of DIY Project Tools"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </Container>

      <Container className="py-5">
        <h2 className="text-center mb-5">
          Everything You Need for Project Success
        </h2>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <i className="bi bi-clipboard-check fs-1 text-primary mb-3"></i>
                <Card.Title className="mb-3">Project Management</Card.Title>
                <Card.Text>
                  Create detailed project plans with subprojects, timelines, and
                  material lists. Track progress and stay organized.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <i className="bi bi-box-seam fs-1 text-primary mb-3"></i>
                <Card.Title className="mb-3">Inventory Tracking</Card.Title>
                <Card.Text>
                  Keep track of your materials and supplies. Know what you have
                  and what you need for each project.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <i className="bi bi-calculator fs-1 text-primary mb-3"></i>
                <Card.Title className="mb-3">Cost Management</Card.Title>
                <Card.Text>
                  Calculate material costs, track expenses, and manage your
                  project budget effectively.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Container fluid className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">How It Works</h2>
          <Row>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <span
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  1
                </span>
              </div>
              <h4 className="mb-3">Create Project</h4>
              <p className="text-muted">
                Start by creating a new project and defining its scope
              </p>
            </Col>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <span
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  2
                </span>
              </div>
              <h4 className="mb-3">Add Materials</h4>
              <p className="text-muted">
                List required materials and track your inventory
              </p>
            </Col>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <span
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  3
                </span>
              </div>
              <h4 className="mb-3">Plan Phases</h4>
              <p className="text-muted">
                Break down your project into manageable subprojects
              </p>
            </Col>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <span
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  4
                </span>
              </div>
              <h4 className="mb-3">Track Progress</h4>
              <p className="text-muted">
                Monitor progress and manage resources as you build
              </p>
            </Col>
          </Row>
        </Container>
      </Container>

      {/* Call to Action */}
      <Container className="text-center py-5">
        <h2 className="mb-4">Ready to Start Your Next Project?</h2>
        <p className="lead mb-4">
          Join Project Pantry today and take control of your DIY projects.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate("/login")}
          className="fw-semibold"
        >
          Get Started Now
        </Button>
      </Container>
    </Container>
  );
}

export default HomePage;
