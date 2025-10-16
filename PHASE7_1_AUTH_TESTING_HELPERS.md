# Phase 7.1 - Commandes & Scripts Utiles pour Tests

**Purpose**: Aide-mémoire pour faciliter les tests d'authentification

---

## 🔧 Commandes Backend

### Voir les Logs en Temps Réel
```bash
cd backend
tail -f storage/logs/laravel.log
```

### Vérifier Tokens dans la Base de Données

#### Laravel Tinker
```bash
cd backend
php artisan tinker
```

```php
// Dans Tinker:

// Voir tous les tokens
DB::table('personal_access_tokens')->get();

// Voir tokens d'un utilisateur spécifique (par ID)
DB::table('personal_access_tokens')->where('tokenable_id', 1)->get();

// Voir tokens d'un utilisateur (par email/phone)
$user = \App\Models\User::where('phone', '0600000000')->first();
$user->tokens;

// Compter tokens par utilisateur
DB::table('personal_access_tokens')
    ->select('tokenable_id', DB::raw('count(*) as token_count'))
    ->groupBy('tokenable_id')
    ->get();

// Voir détails d'un token
DB::table('personal_access_tokens')->find(1);

// Supprimer tous les tokens (RESET complet)
DB::table('personal_access_tokens')->truncate();

// Supprimer tokens d'un utilisateur
DB::table('personal_access_tokens')->where('tokenable_id', 1)->delete();

// Vérifier expiration
DB::table('personal_access_tokens')
    ->select('id', 'name', 'created_at', 'last_used_at', 'expires_at')
    ->get();
```

### Créer un Utilisateur de Test

```bash
php artisan tinker
```

```php
// Créer étudiant
$student = \App\Models\User::create([
    'firstname' => 'Test',
    'lastname' => 'Student',
    'phone' => '0612345678',
    'password' => \Hash::make('Student@123'),
    'birth_date' => '2000-01-01',
    'address' => '123 Test Street',
    'school_name' => 'Test School',
    'role' => 'student',
    'year_of_study' => '1BAC',
    'branch_id' => 1,
]);

echo "Student created: {$student->uuid}";

// Créer admin
$admin = \App\Models\User::create([
    'firstname' => 'Admin',
    'lastname' => 'Test',
    'phone' => '0600000000',
    'password' => \Hash::make('Admin@123'),
    'birth_date' => '1990-01-01',
    'address' => 'Admin Address',
    'school_name' => 'Admin School',
    'role' => 'admin',
]);

echo "Admin created: {$admin->uuid}";
```

### Modifier Expiration des Tokens (pour test)

```bash
# Éditer config
nano config/sanctum.php

# Chercher 'expiration' et modifier
'expiration' => 1, // 1 minute pour test rapide

# Sauvegarder et clear cache
php artisan config:cache
```

**IMPORTANT**: Remettre à `null` après tests!

### Clear Cache

```bash
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

---

## 💻 Scripts Frontend (DevTools Console)

### Voir État Actuel

```javascript
// Voir toutes les données auth
console.log('=== AUTH STATE ===');
console.log('Token:', localStorage.getItem('auth_token'));
console.log('Device UUID:', localStorage.getItem('device_uuid'));
console.log('User:', JSON.parse(localStorage.getItem('auth_user') || 'null'));

// Version formatée
const authState = {
  token: localStorage.getItem('auth_token')?.substring(0, 20) + '...',
  deviceUuid: localStorage.getItem('device_uuid'),
  user: JSON.parse(localStorage.getItem('auth_user') || 'null')
};
console.table(authState);
```

### Clear Session

```javascript
// Déconnexion manuelle (sans API call)
localStorage.clear();
sessionStorage.clear();
console.log('✅ Session cleared');

