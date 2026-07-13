import React, { createContext, useContext, useState, useEffect } from "react";


interface AuthState {
  token: string | null;
  userId: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  authState: AuthState;
  isAuthenticated: boolean;
  login: (token: string, userId: string, isAdmin: boolean) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    userId: null,
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (token && userId) {
      setAuthState({ token, userId, isAdmin });
    }
    setLoading(false);
  }, []);

  const login = (token: string, userId: string, isAdmin: boolean) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("isAdmin", String(isAdmin));
    setAuthState({ token, userId, isAdmin });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("isAdmin");
    setAuthState({ token: null, userId: null, isAdmin: false });
  };

  const isAuthenticated = !!authState.token;

  return (
    <AuthContext.Provider value={{ authState, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
