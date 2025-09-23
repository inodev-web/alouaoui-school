# 🛡️ Phase 5 - Middlewares Testing Guide

## ✅ Implemented Middlewares

### 1. **EnsureSingleDevice** - Device Session Management
- **Purpose**: Ensures only one active session per user device
- **Behavior**: Revokes old tokens when same device logs in again
- **Applied to**: All authenticated routes

### 2. **EnsureSubscription** - Access Control for Premium Content
- **Purpose**: Verifies active subscription before accessing video/live content
- **Behavior**: Blocks access to chapters without valid subscription
- **Applied to**: Chapter access and streaming routes

### 3. **ScannerLock** - QR Scan Concurrency Control
- **Purpose**: Prevents concurrent QR scans using Redis locks
- **Behavior**: Locks scanner during QR processing to prevent duplicates
- **Applied to**: QR checkin routes

## 🧪 Testing Scenarios

### Test 1: Single Device Enforcement

```bash
# 1. Login with device A
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "student123",
    "device_uuid": "device-001"
  }'
# Save the token as TOKEN_A

# 2. Test that TOKEN_A works
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:8000/api/auth/profile

# 3. Login again with same device (should revoke TOKEN_A)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "student123",
    "device_uuid": "device-001"
  }'
# Save the new token as TOKEN_B

# 4. Test that TOKEN_A is now invalid
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:8000/api/auth/profile
# Should return 401 Unauthorized

# 5. Test that TOKEN_B still works
curl -H "Authorization: Bearer TOKEN_B" \
  http://localhost:8000/api/auth/profile
# Should return user profile
```

### Test 2: Subscription Enforcement

```bash
# 1. Login as student
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "student123",
    "device_uuid": "test-device"
  }'
# Save token as STUDENT_TOKEN

# 2. Try to access chapter without subscription
curl -H "Authorization: Bearer STUDENT_TOKEN" \
  http://localhost:8000/api/chapters/1
# Should return 403 - Subscription required

# 3. Login as admin to create subscription
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alouaoui-school.com",
    "password": "admin123",
    "device_uuid": "admin-device"
  }'
# Save token as ADMIN_TOKEN

# 4. Create subscription for student
curl -X POST http://localhost:8000/api/subscriptions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "chapter_id": 1,
    "access_level": "full"
  }'

# 5. Now student can access the chapter
curl -H "Authorization: Bearer STUDENT_TOKEN" \
  http://localhost:8000/api/chapters/1
# Should return chapter details
```

### Test 3: Scanner Lock (QR Concurrency)

```bash
# 1. Login as admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alouaoui-school.com",
    "password": "admin123",
    "device_uuid": "admin-scanner"
  }'
# Save token as ADMIN_TOKEN

# 2. Create a session first
curl -X POST http://localhost:8000/api/admin/checkins/sessions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chapter_id": 1,
    "session_date": "2025-09-23",
    "start_time": "10:00:00",
    "end_time": "11:30:00"
  }'

# 3. Simulate concurrent QR scans (run these simultaneously)
# Terminal 1:
curl -X POST http://localhost:8000/api/admin/checkins/scan \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qr_token": "student_qr_token_here",
    "session_id": 1
  }'

# Terminal 2 (should be blocked):
curl -X POST http://localhost:8000/api/admin/checkins/scan \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qr_token": "another_qr_token",
    "session_id": 1
  }'
# Second request should wait or return "Scanner busy"
```

## 🔧 Configuration Files Updated

### 1. Bootstrap Configuration (`bootstrap/app.php`)
```php
// Middleware aliases registered:
'single.device' => \App\Http\Middleware\EnsureSingleDevice::class,
'subscription' => \App\Http\Middleware\EnsureSubscription::class,
'scanner.lock' => \App\Http\Middleware\ScannerLock::class,
```

### 2. Route Middleware Applied (`routes/api.php`)
```php
// All authenticated routes use single device enforcement
Route::middleware(['auth:sanctum', 'single.device'])->group(function () {
    // Profile routes
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    
    // Chapter routes with subscription check
    Route::middleware('subscription')->group(function () {
        Route::get('/chapters/{id}', [ChapterController::class, 'show']);
        Route::get('/chapters/{id}/stream-token', [ChapterController::class, 'streamToken']);
    });
    
    // Scanner routes with lock
    Route::middleware('scanner.lock')->group(function () {
        Route::post('/admin/checkins/scan', [CheckinController::class, 'scanQr']);
    });
});
```

## 🔍 Error Messages and Responses

### Single Device Violations:
```json
{
  "error": "Device session invalid",
  "message": "This device session has been replaced by a newer login",
  "code": 401
}
```

### Subscription Violations:
```json
{
  "error": "Subscription required",
  "message": "Active subscription required to access this content",
  "code": 403
}
```

### Scanner Lock Conflicts:
```json
{
  "error": "Scanner busy",
  "message": "Another scan operation is in progress. Please wait.",
  "code": 423
}
```

## 🚀 Production Considerations

### Redis Configuration
```env
# Add to .env file
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
```

### Performance Monitoring
- Monitor Redis lock timeouts
- Track device session conflicts
- Monitor subscription check performance
- Log concurrent scan attempts

### Security Best Practices
- Device UUIDs should be cryptographically secure
- Subscription checks should be cached for performance
- Scanner locks should have reasonable timeouts
- Failed authentication attempts should be logged

## ✅ Middleware Features Summary

| Middleware | Purpose | Redis Used | Performance Impact | Security Level |
|------------|---------|------------|-------------------|----------------|
| EnsureSingleDevice | Device session control | No | Low | High |
| EnsureSubscription | Content access control | No | Medium | High |
| ScannerLock | Concurrency control | Yes | Low | Medium |

**Status: Phase 5 Middlewares COMPLETE ✅**

All three middlewares are implemented and ready for production use!