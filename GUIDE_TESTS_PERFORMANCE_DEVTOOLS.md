# 🔍 Guide Tests de Performance - DevTools Browser

**Date:** 16 Octobre 2025  
**Objectif:** Mesurer les gains de performance réels avec Chrome DevTools  
**Durée estimée:** 30-45 minutes

---

## 📋 Checklist Rapide

- [ ] Mesurer temps chargement Dashboard
- [ ] Mesurer nombre requêtes Dashboard
- [ ] Mesurer temps chargement Sessions
- [ ] Mesurer nombre requêtes Sessions
- [ ] Mesurer temps chargement Students
- [ ] Vérifier cache hits (Network tab: 304)
- [ ] Vérifier debouncing fonctionne
- [ ] Prendre screenshots before/after

---

## 🛠️ Préparation

### 1. Ouvrir Chrome DevTools
1. Ouvrir Chrome/Edge
2. Appuyer sur **F12** ou **Ctrl + Shift + I**
3. Aller dans l'onglet **Network**
4. Activer **Preserve log** ✅
5. Désactiver **Disable cache** ❌ (on veut tester le cache)

### 2. Configurer le Throttling (Optionnel)
Pour simuler une connexion réelle :
- Cliquer sur **No throttling**
- Sélectionner **Fast 3G** ou **Slow 3G**
- Pour nos tests : Utiliser **No throttling** (résultats optimistes)

### 3. Se Connecter
```
Admin: 
- Phone: 0555123456
- Password: password
```

---

## 📊 Test 1: Dashboard Performance

### Étapes
1. **Vider le cache localStorage**
   ```javascript
   // Dans Console DevTools (F12)
   localStorage.clear();
   sessionStorage.clear();
   console.log('✅ Cache cleared');
   ```

2. **Première visite (Cold Load)**
   - Dans Network tab, cliquer sur **Clear** (🚫 icône)
   - Recharger la page: **Ctrl + Shift + R** (hard reload)
   - ⏱️ Noter le temps de chargement total (en bas à droite)
   - 📦 Noter le nombre de requêtes (en bas à gauche)
   - 📏 Noter la taille totale transférée

3. **Deuxième visite (Cache Hit)**
   - Recharger la page normalement: **F5**
   - ⏱️ Noter le temps de chargement
   - 📦 Vérifier les requêtes avec status **304 Not Modified**
   - 🔍 Chercher dans la colonne **Size**: devrait afficher **(from memory cache)** ou **(from disk cache)**

### Métriques à Collecter

| Métrique | Cold Load | Cache Hit | Amélioration |
|----------|-----------|-----------|--------------|
| **Temps total** | _____ s | _____ s | _____ % |
| **Nombre requêtes** | _____ | _____ | _____ % |
| **Taille transférée** | _____ KB | _____ KB | _____ % |
| **DOMContentLoaded** | _____ s | _____ s | _____ % |
| **Load Event** | _____ s | _____ s | _____ % |

### Requêtes Dashboard Attendues
```
Cold Load:
✅ GET /api/dashboard/data/cards       → 200 OK
✅ GET /api/dashboard/data/top-teachers → 200 OK
✅ GET /api/dashboard/data/revenue-series → 200 OK
✅ GET /assets/index-*.js              → 200 OK
✅ GET /assets/index-*.css             → 200 OK

Cache Hit (2ème visite):
✅ GET /api/dashboard/data/cards       → 304 Not Modified (ou from cache)
✅ GET /api/dashboard/data/top-teachers → 304 Not Modified
✅ GET /assets/index-*.js              → (from memory cache)
```

### Screenshot Dashboard
1. **Performance Tab** → Cliquer sur **Record** ⏺️
2. Recharger la page
3. Arrêter l'enregistrement
4. Prendre screenshot du **Flamegraph**
5. Identifier les goulots d'étranglement (barres rouges)

---

