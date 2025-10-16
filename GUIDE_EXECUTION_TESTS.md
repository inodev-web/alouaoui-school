# Guide d'Exécution - Test Phase 7.1 Authentication

## 🚀 Installation Rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Démarrer le backend (si pas déjà démarré)
```bash
# Terminal 1
cd backend
php artisan serve
```

### 3. Exécuter les tests
```bash
# Terminal 2 (racine du projet)
npm run test:auth
```

## 📋 Commandes Disponibles

### Test unique
```bash
node test-phase7-1-auth.js
```

### Test avec watch (re-exécution automatique)
```bash
npm run test:auth:watch
```

## ✅ Résultats Attendus

Le script va automatiquement:
1. ✅ Tester 10 scénarios d'authentification
2. ✅ Afficher les résultats en couleur
3. ✅ Calculer un score /10
4. ✅ Lister les bugs trouvés
5. ✅ Donner des recommandations

### Exemple de sortie:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Login avec Credentials Valides
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Device UUID généré: a1b2c3d4-...
✅ PASS - Status code 200
   Status: 200
✅ PASS - Réponse contient token
   Token: 8|yitRtwI6BRhbSu...
...

RÉSUMÉ FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tests Totaux:    35
Tests Réussis:   33 (94%)
Tests Échoués:   2 (6%)

✅ SUCCÈS - Score: 9/10
Prêt pour Phase 7.2 - Dashboard Testing
```

## 🔧 Configuration

### Modifier l'URL de l'API
Éditer `test-phase7-1-auth.js` ligne 11:
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

### Modifier les credentials admin
Éditer `test-phase7-1-auth.js` lignes 12-13:
```javascript
const ADMIN_PHONE = '0555000001';
const ADMIN_PASSWORD = 'password';
```

## 📊 Interprétation des Résultats

### Score ≥ 8/10
✅ **SUCCÈS** - Prêt pour Phase 7.2  
→ L'authentification fonctionne correctement  
→ Documenter les résultats dans `PHASE7_1_AUTH_TESTING_GUIDE.md`

### Score < 8/10
❌ **ÉCHEC** - Corrections nécessaires  
→ Vérifier la liste des bugs  
→ Corriger le code  
→ Re-exécuter les tests

## 🐛 Debugging

### Les tests échouent tous avec "Connection refused"
```bash
# Vérifier que le backend tourne
curl http://localhost:8000/api/health

# Si erreur, démarrer le backend
cd backend
php artisan serve
```

### Erreur "Cannot find module 'axios'"
```bash
# Installer les dépendances
npm install
```

### Token invalide après logout
✅ **Comportement normal** - Le test vérifie que le token est invalidé

### Multiple devices fonctionnent ensemble
⚠️ **Comportement permissif actuel** - C'est normal  
→ Pour strict enforcement: modifier `EnsureSingleDevice.php`

## 📝 Tests Couverts

1. **Login avec credentials valides** - 6 assertions
2. **Login avec credentials invalides** - 3 scénarios
3. **Logout simple** - 2 assertions
4. **Single device enforcement** - 4 assertions
5. **Force device change** - 3 assertions
6. **Multiple login même device** - 3 assertions
7. **Multiple login devices différents** - 4 assertions
8. **Token expiration** - 1 assertion
9. **QR token regeneration** - 3 assertions
10. **Edge cases** - 3 scénarios

**Total**: ~35 assertions automatisées

## 🔄 Workflow Recommandé

1. **Exécuter les tests**
   ```bash
   npm run test:auth
   ```

2. **Analyser les résultats**
   - Score ≥ 8/10 → Continuer
   - Score < 8/10 → Corriger

3. **Corriger les bugs** (si nécessaire)
   - Lire les messages d'erreur
   - Modifier le code backend/frontend
   - Re-exécuter

4. **Documenter**
   - Mettre à jour `PHASE7_1_AUTH_TESTING_GUIDE.md`
   - Cocher les tests réussis

5. **Passer à Phase 7.2**
   - Dashboard Testing
   - Sessions CRUD Testing

## 💡 Conseils

- ✅ Lancer les tests dans un environnement propre
- ✅ Vérifier les logs backend en parallèle: `tail -f backend/storage/logs/laravel.log`
- ✅ Utiliser `npm run test:auth:watch` pour développement rapide
- ⚠️ Ne PAS exécuter en production (utilise des vraies requêtes API)

## 📞 Support

En cas de problème:
1. Vérifier que le backend est démarré
2. Vérifier les logs: `backend/storage/logs/laravel.log`
3. Vérifier la configuration: `backend/.env`
4. Re-installer les dépendances: `npm install`

---

**Créé**: 16 Octobre 2025  
**Version**: 1.0.0  
**Phase**: 7.1 - Authentication Testing
