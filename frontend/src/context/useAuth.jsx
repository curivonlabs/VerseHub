import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "versehub_token";
const USER_KEY = "versehub_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const saveAuth = useCallback((authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);

    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const request = useCallback(
    async (endpoint, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers
      };

      const currentToken = localStorage.getItem(TOKEN_KEY);

      if (currentToken) {
        headers.Authorization = `Bearer ${currentToken}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      let data = null;

      try {
        data = await response.json();
      } catch {}

      if (response.status === 401) {
        clearAuth();
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Something went wrong. Please try again."
        );
      }

      return data;
    },
    [clearAuth]
  );

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError(null);

      try {
        const data = await request("/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials)
        });

        const authToken = data?.token || data?.data?.token;
        const authUser = data?.user || data?.data?.user;

        if (!authToken || !authUser) {
          throw new Error("Invalid authentication response.");
        }

        saveAuth(authToken, authUser);

        return {
          success: true,
          user: authUser,
          token: authToken
        };
      } catch (err) {
        setError(err.message);

        return {
          success: false,
          message: err.message
        };
      } finally {
        setLoading(false);
      }
    },
    [request, saveAuth]
  );

  const register = useCallback(
    async (accountData) => {
      setLoading(true);
      setError(null);

      try {
        const data = await request("/auth/signup", {
          method: "POST",
          body: JSON.stringify(accountData)
        });

        const authToken = data?.token || data?.data?.token;
        const authUser = data?.user || data?.data?.user;

        if (authToken && authUser) {
          saveAuth(authToken, authUser);
        }

        return {
          success: true,
          user: authUser || null,
          token: authToken || null,
          data
        };
      } catch (err) {
        setError(err.message);

        return {
          success: false,
          message: err.message
        };
      } finally {
        setLoading(false);
      }
    },
    [request, saveAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
    setError(null);
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);

    if (!currentToken) {
      return null;
    }

    try {
      const data = await request("/auth/me", {
        method: "GET"
      });

      const authUser = data?.user || data?.data?.user;

      if (authUser) {
        setUser(authUser);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      }

      return authUser;
    } catch {
      clearAuth();
      return null;
    }
  }, [request, clearAuth]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        await refreshUser();
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
      clearError
    }),
    [
      user,
      token,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
      clearError
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
};