## 📊 Test 2: Sessions List Performance

### Étapes
1. **Vider le cache**
   ```javascript
   localStorage.clear();
   ```

2. **Naviguer vers Sessions**
   - Cliquer sur "Sessions" dans le menu
   - Dans Network tab, filtrer par **XHR** ou **Fetch**

3. **Cold Load - Sans Filtres**
   - ⏱️ Noter temps de chargement de la liste
   - 📦 Compter les requêtes API
   - Vérifier la requête: `GET /api/sessions?page=1`

4. **Tester les Filtres (Debouncing)**
   - Dans le champ **Search**, taper lentement: `"math"`
   - 🔍 Vérifier dans Network tab: une seule requête après **300ms**
   - ❌ Pas de requête pour chaque lettre (m, ma, mat, math)

### Métriques à Collecter

| Métrique | Sessions Page |
|----------|---------------|
| **Temps chargement initial** | _____ ms |
| **Nombre requêtes API** | _____ |
| **Temps réponse /api/sessions** | _____ ms |
| **Nombre items affichés** | _____ |
| **Payload size** | _____ KB |

### Vérifier le Debouncing
```
Action: Taper "mathematics" dans Search
Attendu:
  - Aucune requête pendant la frappe
  - 1 seule requête 300ms après la dernière lettre
  - Requête: GET /api/sessions?search=mathematics

❌ MAUVAIS (sans debounce):
  m → GET /api/sessions?search=m
  ma → GET /api/sessions?search=ma
  mat → GET /api/sessions?search=mat
  ... (10 requêtes pour 1 mot!)

✅ BON (avec debounce):
  mathematics → [attente 300ms] → GET /api/sessions?search=mathematics
  (1 seule requête!)
```

### Vérifier le Cache Teachers/Branches
```
Attendu dans Network tab:
1. Première visite Sessions:
   ✅ GET /api/teachers → 200 OK (chargé depuis API)
   ✅ GET /api/branches → 200 OK (chargé depuis API)
   
2. Deuxième visite Sessions (F5):
   📦 GET /api/teachers → (from cache - pas de requête réseau!)
   📦 GET /api/branches → (from cache - pas de requête réseau!)
   
Console DevTools devrait afficher:
  📦 [Cache] Teachers loaded from cache
  📦 [Cache] Branches loaded from cache
```

---

## 📊 Test 3: Students List Performance

### Étapes
1. **Naviguer vers Students/Users**
2. **Mesurer Cold Load**
   - Clear Network tab
   - Recharger la page
   - Noter métriques

3. **Tester Pagination**
   - Vérifier: `GET /api/users?role=student&page=1`
   - Cliquer sur page 2
   - Vérifier: `GET /api/users?role=student&page=2`
   - ⏱️ Temps de réponse par page

4. **Tester Filtres**
   - Sélectionner **Year**: 1AS
   - Vérifier: `GET /api/users?role=student&year_of_study=1AS`
   - Sélectionner **Branch**: Sciences Maths
   - Vérifier: `GET /api/users?role=student&year_of_study=1AS&branch_id=X`

### Métriques à Collecter

| Métrique | Students Page |
|----------|---------------|
| **Temps chargement initial** | _____ ms |
| **Temps réponse /api/users** | _____ ms |
| **Items par page** | _____ (attendu: 50) |
| **Payload size (50 students)** | _____ KB |
| **Temps changement page** | _____ ms |

### Vérifier Eager Loading
Ouvrir la réponse de `GET /api/users?role=student` dans DevTools:

```json
{
  "data": [
    {
      "uuid": "...",
      "firstname": "Anes",
      "lastname": "Alouaoui",
      "phone": "0540225128",
      "year_of_study": "1AS",
      "branch": {  // ✅ Branch chargé directement (pas de N+1)
        "id": 1,
        "name": "Sciences Mathématiques"
      }
    }
  ]
}
```

