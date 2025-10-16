# Phase 7.1 - Rapport de Tests Authentication & Device Management

**Date de test**: [À remplir]  
**Testeur**: [Votre nom]  
**Environnement**: 
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Database: SQLite

---

## 📊 Résumé Global

| Métrique | Valeur |
|----------|--------|
| Tests planifiés | 10 |
| Tests exécutés | 0 / 10 |
| Tests réussis (✅ PASS) | 0 |
| Tests échoués (❌ FAIL) | 0 |
| Tests partiels (⚠️ PARTIAL) | 0 |
| Bugs trouvés | 0 |
| Taux de réussite | 0% |

---

## 🧪 TEST 1: Login avec Credentials Valides

**Date**: [Date]  
**Navigateur**: [Chrome/Firefox/Edge]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Sous-tests

#### 1.1: Login Admin
- [ ] Requête POST `/api/auth/login` → 200 OK
- [ ] Response contient `token`, `user`, `device_uuid`
- [ ] Token stocké dans LocalStorage
- [ ] Redirection vers `/admin/dashboard`
- [ ] Dashboard se charge correctement
- [ ] Nom utilisateur affiché dans header

**Notes**: 
```
[Vos observations ici]
```

#### 1.2: Login Étudiant
- [ ] Même vérifications que 1.1
- [ ] Redirection vers `/student/dashboard`

**Notes**:
```
[Vos observations ici]
```

### Bugs Trouvés
```
1. [Si bug trouvé, décrire ici]
2. 
```

### Screenshots
```
[Liens vers screenshots]
```

---

## 🧪 TEST 2: Login avec Credentials Invalides

**Date**: [Date]  
**Navigateur**: [Chrome/Firefox/Edge]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Sous-tests

#### 2.1: Téléphone Inexistant
- [ ] Requête → 422 Unprocessable Entity
- [ ] Message erreur: "The provided credentials are incorrect."
- [ ] Pas de token créé
- [ ] Pas de redirection

**Téléphone testé**: `0699999999`  
**Password testé**: `AnyPassword@123`  

**Notes**:
```
[Vos observations]
```

#### 2.2: Mot de Passe Incorrect
- [ ] Requête → 422
- [ ] Message d'erreur affiché
- [ ] Pas de token

**Téléphone testé**: `0600000000` (admin)  
**Password testé**: `WrongPassword123`  

**Notes**:
```
[Vos observations]
```

#### 2.3: Format Téléphone Invalide
- [ ] Validation frontend OU backend
- [ ] Message d'erreur clair

**Téléphone testé**: `abc123`  

**Notes**:
```
[Vos observations]
```

### Bugs Trouvés
```
1. 
2. 
```

---

## 🧪 TEST 3: Logout Simple

**Date**: [Date]  
**Navigateur**: [Chrome/Firefox/Edge]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Vérifications

- [ ] Requête POST `/api/auth/logout` → 200 OK
- [ ] Header `Authorization: Bearer <token>` présent
- [ ] LocalStorage `auth_token` supprimé
- [ ] LocalStorage `auth_user` supprimé
- [ ] Redirection vers `/login`
- [ ] Impossible d'accéder `/admin/dashboard` après logout

### Vérification Backend
```sql
-- Exécuter après logout
SELECT * FROM personal_access_tokens WHERE id = [token_id];
-- Résultat attendu: 0 rows
```

**Résultat SQL**: 
```
[Votre résultat ici]
```

### Bugs Trouvés
```
1. 
```

---

## 🧪 TEST 4: Logout de Tous les Devices

**Date**: [Date]  
**Navigateurs**: [Device 1] + [Device 2]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Configuration
- Device 1: [Chrome normal]
- Device 2: [Chrome Incognito]
- User: [Étudiant 0612345678]

### Vérifications

- [ ] 2 sessions actives créées
- [ ] Bouton "Déconnexion tous devices" trouvé
- [ ] Requête `/api/auth/logout-all` → 200 OK
- [ ] Device 1: Déconnecté après refresh
- [ ] Device 2: Déconnecté
- [ ] Tous tokens supprimés en DB

