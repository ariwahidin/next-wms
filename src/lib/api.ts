// import axios from "axios";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string; // Pastikan tidak undefined

// const api = axios.create({
//   baseURL: API_BASE_URL,
// });

// // Interceptor untuk update token
// api.interceptors.response.use((response) => {
//   const newToken = response.headers["x-new-token"];
//   if (newToken) document.cookie = `token=${newToken}; path=/;`; // Simpan di cookie
//   return response;
// });

// // Tambahkan token di setiap request
// api.interceptors.request.use((config) => {
//   const token = document.cookie
//     .split("; ")
//     .find((row) => row.startsWith("token="))
//     ?.split("=")[1];

//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export default api;

import axios from "axios";
import eventBus from "@/utils/eventBus"; // Import eventBus untuk trigger alert

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// api.interceptors.response.use(
//   (response) => {
//     const newToken = response.headers["x-new-token"];
//     if (newToken) document.cookie = `token=${newToken}; path=/;`;
//     return response;
//   },
//   (error) => {
//     eventBus.emit("showAlert", {
//       title: "Error!",
//       description: error.response?.data?.message || "Terjadi kesalahan pada server.",
//       type: "error",
//     });

//     return Promise.reject(error);
//   }
// );

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers["x-new-token"];
    if (newToken) document.cookie = `token=${newToken}; path=/;`;
    return response;
  },
  (error) => {
    // eventBus.emit("showAlert", {
    //   title: "Error!",
    //   description: error.response?.data?.message || "Terjadi kesalahan pada server.",
    //   // description: error,
    //   type: "error",
    // });
    eventBus.emit("showAlert", {
      title: "Error!",
      description:
        error.response?.data?.error || // ✅ Ambil dari `error`
        error.response?.data?.message || // ✅ Ambil dari `message`
        error.message || // ✅ Ambil dari `AxiosError` jika tidak ada response
        "Terjadi kesalahan pada server.", // ✅ Default error
      type: "error",
    });


    // Ubah menjadi Promise.resolve agar tidak menyebabkan unhandled error
    return Promise.resolve(
      {
        success: false,
        data: {}, // ✅ Ubah dari null ke object kosong
        error: true,
        message: error.response?.data?.message || "Terjadi kesalahan"
      });
  }
);


api.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;