**Vérifier:**
- ✅ Branch inclus dans chaque student (pas de requête séparée)
- ✅ Uniquement les colonnes nécessaires (pas de colonnes inutiles)
- ✅ Pas de requête `/api/branches/1`, `/api/branches/2`, etc.

---

## 🔍 Test 4: Cache Service Validation

### Console Logs Performance
Ouvrir **Console DevTools**, vous devriez voir:

```
Cold Load (première visite):
🌐 [API] Teachers fetched from API (250ms)
📦 [Cache] Teachers cached (TTL: 5 min)
🌐 [API] Branches fetched from API (180ms)
📦 [Cache] Branches cached (TTL: 30 min)

Cache Hit (2ème visite):
📦 [Cache] Teachers loaded from cache (0ms)
📦 [Cache] Branches loaded from cache (0ms)
```

### Vérifier localStorage
```javascript
// Dans Console DevTools
console.log('Cache Keys:', Object.keys(localStorage));

// Devrait afficher:
// ["cache_teachers", "cache_branches", "cache_chapters", ...]

// Voir le contenu d'un cache:
console.log('Teachers Cache:', JSON.parse(localStorage.getItem('cache_teachers')));
// Output:
// {
//   data: [...],
//   expiresAt: 1729123456789
// }
```

### Tester Expiration du Cache
```javascript
// Simuler expiration du cache teachers
const cache = JSON.parse(localStorage.getItem('cache_teachers'));
cache.expiresAt = Date.now() - 1000; // Expiré il y a 1 seconde
localStorage.setItem('cache_teachers', JSON.stringify(cache));

// Recharger la page → devrait re-fetch depuis API
// Console devrait afficher:
// 🌐 [API] Teachers fetched from API (250ms)
// 📦 [Cache] Teachers cached (TTL: 5 min)
```

---

## 📸 Screenshots à Prendre

### 1. Network Tab - Dashboard Cold Load
**Fichier:** `screenshots/dashboard-cold-load.png`
- Montrer toutes les requêtes
- Temps total en bas
- Highlight des requêtes API principales

### 2. Network Tab - Dashboard Cache Hit
**Fichier:** `screenshots/dashboard-cache-hit.png`
- Montrer les status 304
- Montrer les "(from cache)"
- Comparer avec cold load

### 3. Performance Tab - Dashboard
**Fichier:** `screenshots/dashboard-performance.png`
- Flamegraph complet
- Main thread activity
- Network waterfall

### 4. Console Logs - Cache Service
**Fichier:** `screenshots/cache-service-logs.png`
- Logs 📦 et 🌐
- Timestamps
- TTL values

### 5. Network Tab - Debouncing
**Fichier:** `screenshots/debouncing-search.png`
- Montrer 1 seule requête après frappe
- Timeline montrant le délai 300ms

### 6. Lighthouse Report
**Fichier:** `screenshots/lighthouse-report.png`
- Performance score
- FCP, LCP, TTI metrics
- Recommandations

---

## 🎯 Résultats Attendus vs Réels

### Dashboard

| Métrique | Sans Optimisation | Avec Optimisation | Attendu |
|----------|-------------------|-------------------|---------|
| Temps chargement | ~2-3s | < 1s | ✅ |
| Nombre requêtes | 8-10 | 3-4 | ✅ |
| Cache hit rate | 0% | 70-80% | ✅ |

### Sessions

| Métrique | Avant | Après | Attendu |
|----------|-------|-------|---------|
| Temps réponse API | ~800ms | < 400ms | ✅ |
| Debouncing actif | ❌ | ✅ | ✅ |
| Cache teachers | ❌ | ✅ | ✅ |

### Students

| Métrique | Avant | Après | Attendu |
|----------|-------|-------|---------|
| Temps réponse API | ~1200ms | < 400ms | ✅ |
| Pagination | ✅ | ✅ | ✅ |
| Eager loading | ❌ | ✅ | ✅ |

