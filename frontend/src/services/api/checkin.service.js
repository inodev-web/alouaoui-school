import api from "./axios.config";

const CHECKIN_ENDPOINTS = {
  SCAN_QR: "/admin/checkin/scan-qr",
  MANUAL_CHECKIN: "/admin/checkin/manual-checkin",
  SESSION_ATTENDANCE: "/admin/checkin/session-attendance",
  ATTENDANCE_STATS: "/admin/checkin/attendance-stats",
  TODAY_SUMMARY: "/admin/checkin/summary-today",
  STUDENT_HISTORY: "/admin/checkin/student",
};

export const checkinService = {
  /**
   * Scan QR code and check-in student
   */
  async scanQr(data) {
    try {
      const response = await api.post(CHECKIN_ENDPOINTS.SCAN_QR, data);
      return response.data;
    } catch (error) {
      console.error("Error scanning QR:", error);
      throw error;
    }
  },

  /**
   * Manual check-in for admin corrections
   */
  async manualCheckin(data) {
    try {
      const response = await api.post(CHECKIN_ENDPOINTS.MANUAL_CHECKIN, data);
      return response.data;
    } catch (error) {
      console.error("Error manual check-in:", error);
      throw error;
    }
  },

  /**
   * Get session attendance list
   */
  async getSessionAttendance(sessionId) {
    try {
      const response = await api.get(
        `${CHECKIN_ENDPOINTS.SESSION_ATTENDANCE}?session_id=${sessionId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching session attendance:", error);
      throw error;
    }
  },

  /**
   * Get attendance statistics
   */
  async getAttendanceStats(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);
      if (filters.teacher_uuid)
        params.append("teacher_uuid", filters.teacher_uuid);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(
        `${CHECKIN_ENDPOINTS.ATTENDANCE_STATS}${queryString}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      throw error;
    }
  },

  /**
   * Get today's summary (scans, unique students, active sessions)
   */
  async getTodaySummary() {
    try {
      const response = await api.get(CHECKIN_ENDPOINTS.TODAY_SUMMARY);
      return response.data;
    } catch (error) {
      console.error("Error fetching today summary:", error);
      throw error;
    }
  },

  /**
   * Get student attendance history
   */
  async getStudentHistory(studentUuid, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);
      if (filters.per_page) params.append("per_page", filters.per_page);

      const response = await api.get(
        `${CHECKIN_ENDPOINTS.STUDENT_HISTORY}/${studentUuid}/history?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student history:", error);
      throw error;
    }
  },

  /**
   * Get today's check-in statistics
   */
  async getTodayStats() {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
      );

      const response = await this.getAttendanceStats({
        from_date: startOfDay.toISOString().split("T")[0],
        to_date: endOfDay.toISOString().split("T")[0],
      });

      return response;
    } catch (error) {
      console.error("Error fetching today stats:", error);
      // Return a safe fallback instead of re-throwing
      return {
        data: {
          total_sessions: 0,
          total_attendances: 0,
          average_attendance_per_session: 0,
          sessions_by_teacher: {},
          daily_stats: {},
        },
      };
    }
  },
};
