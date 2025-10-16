# Phase 7.1 - Tests Manuels Authentication & Device Management

**Date**: 16 Octobre 2025  
**Objectif**: Tester complètement le système d'authentification et de gestion des devices  
**Durée estimée**: 1-2 heures

---

## 📋 Prérequis

### Comptes de Test Disponibles

**Admin**:
```
Phone: 0600000000
Password: Admin@123
Role: admin
```

**Étudiant** (si existant, sinon créer via registration):
```
Phone: 0612345678
Password: Student@123
Role: student
```

### Outils Nécessaires

1. **Navigateurs**:
   - Chrome/Edge (principal)
   - Firefox ou Chrome Incognito (device 2)
   
2. **DevTools**:
   - F12 → Network tab (pour voir les requêtes)
   - F12 → Application → Local Storage (pour voir tokens)
   - F12 → Console (pour voir les logs)

3. **Extensions** (optionnel):
   - JSON Viewer pour Chrome
   - ModHeader (pour manipuler headers)

---

## 🧪 TEST 1: Login avec Credentials Valides ✅

### Objectif
Vérifier qu'un utilisateur peut se connecter avec des credentials corrects.

### Étapes

1. **Ouvrir l'application**
   ```
   URL: http://localhost:5173/login
   ```

2. **Ouvrir DevTools**
   - Appuyer sur `F12`
   - Aller dans l'onglet **Network**
   - Aller dans l'onglet **Application → Local Storage**

3. **Entrer credentials ADMIN**
   ```
   Téléphone: 0600000000
   Mot de passe: Admin@123
   ```

4. **Cliquer sur "Connexion"**

5. **Vérifications à faire**:

   ✅ **Network Tab**:
   - [ ] Requête POST vers `/api/auth/login` 
   - [ ] Status: 200 OK
   - [ ] Response contient:
     ```json
     {
       "message": "Login successful",
       "data": {
         "user": {
           "uuid": "...",
           "firstname": "Admin",
           "phone": "0600000000",
           "role": "admin"
         },
         "token": "...",
         "device_uuid": "..."
       }
     }
     ```

   ✅ **Local Storage**:
   - [ ] Clé `auth_token` existe
   - [ ] Clé `auth_user` existe avec données user
   - [ ] Clé `device_uuid` existe

   ✅ **Redirection**:
   - [ ] Redirection vers `/admin/dashboard`
   - [ ] Dashboard se charge correctement
   - [ ] Header affiche nom de l'utilisateur

   ✅ **Console**:
   - [ ] Pas d'erreurs rouges
   - [ ] Log: "Login response:" avec données

### Résultat Attendu
✅ **PASS** - Login admin réussi avec token généré et redirection correcte

---

## 🧪 TEST 2: Login avec Credentials Invalides ❌

### Objectif
Vérifier que le système refuse les mauvais credentials.

### Test 2.1: Téléphone Inexistant

1. **Entrer credentials**
   ```
   Téléphone: 0699999999 (n'existe pas)
   Mot de passe: AnyPassword@123
   ```

2. **Cliquer sur "Connexion"**

3. **Vérifications**:
   - [ ] Requête POST `/api/auth/login`
   - [ ] Status: **422 Unprocessable Entity**
   - [ ] Response:
     ```json
     {
       "message": "Validation failed",
       "errors": {
         "login": ["The provided credentials are incorrect."]
       }
     }
     ```
   - [ ] Message d'erreur affiché sur le formulaire
   - [ ] Pas de redirection
   - [ ] Pas de token créé

### Test 2.2: Mot de Passe Incorrect

1. **Entrer credentials**
   ```
   Téléphone: 0600000000 (admin correct)
   Mot de passe: WrongPassword123
   ```

2. **Cliquer sur "Connexion"**

3. **Vérifications**:
   - [ ] Status: **422**
   - [ ] Erreur: "The provided credentials are incorrect."
   - [ ] Pas de token créé

### Test 2.3: Format Téléphone Invalide

1. **Entrer credentials**
   ```
   Téléphone: abc123 (format invalide)
   Mot de passe: Admin@123
   ```

