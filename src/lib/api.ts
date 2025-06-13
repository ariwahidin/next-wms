import axios from "axios";
import eventBus from "@/utils/eventBus";
import router from "next/router";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {

  const next_token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("next-auth-token="))
    ?.split("=")[1];

  console.log("next_auth_token AT API", next_token);

  // if (!token) {
  //   router.push("/auth/login");
  //   return;
  // }

  if (next_token) config.headers.Authorization = `Bearer ${next_token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers["x-new-token"];
    if (newToken) document.cookie = `token=${newToken}; path=/;`;
    return response;
  },
  (error) => {

    if (error.status === 401) {
      router.push("/auth/login");
    }

    eventBus.emit("showAlert", {
      title: "Error!",
      description:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Something went wrong with the request",
      type: "error",
    });

    return Promise.resolve({
      success: false,
      data: {},
      error: true,
      message: error.response?.data?.message || "Something went wrong",
    });
  }
);

export default api;


