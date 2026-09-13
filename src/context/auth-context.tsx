import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import type { AuthUser, LoginAPIResponse } from "@/hooks/api/loginAPI";
import { apiFetch } from "@/services/api-client";
import {
  loadAuthToken,
  removeAuthToken,
  saveAuthToken,
} from "@/services/auth-token";

type AuthSession = LoginAPIResponse["data"];

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = await loadAuthToken();

        if (!storedToken && Platform.OS !== "web") {
          return;
        }

        const response = await apiFetch("/api/auth/me");
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            await removeAuthToken();
          }
          return;
        }

        const payload = (await response.json()) as { data: AuthUser };
        if (isMounted) {
          setToken(storedToken);
          setUser(payload.data);
        }
      } catch {
        // Keep the login screen available when the API cannot be reached.
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (session: AuthSession) => {
    queryClient.clear();
    await saveAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }, [queryClient]);

  const signOut = useCallback(async () => {
    queryClient.clear();
    await removeAuthToken();
    setToken(null);
    setUser(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token || user),
      isInitializing,
      token,
      user,
      signIn,
      signOut,
    }),
    [isInitializing, signIn, signOut, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