2. **Vérifications**:
   - [ ] Validation côté frontend (si implémentée)
   - [ ] OU erreur backend 422
   - [ ] Message d'erreur clair

### Résultat Attendu
✅ **PASS** - Tous les cas d'erreur sont correctement gérés

---

## 🧪 TEST 3: Logout Simple 🚪

### Objectif
Vérifier que logout supprime le token et déconnecte l'utilisateur.

### Étapes

1. **Se connecter d'abord**
   - Login avec admin (Test 1)
   - Vérifier présence token dans LocalStorage

2. **Ouvrir DevTools Network**

3. **Cliquer sur "Déconnexion"** (bouton dans header)

4. **Vérifications**:

   ✅ **Network**:
   - [ ] Requête POST `/api/auth/logout`
   - [ ] Status: 200 OK
   - [ ] Header `Authorization: Bearer <token>` présent

   ✅ **Local Storage**:
   - [ ] Clé `auth_token` **supprimée**
   - [ ] Clé `auth_user` **supprimée**
   - [ ] Clé `device_uuid` peut rester (optionnel)

   ✅ **Redirection**:
   - [ ] Redirection vers `/login`
   - [ ] Impossible d'accéder à `/admin/dashboard` (redirect vers login)

   ✅ **Backend** (vérifier logs):
   - [ ] Token supprimé de la table `personal_access_tokens`

### Résultat Attendu
✅ **PASS** - Logout nettoie session et redirige vers login

---

## 🧪 TEST 4: Logout de Tous les Devices 📱

### Objectif
Vérifier qu'un utilisateur peut se déconnecter de tous ses appareils.

### Prérequis
Avoir au moins 2 sessions actives (voir TEST 7 pour créer multiple sessions).

### Étapes

1. **Session 1 (Chrome normal)**
   - Login avec étudiant

2. **Session 2 (Chrome Incognito)**
   - Login avec **même étudiant** → doit invalider session 1

3. **Dans Session 2**:
   - Vérifier connexion active
   - Aller dans Settings/Profile
   - Chercher bouton "Déconnexion de tous les appareils"
   - Cliquer dessus

4. **Vérifications**:

   ✅ **Network (Session 2)**:
   - [ ] Requête POST `/api/auth/logout-all` ou `/api/auth/logout-all-devices`
   - [ ] Status: 200 OK

   ✅ **Session 1 (Chrome normal)**:
   - [ ] Rafraîchir page
   - [ ] Doit être déconnecté (redirect vers login)
   - [ ] LocalStorage vide

   ✅ **Session 2**:
   - [ ] Également déconnecté
   - [ ] Redirection vers login

   ✅ **Base de données**:
   ```sql
   SELECT * FROM personal_access_tokens 
   WHERE tokenable_id = <student_id>;
   -- Résultat: 0 rows (tous les tokens supprimés)
   ```

### Résultat Attendu
✅ **PASS** - Tous les tokens de l'utilisateur sont invalidés

---

## 🧪 TEST 5: Single Device Enforcement 🔒

### Objectif
Vérifier qu'un étudiant ne peut être connecté que sur UN seul appareil.

### Étapes

1. **Device A (Chrome normal)**
   - Login étudiant
   - Téléphone: 0612345678
   - Password: Student@123
   - Noter le `device_uuid` dans LocalStorage

2. **Vérifier connexion active**:
   - [ ] Dashboard accessible
   - [ ] Token valide

3. **Device B (Chrome Incognito ou Firefox)**
   - **MÊME** login étudiant
   - Téléphone: 0612345678
   - Password: Student@123

4. **Vérifications Device B**:
   - [ ] Login réussi (200 OK)
   - [ ] Nouveau token généré
   - [ ] Nouveau `device_uuid` différent de Device A

5. **Vérifier Device A**:
   - [ ] **Rafraîchir la page**
   - [ ] Doit être **déconnecté automatiquement**
   - [ ] Redirection vers `/login`
   - [ ] Message: "Vous avez été déconnecté car une nouvelle session a été ouverte"

