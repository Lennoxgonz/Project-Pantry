import { Session, User } from "@supabase/supabase-js";
import supabaseClient from "../utils/supabaseClient";
import { toDataAccessError } from "./data-access-error";

/**
 * Returns the current authenticated session, if one exists.
 */
export async function getAuthSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  } catch (error) {
    throw toDataAccessError(error, "Authentication required");
  }
}

/**
 * Returns the currently authenticated user and throws when missing.
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error("No user logged in");
    }

    return user;
  } catch (error) {
    throw toDataAccessError(error, "Authentication required");
  }
}

/**
 * Subscribes to auth state updates and returns an unsubscribe function.
 */
export function subscribeToAuthStateChange(
  onSessionChange: (session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    onSessionChange(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Signs out the current user.
 */
export async function signOutCurrentUser(): Promise<void> {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    throw toDataAccessError(error, "Unable to sign out.");
  }
}

/**
 * Sends a password reset email for the provided account.
 */
export async function requestPasswordReset(
  email: string,
  redirectTo: string
): Promise<void> {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toDataAccessError(
      error,
      "Unable to send password reset email. Please try again."
    );
  }
}

/**
 * Updates the password for the currently authenticated user.
 */
export async function updateCurrentUserPassword(
  password: string
): Promise<void> {
  try {
    const { error } = await supabaseClient.auth.updateUser({ password });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw toDataAccessError(
      error,
      "Unable to update password. Please request another reset link."
    );
  }
}

/**
 * Exposes the initialized auth client for the Supabase Auth UI component.
 */
export function getAuthUiClient() {
  return supabaseClient;
}
