import api from "./axios.config";

const SUBSCRIPTION_ENDPOINTS = {
  SUBSCRIPTIONS: "/subscriptions",
  ACTIVE: "/subscriptions/active",
};

export const subscriptionService = {
  /**
   * Create a new subscription (monthly or session_pass)
   */
  async createSubscription(data) {
    try {
      console.log("Creating subscription with data:", data);
      const response = await api.post(
        SUBSCRIPTION_ENDPOINTS.SUBSCRIPTIONS,
        data,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating subscription:", error);
      console.error("Error response data:", error.response?.data);
      throw error;
    }
  },

  /**
   * Get active subscriptions for current user
   */
  async getActiveSubscriptions() {
    try {
      const response = await api.get(SUBSCRIPTION_ENDPOINTS.ACTIVE);
      return response.data;
    } catch (error) {
      console.error("Error fetching active subscriptions:", error);
      throw error;
    }
  },

  /**
   * Create monthly subscription
   */
  async createMonthlySubscription(teacherUuid) {
    return this.createSubscription({
      teacher_uuid: teacherUuid,
      mode: "monthly",
    });
  },

  /**
   * Create session pass subscription
   */
  async createSessionPassSubscription(teacherUuid, sessionId) {
    return this.createSubscription({
      teacher_uuid: teacherUuid,
      mode: "session_pass",
      session_id: sessionId,
    });
  },
};
