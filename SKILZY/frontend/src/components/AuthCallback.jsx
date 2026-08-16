import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/lib/api";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        sessionStorage.setItem("authToken", token);
        // Determine next page based on profile completion
        (async () => {
          try {
            const me = await fetchWithAuth("/users/me");
            const completed = !!(me && me.profile_complete);
            navigate(completed ? "/dashboard" : "/profile-setup", { replace: true });
          } catch (_) {
            // If check fails, fall back to dashboard
            navigate("/dashboard", { replace: true });
          }
        })();
      } else {
        navigate("/login", { replace: true });
      }
    } catch (_) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
};

export default AuthCallback;


