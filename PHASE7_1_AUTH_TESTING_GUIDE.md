# Phase 7.1 - Authentication & Device Management Testing Guide 🔐

**Date**: 16 Octobre 2025  
**Objectif**: Tester systématiquement toutes les fonctionnalités d'authentification  
**Durée estimée**: 2-3 heures

---

## 🛠️ Préparation des Tests

### 1. Outils Nécessaires
- ✅ Navigateur Chrome/Firefox (DevTools F12)
- ✅ Mode Incognito pour simuler différents devices
- ✅ Postman/Thunder Client (optionnel pour tests API direct)
- ✅ Compte admin: `0555000001` / `password`
- ✅ Compte étudiant test (à créer)

### 2. Configuration DevTools
```
1. Ouvrir DevTools (F12)
2. Onglet "Application" → "Local Storage"
3. Observer les clés: token, user, device_uuid, cache_*
4. Onglet "Network" → "Fetch/XHR" pour voir les requêtes
5. Onglet "Console" pour voir les logs
```

### 3. URLs de Test
```
Frontend: http://localhost:5173
Backend API: http://localhost:8000/api

Endpoints:
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/register
- GET  /api/auth/profile
```

---

## ✅ Test 1: Login avec Credentials Valides

### Objectif
Vérifier que le login fonctionne correctement avec des credentials valides.

### Étapes
1. **Ouvrir l'application**
   - URL: `http://localhost:5173`
   - Vous devez être redirigé vers `/login`

2. **Ouvrir DevTools**
   - F12 → Application → Local Storage
   - Vérifier que `token`, `user`, `device_uuid` sont absents

3. **Se connecter avec Admin**
   ```
   Téléphone: 0555000001
   Mot de passe: password
   ```

4. **Vérifier la réponse réseau**
   - DevTools → Network → XHR
   - Chercher requête `POST /api/auth/login`
   - Status: 200 OK
   - Response body doit contenir:
     ```json
     {
       "message": "Login successful",
       "data": {
         "token": "8|xxxxxxx...",
         "user": { "uuid": "...", "role": "admin", ... },
         "device_uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
       }
     }
     ```

5. **Vérifier localStorage**
   - DevTools → Application → Local Storage
   - ✅ Clé `token` existe avec valeur `8|xxx...`
   - ✅ Clé `user` existe avec JSON `{"uuid": "...", "role": "admin", ...}`
   - ✅ Clé `device_uuid` existe avec UUID valide
   - ❌ Clé `auth_token` NE DOIT PAS exister (ancien système)

6. **Vérifier redirection**
   - URL doit changer vers `/admin/dashboard`
   - Dashboard doit afficher les données

### Résultat Attendu
✅ Login réussi  
✅ Token stocké dans localStorage  
✅ Redirection vers dashboard admin  
✅ Pas d'erreurs console

### Résultat Réel
- [ ] ✅ Succès
- [ ] ❌ Échec - Raison: ___________________________

---

## ❌ Test 2: Login avec Credentials Invalides

### Objectif
Vérifier que le login échoue correctement avec des credentials invalides.

### Étapes

#### 2.1 - Téléphone Inexistant
1. **Tenter login**
   ```
   Téléphone: 0999999999
   Mot de passe: password
   ```

2. **Vérifier réseau**
   - Status: 422 Unprocessable Entity
   - Response:
     ```json
     {
       "message": "Validation failed",
       "errors": {
         "login": ["The provided credentials are incorrect."]
       }
     }
     ```

3. **Vérifier UI**
   - Message d'erreur affiché en arabe: "البيانات المدخلة غير صحيحة"
   - Pas de redirection
   - localStorage reste vide

#### 2.2 - Mot de Passe Incorrect
1. **Tenter login**
   ```
   Téléphone: 0555000001
   Mot de passe: wrongpassword
   ```

2. **Vérifier même comportement que 2.1**

#### 2.3 - Format Téléphone Invalide
1. **Tenter login**
   ```
   Téléphone: abc123
   Mot de passe: password
   ```

2. **Vérifier validation côté frontend**
   - Message: "Le champ téléphone est invalide"

