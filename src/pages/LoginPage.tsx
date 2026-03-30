import { Col, Row } from "react-bootstrap";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAuthUiClient } from "../data-access/auth.data";

function LoginPage(): JSX.Element {
  const { user } = useAuth();
  const authUiClient = getAuthUiClient();

  if (!user) {
    return (
      <Row className="justify-content-center">
        <Col className="text-center" xs={12} sm={6} md={4} lg={3}>
          <Auth
            supabaseClient={authUiClient}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </Col>
      </Row>
    );
  }

  return <Navigate to="/projects" replace />;
}

export default LoginPage;
