import axiosInstance from "./api/axios.config";
import { cacheService } from "./cache.service";

class DashboardService {
  /**
   * Get dashboard cards data with caching
   */
  async getDashboardCards(period = "daily", date = null) {
    try {
      console.log("📊 Loading dashboard cards...", { period, date });

      const cacheKey = `dashboard_cards_${period}_${date || "current"}`;

      const data = await cacheService.getDashboardStats(async () => {
        const params = new URLSearchParams({ period });
        if (date) params.append("date", date);

        console.log("🌐 API call: dashboard/data/cards");
        const response = await axiosInstance.get(
          `/dashboard/data/cards?${params}`,
        );
        return response.data;
      }, cacheKey);

      console.log("✅ Dashboard cards loaded");
      return data;
    } catch (error) {
      console.error("❌ Error fetching dashboard cards:", error);
      throw error;
    }
  }

  /**
   * Get dashboard summary data
   */
  async getDashboardSummary(period = "daily", date = null) {
    try {
      const params = new URLSearchParams({ period });
      if (date) params.append("date", date);

      const response = await axiosInstance.get(
        `/dashboard/data/summary?${params}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      throw error;
    }
  }

  /**
   * Get top teachers by revenue with caching
   */
  async getTopTeachers(limit = 10, period = "daily", date = null) {
    try {
      console.log("👨‍🏫 Loading top teachers...", { limit, period, date });

      const cacheKey = `top_teachers_${limit}_${period}_${date || "current"}`;

      const data = await cacheService.getDashboardStats(async () => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          period,
        });
        if (date) params.append("date", date);

        console.log("🌐 API call: dashboard/data/top-teachers");
        const response = await axiosInstance.get(
          `/dashboard/data/top-teachers?${params}`,
        );
        return response.data;
      }, cacheKey);

      console.log("✅ Top teachers loaded");
      return data;
    } catch (error) {
      console.error("❌ Error fetching top teachers:", error);
      throw error;
    }
  }

  /**
   * Get revenue time series data for charts with caching
   */
  async getRevenueTimeSeries(
    period = "daily",
    days = 30,
    startDate = null,
    endDate = null,
  ) {
    try {
      console.log("📈 Loading revenue time series...", {
        period,
        days,
        startDate,
        endDate,
      });

      const cacheKey = `revenue_series_${period}_${days}_${startDate || "null"}_${endDate || "null"}`;

      const data = await cacheService.getDashboardStats(async () => {
        const params = new URLSearchParams({
          period,
          days: days.toString(),
        });
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);

        console.log("🌐 API call: dashboard/data/revenue-time-series");
        const response = await axiosInstance.get(
          `/dashboard/data/revenue-time-series?${params}`,
        );
        return response.data;
      }, cacheKey);

      console.log("✅ Revenue time series loaded");
      return data;
    } catch (error) {
      console.error("❌ Error fetching revenue time series:", error);
      throw error;
    }
  }

  /**
   * Get teacher performance data
   */
  async getTeacherPerformance(
    teacherUuid = null,
    period = "daily",
    date = null,
  ) {
    try {
      const params = new URLSearchParams({ period });
      if (teacherUuid) params.append("teacher_uuid", teacherUuid);
      if (date) params.append("date", date);

      const response = await axiosInstance.get(
        `/dashboard/data/teacher-performance?${params}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching teacher performance:", error);
      throw error;
    }
  }

  /**
   * Get refresh status
   */
  async getRefreshStatus() {
    try {
      const response = await axiosInstance.get(
        "/dashboard/data/refresh-status",
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching refresh status:", error);
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount, currency = "DZD") {
    return new Intl.NumberFormat("ar-DZ", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format number for display
   */
  formatNumber(number) {
    return new Intl.NumberFormat("ar-DZ").format(number);
  }

  /**
   * Calculate percentage change
   */
  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}

export default new DashboardService();