### Vérification Backend
```sql
SELECT * FROM personal_access_tokens 
WHERE tokenable_id = [student_id];
-- Résultat attendu: 0 rows
```

**Résultat SQL**:
```
[Votre résultat ici]
```

### Bugs Trouvés
```
1. 
```

---

## 🧪 TEST 5: Single Device Enforcement

**Date**: [Date]  
**Navigateurs**: [Device A] + [Device B]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Configuration
- Device A: [Chrome normal]
- Device B: [Firefox]
- User: [Étudiant 0612345678]

### Étapes Testées

1. **Login Device A**
   - [ ] Login réussi
   - [ ] `device_uuid_A`: `[noter ici]`
   - [ ] Dashboard accessible

2. **Login Device B (même user)**
   - [ ] Login réussi
   - [ ] `device_uuid_B`: `[noter ici]`
   - [ ] Nouveau token généré

3. **Vérification Device A**
   - [ ] Rafraîchir page
   - [ ] **Déconnecté automatiquement**
   - [ ] Redirection vers `/login`
   - [ ] Message affiché: "Nouvelle session ouverte..."

4. **Vérification Backend**
```sql
SELECT name, created_at FROM personal_access_tokens 
WHERE tokenable_id = [student_id]
ORDER BY created_at DESC;
-- Résultat attendu: 1 seul token (Device B)
```

**Résultat SQL**:
```
[Nombre de tokens]: 
[device_uuid du token actif]: 
```

### Test Inverse
- [ ] Device A re-login → Device B déconnecté

### Bugs Trouvés
```
1. 
```

---

## 🧪 TEST 6: Force Device Change

**Date**: [Date]  
**Navigateur**: [Chrome]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Étapes

1. **Login initial**
   - `device_uuid_A`: `[noter]`

2. **Changement manuel device_uuid**
```javascript
// Exécuté dans Console DevTools
const newUuid = crypto.randomUUID();
localStorage.setItem('device_uuid', newUuid);
console.log('New device_uuid:', newUuid);
```
   - `device_uuid_NEW`: `[noter]`

3. **Rafraîchir page**
   - [ ] Option A: Token mis à jour (200 OK)
   - [ ] Option B: Déconnexion (401 Unauthorized)
   - [ ] Log backend: "Device change detected"

**Comportement observé**: 
```
[Décrire ce qui s'est passé]
```

### Bugs Trouvés
```
1. 
```

---

## 🧪 TEST 7: Multiple Login Attempts - Même Device

**Date**: [Date]  
**Navigateur**: [Chrome]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Étapes

1. **Login 1**
   - `token_1`: `[noter premiers 20 chars]`
   - `device_uuid`: `[noter]`

2. **Clear LocalStorage + Login 2**
```javascript
localStorage.clear();
// Puis login à nouveau
```
   - `token_2`: `[noter premiers 20 chars]`

3. **Vérification**
```sql
SELECT id, name, created_at FROM personal_access_tokens 
WHERE tokenable_id = [student_id]
ORDER BY created_at DESC;
```

**Nombre de tokens**: `[1 ou 2?]`  
**Tokens valides**: `[token_1, token_2, ou seulement token_2?]`

### Bugs Trouvés
```
1. 
```

---

## 🧪 TEST 8: Multiple Login - Devices Différents

**Date**: [Date]  
**Navigateurs**: [3 browsers]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Scénario ADMIN (multi-device autorisé)

#### Configuration
- Device 1: [Chrome]
- Device 2: [Firefox]
- Device 3: [Chrome Incognito]
- User: Admin 0600000000

#### Vérifications
- [ ] Device 1: Dashboard accessible
- [ ] Device 2: Dashboard accessible
- [ ] Device 3: Dashboard accessible
- [ ] 3 tokens actifs en DB