6. **Vérifier Backend**:
   ```sql
   SELECT name, created_at FROM personal_access_tokens 
   WHERE tokenable_id = <student_id>
   ORDER BY created_at DESC;
   -- Résultat: 1 seul token (celui de Device B)
   ```

7. **Test Inverse**:
   - Device A: Re-login
   - Device B: Doit être déconnecté

### Middleware Vérifié
```php
// backend/app/Http/Middleware/EnsureSingleDevice.php
// Vérifie que token.name === X-Device-UUID header
```

### Résultat Attendu
✅ **PASS** - Un seul device actif à la fois pour les étudiants

---

## 🧪 TEST 6: Force Device Change 🔄

### Objectif
Vérifier que le système gère correctement un changement de device.

### Étapes

1. **Login Device A**
   - Login étudiant
   - Noter `device_uuid_A` dans LocalStorage

2. **Simuler changement de device** (même navigateur):
   - Ouvrir DevTools → Console
   - Exécuter:
     ```javascript
     // Changer le device UUID manuellement
     const newUuid = crypto.randomUUID();
     localStorage.setItem('device_uuid', newUuid);
     console.log('New device_uuid:', newUuid);
     ```

3. **Faire une requête API** (ex: charger dashboard):
   - Rafraîchir la page

4. **Vérifications**:

   ✅ **Comportement Attendu** (selon implementation):
   
   **Option A: Update automatique**
   - [ ] Middleware détecte changement
   - [ ] Update `personal_access_tokens.name` avec nouveau UUID
   - [ ] Requête réussit (200 OK)
   - [ ] Log backend: "Device change detected"

   **Option B: Force logout**
   - [ ] Middleware détecte mismatch
   - [ ] Retourne 401 Unauthorized
   - [ ] Frontend déconnecte et redirect login
   - [ ] Message: "Device changé, veuillez vous reconnecter"

5. **Vérifier le code middleware**:
   ```php
   // Ligne ~95 de EnsureSingleDevice.php
   if ($tokenDeviceUuid !== $deviceUuid) {
       // Vérifier quel comportement est implémenté
   }
   ```

### Résultat Attendu
✅ **PASS** - Changement device géré (update OU logout selon config)

---

## 🧪 TEST 7: Multiple Login Attempts - Même Device 🔁

### Objectif
Vérifier que plusieurs tentatives de login depuis le même device sont gérées.

### Étapes

1. **Login 1**
   - Téléphone: 0612345678
   - Password: Student@123
   - Noter `token_1` et `device_uuid`

2. **NE PAS LOGOUT**

3. **Login 2 (même browser, même tab)**
   - Effacer LocalStorage:
     ```javascript
     localStorage.clear();
     ```
   - Aller sur `/login`
   - **MÊME** credentials
   - **MÊME** device (device_uuid sera régénéré ou réutilisé)

4. **Vérifications**:

   ✅ **Tokens**:
   ```sql
   SELECT id, name, created_at FROM personal_access_tokens 
   WHERE tokenable_id = <student_id>
   ORDER BY created_at DESC;
   ```
   - [ ] Combien de tokens? (selon implementation)
   - [ ] Option A: 1 token (ancien supprimé)
   - [ ] Option B: 2 tokens (ancien + nouveau)

   ✅ **Comportement**:
   - [ ] Login 2 réussit
   - [ ] `token_2` généré
   - [ ] Dashboard accessible avec `token_2`

5. **Test avec token_1**:
   - Remplacer manuellement token dans LocalStorage
   - Rafraîchir
   - Vérifier si `token_1` est toujours valide

### Résultat Attendu
✅ **PASS** - Nouveau login invalide l'ancien token du même device

---

## 🧪 TEST 8: Multiple Login Attempts - Devices Différents 📱📱

### Objectif
Vérifier comportement avec login depuis plusieurs devices différents.

### Scénario: Admin (peut avoir plusieurs devices)

1. **Device 1 (Chrome)**
   - Login admin
   - Noter `device_uuid_1`

2. **Device 2 (Firefox)**
   - Login admin
   - Noter `device_uuid_2`

