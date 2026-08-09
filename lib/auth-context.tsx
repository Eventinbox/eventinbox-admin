"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthResponse, User, Workspace } from "./types";
import { clearAuth, readAuth, writeAuth, AUTH_STORAGE_KEY } from "./storage";

interface AuthState {
  token: string | null;
  user: User | null;
  workspace: Workspace | null;
  // false until we've read localStorage on the client; prevents auth flicker
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  signInWith: (auth: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY: AuthState = {
  token: null,
  user: null,
  workspace: null,
  ready: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY);

  // Hydrate from localStorage on mount (client only — no SSR dependency).
  useEffect(() => {
    const stored = readAuth();
    if (stored) {
      setState({
        token: stored.token,
        user: stored.user,
        workspace: stored.workspace,
        ready: true,
      });
    } else {
      setState((s) => ({ ...s, ready: true }));
    }
  }, []);

  // Keep tabs in sync (sign out in one tab -> all tabs).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== AUTH_STORAGE_KEY) return;
      const stored = readAuth();
      setState({
        token: stored?.token ?? null,
        user: stored?.user ?? null,
        workspace: stored?.workspace ?? null,
        ready: true,
      });
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signInWith = useCallback((auth: AuthResponse) => {
    writeAuth(auth);
    setState({
      token: auth.token,
      user: auth.user,
      workspace: auth.workspace,
      ready: true,
    });
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    setState({ token: null, user: null, workspace: null, ready: true });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: !!state.token,
      signInWith,
      signOut,
    }),
    [state, signInWith, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
