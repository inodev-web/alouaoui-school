import api from "./axios.config";
import cacheService from "../cache.service";

const SESSION_ENDPOINTS = {
  SESSIONS: "/sessions",
  TODAY: "/sessions/today",
  STATS: "/sessions/stats",
};

export const sessionService = {
  /**
   * Get all sessions with optional filters
   */
  async getSessions(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.teacher_uuid)
        params.append("teacher_uuid", filters.teacher_uuid);
      if (filters.year_target)
        params.append("year_target", filters.year_target);
      if (filters.branch_id) params.append("branch_id", filters.branch_id);
      if (filters.status && filters.status !== "null")
        params.append("status", filters.status);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.search) params.append("search", filters.search);
      if (filters.today_only) params.append("today_only", filters.today_only);
      if (filters.page) params.append("page", filters.page);

      const fetchFn = async () => {
        const response = await api.get(
          `${SESSION_ENDPOINTS.SESSIONS}?${params.toString()}`,
        );
        return response;
      };

      // Use cache for read/list operations only; include filter set in key
      const data = await cacheService.getSessions(async () => {
        const response = await fetchFn();
        return response.data;
      }, Object.fromEntries(params));

      // Client-side filtering for null status (use cached response data)
      if (data && filters.status === "null") {
        data.data = data.data.filter(
          (session) =>
            session.status_raw === null || session.status_raw === undefined,
        );
      }

      return data;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      throw error;
    }
  },

  /**
   * Get today's sessions
   */
  async getTodaysSessions() {
    try {
      const response = await api.get(SESSION_ENDPOINTS.TODAY);
      return response.data;
    } catch (error) {
      console.error("Error fetching today's sessions:", error);
      throw error;
    }
  },

  /**
   * Get session statistics
   */
  async getSessionStats() {
    try {
      const response = await api.get(SESSION_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      console.error("Error fetching session stats:", error);
      throw error;
    }
  },

  /**
   * Get a single session by ID
   */
  async getSession(sessionId) {
    try {
      const response = await api.get(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching session:", error);
      throw error;
    }
  },

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    try {
      const response = await api.post(SESSION_ENDPOINTS.SESSIONS, sessionData);
      return response.data;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  },

  /**
   * Update a session
   */
  async updateSession(sessionId, sessionData) {
    try {
      const response = await api.put(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`,
        sessionData,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  },

  /**
   * Transform session data for form submission
   */
  transformSessionForSubmission(formData) {
    const normalizedBranchIds = Array.isArray(formData.branch_ids)
      ? formData.branch_ids
          .filter((id) => id !== null && id !== undefined && id !== "")
          .map((id) => parseInt(id, 10))
          .filter((id) => !Number.isNaN(id))
      : [];

    const fallbackBranchId = formData.branch_id
      ? parseInt(formData.branch_id, 10)
      : null;
    const primaryBranchId =
      normalizedBranchIds.length > 0
        ? normalizedBranchIds[0]
        : Number.isInteger(fallbackBranchId)
          ? fallbackBranchId
          : null;

    const startTime = this.formatDateTimeLocal(formData.date, formData.time);

    return {
      teacher_uuid: formData.teacher,
      year_target: formData.year_target || "1AM",
      branch_id: primaryBranchId,
      branch_ids: normalizedBranchIds,
      start_time: startTime,
      end_time: this.calculateEndTime(
        formData.date,
        formData.time,
        formData.duration,
      ),
    };
  },

  /**
   * Calculate end time based on start time and duration
   */
  calculateEndTime(date, startTime, duration) {
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const durationHours = parseFloat(
      typeof duration === "string"
        ? duration.replace(/,/g, ".").replace(/[^0-9.]/g, "")
        : duration,
    );
    const durationMinutes = Number.isFinite(durationHours)
      ? Math.round(durationHours * 60)
      : 60;
    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60 * 1000,
    );

    return Number.isNaN(endDateTime.getTime())
      ? `${date} ${startTime}:00`
      : `${endDateTime.getFullYear()}-${String(endDateTime.getMonth() + 1).padStart(2, "0")}-${String(endDateTime.getDate()).padStart(2, "0")} ${String(endDateTime.getHours()).padStart(2, "0")}:${String(endDateTime.getMinutes()).padStart(2, "0")}:00`;
  },

  /**
   * Update session status helper
   */
  async updateSessionStatus(sessionId, status, options = {}) {
    const payload = { status };

    if (status === "cancelled") {
      const reason =
        typeof options.cancelReason === "string"
          ? options.cancelReason.trim()
          : "";

      if (!reason) {
        throw new Error("cancel_reason is required when cancelling a session");
      }

      payload.cancel_reason = reason;
    }

    return this.updateSession(sessionId, payload);
  },

  /**
   * Format a local datetime string for API submission
   */
  formatDateTimeLocal(date, time) {
    const normalized = new Date(`${date}T${time}:00`);

    if (Number.isNaN(normalized.getTime())) {
      return `${date} ${time}:00`;
    }

    return `${normalized.getFullYear()}-${String(normalized.getMonth() + 1).padStart(2, "0")}-${String(normalized.getDate()).padStart(2, "0")} ${String(normalized.getHours()).padStart(2, "0")}:${String(normalized.getMinutes()).padStart(2, "0")}:00`;
  },
};

export default sessionService;