3. **Device 3 (Chrome Incognito)**
   - Login admin
   - Noter `device_uuid_3`

4. **Vérifications**:

   ✅ **Tous les devices actifs**:
   - [ ] Device 1: Dashboard accessible
   - [ ] Device 2: Dashboard accessible
   - [ ] Device 3: Dashboard accessible

   ✅ **Tokens**:
   ```sql
   SELECT name, created_at FROM personal_access_tokens 
   WHERE tokenable_id = <admin_id>
   ORDER BY created_at DESC;
   ```
   - [ ] 3 tokens présents (ou 3 derniers si nettoyage auto)
   - [ ] Chaque token a un `name` (device_uuid) différent

### Scénario: Étudiant (single device only)

1. **Device 1**
   - Login étudiant

2. **Device 2**
   - Login **même** étudiant

3. **Vérifications**:
   - [ ] Device 1: **Déconnecté**
   - [ ] Device 2: **Connecté**
   - [ ] Table: **1 seul token** pour cet étudiant

### Résultat Attendu
✅ **PASS** - Admin multi-device, Étudiant single-device

---

## 🧪 TEST 9: Token Expiration Handling ⏰

### Objectif
Vérifier que les tokens expirés sont correctement gérés.

### Configuration
```php
// backend/config/sanctum.php
'expiration' => 60, // 60 minutes (par défaut null = jamais)
```

### Étapes

1. **Modifier temporairement l'expiration** (pour test rapide):
   ```php
   // config/sanctum.php
   'expiration' => 1, // 1 minute pour test
   ```

2. **Artisan cache clear**:
   ```bash
   cd backend
   php artisan config:cache
   ```

3. **Login**
   - Login étudiant
   - Dashboard chargé

4. **Attendre 2 minutes** ⏱️

5. **Faire une action** (ex: charger sessions):
   - Cliquer sur "Sessions" dans menu

6. **Vérifications**:

   ✅ **Response**:
   - [ ] Status: **401 Unauthorized**
   - [ ] Message: "Unauthenticated" ou "Token expired"

   ✅ **Frontend**:
   - [ ] Axios interceptor détecte 401
   - [ ] LocalStorage nettoyé
   - [ ] Redirection vers `/login`
   - [ ] Message: "Session expirée, veuillez vous reconnecter"

   ✅ **Code à vérifier**:
   ```javascript
   // frontend/src/services/api/axios.config.js
   axios.interceptors.response.use(
     response => response,
     error => {
       if (error.response?.status === 401) {
         // Vérifier gestion expiration
       }
     }
   );
   ```

### Résultat Attendu
✅ **PASS** - Token expiré → logout automatique

---

## 🧪 TEST 10: QR Token Regeneration 🔄

### Objectif
Vérifier que le QR code (uuid) est correctement généré et ne change pas.

### Étapes

1. **Login étudiant**

2. **Vérifier QR Token initial**:
   - Response login contient:
     ```json
     {
       "user": {
         "uuid": "550e8400-e29b-41d4-a716-446655440000",
         "qr_token": "550e8400-e29b-41d4-a716-446655440000"
       }
     }
     ```
   - Noter le `qr_token` (= `uuid` utilisateur)

3. **Aller sur profil étudiant** (`/student/profile`):
   - [ ] QR Code affiché
   - [ ] QR Code contient le `uuid` de l'utilisateur

4. **Scanner le QR Code** (ou vérifier le contenu):
   - Utiliser un scanner QR (téléphone ou online tool)
   - Vérifier que le contenu = `user.uuid`

5. **Logout et Re-login**:
   - Logout
   - Login à nouveau
   - Vérifier QR Token

6. **Vérifications**:

   ✅ **QR Token stable**:
   - [ ] `qr_token` identique avant/après logout
   - [ ] `qr_token` = `user.uuid` (jamais change)
   - [ ] QR Code toujours le même

   ✅ **NOT A FEATURE**: Regeneration
   - Le QR token est le UUID permanent de l'utilisateur
   - **NE DOIT PAS** changer (pas de "regeneration")
   - Exception: Si admin modifie UUID (rare)

