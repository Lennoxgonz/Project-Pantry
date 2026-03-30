import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import {
  getAuthSession,
  subscribeToAuthStateChange,
} from "../data-access/auth.data";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(function setupAuthListener() {
    getAuthSession()
      .then((session) => {
        setUser(session?.user ?? null);
      })
      .finally(() => {
        setLoading(false);
      });

    const unsubscribe = subscribeToAuthStateChange((session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { user, loading };
}