### Résultat Attendu
✅ Erreur 422 pour credentials incorrects  
✅ Message d'erreur traduit en arabe  
✅ localStorage reste vide  
✅ Pas de redirection

### Résultat Réel
- [ ] ✅ Succès (tous les cas)
- [ ] ❌ Échec - Cas: _____ Raison: ___________________________

---

## 🚪 Test 3: Logout Simple

### Objectif
Vérifier que le logout nettoie correctement toutes les données d'auth.

### Étapes
1. **Se connecter** (utiliser Test 1)

2. **Vérifier localStorage AVANT logout**
   ```
   ✅ token = "8|xxx..."
   ✅ user = "{...}"
   ✅ device_uuid = "uuid..."
   ✅ cache_teachers = "{...}" (possiblement présent)
   ✅ cache_branches = "{...}" (possiblement présent)
   ✅ cache_dashboard_stats_... = "{...}" (possiblement présent)
   ```

3. **Cliquer sur "Déconnexion"**
   - Bouton dans header/sidebar admin

4. **Vérifier réseau**
   - Requête `POST /api/auth/logout`
   - Status: 200 OK (ou 401 si token déjà invalide - acceptable)

5. **Vérifier localStorage APRÈS logout**
   ```
   ❌ token = (supprimé)
   ❌ user = (supprimé)
   ❌ device_uuid = (supprimé)
   ❌ auth_token = (supprimé si présent)
   ❌ cache_* = (tous supprimés)
   ```

6. **Vérifier console**
   - Message: "✅ Logout: localStorage cleaned (auth + cache cleared)"

7. **Vérifier redirection**
   - URL: `/login`
   - Page login affichée

8. **Tenter d'accéder à une page protégée**
   - Aller manuellement vers `/admin/dashboard`
   - Doit rediriger vers `/login`

### Résultat Attendu
✅ Logout API réussi  
✅ localStorage complètement nettoyé (auth + cache)  
✅ Redirection vers /login  
✅ Impossible d'accéder aux pages protégées

### Résultat Réel
- [ ] ✅ Succès
- [ ] ❌ Échec - Raison: ___________________________

---

## 📱 Test 4: Single Device Enforcement

### Objectif
Vérifier qu'un étudiant ne peut se connecter que depuis un seul device.

### Prérequis
- Créer un compte étudiant de test (pas admin)
- Utiliser 2 navigateurs différents ou 1 normal + 1 incognito

### Étapes

#### 4.1 - Premier Device (Browser Normal)
1. **Ouvrir Chrome normal**
2. **Se connecter**
   ```
   Téléphone: [étudiant test]
   Password: password
   ```
3. **Vérifier localStorage**
   - Note le `device_uuid`: `UUID_A`
   - Note le `token`: `8|TOKEN_A`
4. **Rester connecté**
5. **Vérifier accès dashboard étudiant**
   - `/student/profile` accessible

#### 4.2 - Second Device (Browser Incognito)
1. **Ouvrir Chrome incognito** (ou Firefox)
2. **Se connecter avec MÊME compte étudiant**
   ```
   Téléphone: [même étudiant]
   Password: password
   ```
3. **Vérifier localStorage**
   - `device_uuid`: `UUID_B` (différent de UUID_A)
   - `token`: `8|TOKEN_B` (différent de TOKEN_A)
4. **Vérifier accès**
   - `/student/profile` accessible dans Incognito

#### 4.3 - Retour au Premier Device
1. **Revenir au Chrome normal**
2. **Rafraîchir la page** (F5)
3. **Faire une requête API** (naviguer vers une page)

4. **Comportement attendu selon le middleware**
   - **Scénario A** (Strict): Le token TOKEN_A est invalidé
     - Requête API retourne 401 Unauthorized
     - Redirection automatique vers `/login`
     - Message: "Vous avez été déconnecté car une nouvelle connexion a été détectée"
   
   - **Scénario B** (Permissif - code actuel): Le token TOKEN_A est mis à jour
     - Le middleware met à jour `name` du token vers UUID_B
     - La session continue à fonctionner
     - Log warning dans backend

5. **Vérifier logs backend**
   ```bash
   tail -f storage/logs/laravel.log
   ```
   - Chercher: "Device mismatch for user"
   - Chercher: "Device change detected"

