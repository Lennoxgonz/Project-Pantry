import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import supabaseClient from "../utils/supabaseClient";

function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Project Pantry
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="nav-menu" />
        <Navbar.Collapse id="nav-menu">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            {user && (
              <>
                <Nav.Link as={Link} to="/projects">
                  Projects
                </Nav.Link>
                <Nav.Link as={Link} to="/inventory">
                  Inventory
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Nav.Link onClick={handleSignOut}>Sign Out</Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to="/signin">
                Sign In
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
