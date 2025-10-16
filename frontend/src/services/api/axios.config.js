import axios from "axios";

// Créer une instance axios avec la configuration de base
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Intercepteur pour ajouter le token d'authentification aux requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    // Ne pas ajouter le token pour les routes d'authentification publiques
    const isAuthRoute =
      config.url.includes("/auth/login") ||
      config.url.includes("/auth/register");

    if (!isAuthRoute) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        console.debug("🔑 Auth header added:", token.substring(0, 20) + "...");
      } else {
        console.warn(
          "⚠️ No token found in localStorage for protected route:",
          config.url,
        );
      }
    }

    // Ajouter le Device UUID si disponible
    const deviceUUID = localStorage.getItem("device_uuid");
    if (deviceUUID) {
      config.headers["X-Device-UUID"] = deviceUUID;
    } else {
      console.warn(
        "⚠️ No device_uuid found in localStorage for route:",
        config.url,
      );
    }

    // Debug logging for auth requests
    if (config.url.includes("/auth/")) {
      console.log("📤 API Request:", {
        url: config.url,
        method: config.method,
        hasToken: !isAuthRoute && !!localStorage.getItem("token"),
        deviceUUID: deviceUUID,
        isAuthRoute: isAuthRoute,
      });
    }
    // Additional debug for protected endpoints like subscriptions
    if (config.url.includes("/subscriptions")) {
      const hasAuthHeader = !!config.headers["Authorization"];
      const tokenSample = localStorage.getItem("token")?.slice(0, 20) || null;
      console.debug("🔐 Protected Request:", {
        url: config.url,
        method: config.method,
        hasAuthHeader,
        tokenSample,
        deviceUUID: deviceUUID,
        headers: {
          Authorization: config.headers["Authorization"]
            ? "Bearer ***"
            : "MISSING",
          "X-Device-UUID": config.headers["X-Device-UUID"] || "MISSING",
        },
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur pour gérer les erreurs de réponse
axiosInstance.interceptors.response.use(
  (response) => {
    // Debug logging for auth responses
    if (response.config.url.includes("/auth/")) {
      console.log("📥 API Response:", {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    const url = error.config?.url;
    const status = error.response?.status;
    console.error("❌ API Error:", {
      url,
      status,
      data: error.response?.data,
      message: error.message,
    });

    if (
      status === 409 &&
      error.response?.data?.error_code === "DEVICE_CONFLICT"
    ) {
      console.log(
        "⚠️ 409 DEVICE_CONFLICT - Forcing re-login but preserving device UUID",
      );
      // Conserver device_uuid pour la prochaine connexion
      const device = localStorage.getItem("device_uuid");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (device) localStorage.setItem("device_uuid", device);
      window.location.href = "/login";
    } else if (status === 401) {
      // Be less aggressive: only auto-logout when profile endpoint fails (token invalid)
      const path = typeof url === "string" ? url : "";
      const isProfileCall = path.includes("/auth/profile");
      const isLogoutCall = path.includes("/auth/logout");

      if (isProfileCall) {
        console.log("🚫 401 on /auth/profile - Clearing token/user");
        const device = localStorage.getItem("device_uuid");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (device) localStorage.setItem("device_uuid", device);
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (isLogoutCall) {
        console.log(
          "🚫 401 on /auth/logout - Token already invalid, proceeding with local cleanup",
        );
        // Don't redirect on logout 401 - let the logout handler deal with it
        // This prevents infinite redirects when token is already invalid
      } else {
        console.warn(
          "401 received on non-profile endpoint, skipping auto-logout",
        );
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
