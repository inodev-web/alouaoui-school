# Debug Instructions - Please Follow These Steps

## What We're Debugging

The issue is that you're being logged out immediately after login. We've added extensive logging to find the exact cause.

## Steps to Debug

### 1. Clear Everything First
1. Open browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. **Delete all items** (right-click → Clear)
4. **Close** all browser tabs
5. **Reopen** the app in a new tab

### 2. Attempt to Register (Fresh)
1. Go to `/register`
2. Fill in all fields with **new data** (new phone number)
3. **Before clicking register**, open Console tab (F12)
4. Click "Register"
5. **Copy ALL console output** and send it to me

### 3. Check What's in localStorage After Register
After registration attempt, in Console tab, run:
```javascript
console.log({
  token: localStorage.getItem('token'),
  device_uuid: localStorage.getItem('device_uuid'),
  user: localStorage.getItem('user')
})
```
**Copy the output** and send it to me

### 4. Check the Backend Logs
Open `backend/storage/logs/laravel.log` and look for the **LAST 50 lines**. Send them to me.

Or run this command in terminal:
```bash
cd backend
php artisan log:tail
```

## What We're Looking For

The console logs will show:
- 🔍 What device_uuid is in localStorage when app loads
- 📤 What device_uuid is sent in the API request header
- 📥 What the backend returns
- ❌ Any errors from the backend

The backend logs will show:
- What device_uuid the backend receives in the header
- What device_uuid is stored in the token's name
- If there's a mismatch

## Expected Flow (Should Work)

```
Registration:
1. Generate device_uuid: "abc-123"
2. Send to backend
3. Backend creates token with name "abc-123"
4. Save token and device_uuid to localStorage

Page Load:
1. Read device_uuid from localStorage: "abc-123"
2. Read token from localStorage
3. Send request with X-Device-UUID: "abc-123"
4. Backend checks: token.name ("abc-123") == header ("abc-123") ✅
5. Profile loaded successfully
```

## Actual Problem (What's Happening)

```
Registration:
1. Generate device_uuid: "abc-123"
2. Backend creates token with name "abc-123"
3. Save to localStorage ✅

Page Load:
1. Read device_uuid from localStorage: "xyz-789" ❌ (DIFFERENT!)
2. Send request with X-Device-UUID: "xyz-789"
3. Backend checks: token.name ("abc-123") != header ("xyz-789") ❌
4. Returns 401 error
5. Everything cleared
```

## Please Send Me

1. **Console output** from registration attempt
2. **localStorage contents** after registration
3. **Backend log** (last 50 lines from laravel.log)

This will tell me exactly what's going wrong!

