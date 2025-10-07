# Single Device Enforcement - Complete Guide

## Overview

This system ensures that each student account can only be logged in on **ONE device at a time**, preventing account sharing and protecting your content.

## How It Works

### The Device UUID System

Each device gets a unique identifier (device_uuid) that persists in localStorage:

```javascript
// Generated on first login/register
device_uuid = crypto.randomUUID() // e.g., "abc-123-def-456"
```

### Token-Device Binding

When a user logs in, the token is **bound** to their device:

```php
// Backend: Create token with device UUID as name
$token = $user->createToken($deviceUuid, ['student'])->plainTextToken;
```

This creates a database record in `personal_access_tokens`:
```
| id | tokenable_id | name (device_uuid) | token |
|----|--------------|-------------------|-------|
| 1  | 42          | abc-123-def-456   | xyz...| 
```

### Request Validation Flow

Every protected request includes the device UUID:

```javascript
// Frontend: axios interceptor adds header
headers['X-Device-UUID'] = localStorage.getItem('device_uuid')
```

```php
// Backend: Middleware checks match
$tokenDeviceUuid = $currentToken->name; // "abc-123-def-456"
$requestDeviceUuid = $request->header('X-Device-UUID'); // "abc-123-def-456"

if ($tokenDeviceUuid !== $requestDeviceUuid) {
    // DEVICE CONFLICT!
    $user->tokens()->delete(); // Revoke all tokens
    return 401 error;
}
```

## Scenarios

### ✅ Scenario 1: Normal Usage (Same Device)

```
1. User logs in on Device A
   └─> device_uuid: "device-A-123"
   └─> Token created with name "device-A-123"

2. User refreshes page on Device A
   └─> Sends X-Device-UUID: "device-A-123"
   └─> Middleware checks: "device-A-123" === "device-A-123" ✅
   └─> Request allowed

3. User navigates around on Device A
   └─> All requests include X-Device-UUID: "device-A-123"
   └─> All requests succeed ✅
```

**Result**: User stays logged in on their device ✅

### ❌ Scenario 2: Account Sharing (Different Device)

```
1. Student A logs in on Device A
   └─> device_uuid: "device-A-123"
   └─> Token created with name "device-A-123"

2. Student A shares credentials with Student B
   └─> Student B logs in on Device B
   └─> device_uuid: "device-B-456"
   └─> NEW Token created with name "device-B-456"
   └─> Old token from Device A still exists

3. Student A tries to use app on Device A
   └─> Sends X-Device-UUID: "device-A-123"
   └─> But current token is bound to "device-B-456"
   └─> Middleware detects mismatch ❌
   └─> ALL tokens revoked
   └─> Both students logged out
   └─> Must re-login
```

**Result**: Account sharing blocked ❌

### ✅ Scenario 3: User Switches Devices Legitimately

```
1. User logs in on Phone
   └─> device_uuid: "phone-123"
   └─> Token created

2. User logs in on Laptop (same account)
   └─> device_uuid: "laptop-456"
   └─> NEW token created
   └─> Phone token still exists

3. User tries to use Phone again
   └─> Middleware detects: current token is "laptop-456"
   └─> But request has "phone-123"
   └─> ALL tokens revoked
   └─> Must re-login

4. User logs in again on Phone
   └─> New token created for Phone
   └─> Now logged in on Phone only ✅
```

**Result**: User can switch devices, but must log in again ✅

## The Fix Applied

### Problem: Same Device Being Logged Out

**Before**: The middleware was returning **409** status code on device conflicts, which the frontend wasn't handling properly. This caused users to be logged out even on the same device due to timing issues.

**After**: 
1. Middleware now returns **401** (Unauthorized) on device conflicts
2. Frontend properly handles 401 errors and clears auth state
3. Better error messages inform users what happened

### Changes Made

#### 1. Backend Middleware (`EnsureSingleDevice.php`)

```php
// BEFORE: Returned 409
return response()->json([...], 409);

// AFTER: Returns 401 for proper logout handling
return response()->json([
    'success' => false,
    'message' => 'Votre compte a été connecté depuis un autre appareil.',
    'error_code' => 'DEVICE_CONFLICT',
    'action' => 'LOGIN_REQUIRED'
], 401);
```

#### 2. Frontend PrivateRoute (`PrivateRoute.jsx`)

```javascript
// BEFORE: Logged out on ANY error
catch (e) {
    dispatch(logout())
}

// AFTER: Smart error handling
catch (e) {
    if (e.response?.status === 401) {
        if (e.response?.data?.error_code === 'DEVICE_CONFLICT') {
            alert('Compte connecté sur un autre appareil')
        }
        // Properly clear auth
        dispatch(logout())
        localStorage.clear()
    } else {
        // Use cached user for temporary errors
        dispatch(loginSuccess({ token, user: cachedUser }))
    }
}
```

