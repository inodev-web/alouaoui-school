import api from "./axios.config";

const studentsService = {
  // Get all students with filters and pagination
  async getStudents(params = {}) {
    try {
      const response = await api.get("/users", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  // Get student statistics for dashboard
  async getStudentStats() {
    try {
      const response = await api.get("/users/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching student stats:", error);
      throw error;
    }
  },

  // Get specific student details
  async getStudent(uuid) {
    try {
      const response = await api.get(`/users/${uuid}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching student:", error);
      throw error;
    }
  },

  // Create new student
  async createStudent(studentData) {
    try {
      const response = await api.post("/users", studentData);
      return response.data;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  },

  // Update student
  async updateStudent(uuid, studentData) {
    try {
      const response = await api.put(`/users/${uuid}`, studentData);
      return response.data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  // Delete student
  async deleteStudent(uuid) {
    try {
      const response = await api.delete(`/users/${uuid}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  },

  // Toggle free subscriber status
  async toggleFreeSubscriber(uuid, reason = null) {
    try {
      const data = reason ? { reason } : {};
      const response = await api.post(
        `/users/${uuid}/toggle-free-subscriber`,
        data,
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling free subscriber:", error);
      throw error;
    }
  },
};

export default studentsService;
