"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await fetch("http://localhost:8000/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          
          // Fetch permissions
          const permResponse = await fetch("http://localhost:8000/api/auth/permissions", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (permResponse.ok) {
            const permData = await permResponse.json();
            setUser(prev => ({ ...prev, permissions: permData.permissions }));
          }
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      // Fetch permissions
      const permResponse = await fetch("http://localhost:8000/api/auth/permissions", {
        headers: {
          "Authorization": `Bearer ${data.access_token}`
        }
      });
      
      if (permResponse.ok) {
        const permData = await permResponse.json();
        setUser({ ...data.user, permissions: permData.permissions });
      } else {
        setUser(data.user);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password, role = "user") => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Registration failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      // Fetch permissions
      const permResponse = await fetch("http://localhost:8000/api/auth/permissions", {
        headers: {
          "Authorization": `Bearer ${data.access_token}`
        }
      });
      
      if (permResponse.ok) {
        const permData = await permResponse.json();
        setUser({ ...data.user, permissions: permData.permissions });
      } else {
        setUser(data.user);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasPermission,
    isAdmin,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