// Recharger page
window.location.reload();
```

### Changer Device UUID Manuellement

```javascript
// Simuler changement d'appareil
const newUuid = crypto.randomUUID();
localStorage.setItem('device_uuid', newUuid);
console.log('✅ New device_uuid:', newUuid);
console.log('Ancien token toujours présent:', !!localStorage.getItem('auth_token'));
console.log('Rafraîchissez la page pour tester le middleware');
```

### Test API Manual

```javascript
// Tester un endpoint avec le token actuel
const testApi = async (endpoint) => {
  const token = localStorage.getItem('auth_token');
  const deviceUuid = localStorage.getItem('device_uuid');
  
  console.log(`Testing: ${endpoint}`);
  console.log('Token:', token?.substring(0, 20) + '...');
  console.log('Device UUID:', deviceUuid);
  
  const response = await fetch(`http://localhost:8000${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Device-UUID': deviceUuid,
      'Accept': 'application/json'
    }
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', data);
  return data;
};

// Usage
await testApi('/api/auth/user');
await testApi('/api/sessions');
await testApi('/api/dashboard');
```

### Simuler Token Expiré

```javascript
// Changer le token pour un token invalide
localStorage.setItem('auth_token', 'invalid_token_123456789');
console.log('✅ Token modifié pour test');
console.log('Tentez une action API pour voir la gestion 401');
```

### Monitor Network Requests

```javascript
// Intercepter toutes les requêtes fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 Fetch:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('✅ Response:', response.status, args[0]);
      return response;
    })
    .catch(error => {
      console.error('❌ Error:', args[0], error);
      throw error;
    });
};

console.log('✅ Fetch interceptor installé');
```

---

## 🔍 SQL Queries Utiles

### Voir Tous les Tokens Actifs

```sql
SELECT 
    pat.id,
    pat.tokenable_id,
    u.phone,
    u.role,
    pat.name as device_uuid,
    pat.created_at,
    pat.last_used_at,
    pat.expires_at
FROM personal_access_tokens pat
JOIN users u ON pat.tokenable_id = u.id
ORDER BY pat.created_at DESC;
```

### Trouver Tokens d'un Utilisateur

```sql
-- Par téléphone
SELECT pat.*, u.phone, u.firstname
FROM personal_access_tokens pat
JOIN users u ON pat.tokenable_id = u.id
WHERE u.phone = '0600000000';

-- Par UUID
SELECT pat.*, u.phone, u.firstname
FROM personal_access_tokens pat
JOIN users u ON pat.tokenable_id = u.id
WHERE u.uuid = '550e8400-e29b-41d4-a716-446655440000';
```

### Statistiques Tokens

```sql
-- Tokens par rôle
SELECT u.role, COUNT(pat.id) as token_count
FROM personal_access_tokens pat
JOIN users u ON pat.tokenable_id = u.id
GROUP BY u.role;

-- Tokens par device UUID
SELECT name as device_uuid, COUNT(*) as count
FROM personal_access_tokens
GROUP BY name
HAVING count > 1; -- Trouve devices avec multiple tokens

-- Tokens créés aujourd'hui
SELECT COUNT(*) as tokens_today
FROM personal_access_tokens
WHERE DATE(created_at) = CURRENT_DATE;
```

### Clean Up

```sql
-- Supprimer tokens expirés (si expiration activée)
DELETE FROM personal_access_tokens
WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();

-- Supprimer tokens non utilisés depuis 30 jours
DELETE FROM personal_access_tokens
WHERE last_used_at IS NOT NULL 
  AND last_used_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Supprimer TOUS les tokens (RESET complet)
TRUNCATE TABLE personal_access_tokens;
```

---

## 🧪 Scripts de Test Automatisés

### Script PowerShell: Test Login

Créer `test-login.ps1`:

```powershell
# Test Login API
$baseUrl = "http://localhost:8000"
$phone = "0600000000"
$password = "Admin@123"

$body = @{
    login = $phone
    password = $password
    device_uuid = [guid]::NewGuid().ToString()
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "$baseUrl/api/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host "Token: $($response.data.token.Substring(0,20))..."
Write-Host "User: $($response.data.user.firstname) ($($response.data.user.role))"
Write-Host "Device UUID: $($response.data.device_uuid)"

# Sauvegarder pour autres tests
$env:AUTH_TOKEN = $response.data.token
$env:DEVICE_UUID = $response.data.device_uuid
```

Exécuter:
```powershell
.\test-login.ps1
```

### Script PowerShell: Test Multiple Devices

Créer `test-multi-device.ps1`:

```powershell
$baseUrl = "http://localhost:8000"
$phone = "0612345678"  # Étudiant
$password = "Student@123"

# Device 1
$device1 = [guid]::NewGuid().ToString()
$body1 = @{ login = $phone; password = $password; device_uuid = $device1 } | ConvertTo-Json
$resp1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body1 -ContentType "application/json"
Write-Host "Device 1 login: ✅" -ForegroundColor Green
$token1 = $resp1.data.token

Start-Sleep -Seconds 2

# Device 2 (doit invalider Device 1)
$device2 = [guid]::NewGuid().ToString()
$body2 = @{ login = $phone; password = $password; device_uuid = $device2 } | ConvertTo-Json
$resp2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body2 -ContentType "application/json"
Write-Host "Device 2 login: ✅" -ForegroundColor Green
$token2 = $resp2.data.token

# Test Device 1 token (doit échouer)
try {
    $headers = @{ 
        Authorization = "Bearer $token1"
        "X-Device-UUID" = $device1
    }
    Invoke-RestMethod -Uri "$baseUrl/api/auth/user" -Headers $headers
    Write-Host "❌ Device 1 still active (FAIL)" -ForegroundColor Red
} catch {
    Write-Host "✅ Device 1 invalidated (PASS)" -ForegroundColor Green
}

# Test Device 2 token (doit réussir)
try {
    $headers = @{ 
        Authorization = "Bearer $token2"
        "X-Device-UUID" = $device2
    }
    $user = Invoke-RestMethod -Uri "$baseUrl/api/auth/user" -Headers $headers
    Write-Host "✅ Device 2 active (PASS)" -ForegroundColor Green
} catch {
    Write-Host "❌ Device 2 failed (FAIL)" -ForegroundColor Red
}
```

---

## 📊 Monitoring en Temps Réel

### Terminal 1: Backend Logs
```bash
cd backend
tail -f storage/logs/laravel.log | grep -i "login\|logout\|device\|token"
```

### Terminal 2: Database Monitor

```bash
# Watch tokens table (Linux/Mac)
watch -n 2 'mysql -u root -p -e "SELECT COUNT(*) FROM alouaoui_school.personal_access_tokens"'

# PowerShell version
while ($true) {
    Clear-Host
    php artisan tinker --execute="echo DB::table('personal_access_tokens')->count();"
    Start-Sleep -Seconds 2
}
```

### Terminal 3: Network Monitor

```bash
# Avec tcpdump (Linux)
sudo tcpdump -i lo port 8000

# Avec Wireshark (Windows)
# Filtrer: tcp.port == 8000
```

---

## 🎯 Checklist Rapide de Test

Copier-coller dans terminal pour test rapide:

```bash
# Backend: Voir tokens
php artisan tinker --execute="DB::table('personal_access_tokens')->count()"

# Backend: Clear tous tokens
php artisan tinker --execute="DB::table('personal_access_tokens')->truncate()"

# Frontend: Test token validity
curl http://localhost:8000/api/auth/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Device-UUID: YOUR_DEVICE_UUID"
```

---

## 🔐 Credentials de Test

### Comptes Existants

```
Admin:
  Phone: 0600000000
  Password: Admin@123
  Role: admin

Étudiant 1:
  Phone: 0612345678
  Password: Student@123
  Role: student
  (À créer si n'existe pas)
```

### Créer Rapidement un Étudiant de Test

```bash
php artisan tinker
```

```php
\App\Models\User::create([
    'firstname' => 'Test',
    'lastname' => 'Étudiant',
    'phone' => '0612345678',
    'password' => \Hash::make('Student@123'),
    'birth_date' => '2000-01-01',
    'address' => 'Test Address',
    'school_name' => 'Test School',
    'role' => 'student',
    'year_of_study' => '1BAC',
    'branch_id' => 1,
]);
```

---

## 📝 Notes Importantes

1. **Device UUID**: 
   - Généré automatiquement par frontend si non fourni
   - Stocké dans LocalStorage: `device_uuid`
   - Utilisé comme `name` du token Sanctum

2. **Single Device**:
   - Admin: **Multiple devices** autorisés
   - Student: **Single device** seulement
   - Middleware: `EnsureSingleDevice`

3. **Token Expiration**:
   - Default: `null` (jamais expire)
   - Config: `config/sanctum.php`
   - Pour test: Mettre à `1` minute

4. **QR Token**:
   - QR Token = User UUID
   - **NE CHANGE JAMAIS**
   - Pas de "regeneration"

---

## 🚀 Quick Start

1. **Démarrer backend**:
   ```bash
   cd backend
   php artisan serve
   ```

2. **Démarrer frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Ouvrir DevTools** (F12)

4. **Login** et suivre guide de test: `PHASE7_1_AUTH_TESTING_MANUAL.md`

5. **Remplir rapport**: `PHASE7_1_AUTH_TESTING_REPORT.md`

---

**Bonne chance avec les tests! 🎯**