### Note Importante
```
Le "QR Token" n'est PAS un token d'authentification.
C'est simplement l'UUID de l'utilisateur utilisé pour le check-in.
Il ne change jamais sauf si l'utilisateur est recréé.
```

### Résultat Attendu
✅ **PASS** - QR Token (UUID) stable et permanent

---

## 📊 Résumé des Tests

| Test | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Login valide | ⏳ | Admin + Étudiant |
| 2 | Login invalide | ⏳ | 3 cas d'erreur |
| 3 | Logout simple | ⏳ | Token supprimé |
| 4 | Logout all devices | ⏳ | Tous tokens supprimés |
| 5 | Single device | ⏳ | Étudiant seulement |
| 6 | Device change | ⏳ | Update ou logout |
| 7 | Multiple login même device | ⏳ | Token invalidation |
| 8 | Multiple login diff devices | ⏳ | Admin vs Étudiant |
| 9 | Token expiration | ⏳ | 401 handling |
| 10 | QR Token | ⏳ | UUID permanent |

---

## 📝 Template de Rapport de Test

Pour chaque test, documenter:

```markdown
### TEST X: [Nom du Test]
**Date**: [Date]
**Testeur**: [Nom]
**Navigateur**: [Chrome/Firefox]

**Résultat**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

**Détails**:
- Étape 1: ✅ OK
- Étape 2: ✅ OK
- Étape 3: ❌ FAIL - [Description du problème]

**Bugs trouvés**:
1. [Bug 1]: [Description]
2. [Bug 2]: [Description]

**Screenshots**: [Lien vers screenshots si applicable]

**Recommendations**:
- [Amélioration 1]
- [Amélioration 2]
```

---

## 🔧 Outils de Debug

### Logs Backend à Activer

```php
// backend/app/Http/Middleware/EnsureSingleDevice.php
\Log::info("EnsureSingleDevice middleware check", [
    'user_uuid' => $user->uuid,
    'request_device_uuid' => $deviceUuid,
    'token_device_uuid' => $currentToken ? $currentToken->name : 'NO_TOKEN',
]);
```

### Commandes Utiles

```bash
# Voir logs backend en temps réel
cd backend
tail -f storage/logs/laravel.log

# Vérifier tokens dans DB
php artisan tinker
>>> DB::table('personal_access_tokens')->get();
>>> DB::table('personal_access_tokens')->where('tokenable_id', 1)->get();

# Clear tous les tokens (reset)
>>> DB::table('personal_access_tokens')->truncate();
```

### DevTools Console Scripts

```javascript
// Voir token actuel
console.log('Token:', localStorage.getItem('auth_token'));
console.log('Device UUID:', localStorage.getItem('device_uuid'));
console.log('User:', JSON.parse(localStorage.getItem('auth_user')));

// Clear session
localStorage.clear();
sessionStorage.clear();

// Tester API manuellement
fetch('http://localhost:8000/api/auth/user', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'X-Device-UUID': localStorage.getItem('device_uuid')
  }
}).then(r => r.json()).then(console.log);
```

---

## ✅ Checklist Finale

Avant de marquer Phase 7.1 comme complète:

- [ ] Tous les 10 tests exécutés
- [ ] Rapport de test rédigé pour chaque test
- [ ] Bugs documentés (si trouvés)
- [ ] Screenshots pris (pour tests critiques)
- [ ] Comportement admin vs étudiant vérifié
- [ ] Device enforcement vérifié
- [ ] Token expiration testée
- [ ] QR Token validé

**Statut Phase 7.1**: ⏳ En cours → ✅ Complète (après tests)

---

## 🚀 Prochaines Étapes

Après Phase 7.1:
- **Phase 7.2**: Admin Dashboard Testing
- **Phase 7.3**: Sessions CRUD Testing
- **Phase 7.4**: Students CRUD Testing
- **Phase 7.5**: Teachers CRUD Testing
- **Phase 7.6**: Check-in Testing
- **Phase 7.7**: Student Panel Testing
- **Phase 7.8**: Responsive Testing

**Estimation Phase 7 complète**: 4-6 heures
