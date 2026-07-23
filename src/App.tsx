import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { OAuthCallbackPage } from "./features/auth/OAuthCallbackPage";
import { ProtectedRoute, PublicOnlyRoute } from "./routes/ProtectedRoute";
import { ChatShell } from "./features/conversations/ChatShell";
import { MaintenancePage } from "./features/maintenance/MaintenancePage";
import { useAuthStore } from "./store/authStore";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

function AuthBootstrap() {
  const init = useAuthStore((s) => s.init);
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    void init();
  }, [init]);

  // Covers the OAuth redirect flow: Google/GitHub login is a full-page
  // navigation handled entirely by the backend, so whatever path/query it
  // redirects the browser back to, once the session resolves as
  // authenticated we land the user cleanly on the main page.
  useEffect(() => {
    if (status !== "authenticated") return;
    const isMainAppRoute =
      location.pathname === "/" || location.pathname.startsWith("/c/");
    const isAuthPage =
      location.pathname === "/login" || location.pathname === "/register";
    if (!isMainAppRoute || isAuthPage) {
      navigate("/", { replace: true });
    }
  }, [status, location.pathname, navigate]);

  return null;
}

function App() {
  if (MAINTENANCE_MODE) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<MaintenancePage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ChatShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
