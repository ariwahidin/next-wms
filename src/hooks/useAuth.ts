// hooks/useAuth.ts
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/router";

const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/isLoggedIn", { withCredentials: true });
        if (res.data.success === false) {
          // window.location.href = "/auth/login";
          router.push("/auth/login");
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // window.location.href = "/auth/login";
          router.push("/auth/login");
          return;
        }
        console.error("Auth check failed:", error);
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router]);

  return { loading };
};

export default useAuth;