```sql
SELECT name, created_at FROM personal_access_tokens 
WHERE tokenable_id = [admin_id]
ORDER BY created_at DESC;
```

**Nombre de tokens**: `[3?]`

### Scénario ÉTUDIANT (single-device seulement)

#### Configuration
- Device 1: [Chrome]
- Device 2: [Firefox]
- User: Étudiant 0612345678

#### Vérifications
- [ ] Device 1 login → OK
- [ ] Device 2 login → OK
- [ ] Device 1 refresh → **Déconnecté**
- [ ] 1 seul token en DB

**Nombre de tokens étudiant**: `[1?]`

### Bugs Trouvés
```
1. 
```

---

## 🧪 TEST 9: Token Expiration Handling

**Date**: [Date]  
**Navigateur**: [Chrome]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Configuration
```php
// backend/config/sanctum.php (modifié pour test)
'expiration' => 1, // 1 minute
```

**Config cache cleared**: [ ] Oui / [ ] Non

### Étapes

1. **Login**
   - Heure login: `[HH:MM:SS]`

2. **Attente 2 minutes** ⏱️
   - Heure après attente: `[HH:MM:SS]`

3. **Action API** (charger sessions)
   - [ ] Status: 401 Unauthorized
   - [ ] Message: "Unauthenticated" ou "Token expired"

4. **Frontend**
   - [ ] Axios interceptor détecte 401
   - [ ] LocalStorage nettoyé
   - [ ] Redirection `/login`
   - [ ] Message: "Session expirée..."

### Bugs Trouvés
```
1. 
```

**Note**: Remettre `'expiration' => null` après test!

---

## 🧪 TEST 10: QR Token (UUID Permanent)

**Date**: [Date]  
**Navigateur**: [Chrome]  
**Résultat**: ⏳ NON TESTÉ / ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Vérifications

1. **Login initial**
```json
// Response login
{
  "user": {
    "uuid": "[noter]",
    "qr_token": "[noter]"
  }
}
```
   - `uuid`: `[noter]`
   - `qr_token`: `[noter]`
   - [ ] `uuid` === `qr_token`

2. **Page profil `/student/profile`**
   - [ ] QR Code affiché
   - [ ] Contenu QR = `user.uuid`

3. **Scanner QR Code**
   - Contenu scanné: `[noter]`
   - [ ] Contenu === `user.uuid`

4. **Logout + Re-login**
   - Nouveau `uuid`: `[noter]`
   - Nouveau `qr_token`: `[noter]`
   - [ ] Identique au login initial (JAMAIS change)

### Bugs Trouvés
```
1. 
```

---

## 📊 Résumé Final

### Tests Réussis ✅
```
1. [TEST X]: [Description]
2. 
3. 
```

### Tests Échoués ❌
```
1. [TEST X]: [Description] - [Raison]
2. 
```

### Tests Partiels ⚠️
```
1. [TEST X]: [Description] - [Raison]
2. 
```

---

## 🐛 Liste Complète des Bugs

### Bug #1
**Sévérité**: 🔴 Critique / 🟡 Modérée / 🟢 Mineure  
**Test**: [Numéro du test]  
**Description**: [Description détaillée]  
**Steps to Reproduce**:
1. 
2. 

**Expected**: [Comportement attendu]  
**Actual**: [Comportement observé]  
**Screenshot**: [Lien]

---

### Bug #2
[Même template]

---

## ✅ Recommandations

### Corrections Urgentes
```
1. [Si bugs critiques trouvés]
2. 
```

### Améliorations Suggérées
```
1. [Améliorer UX, messages, etc.]
2. 
```

### Tests Additionnels
```
1. [Autres scénarios à tester]
2. 
```

---

## 📝 Conclusion

**Phase 7.1 Status**: ⏳ En cours / ✅ Complète / ❌ Bloquée

**Prêt pour Phase 7.2**: [ ] Oui / [ ] Non (bugs à corriger)

**Date de complétion**: [Date]  
**Temps total**: [X heures]

**Signature**: [Testeur]
