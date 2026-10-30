import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("optiguard_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired/invalid on authenticated endpoints
      const isAuthPath = error.config.url.includes("/auth/login") || error.config.url.includes("/auth/register");
      if (!isAuthPath) {
        localStorage.removeItem("optiguard_token");
        localStorage.removeItem("optiguard_user");
        window.dispatchEvent(new Event("optiguard:logout"));
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
};

export const inspectionApi = {
  analyze: (formDataOrJson, isMultipart = true) => {
    return api.post("/inspections/analyze", formDataOrJson, {
      headers: isMultipart ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
  getAll: (params) => api.get("/inspections", { params }),
  getById: (id) => api.get(`/inspections/${id}`),
  updateStatus: (id, data) => api.patch(`/inspections/${id}/status`, data),
  delete: (id) => api.delete(`/inspections/${id}`),
  sendChat: (id, message) => api.post(`/inspections/${id}/chat`, { message }),
  compare: (formDataOrJson, isMultipart = true) => {
    return api.post("/inspections/compare", formDataOrJson, {
      headers: isMultipart ? { "Content-Type": "multipart/form-data" } : {},
    });
  },
  getComparisons: () => api.get("/inspections/comparisons/list"),
};

export const analyticsApi = {
  getSummary: () => api.get("/analytics/summary"),
};

export const healthApi = {
  check: () => api.get("/health"),
};

export default api;