---

## 🐛 Troubleshooting

### Problème: Pas de logs cache dans Console
**Solution:**
```javascript
// Vérifier que CacheService existe
import { cacheService } from '@/services/cache.service';
console.log('Cache Service:', cacheService);
```

### Problème: Cache ne fonctionne pas
**Solution:**
1. Vérifier localStorage pas désactivé
2. Vérifier TTL pas expiré
3. Vérifier console pour erreurs

### Problème: Debouncing ne fonctionne pas
**Solution:**
1. Vérifier import `useDebounce` correct
2. Vérifier delay configuré (300ms)
3. Chercher dans code: `const debouncedSearch = useDebounce(searchTerm, 300)`

### Problème: Requêtes N+1 toujours présentes
**Solution:**
1. Vérifier backend Controller utilise `with(['relation:columns'])`
2. Vérifier foreign key inclus dans colonnes
3. Check Network tab pour requêtes multiples

---

## 📊 Template de Rapport

Copier-coller ce template dans un fichier `RESULTATS_TESTS_DEVTOOLS.md`:

```markdown
# Résultats Tests Performance DevTools
**Date:** 16 Octobre 2025
**Testeur:** [Votre Nom]

## Dashboard

### Cold Load
- ⏱️ Temps total: _____ s
- 📦 Nombre requêtes: _____
- 📏 Taille totale: _____ KB
- 🎯 DOMContentLoaded: _____ s

### Cache Hit
- ⏱️ Temps total: _____ s
- 📦 Requêtes from cache: _____
- 💾 Cache hit rate: _____ %

### Screenshots
- [x] dashboard-cold-load.png
- [x] dashboard-cache-hit.png
- [x] dashboard-performance.png

## Sessions

### Performance
- ⏱️ Temps chargement: _____ ms
- 📦 Nombre requêtes: _____
- 🔍 Debouncing: ✅ / ❌
- 💾 Cache teachers: ✅ / ❌

### Screenshots
- [x] sessions-network.png
- [x] debouncing-demo.png

## Students

### Performance
- ⏱️ Temps chargement: _____ ms
- 📦 Temps réponse API: _____ ms
- 👥 Items par page: _____
- 📏 Payload size: _____ KB

### Eager Loading
- ✅ Branch inclus: OUI / NON
- ✅ Pas de N+1: OUI / NON

## Lighthouse

- 🎯 Performance: _____ / 100
- ♿ Accessibility: _____ / 100
- 🔍 Best Practices: _____ / 100
- 🔎 SEO: _____ / 100

## Conclusion

**Objectifs atteints:**
- [ ] Temps chargement < 1s
- [ ] Cache hit rate > 70%
- [ ] Debouncing actif
- [ ] Eager loading sans N+1
- [ ] Lighthouse > 90

**Problèmes détectés:**
- Aucun / [Décrire]

**Recommandations:**
- [Liste des améliorations suggérées]
```

---

## ✅ Validation Finale

Une fois tous les tests effectués, cocher:

- [ ] ✅ Dashboard cold load < 1s
- [ ] ✅ Dashboard cache hit < 500ms
- [ ] ✅ Cache hit rate > 70%
- [ ] ✅ Sessions debouncing fonctionne
- [ ] ✅ Teachers/Branches chargés from cache
- [ ] ✅ Students pagination efficace
- [ ] ✅ Pas de requêtes N+1 visibles
- [ ] ✅ Tous screenshots pris
- [ ] ✅ Rapport complété

---

## 🚀 Prochaine Étape

Une fois Phase 8.1 complète → **Phase 8.2: Apache Bench Tests**

```bash
# Preview de la commande
ab -n 1000 -c 100 -p login.json -T application/json http://localhost:8000/api/login
```

---

**Guide créé le:** 16 Octobre 2025  
**Dernière mise à jour:** 16 Octobre 2025
