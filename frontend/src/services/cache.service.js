/**
 * Cache Service for API Data
 * Reduces redundant API calls by caching frequently accessed data
 */

const CACHE_KEYS = {
  TEACHERS: "cache_teachers",
  BRANCHES: "cache_branches",
  CHAPTERS: "cache_chapters",
  USER_STATS: "cache_user_stats",
  DASHBOARD_STATS: "cache_dashboard_stats", // Dynamic prefix for dashboard data
  STUDENTS: "cache_students", // Students list cache
  SESSIONS: "cache_sessions", // Sessions list cache
};

const CACHE_TTL = {
  TEACHERS: 5 * 60 * 1000, // 5 minutes
  BRANCHES: 30 * 60 * 1000, // 30 minutes (rarely changes)
  CHAPTERS: 10 * 60 * 1000, // 10 minutes
  USER_STATS: 2 * 60 * 1000, // 2 minutes
  DASHBOARD_STATS: 2 * 60 * 1000, // 2 minutes (same as user stats)
  STUDENTS: 3 * 60 * 1000, // 3 minutes (frequently accessed)
  SESSIONS: 2 * 60 * 1000, // 2 minutes (updated frequently)
};

class CacheService {
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp > ttl) {
        this.remove(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Remove cached data
   * @param {string} key - Cache key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Cache remove error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  clearAll() {
    try {
      Object.values(CACHE_KEYS).forEach((key) => {
        this.remove(key);
      });
    } catch (error) {
      console.error("Cache clear all error:", error);
    }
  }

  /**
   * Get or fetch teachers with caching
   * @param {Function} fetchFn - Function to fetch teachers
   * @returns {Promise<Array>}
   */
  async getTeachers(fetchFn) {
    const cached = this.get(CACHE_KEYS.TEACHERS);
    if (cached) {
      console.log("📦 Using cached teachers");
      return cached;
    }

    console.log("🌐 Fetching teachers from API");
    const data = await fetchFn();
    this.set(CACHE_KEYS.TEACHERS, data, CACHE_TTL.TEACHERS);
    return data;
  }

  /**
   * Get or fetch branches with caching
   * @param {Function} fetchFn - Function to fetch branches
   * @returns {Promise<Array>}
   */
  async getBranches(fetchFn) {
    const cached = this.get(CACHE_KEYS.BRANCHES);
    if (cached) {
      console.log("📦 Using cached branches");
      return cached;
    }

    console.log("🌐 Fetching branches from API");
    const data = await fetchFn();
    this.set(CACHE_KEYS.BRANCHES, data, CACHE_TTL.BRANCHES);
    return data;
  }

  /**
   * Get or fetch chapters with caching
   * @param {Function} fetchFn - Function to fetch chapters
   * @returns {Promise<Array>}
   */
  async getChapters(fetchFn) {
    const cached = this.get(CACHE_KEYS.CHAPTERS);
    if (cached) {
      console.log("📦 Using cached chapters");
      return cached;
    }

    console.log("🌐 Fetching chapters from API");
    const data = await fetchFn();
    this.set(CACHE_KEYS.CHAPTERS, data, CACHE_TTL.CHAPTERS);
    return data;
  }

  /**
   * Get or fetch user stats with caching
   * @param {Function} fetchFn - Function to fetch user stats
   * @returns {Promise<Object>}
   */
  async getUserStats(fetchFn) {
    const cached = this.get(CACHE_KEYS.USER_STATS);
    if (cached) {
      console.log("📦 Using cached user stats");
      return cached;
    }

    console.log("🌐 Fetching user stats from API");
    const data = await fetchFn();
    this.set(CACHE_KEYS.USER_STATS, data, CACHE_TTL.USER_STATS);
    return data;
  }

  /**
   * Get or fetch dashboard stats with caching
   * Supports dynamic cache keys for different dashboard data (cards, charts, etc.)
   * @param {Function} fetchFn - Function to fetch dashboard data
   * @param {string} cacheKey - Specific cache key (e.g., 'dashboard_cards_daily')
   * @returns {Promise<Object>}
   */
  async getDashboardStats(fetchFn, cacheKey) {
    const fullKey = `${CACHE_KEYS.DASHBOARD_STATS}_${cacheKey}`;
    const cached = this.get(fullKey);
    if (cached) {
      console.log("📦 Using cached dashboard data:", cacheKey);
      return cached;
    }

    console.log("🌐 Fetching dashboard data from API:", cacheKey);
    const data = await fetchFn();
    this.set(fullKey, data, CACHE_TTL.DASHBOARD_STATS);
    return data;
  }

  /**
   * Invalidate specific cache
   */
  invalidateTeachers() {
    this.remove(CACHE_KEYS.TEACHERS);
  }

  invalidateBranches() {
    this.remove(CACHE_KEYS.BRANCHES);
  }

  invalidateChapters() {
    this.remove(CACHE_KEYS.CHAPTERS);
  }

  invalidateUserStats() {
    this.remove(CACHE_KEYS.USER_STATS);
  }

  invalidateDashboardStats() {
    // Clear all dashboard-related cache keys
    const allKeys = Object.keys(localStorage);
    const dashboardKeys = allKeys.filter((key) =>
      key.startsWith(CACHE_KEYS.DASHBOARD_STATS),
    );
    dashboardKeys.forEach((key) => this.remove(key));
    console.log("🗑️ Invalidated dashboard stats cache");
  }

  /**
   * Get or fetch students with caching
   * Supports pagination and search query in cache key
   * @param {Function} fetchFn - Function to fetch students
   * @param {Object} params - Query params (page, search, etc.)
   * @returns {Promise<Object>}
   */
  async getStudents(fetchFn, params = {}) {
    const cacheKey = `${CACHE_KEYS.STUDENTS}_${params.page || 1}_${params.search || ""}`;
    const cached = this.get(cacheKey);
    if (cached) {
      console.log("📦 [Cache HIT] Students:", params);
      return cached;
    }

    console.log("🌐 [API] Fetching students:", params);
    const data = await fetchFn();
    this.set(cacheKey, data, CACHE_TTL.STUDENTS);
    return data;
  }

  /**
   * Get or fetch sessions with caching
   * Supports filtering by date, teacher, etc. in cache key
   * @param {Function} fetchFn - Function to fetch sessions
   * @param {Object} filters - Filter params (date, teacher_id, etc.)
   * @returns {Promise<Object>}
   */
  async getSessions(fetchFn, filters = {}) {
    const filterStr = JSON.stringify(filters);
    const cacheKey = `${CACHE_KEYS.SESSIONS}_${filterStr}`;
    const cached = this.get(cacheKey);
    if (cached) {
      console.log("📦 [Cache HIT] Sessions:", filters);
      return cached;
    }

    console.log("🌐 [API] Fetching sessions:", filters);
    const data = await fetchFn();
    this.set(cacheKey, data, CACHE_TTL.SESSIONS);
    return data;
  }

  /**
   * Invalidate students cache
   */
  invalidateStudents() {
    const allKeys = Object.keys(localStorage);
    const studentKeys = allKeys.filter((key) =>
      key.startsWith(CACHE_KEYS.STUDENTS),
    );
    studentKeys.forEach((key) => this.remove(key));
    console.log("🗑️ [Cache INVALIDATED] Students");
  }

  /**
   * Invalidate sessions cache
   */
  invalidateSessions() {
    const allKeys = Object.keys(localStorage);
    const sessionKeys = allKeys.filter((key) =>
      key.startsWith(CACHE_KEYS.SESSIONS),
    );
    sessionKeys.forEach((key) => this.remove(key));
    console.log("🗑️ [Cache INVALIDATED] Sessions");
  }
}

export const cacheService = new CacheService();
export { CACHE_KEYS, CACHE_TTL };
export default cacheService;
