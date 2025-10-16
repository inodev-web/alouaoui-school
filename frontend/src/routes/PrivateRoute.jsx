import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import authService from "../services/api/auth.service";
import { loginSuccess, logout } from "../store/slices/authSlice";

/**
 * PrivateRoute
 * - Vérifie authentification via Redux ou localStorage (token)
 * - Charge le profil backend si user manquant (synchronisation uuid/role)
 * - Applique un filtrage par rôle si allowedRoles fourni
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const syncAuth = async () => {
      try {
        const storedToken = token || localStorage.getItem("token");
        const storedUserStr = localStorage.getItem("user");

        console.log("🔍 PrivateRoute - syncAuth check:", {
          hasToken: !!storedToken,
          hasReduxUser: !!user,
          hasStoredUser: !!storedUserStr,
        });

        if (!storedToken) {
          if (isMounted) setChecking(false);
          return;
        }

        // Si l'utilisateur Redux est absent, try localStorage first
        if (!user) {
          // First try to use cached user from localStorage (faster, no API call)
          if (storedUserStr) {
            try {
              const cachedUser = JSON.parse(storedUserStr);
              console.log(
                "✅ Using cached user from localStorage in PrivateRoute",
              );
              dispatch(loginSuccess({ token: storedToken, user: cachedUser }));
              if (isMounted) setChecking(false);
              return; // Don't fetch profile if we have cached user
            } catch (parseError) {
              console.warn(
                "Failed to parse cached user, will fetch from API:",
                parseError,
              );
            }
          }

          // Only fetch profile if no cached user available
          try {
            console.log("📡 Fetching profile from API...");
            const profile = await authService.getProfile();
            if (profile && isMounted) {
              dispatch(loginSuccess({ token: storedToken, user: profile }));
            }
          } catch (e) {
            console.warn("Profile fetch failed in PrivateRoute:", e);

            // Handle device conflicts and unauthorized errors
            if (e.response?.status === 401 && isMounted) {
              const errorCode = e.response?.data?.error_code;

              if (errorCode === "DEVICE_CONFLICT") {
                console.log(
                  "Device conflict detected - account logged in on another device",
                );
                alert(
                  "Votre compte a été connecté depuis un autre appareil. Veuillez vous reconnecter.",
                );
              } else {
                console.log("Unauthorized - clearing auth state");
              }

              // Clear all auth data
              const device = localStorage.getItem("device_uuid");
              dispatch(logout());
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              if (device) localStorage.setItem("device_uuid", device);
            } else if (e.response?.status === 400 && isMounted) {
              // Handle missing device UUID or other bad requests
              const errorCode = e.response?.data?.error_code;

              if (errorCode === "DEVICE_UUID_REQUIRED") {
                console.log(
                  "Device UUID missing - clearing auth and forcing re-login",
                );
                const device = localStorage.getItem("device_uuid");
                dispatch(logout());
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (device) localStorage.setItem("device_uuid", device);
              } else {
                // For other 400 errors, try to use cached user
                const cachedUser = localStorage.getItem("user");
                if (cachedUser) {
                  try {
                    const user = JSON.parse(cachedUser);
                    dispatch(loginSuccess({ token: storedToken, user }));
                    console.log(
                      "Using cached user from localStorage due to profile fetch error",
                    );
                  } catch (parseError) {
                    console.error("Failed to parse cached user:", parseError);
                  }
                }
              }
            } else if (e.response?.status === 409 && isMounted) {
              // Device conflict as per middleware; preserve device UUID and force relogin
              const device = localStorage.getItem("device_uuid");
              dispatch(logout());
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              if (device) localStorage.setItem("device_uuid", device);
            } else if (isMounted) {
              // For other errors (500, network issues), use cached user from localStorage
              const cachedUser = localStorage.getItem("user");
              if (cachedUser) {
                try {
                  const user = JSON.parse(cachedUser);
                  dispatch(loginSuccess({ token: storedToken, user }));
                  console.log(
                    "Using cached user from localStorage due to profile fetch error",
                  );
                } catch (parseError) {
                  console.error("Failed to parse cached user:", parseError);
                }
              }
            }
          }
        }
      } finally {
        if (isMounted) setChecking(false);
      }
    };
    syncAuth();
    return () => {
      isMounted = false;
    };
  }, [user, token, dispatch]);

  // Pendant vérification, on peut afficher un loader minimal
  if (checking) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const effectiveUser =
    user ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch {
        return null;
      }
    })();
  const hasToken = !!(token || localStorage.getItem("token"));

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    const role = effectiveUser?.role;
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
