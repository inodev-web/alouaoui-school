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
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
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
                    // This user has another token for this device - use that one instead
                    // Revoke the current token being used (old device)
                    $currentToken->delete();
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Session active détectée sur un autre appareil. Reconnectez-vous.',
                        'error_code' => 'DEVICE_CONFLICT',
                        'action' => 'LOGIN_REQUIRED'
                    ], 401); // Use 401 for proper logout
                } else {
                    // Different device detected - revoke all tokens and force re-login
                    $user->tokens()->delete();

                    return response()->json([
                        'success' => false,
                        'message' => 'Votre compte a été connecté depuis un autre appareil. Reconnectez-vous.',
                        'error_code' => 'DEVICE_CONFLICT',
                        'action' => 'LOGIN_REQUIRED'
                    ], 401); // Use 401 for proper logout
                }
            }
        }

        // Check if device UUID is already used by another user
        $existingToken = DB::table('personal_access_tokens')
            ->where('name', $deviceUuid)
            ->where('tokenable_id', '!=', $user->id)
            ->first();

        if ($existingToken) {
            // Revoke the conflicting token
            DB::table('personal_access_tokens')
                ->where('id', $existingToken->id)
                ->delete();

            \Log::info("Device UUID conflict resolved: Device {$deviceUuid} was transferred from user {$existingToken->tokenable_id} to user {$user->id}");
        }

        // Store device UUID in request for further use
        $request->merge(['device_uuid' => $deviceUuid]);

        return $next($request);
    }
}
