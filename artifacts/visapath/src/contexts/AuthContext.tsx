import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { getToken, setToken, removeToken } from "@/lib/auth";
import { customFetch } from "@/lib/customFetch";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "SET_USER"; payload: User }
  | { type: "CLEAR_USER" }
  | { type: "SET_LOADING"; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case "CLEAR_USER":
      return { user: null, isAuthenticated: false, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      dispatch({ type: "CLEAR_USER" });
      return;
    }
    try {
      const user = await customFetch<User>("/api/auth/me");
      dispatch({ type: "SET_USER", payload: user });
    } catch {
      removeToken();
      dispatch({ type: "CLEAR_USER" });
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, user: User) => {
    setToken(token);
    dispatch({ type: "SET_USER", payload: user });
  };

  const logout = () => {
    removeToken();
    dispatch({ type: "CLEAR_USER" });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
