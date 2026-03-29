import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import supabaseClient from "../utils/supabaseClient";
import { Navigate } from "react-router-dom";

function LoginPage(): JSX.Element {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <Row className="justify-content-center">
        <Col className="text-center" xs={12} sm={6} md={4} lg={3}>
          <Auth
            supabaseClient={supabaseClient}
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
