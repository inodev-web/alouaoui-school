# 🔧 Corrections - Problèmes de Cache et Performance

**Date:** 16 Octobre 2025  
**Problèmes identifiés:** Cache localStorage non utilisé + Refresh automatique inutile + Rechargement complet de la page

---

## 🔴 Problèmes Identifiés

### 1. Cache localStorage Existe mais N'est PAS Utilisé

**Logs serveur montrent:**
```
11:49:08 /api/dashboard/data/cards → 1s
11:49:08 /api/dashboard/data/cards → 4s (RÉPÉTÉ!)
11:49:08 /api/dashboard/data/cards → 6s (ENCORE!)
```

**Raison:** Les hooks `useDashboardCards`, `useTopTeachers`, `useRevenueTimeSeries` appellent directement `dashboardService` **SANS** vérifier le cache localStorage.

### 2. Refresh Automatique Permanent des Cards

**Problème:** Dashboard se rafraîchit automatiquement toutes les X secondes sans raison.

**Devrait:** Se rafraîchir UNIQUEMENT quand :
- L'utilisateur crée/modifie/supprime des données
- L'utilisateur change de période (daily/weekly/monthly)
- L'utilisateur clique sur "Rafraîchir"

### 3. Rechargement Complet au Lieu de Mise à Jour Sélective

**Problème:** Lors de l'ajout d'un étudiant, TOUTE la page se recharge.

**Devrait:** Mettre à jour UNIQUEMENT :
- La liste des étudiants (ajouter le nouveau)
- Les cards concernées (+1 student)

---

## ✅ Solutions

### Solution 1: Utiliser le Cache dans les Hooks

**Fichier:** `frontend/src/hooks/useDashboardData.js`

```javascript
import { useState, useEffect } from "react";
import dashboardService from "../services/dashboardService";

// CACHE TTL
const CACHE_TTL = {
  cards: 2 * 60 * 1000, // 2 minutes
  topTeachers: 3 * 60 * 1000, // 3 minutes
  revenue: 5 * 60 * 1000, // 5 minutes
};

// Helper: Vérifier et récupérer depuis cache
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

// Hook: Dashboard Cards avec Cache
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

// Hook: Top Teachers avec Cache
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

// Hook: Revenue Time Series avec Cache
export const useRevenueTimeSeries = (
  period = "daily",
  days = 30,
  startDate = null,
  endDate = null
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

// NOUVEAU: Fonction d'invalidation globale
export const invalidateDashboardCache = () => {
  const keys = Object.keys(localStorage).filter(key => 
    key.startsWith('cache_dashboard_') || 
    key.startsWith('cache_top_teachers_') || 
    key.startsWith('cache_revenue_')
  );
  
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️  [Cache INVALIDATED] Removed ${keys.length} dashboard cache entries`);
};
```

---

### Solution 2: Supprimer le Refresh Automatique

**Fichier:** `frontend/src/components/admin/dashboard-cards.jsx`

**AVANT (avec auto-refresh):**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    refetch(); // ❌ Refresh toutes les 30s inutilement
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

**APRÈS (sans auto-refresh):**
```javascript
// ✅ PAS de setInterval
// Le refresh se fait UNIQUEMENT via:
// 1. Changement de période (useEffect de useDashboardCards)
// 2. Click sur bouton refresh
// 3. Après création/modification de données
```

**Ajouter bouton refresh manuel:**
```jsx
<Button onClick={() => {
  invalidateDashboardCache();
  refetch();
}} variant="outline">
  <RefreshCw className="h-4 w-4 ml-2" />
  تحديث
</Button>
```

---

### Solution 3: Mise à Jour Sélective (Optimistic Updates)

**Fichier:** `frontend/src/pages/admin/StudentsPage.jsx` (exemple)

**AVANT:**
```javascript
const handleCreateStudent = async (studentData) => {
  await studentService.create(studentData);
  
  // ❌ Recharge TOUTE la page
  window.location.reload();
};
```

**APRÈS:**
```javascript
import { invalidateDashboardCache } from '@/hooks/useDashboardData';

