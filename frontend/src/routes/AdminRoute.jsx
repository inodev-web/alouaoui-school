import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import authService from "../services/api/auth.service";
import { loginSuccess, logout } from "../store/slices/authSlice";

// Global cache pour éviter double validation
let globalValidationPromise = null;
let globalValidationResult = null;
let globalValidationTimestamp = null;
const VALIDATION_CACHE_TTL = 60 * 1000; // 1 minute

const AdminRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const isInitializing = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent concurrent initializations
      if (isInitializing.current) {
        console.log("⏸️  AdminRoute - Already initializing, skipping...");
        return;
      }

      isInitializing.current = true;
      try {
        // Get stored values
        const storedToken = localStorage.getItem("token");
        const storedUserStr = localStorage.getItem("user");

        console.log("🔍 AdminRoute - Initializing auth:", {
          hasStoredToken: !!storedToken,
          hasReduxUser: !!user,
          hasStoredUser: !!storedUserStr,
        });

        // If no token, redirect to login
        if (!storedToken) {
          console.log("❌ No token found, redirecting to login");
          setIsLoading(false);
          return;
        }

        // If we already have a user in Redux, we're good
        if (user) {
          console.log("✅ User already in Redux, proceeding");
          setIsLoading(false);
          return;
        }

        // If we have a stored user, validate the token
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr);

            // Check if we have a recent validation result
            const now = Date.now();
            if (
              globalValidationResult &&
              globalValidationTimestamp &&
              now - globalValidationTimestamp < VALIDATION_CACHE_TTL
            ) {
              console.log(
                "� Using cached validation result (age:",
                Math.round((now - globalValidationTimestamp) / 1000),
                "s)",
              );
              dispatch(
                loginSuccess({
                  token: storedToken,
                  user: globalValidationResult,
                }),
              );
              setIsLoading(false);
              isInitializing.current = false;
              return;
            }

            // If there's already a validation in progress, reuse it
            if (globalValidationPromise) {
              console.log("⏳ Reusing in-flight validation request...");
              try {
                const profile = await globalValidationPromise;
                dispatch(loginSuccess({ token: storedToken, user: profile }));
                setIsLoading(false);
                isInitializing.current = false;
                return;
              } catch (error) {
                // Handle error below
                throw error;
              }
            }

            // Start new validation
            console.log("📡 Validating token with API...");
            globalValidationPromise = authService.getProfile();

            const profile = await globalValidationPromise;

            // Cache the result
            globalValidationResult = profile;
            globalValidationTimestamp = Date.now();
            globalValidationPromise = null;

            // If API call succeeds, use the fresh profile data
            if (profile) {
              console.log("✅ Token valid, updating Redux with fresh data");
              dispatch(loginSuccess({ token: storedToken, user: profile }));
              setIsLoading(false);
              isInitializing.current = false;
              return;
            }
          } catch (apiError) {
            console.warn("⚠️ API validation failed:", apiError);

            // Clear the global promise
            globalValidationPromise = null;
            globalValidationResult = null;
            globalValidationTimestamp = null;

            // If 401, token is invalid
            if (apiError.response?.status === 401) {
              console.log("❌ Token invalid (401), clearing auth state");
              dispatch(logout());
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("device_uuid");
              setIsLoading(false);
              isInitializing.current = false;
              return;
            }

            // For other errors, try using stored user as fallback
            try {
              const storedUser = JSON.parse(storedUserStr);
              if (storedUser.role === "admin") {
                console.log("⚠️ Using stored admin user as fallback");
                dispatch(
                  loginSuccess({ token: storedToken, user: storedUser }),
                );
                setIsLoading(false);
                isInitializing.current = false;
                return;
              }
            } catch (parseError) {
              console.error("❌ Failed to parse stored user:", parseError);
            }
          }
        }

        // If we get here, something went wrong
        console.log("❌ No valid authentication found, clearing state");
        dispatch(logout());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("device_uuid");
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        dispatch(logout());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("device_uuid");
      } finally {
        setIsLoading(false);
        isInitializing.current = false;
      }
    };

    // Only run if not already initialized
    if (!isLoading || !isInitializing.current) {
      initializeAuth();
    }
  }, []); // Empty dependency array - only run once

  // Show loading while initializing
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const currentUser =
    user ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch {
        return null;
      }
    })();

  const hasToken = !!(token || localStorage.getItem("token"));

  // Redirect to login if no token
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to unauthorized if not admin
  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and is admin, render children
  return children;
};

export default AdminRoute;
