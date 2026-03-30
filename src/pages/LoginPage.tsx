import { FormEvent, useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getAuthUiClient,
  requestPasswordReset,
} from "../data-access/auth.data";

function LoginPage(): JSX.Element {
  const { user } = useAuth();
  const authUiClient = getAuthUiClient();
  const signInRedirectUrl = `${window.location.origin}/auth/signin`;
  const resetPasswordRedirectUrl = `${window.location.origin}/auth/reset-password`;
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);
  const [resetEmailSuccess, setResetEmailSuccess] = useState<string | null>(
    null
  );
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  async function handleSendResetEmail(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (!resetEmail.trim()) {
      setResetEmailError("Enter an email address.");
      return;
    }

    try {
      setIsSendingResetEmail(true);
      setResetEmailError(null);
      setResetEmailSuccess(null);

      await requestPasswordReset(resetEmail.trim(), resetPasswordRedirectUrl);
      setResetEmailSuccess(
        "If this account exists, a reset email has been sent."
      );
    } catch (error) {
      setResetEmailError(
        error instanceof Error
          ? error.message
          : "Unable to send reset email. Please try again."
      );
    } finally {
      setIsSendingResetEmail(false);
    }
  }

  if (!user) {
    return (
      <Row className="justify-content-center">
        <Col className="text-center" xs={12} sm={6} md={4} lg={3}>
          <Auth
            supabaseClient={authUiClient}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={signInRedirectUrl}
          />
          <hr className="my-4" />
          <h2 className="h5 mb-3">Forgot your password?</h2>
          {resetEmailSuccess && <Alert variant="success">{resetEmailSuccess}</Alert>}
          {resetEmailError && <Alert variant="danger">{resetEmailError}</Alert>}
          <Form onSubmit={handleSendResetEmail}>
            <Form.Group className="mb-3" controlId="passwordResetEmail">
              <Form.Control
                type="email"
                placeholder="Email address"
                autoComplete="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                disabled={isSendingResetEmail}
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="outline-primary"
              className="w-100"
              disabled={isSendingResetEmail}
            >
              {isSendingResetEmail ? "Sending..." : "Send reset email"}
            </Button>
          </Form>
        </Col>
      </Row>
    );
  }

  return <Navigate to="/projects" replace />;
}

export default LoginPage;
