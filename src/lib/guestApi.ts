import axios from "axios";
import eventBus from "@/utils/eventBus";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_GUEST as string;

const guestApi = axios.create({
  baseURL: API_BASE_URL,
});

guestApi.interceptors.request.use((config) => {
  eventBus.emit("loading", true); 
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

guestApi.interceptors.response.use(
  (response) => {
    eventBus.emit("loading", false); // Selesai loading
    const newToken = response.headers["x-new-token"];
    if (newToken) document.cookie = `token=${newToken}; path=/;`;
    return response;
  },
  (error) => {
    eventBus.emit("loading", false);
    eventBus.emit("showAlert", {
      title: "Error!",
      description:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan pada server.",
      type: "error",
    });

    return Promise.resolve({
      success: false,
      data: {},
      error: true,
      message: error.response?.data?.message || "Terjadi kesalahan",
    });
  }
);

export default guestApi;


