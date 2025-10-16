import api from "./axios.config";

const USER_ENDPOINTS = {
  STATS: "/users/stats",
};

export const userService = {
  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const response = await api.get(USER_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },
};