### Résultat Attendu
**Selon implémentation actuelle (permissive)**:
✅ Device A et B peuvent coexister  
⚠️ Warning logs dans backend  
✅ Token mis à jour automatiquement

**Selon implémentation stricte (idéal)**:
✅ Device B connecté → Device A déconnecté  
✅ Redirection Device A vers login  
✅ Message explicite "connexion depuis autre device"

### Résultat Réel
- [ ] ✅ Comportement permissif (actuel)
- [ ] ✅ Comportement strict (après modification)
- [ ] ❌ Échec - Raison: ___________________________

---

## 🔄 Test 5: Force Device Change

### Objectif
Tester le changement volontaire de device par l'utilisateur.

### Étapes
1. **Device A**: Se connecter
2. **Logout volontaire** depuis Device A
3. **Device B**: Se connecter immédiatement après
4. **Vérifier**: Nouveau token généré, pas de conflit

### Résultat Attendu
✅ Logout A libère le device slot  
✅ Login B réussit sans erreur  
✅ Nouveau UUID généré

### Résultat Réel
- [ ] ✅ Succès
- [ ] ❌ Échec - Raison: ___________________________

---

## 🔁 Test 6: Multiple Login Attempts - Même Device

### Objectif
Vérifier le comportement lors de multiples tentatives de login depuis le même device.

### Étapes
1. **Login 1**: Se connecter
   - Note `token_1` et `device_uuid`
2. **Sans logout**: Cliquer "Login" à nouveau
   - Entrer mêmes credentials
3. **Vérifier localStorage**
   - `token` a changé → `token_2` ≠ `token_1`
   - `device_uuid` reste identique
4. **Vérifier backend tokens**
   ```sql
   SELECT id, name, created_at FROM personal_access_tokens 
   WHERE tokenable_id = [user_id] 
   ORDER BY created_at DESC;
   ```
   - Pour admin: Plusieurs tokens possibles (max 3 par device)
   - Pour student: 1 seul token actif

### Résultat Attendu
✅ Nouveau token généré  
✅ Ancien token invalidé (student) ou conservé (admin, max 3)  
✅ Même device_uuid  
✅ Accès fonctionnel avec nouveau token

### Résultat Réel
- [ ] ✅ Succès
- [ ] ❌ Échec - Raison: ___________________________

---

## 🌐 Test 7: Multiple Login Attempts - Devices Différents

### Objectif
Tester le login simultané depuis 3 devices différents.

### Étapes
1. **Device A** (Chrome normal): Login étudiant
2. **Device B** (Chrome incognito): Login même étudiant
3. **Device C** (Firefox): Login même étudiant

4. **Pour chaque device**, vérifier:
   - Token unique: `TOKEN_A`, `TOKEN_B`, `TOKEN_C`
   - UUID unique: `UUID_A`, `UUID_B`, `UUID_C`

5. **Tester l'accès simultané**:
   - Device A: Faire requête API → Vérifier status
   - Device B: Faire requête API → Vérifier status
   - Device C: Faire requête API → Vérifier status

### Résultat Attendu
**Selon implémentation actuelle**:
✅ Les 3 devices fonctionnent (permissif)  
⚠️ Warnings dans logs backend

**Selon implémentation stricte (à implémenter)**:
✅ Device C connecté  
❌ Device A et B déconnectés  
✅ Seul le dernier device fonctionne

### Résultat Réel
- [ ] ✅ Comportement permissif (actuel)
- [ ] ✅ Comportement strict (après modification)
- [ ] ❌ Échec - Raison: ___________________________

---

## ⏰ Test 8: Token Expiration Handling

### Objectif
Vérifier le comportement quand le token expire.

### Configuration Backend
```php
// config/sanctum.php
'expiration' => 1, // 1 minute pour test (au lieu de null)
```

### Étapes
1. **Se connecter** normalement
2. **Attendre 2 minutes**
3. **Faire une requête API**
   - Naviguer vers une page
   - Ou rafraîchir F5

4. **Vérifier réponse**
   - Status: 401 Unauthorized
   - Message: "Non authentifié"

