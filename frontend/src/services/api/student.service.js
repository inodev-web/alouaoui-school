import api from "./axios.config";

const STUDENT_ENDPOINTS = {
  INFO: "/admin/checkin/student",
  SESSIONS: "/admin/checkin/student",
};

export const studentService = {
  /**
   * Get student information by UUID (for QR scanner input)
   */
  async getStudentById(studentId) {
    try {
      const response = await api.get(
        `${STUDENT_ENDPOINTS.INFO}/${studentId}/info`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student by ID:", error);
      throw error;
    }
  },

  /**
   * Get student with today's sessions and subscription status
   */
  async getStudentWithSessions(studentId) {
    try {
      const response = await api.get(
        `${STUDENT_ENDPOINTS.SESSIONS}/${studentId}/sessions`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student with sessions:", error);
      throw error;
    }
  },
};
