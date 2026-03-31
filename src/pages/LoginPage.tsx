import { Alert, Col, Row } from "react-bootstrap";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAuthUiClient } from "../data-access/auth.data";

function LoginPage(): JSX.Element {
  const { user } = useAuth();
  const location = useLocation();
  const authUiClient = getAuthUiClient();
  const signInRedirectUrl = `${window.location.origin}/auth/signin`;

  const isPasswordResetSuccess =
    new URLSearchParams(location.search).get("passwordReset") === "success";
  const isRecoveryLink =
    window.location.hash.includes("type=recovery") ||
    new URLSearchParams(window.location.search).get("type") === "recovery";

  if (isRecoveryLink) {
    return (
      <Navigate
        to={`/auth/reset-password${window.location.search}${window.location.hash}`}
        replace
      />
    );
  }

  if (!user) {
    return (
      <Row className="justify-content-center">
        <Col className="text-center" xs={12} sm={6} md={4} lg={3}>
          {isPasswordResetSuccess && (
            <Alert variant="success" className="text-start">
              Password updated successfully. Sign in with your new password.
            </Alert>
          )}
          <Auth
            supabaseClient={authUiClient}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={signInRedirectUrl}
          />
        </Col>
      </Row>
    );
  }

  return <Navigate to="/projects" replace />;
}

export default LoginPage;
