import axios from "axios";

const api = axios.create({
  baseURL:
    "https://intelligent-medicine-reminder-platform.onrender.com",
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // IMPORTANT:
    // Do not force Content-Type for FormData requests.
    // The browser must generate the multipart boundary automatically.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Request Failed:", error);
    console.error(
      "Request URL:",
      `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
    );
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    return Promise.reject(error);
  },
);

export default api;