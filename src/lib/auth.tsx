import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  /** Sends a reset link. Resolves the same way whether or not the address exists. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Sets a new password for the session opened by a reset link. */
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Without Supabase configured the storefront is still fully browsable as a
    // guest, so a missing client resolves to "signed out" instead of throwing
    // and taking the whole tree down with it.
    let unsubscribe: (() => void) | undefined;
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setLoading(false);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
      supabase.auth
        .getSession()
        .then(({ data }) => {
          setSession(data.session);
          setLoading(false);
        })
        .catch((error) => {
          console.warn("[auth] no session available:", error);
          setLoading(false);
        });
    } catch (error) {
      console.warn("[auth] authentication is unavailable:", error);
      setSession(null);
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      async signUp({ email, password, firstName, lastName }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) throw new Error(error.message);
        if (data.session?.user) {
          await supabase.from("profiles").upsert({
            id: data.session.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
          });
        }
        return { needsConfirmation: !data.session };
      },
      async requestPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/wachtwoord-herstellen`,
        });
        // Supabase does not reveal whether an address is registered, and
        // neither does this: reporting "unknown e-mail" would let anyone
        // enumerate customer accounts.
        if (error) throw new Error(error.message);
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth moet binnen een AuthProvider gebruikt worden");
  return ctx;
}
