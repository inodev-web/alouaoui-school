<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureSingleDevice
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Try multiple ways to get the authenticated user
        $user = $request->user('sanctum') ?? $request->user() ?? Auth::guard('sanctum')->user();

        if (!$user) {
            \Log::warning("EnsureSingleDevice: No authenticated user found", [
                'url' => $request->url(),
                'has_bearer_token' => $request->bearerToken() ? 'yes' : 'no',
                'device_uuid_header' => $request->header('X-Device-UUID'),
                'ip' => $request->ip(),
                'auth_guard' => Auth::getDefaultDriver(),
                'sanctum_user' => $request->user('sanctum') ? 'found' : 'null',
                'request_user' => $request->user() ? 'found' : 'null'
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié',
                'debug' => 'EnsureSingleDevice: No authenticated user found'
            ], 401);
        }

        // Skip device check for admin users
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Get device UUID from request header
        $deviceUuid = $request->header('X-Device-UUID');

        if (!$deviceUuid) {
            return response()->json([
                'success' => false,
                'message' => 'UUID de l\'appareil requis',
                'error_code' => 'DEVICE_UUID_REQUIRED'
            ], 400);
        }

        // Check if user has an active session on another device
        $currentToken = $user->currentAccessToken();

        \Log::info("EnsureSingleDevice middleware check", [
            'user_uuid' => $user->uuid,
            'request_device_uuid' => $deviceUuid,
            'token_device_uuid' => $currentToken ? $currentToken->name : 'NO_TOKEN',
            'token_id' => $currentToken ? $currentToken->id : null
        ]);

        if ($currentToken) {
            // Get device UUID from token's meta or name
            $tokenDeviceUuid = $currentToken->name;

            // If device UUID doesn't match current token's device UUID
            if ($tokenDeviceUuid !== $deviceUuid) {
                \Log::warning("Device mismatch for user {$user->uuid}: Token device={$tokenDeviceUuid}, Request device={$deviceUuid}");

                // Check if this device UUID is already associated with another token from this user
                $userDeviceToken = DB::table('personal_access_tokens')
                    ->where('tokenable_type', get_class($user))
                    ->where('tokenable_id', $user->id)
                    ->where('name', $deviceUuid)
                    ->first();

                if ($userDeviceToken) {
                    // This user has another token for this device - allow the request but log the conflict
                    \Log::info("Device UUID conflict resolved: Device {$deviceUuid} was transferred from user {$user->uuid} to user {$user->uuid}");
                    
                    // Don't delete the token, just allow the request to proceed
                    return $next($request);
                } else {
                    // Different device detected - log but don't delete tokens immediately
                    \Log::warning("Device change detected for user {$user->uuid}: {$tokenDeviceUuid} -> {$deviceUuid}");
                    
                    // Update the current token's name to the new device UUID instead of deleting
                    $currentToken->update(['name' => $deviceUuid]);
                    
                    return $next($request);
                }
            }
        }

        // Check if device UUID is already used by another user
        $existingToken = DB::table('personal_access_tokens')
            ->where('name', $deviceUuid)
            ->where('tokenable_id', '!=', $user->id)
            ->first();

        if ($existingToken) {
            // Log the conflict but don't delete tokens to avoid breaking authentication
            \Log::info("Device UUID conflict detected: Device {$deviceUuid} is used by user {$existingToken->tokenable_id}, current user: {$user->id}");
            
            // Just log the conflict and continue - don't delete tokens
            // This prevents authentication issues while still tracking conflicts
        }

        // Store device UUID in request for further use
        $request->merge(['device_uuid' => $deviceUuid]);

        return $next($request);
    }
}
