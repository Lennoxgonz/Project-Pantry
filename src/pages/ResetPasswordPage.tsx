import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Col, Form, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuthSession,
  requestPasswordReset,
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
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [updatePasswordErrorMessage, setUpdatePasswordErrorMessage] = useState<
    string | null
  >(null);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [sendResetEmailErrorMessage, setSendResetEmailErrorMessage] = useState<
    string | null
  >(null);
  const [sendResetEmailSuccessMessage, setSendResetEmailSuccessMessage] =
    useState<string | null>(null);
  const resetPasswordRedirectUrl = `${window.location.origin}/auth/reset-password`;
  const hasRecoveryAttemptInUrl =
    window.location.hash.includes("type=recovery") ||
    new URLSearchParams(window.location.search).get("type") === "recovery";

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

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setUpdatePasswordErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setUpdatePasswordErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setUpdatePasswordErrorMessage(null);
      await updateCurrentUserPassword(password);
      await signOutCurrentUser();
      navigate("/auth/signin?passwordReset=success", { replace: true });
    } catch (error) {
      setUpdatePasswordErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset password. Please try again."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleSendResetEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resetEmail.trim()) {
      setSendResetEmailErrorMessage("Enter an email address.");
      return;
    }

    try {
      setIsSendingResetEmail(true);
      setSendResetEmailErrorMessage(null);
      setSendResetEmailSuccessMessage(null);
      await requestPasswordReset(resetEmail.trim(), resetPasswordRedirectUrl);
      setSendResetEmailSuccessMessage(
        "If this account exists, a reset email has been sent."
      );
    } catch (error) {
      setSendResetEmailErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send reset email. Please try again."
      );
    } finally {
      setIsSendingResetEmail(false);
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
          <h1 className="h3 mb-3 text-center">Reset your password</h1>
          <p className="text-muted text-center mb-4">
            Enter your account email and we will send you a reset link.
          </p>

          {hasRecoveryAttemptInUrl && (
            <Alert variant="warning" className="mb-3">
              This password reset link is invalid or expired. Request a new one
              below.
            </Alert>
          )}

          {sendResetEmailSuccessMessage && (
            <Alert variant="success">{sendResetEmailSuccessMessage}</Alert>
          )}
          {sendResetEmailErrorMessage && (
            <Alert variant="danger">{sendResetEmailErrorMessage}</Alert>
          )}

          <Form onSubmit={handleSendResetEmail}>
            <Form.Group className="mb-3" controlId="passwordResetEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                disabled={isSendingResetEmail}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100 mb-3"
              disabled={isSendingResetEmail}
            >
              {isSendingResetEmail ? "Sending..." : "Send reset email"}
            </Button>
          </Form>

          <p className="mb-0 text-center">
            Return to <Link to="/auth/signin">sign in</Link>.
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

        {updatePasswordErrorMessage && (
          <Alert variant="danger">{updatePasswordErrorMessage}</Alert>
        )}

        <Form onSubmit={handleUpdatePassword}>
          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isUpdatingPassword}
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
              disabled={isUpdatingPassword}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100"
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? "Updating password..." : "Update password"}
          </Button>
        </Form>
      </Col>
    </Row>
  );
}

export default ResetPasswordPage;
