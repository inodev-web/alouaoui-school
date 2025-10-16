import { useState, useEffect, useCallback } from "react";
import { checkinService } from "../services/api/checkin.service";

export const useCheckinStats = () => {
  const [data, setData] = useState({
    todayScans: 0,
    studentsCheckedIn: 0,
    activeSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await checkinService.getTodaySummary();
      const summary = response?.data || {};

      setData({
        todayScans: summary.total_scans ?? 0,
        studentsCheckedIn: summary.unique_students ?? 0,
        activeSessions:
          summary.sessions_in_progress && summary.sessions_in_progress > 0
            ? summary.sessions_in_progress
            : (summary.sessions_today ?? 0),
      });
    } catch (err) {
      setError(err);
      console.error("Error fetching check-in stats:", err);
      // Set default values on error - graceful degradation
      setData({
        todayScans: 0,
        studentsCheckedIn: 0,
        activeSessions: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);

    const handleAttendanceUpdated = () => {
      fetchStats();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("attendance:updated", handleAttendanceUpdated);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "attendance:updated",
          handleAttendanceUpdated,
        );
      }
    };
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
};
