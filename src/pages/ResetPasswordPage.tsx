import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Col, Form, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuthSession,
  signOutCurrentUser,
  subscribeToAuthStateChange,
  updateCurrentUserPassword,
} from "../data-access/auth.data";

function ResetPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChange((session) => {
      setHasRecoverySession(Boolean(session));
      setIsCheckingSession(false);
    });

    async function checkSession() {
      try {
        const session = await getAuthSession();
        setHasRecoverySession(Boolean(session));
      } catch {
        setHasRecoverySession(false);
      } finally {
        setIsCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await updateCurrentUserPassword(password);
      await signOutCurrentUser();
      navigate("/auth/signin?passwordReset=success", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <Row className="justify-content-center">
        <Col className="text-center" xs={12} sm={8} md={6} lg={5}>
          <Spinner animation="border" role="status" className="mb-3" />
          <p className="mb-0">Validating your password reset link...</p>
        </Col>
      </Row>
    );
  }

  if (!hasRecoverySession) {
    return (
      <Row className="justify-content-center">
        <Col xs={12} sm={8} md={6} lg={5}>
          <Alert variant="warning" className="mb-3">
            This password reset link is invalid or expired.
          </Alert>
          <p className="mb-0">
            Request a new reset email from the{" "}
            <Link to="/auth/signin">sign in page</Link>.
          </p>
        </Col>
      </Row>
    );
  }

  return (
    <Row className="justify-content-center">
      <Col xs={12} sm={8} md={6} lg={5}>
        <h1 className="h3 mb-3 text-center">Set a new password</h1>
        <p className="text-muted text-center mb-4">
          Enter your new password below to finish resetting your account.
        </p>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="confirmNewPassword">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>
        </Form>
      </Col>
    </Row>
  );
}

export default ResetPasswordPage;
