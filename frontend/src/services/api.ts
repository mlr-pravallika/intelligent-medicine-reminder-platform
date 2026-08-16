import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token");

    if (token) {
      config.headers =
        config.headers ?? {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error(
      "API Request Failed:",
      error,
    );

    console.error(
      "Request URL:",
      error.config?.baseURL +
        error.config?.url,
    );

    console.error(
      "Status:",
      error.response?.status,
    );

    console.error(
      "Response:",
      error.response?.data,
    );

    return Promise.reject(error);
  },
);

export default api;