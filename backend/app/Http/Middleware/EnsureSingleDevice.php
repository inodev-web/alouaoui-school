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
        
        if ($currentToken) {
            // Get device UUID from token's meta or name
            $tokenDeviceUuid = $currentToken->name; // We'll store device UUID as token name
            
            // If device UUID doesn't match current token's device UUID
            if ($tokenDeviceUuid !== $deviceUuid) {
                // Revoke all existing tokens for this user
                $user->tokens()->delete();
                
                return response()->json([
                    'success' => false,
                    'message' => 'Session active détectée sur un autre appareil. Reconnectez-vous.',
                    'error_code' => 'DEVICE_CONFLICT',
                    'action' => 'LOGIN_REQUIRED'
                ], 409); // Conflict status code
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

        // Update current token's device info if needed
        if ($currentToken && $currentToken->name !== $deviceUuid) {
            $currentToken->update([
                'name' => $deviceUuid,
                'updated_at' => now()
            ]);
        }

        // Store device UUID in request for further use
        $request->merge(['device_uuid' => $deviceUuid]);

        return $next($request);
    }
}
