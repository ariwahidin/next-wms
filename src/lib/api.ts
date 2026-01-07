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
    .find((row) => row.startsWith("wms-auth-token="))
    ?.split("=")[1];

  if (!next_token || next_token === "undefined") {
    console.log("Request Auth Token not found. Redirecting to login.");
    // router.push("/auth/login");
    return config;
  }

  console.log("Next Auth Token:", next_token);

  if (next_token) config.headers.Authorization = `Bearer ${next_token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {

    console.log("API Error Response:", err.response);
    eventBus.emit("showAlert", {
      title: "Error!",
      description:
        err.response?.data?.error || // ini error asli dari backend
        err.response?.data?.message || // ini error custom dari backend
        err.message ||
        "Something went wrong with the request",
      type: "error",
    });


    if (err.response?.status === 409) {
      console.log("API Error Response conflict:", err.response);
      const conflictId = err.response?.data?.cid || null;
      router.push(`/auth/conflict?cid=${conflictId}`);
      // return Promise.resolve({
      //   success: false,
      //   data: err.response.data,
      //   error: true,
      //   message: err.response.data?.message,
      // });
    }


    if (err.response?.status === 401) {
      router.push("/auth/login");
      return Promise.resolve({
        success: false,
        data: {},
        error: true,
        message: "Unauthorized. Redirecting to login.",
      });
    }


    if (err.response?.status === 500 || err.response?.status === 404 || err.response?.status === 400) {
      return Promise.resolve({
        success: false,
        data: err.response?.data || {},
        error: true,
        message: err.response?.data?.message || "Something went wrong",
      });
    }

    return Promise.resolve({
      success: false,
      data: {},
      error: true,
      errors: err.response?.data?.errors || null,
      validation_errors: err.response?.data?.validation_errors || null,
      message: err.response?.data?.message || "Something went wrong",
    });
  }
);

export default api;


