import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  refreshingToken: false,

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const res = await axios.get("/auth/profile");
      set({ user: res.data, checkingAuth: false });
    } catch (error) {
      set({ user: null, checkingAuth: false });
    }
  },

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });
    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }
    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
      toast.success("Registerd successfully");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occured");
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });
      set({ user: res.data, loading: false });
      toast.success("Logged in successfully");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occured");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
      toast.success("Logged out successfully", { id: "logout_success" });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occured during logout",
        { id: "logout_error" },
      );
    }
  },
  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth || get().refreshingToken) return;

    set({ refreshingToken: true, checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({
        user: response.data.user,
        checkingAuth: false,
        refreshingToken: false,
      }); // <-- update user
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false, refreshingToken: false });
      throw error;
    }
  },
}));
// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        if (refreshPromise) {
          await refreshPromise;
        } else {
          refreshPromise = useAuthStore.getState().refreshToken();
          try {
            await refreshPromise;
          } finally {
            refreshPromise = null;
          }
        }

        return axios(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
