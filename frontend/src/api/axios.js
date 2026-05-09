import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../utils/token";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

//  REQUEST INTERCEPTOR
API.interceptors.request.use((config) => {
  const token = getAccessToken();

  const isAuthRoute =
    config.url.includes("/auth/login") ||
    config.url.includes("/auth/signup") ||
    config.url.includes("/auth/refresh");

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

//  RESPONSE INTERCEPTOR (AUTO REFRESH)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // if token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = getRefreshToken();

        const res = await axios.post(
          "http://127.0.0.1:8000/api/auth/refresh/",
          { refresh }
        );

        const newAccess = res.data.access;

        setTokens(newAccess, refresh);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return API(originalRequest);
      } catch (err) {
        clearTokens();
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default API;