5. **Vérifier comportement frontend**
   - Redirection automatique vers `/login`
   - Message: "Votre session a expiré"
   - localStorage nettoyé

### Résultat Attendu
✅ API retourne 401 après expiration  
✅ Frontend détecte 401  
✅ Redirection automatique vers login  
✅ Message d'expiration affiché  
✅ localStorage nettoyé

### Résultat Réel
- [ ] ✅ Succès
- [ ] ❌ Échec - Raison: ___________________________

---

## 🔄 Test 9: QR Token Regeneration

### Objectif
Vérifier que le QR token (UUID utilisateur) reste constant.

### Étapes
1. **Login étudiant**
2. **Vérifier localStorage**
   - `user.qr_token` = `user.uuid`
3. **Logout + Re-login**
4. **Vérifier localStorage**
   - `user.qr_token` identique (ne change jamais)
   - `user.uuid` identique (ne change jamais)

### Résultat Attendu
✅ QR token = UUID utilisateur  
✅ QR token constant (ne change jamais)  
✅ Utilisable pour check-in QR code

### Résultat Réel
- [ ] ✅ Succès
- [ ] ❌ Échec - Raison: ___________________________

---

## 🐛 Test 10: Edge Cases

### 10.1 - Logout Sans Token
1. **Ouvrir DevTools**
2. **Supprimer manuellement `token` de localStorage**
3. **Cliquer "Déconnexion"**
4. **Résultat attendu**:
   - Pas d'erreur
   - Redirection vers login
   - Console: Warning "401 - token already invalid"

### 10.2 - Token Invalide Manuellement
1. **Se connecter**
2. **Modifier `token` dans localStorage** → Mettre `999|faketoken`
3. **Naviguer vers une page protégée**
4. **Résultat attendu**:
   - API retourne 401
   - Redirection vers login
   - localStorage nettoyé

### 10.3 - Network Offline
1. **Se connecter**
2. **DevTools → Network → Offline**
3. **Tenter logout**
4. **Résultat attendu**:
   - localStorage nettoyé malgré erreur réseau
   - Redirection vers login
   - Message: "Déconnexion locale (mode hors ligne)"

### Résultat Attendu
✅ Application gère correctement les edge cases  
✅ Pas de crash ou erreurs bloquantes  
✅ Messages d'erreur appropriés

### Résultat Réel
- [ ] ✅ Succès (tous les cas)
- [ ] ❌ Échec - Cas: _____ Raison: ___________________________

---

## 📊 Résumé Final Phase 7.1

### Checklist Globale
- [ ] Test 1: Login valide ✅
- [ ] Test 2: Login invalide ❌
- [ ] Test 3: Logout simple 🚪
- [ ] Test 4: Single device enforcement 📱
- [ ] Test 5: Force device change 🔄
- [ ] Test 6: Multiple login même device 🔁
- [ ] Test 7: Multiple login devices différents 🌐
- [ ] Test 8: Token expiration ⏰
- [ ] Test 9: QR token regeneration 🔄
- [ ] Test 10: Edge cases 🐛

### Bugs Trouvés
1. **Bug #1**: _______________________________________
   - **Sévérité**: Critique / Majeur / Mineur
   - **Reproduction**: ________________________________
   - **Fix suggéré**: _________________________________

2. **Bug #2**: _______________________________________
   - **Sévérité**: Critique / Majeur / Mineur
   - **Reproduction**: ________________________________
   - **Fix suggéré**: _________________________________

### Améliorations Suggérées
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Score Global Phase 7.1
- **Tests Réussis**: ___ / 10
- **Bugs Critiques**: ___
- **Bugs Mineurs**: ___
- **Prêt pour Production**: ✅ Oui / ❌ Non

---

## 🚀 Prochaines Étapes

Si Phase 7.1 réussie (≥ 8/10 tests):
→ **Phase 7.2**: Admin Dashboard Testing

Si Phase 7.1 échouée (< 8/10):
→ Corriger les bugs identifiés
→ Re-tester Phase 7.1

---

**Date de test**: ___ / ___ / 2025  
**Testeur**: ___________________  
**Durée totale**: ___ heures
