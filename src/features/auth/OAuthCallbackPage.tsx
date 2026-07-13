import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { FullPageSpinner } from "../../components/ui/Spinner";

export function OAuthCallbackPage() {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handledError = useRef(false);

  const error = searchParams.get("error");

  useEffect(() => {
    if (!error || handledError.current) return;
    handledError.current = true;
    toast.error("Sign-in failed. Please try again.");
    navigate("/login", { replace: true });
  }, [error, navigate]);

  useEffect(() => {
    if (error) return;
    if (status === "authenticated") {
      navigate("/", { replace: true });
    } else if (status === "unauthenticated") {
      toast.error("Sign-in failed. Please try again.");
      navigate("/login", { replace: true });
    }
  }, [error, status, navigate]);

  return <FullPageSpinner />;
}