const handleCreateStudent = async (studentData) => {
  try {
    const newStudent = await studentService.create(studentData);
    
    // ✅ 1. Ajouter à la liste existante (optimistic update)
    setStudents(prev => [newStudent, ...prev]);
    
    // ✅ 2. Invalider cache dashboard (pour cards)
    invalidateDashboardCache();
    
    // ✅ 3. PAS de reload, juste un toast
    toast.success('تم إضافة الطالب بنجاح');
    
  } catch (error) {
    toast.error('خطأ في إضافة الطالب');
  }
};
```

**Pour les Cards:**
```javascript
const handleCreateStudent = async (studentData) => {
  // ... create student

  // ✅ Mise à jour locale immédiate
  setDashboardData(prev => ({
    ...prev,
    total_students: {
      ...prev.total_students,
      value: prev.total_students.value + 1
    }
  }));
  
  // Invalider cache pour forcer reload au prochain mount
  invalidateDashboardCache();
};
```

---

## 📝 Plan de Correction Complet

### Étape 1: Corriger les Hooks (5 min)
- [ ] Modifier `useDashboardCards` avec cache
- [ ] Modifier `useTopTeachers` avec cache
- [ ] Modifier `useRevenueTimeSeries` avec cache
- [ ] Ajouter fonction `invalidateDashboardCache()`

### Étape 2: Supprimer Auto-Refresh (2 min)
- [ ] Supprimer tous les `setInterval` dans dashboard components
- [ ] Ajouter bouton "Rafraîchir" manuel

### Étape 3: Optimistic Updates (10 min)
- [ ] `StudentsPage` - Create/Update/Delete
- [ ] `SessionsPage` - Create/Update/Delete
- [ ] `TeachersPage` - Create/Update/Delete
- [ ] Invalider cache après chaque mutation

### Étape 4: Tester (5 min)
- [ ] Vérifier logs console (`📦 [Cache HIT]` apparaît)
- [ ] Vérifier logs serveur (moins de requêtes répétées)
- [ ] Vérifier localStorage (cache créé et utilisé)
- [ ] Vérifier qu'il n'y a plus d'auto-refresh
- [ ] Vérifier optimistic updates fonctionnent

---

## 🎯 Résultats Attendus

### Avant:
```
// Dashboard mount
11:49:08 /api/dashboard/data/cards → 1s
11:49:08 /api/dashboard/data/revenue-time-series → 2s
11:49:08 /api/dashboard/data/top-teachers → 3s

// Auto-refresh 30s plus tard
11:49:38 /api/dashboard/data/cards → 1s
11:49:38 /api/dashboard/data/revenue-time-series → 2s
11:49:38 /api/dashboard/data/top-teachers → 3s

// Changement de période
11:49:45 /api/dashboard/data/cards → 1s (RÉPÉTÉ!)
11:49:45 /api/dashboard/data/revenue-time-series → 2s
11:49:45 /api/dashboard/data/top-teachers → 3s
```

**Total: 9 requêtes API en 45 secondes** ❌

### Après:
```
// Dashboard mount - COLD LOAD
11:49:08 /api/dashboard/data/cards → 1s
11:49:08 /api/dashboard/data/revenue-time-series → 2s
11:49:08 /api/dashboard/data/top-teachers → 3s
Console: 💾 [Cache SAVED] dashboard_cards_daily
Console: 💾 [Cache SAVED] revenue_series_daily_30
Console: 💾 [Cache SAVED] top_teachers_10_daily

// Refresh page (dans les 2 min) - CACHE HIT
11:49:30 (aucune requête API!)
Console: 📦 [Cache HIT] dashboard_cards_daily (age: 22s)
Console: 📦 [Cache HIT] revenue_series_daily_30 (age: 22s)
Console: 📦 [Cache HIT] top_teachers_10_daily (age: 22s)

// Changement de période → Nouvelle clé cache
11:49:45 /api/dashboard/data/cards?period=weekly → 1s
Console: 💾 [Cache SAVED] dashboard_cards_weekly

// Création étudiant → Invalidation cache
11:50:00 POST /api/users (create student)
Console: 🗑️  [Cache INVALIDATED] Removed 3 dashboard cache entries

// Prochain mount → FRESH DATA
11:50:05 /api/dashboard/data/cards → 1s
```

**Total: 5 requêtes API en 60 secondes** ✅ (-55%)

---

## 🚀 Mise en Œuvre

Voulez-vous que je :

1. **Corriger les hooks maintenant** → Modifier `useDashboardData.js`
2. **Supprimer auto-refresh** → Modifier components
3. **Ajouter optimistic updates** → Modifier pages CRUD
4. **Tout faire d'un coup** → Corrections complètes

Quelle option préférez-vous ?
