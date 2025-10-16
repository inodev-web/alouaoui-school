import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "./store/slices/authSlice";
import AppRouter from "./routes/router";
import { Toaster } from "./components/ui/toaster";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore auth state from localStorage on app load
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const deviceUuid = localStorage.getItem("device_uuid");

    console.log("🔍 App.jsx - Checking localStorage:", {
      hasToken: !!token,
      hasUser: !!userStr,
      deviceUuid: deviceUuid,
    });

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Restore Redux state from localStorage
        dispatch(loginSuccess({ token, user }));
        console.log("✅ Auth state restored from localStorage", {
          user,
          deviceUuid,
        });
      } catch (error) {
        console.error("❌ Failed to restore auth state:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [dispatch]);

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