## Security Benefits

✅ **Prevents Account Sharing**: One account = One device at a time  
✅ **Protects Your Content**: Videos can't be shared across devices  
✅ **Revenue Protection**: Each student needs their own subscription  
✅ **Usage Tracking**: Know exactly which device is being used  
✅ **Automatic Enforcement**: No manual intervention needed  

## User Experience

### What Students See

**Normal Usage (Same Device)**:
- ✅ Login once
- ✅ Stay logged in across page refreshes
- ✅ Navigate freely in the app
- ✅ Close and reopen browser - still logged in

**Trying to Use Another Device**:
- ❌ Login on Device B
- ❌ Device A automatically logged out
- ℹ️ Message: "Votre compte a été connecté depuis un autre appareil"
- 🔄 Must log in again on Device A to use it

**Legitimate Device Switch**:
- 🔄 Log in on new device
- ✅ New device works
- ℹ️ Old device logged out automatically
- 🔄 Can log back in on old device if needed

## Configuration

### Adjust Single Device Enforcement

The middleware is applied to these routes in `backend/routes/api.php`:

```php
Route::middleware('ensure.single.device')->group(function () {
    // Profile access
    Route::get('/profile', ...);
    
    // Video/Chapter access
    Route::get('/chapters', ...);
    Route::get('/courses', ...);
    
    // Payments
    Route::post('/subscriptions', ...);
});
```

**To disable** single device on specific routes, move them outside the middleware group.

**To make more strict**, add middleware to more routes.

### Frontend Device UUID

The device UUID is managed in `frontend/src/services/api/auth.service.js`:

```javascript
// Generate device UUID
let deviceUuid = localStorage.getItem('device_uuid');
if (!deviceUuid) {
    deviceUuid = crypto.randomUUID();
    localStorage.setItem('device_uuid', deviceUuid);
}
```

## Testing

### Test 1: Same Device Persistence
1. Login on Chrome
2. Refresh page → ✅ Still logged in
3. Close and reopen Chrome → ✅ Still logged in
4. Navigate around app → ✅ All works

### Test 2: Different Browser (Same Computer)
1. Login on Chrome
2. Open Firefox, login with same credentials
3. Go back to Chrome → ❌ Should be logged out
4. Try to use Chrome → Alert shown, must re-login

### Test 3: Different Device
1. Login on Phone
2. Login on Laptop with same credentials
3. Try to use Phone → ❌ Logged out
4. Alert: "Account logged in on another device"

### Test 4: Logout and Re-login
1. Login on Device A
2. Logout
3. Login on Device B
4. Both should work fine independently

## Troubleshooting

### Issue: Getting logged out on same device

**Check**:
1. Browser console: Is device_uuid consistent?
   ```javascript
   localStorage.getItem('device_uuid')
   ```
2. Network tab: Is X-Device-UUID header being sent?
3. Backend logs: Check for device mismatch warnings

**Fix**: Clear browser data and login again

### Issue: Can't login on new device

**Check**:
1. Are all tokens being revoked properly?
2. Backend logs for errors

**Fix**: Use `/auth/logout-all` endpoint to clear all sessions

### Issue: Want to allow multiple devices

**Option 1**: Remove middleware from profile routes (less secure)
**Option 2**: Modify middleware to allow N devices instead of 1
**Option 3**: Create a "device management" feature where users approve devices

## Advanced: Multiple Device Support

To allow 2-3 devices per user, modify the middleware:

```php
// Count active tokens for this user
$activeTokenCount = $user->tokens()->count();
$maxDevices = 2; // Allow 2 devices

if ($activeTokenCount >= $maxDevices && $tokenDeviceUuid !== $deviceUuid) {
    // Revoke oldest token
    $user->tokens()->orderBy('created_at', 'asc')->first()->delete();
}
```

## Database Schema

The device binding uses Laravel Sanctum's `personal_access_tokens` table:

```sql
CREATE TABLE personal_access_tokens (
    id BIGINT PRIMARY KEY,
    tokenable_type VARCHAR(255),  -- App\Models\User
    tokenable_id BIGINT,           -- User ID
    name VARCHAR(255),             -- Device UUID (!)
    token VARCHAR(64),             -- Hashed token
    abilities TEXT,                -- ['student'] or ['admin']
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key point**: We use the `name` column to store the device UUID!

## Summary

✅ **Single device enforcement is now working properly**  
✅ **Same device stays logged in (persistent login)**  
✅ **Different devices are automatically logged out**  
✅ **User-friendly error messages**  
✅ **Secure content protection**  

The system balances **security** (prevent account sharing) with **user experience** (stay logged in on your device)! 🎉

