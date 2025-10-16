import { useState, useEffect } from "react";
import dashboardService from "../services/dashboardService";

// CACHE TTL Configuration
const CACHE_TTL = {
  cards: 2 * 60 * 1000, // 2 minutes
  topTeachers: 3 * 60 * 1000, // 3 minutes
  revenue: 5 * 60 * 1000, // 5 minutes
};

// Helper: Récupérer depuis cache
const getFromCache = (key, ttl) => {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < ttl) {
      console.log(`📦 [Cache HIT] ${key} (age: ${Math.round(age / 1000)}s)`);
      return data;
    } else {
      console.log(`⏱️  [Cache EXPIRED] ${key} (age: ${Math.round(age / 1000)}s)`);
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [Cache ERROR] ${key}:`, error);
    return null;
  }
};

// Helper: Sauvegarder dans cache
const saveToCache = (key, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
    console.log(`💾 [Cache SAVED] ${key}`);
  } catch (error) {
    console.error(`❌ [Cache SAVE ERROR] ${key}:`, error);
  }
};

export const useDashboardCards = (period = "daily", date = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (useCache = true) => {
    const cacheKey = `dashboard_cards_${period}_${date || "null"}`;

    // 1. Vérifier cache FIRST
    if (useCache) {
      const cached = getFromCache(cacheKey, CACHE_TTL.cards);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    // 2. Fetch depuis API si pas de cache
    try {
      setLoading(true);
      setError(null);
      console.log(`🌐 [API] Fetching dashboard cards (${period})...`);
      
      const result = await dashboardService.getDashboardCards(period, date);
      
      setData(result);
      saveToCache(cacheKey, result);
    } catch (err) {
      setError(err);
      console.error("❌ Error fetching dashboard cards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true); // useCache = true
  }, [period, date]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(false) // Force refresh sans cache
  };
};

export const useTopTeachers = (limit = 10, period = "daily", date = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (useCache = true) => {
    const cacheKey = `top_teachers_${limit}_${period}_${date || "null"}`;

    if (useCache) {
      const cached = getFromCache(cacheKey, CACHE_TTL.topTeachers);
      if (cached) {
        setData(cached.data || []);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🌐 [API] Fetching top teachers (limit: ${limit})...`);
      
      const result = await dashboardService.getTopTeachers(limit, period, date);
      
      setData(result.data || []);
      saveToCache(cacheKey, result);
    } catch (err) {
      setError(err);
      console.error("❌ Error fetching top teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [limit, period, date]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(false)
  };
};

export const useRevenueTimeSeries = (
  period = "daily",
  days = 30,
  startDate = null,
  endDate = null,
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (useCache = true) => {
    const cacheKey = `revenue_series_${period}_${days}_${startDate || "null"}_${endDate || "null"}`;

    if (useCache) {
      const cached = getFromCache(cacheKey, CACHE_TTL.revenue);
      if (cached) {
        setData(cached.data || []);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🌐 [API] Fetching revenue series (${period}, ${days} days)...`);
      
      const result = await dashboardService.getRevenueTimeSeries(
        period,
        days,
        startDate,
        endDate
      );
      
      setData(result.data || []);
      saveToCache(cacheKey, result);
    } catch (err) {
      setError(err);
      console.error("❌ Error fetching revenue time series:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [period, days, startDate, endDate]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(false)
  };
};

export const useTeacherPerformance = (
  teacherUuid = null,
  period = "daily",
  date = null,
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardService.getTeacherPerformance(
          teacherUuid,
          period,
          date,
        );
        setData(result.data || []);
      } catch (err) {
        setError(err);
        console.error("Error fetching teacher performance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherUuid, period, date]);

  return { data, loading, error, refetch: () => fetchData() };
};

// NOUVELLE fonction: Invalidation globale du cache dashboard
export const invalidateDashboardCache = () => {
  const keys = Object.keys(localStorage).filter(key => 
    key.startsWith('cache_dashboard_') || 
    key.startsWith('cache_top_teachers_') || 
    key.startsWith('cache_revenue_')
  );
  
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️  [Cache INVALIDATED] Removed ${keys.length} dashboard cache entries`);
};
