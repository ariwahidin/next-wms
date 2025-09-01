import axios from "axios";
import eventBus from "@/utils/eventBus";
import router from "next/router";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true // agar cookie dikirim otomatis
});

api.interceptors.request.use((config) => {
  const next_token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("next-auth-token="))
    ?.split("=")[1];

  if (!next_token || next_token === "undefined") {
    router.push("/auth/login");
    return config;
  }

  console.log("Next Auth Token:", next_token);

  if (next_token) config.headers.Authorization = `Bearer ${next_token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {

    // const originalRequest = err.config;

    // if (err.response?.status === 401) {

    //   // Jika gagal saat refresh, jangan ulangi lagi
    //   if (originalRequest.url.includes('/auth/refresh')) {
    //     // window.location.href = "/auth/login";
    //     router.push("/auth/login");
    //     return Promise.reject(err);
    //   }

    //   try {
    //     const refreshRes = await api.post('/auth/refresh');
    //     const newAccessToken = refreshRes.data.access_token;

    //     // Simpan token baru ke cookie
    //     document.cookie = `next-auth-token=${newAccessToken}; path=/; max-age=${60 * 60 * 24
    //       }; secure; samesite=None`;

    //     // Ulang request awal — interceptor akan inject token baru otomatis
    //     return api(err.config);
    //   } catch (refreshError) {
    //     console.warn("Refresh token tidak valid:", refreshError);
    //     // window.location.href = "/auth/login";
    //     // return Promise.reject(refreshError);
    //     eventBus.emit("showAlert", {
    //       title: "Error!",
    //       description:
    //         refreshError.response?.data?.error || // ini error asli dari backend
    //         refreshError.response?.data?.message || // ini error custom dari backend
    //         refreshError.message ||
    //         "Something went wrong with the request",
    //       type: "error",
    //     });

    //     return Promise.resolve({
    //       success: false,
    //       data: {},
    //       error: true,
    //       message: refreshError.response?.data?.message || "Something went wrong",
    //     });
    //   }

    //   // return Promise.reject(err);
    // }

    eventBus.emit("showAlert", {
      title: "Error!",
      description:
        err.response?.data?.error || // ini error asli dari backend
        err.response?.data?.message || // ini error custom dari backend
        err.message ||
        "Something went wrong with the request",
      type: "error",
    });

    return Promise.resolve({
      success: false,
      data: {},
      error: true,
      message: err.response?.data?.message || "Something went wrong",
    });
    // return Promise.reject(err);
  }
);

export default api;


