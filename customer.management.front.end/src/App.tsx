import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import Login from "./pages/Login";
import { getApiBaseUrl } from "./utils/apiConfig";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const hasLocalAuth = localStorage.getItem("isAuthenticated") === "true";
      
      if (!hasLocalAuth) {
        setIsAuthenticated(false);
        return;
      }

      // Verify token is still valid by checking current user
      try {
        const response = await fetch(`${getApiBaseUrl()}/user/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          // Update user data in localStorage
          localStorage.setItem("user", JSON.stringify(userData));
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          // 401 is expected when token is invalid/expired - silently handle it
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        } else {
          // Other errors (500, etc.) - clear auth data
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Network error - clear stale auth data
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
