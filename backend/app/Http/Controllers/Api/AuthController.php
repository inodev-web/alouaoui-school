<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new student
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'year_of_study' => 'required|in:1AM,2AM,3AM,4AM,1AS,2AS,3AS',
            'device_uuid' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Générer un QR token unique
        $qrToken = $this->generateUniqueQrToken();

        // Récupérer ou générer device UUID
        $deviceUuid = $request->device_uuid ?? Str::uuid()->toString();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'student',
            'year_of_study' => $request->year_of_study,
            'device_uuid' => $deviceUuid,
            'qr_token' => $qrToken,
        ]);

        // Créer le token d'authentification avec device UUID comme nom
        $token = $user->createToken($deviceUuid, ['student'])->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'year_of_study' => $user->year_of_study,
                    'qr_token' => $user->qr_token,
                ],
                'token' => $token,
                'device_uuid' => $deviceUuid,
            ]
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string', // phone ou email
            'password' => 'required|string',
            'device_uuid' => 'sometimes|string|max:255',
            'single_device' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Déterminer si c'est un email ou un téléphone
        $loginField = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

        $user = User::where($loginField, $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Récupérer ou générer device UUID
        $deviceUuid = $request->device_uuid ?? Str::uuid()->toString();

        // Vérification du device unique si demandé
        if ($request->boolean('single_device') && $request->has('device_uuid')) {
            $this->enforceSingleDevice($user, $deviceUuid);
        }

        // Mettre à jour le device_uuid si fourni
        if ($request->has('device_uuid')) {
            $user->update(['device_uuid' => $deviceUuid]);
        }

        // Créer le token avec les permissions appropriées et device UUID comme nom
        $abilities = $user->role === 'admin' ? ['admin', 'student'] : ['student'];
        $token = $user->createToken($deviceUuid, $abilities)->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'year_of_study' => $user->year_of_study,
                    'qr_token' => $user->qr_token,
                ],
                'token' => $token,
                'device_uuid' => $deviceUuid,
            ]
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }

    /**
     * Logout from all devices
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out from all devices'
        ]);
    }

    /**
     * Get current user profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'year_of_study' => $user->year_of_study,
                'qr_token' => $user->qr_token,
                'device_uuid' => $user->device_uuid,
                'created_at' => $user->created_at,
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|string|max:20|unique:users,phone,' . $user->id,
            'year_of_study' => 'sometimes|in:1AM,2AM,3AM,4AM,1AS,2AS,3AS',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['name', 'email', 'phone', 'year_of_study']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'year_of_study' => $user->year_of_study,
            ]
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Invalider tous les autres tokens
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Regenerate QR token
     */
    public function regenerateQrToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $newQrToken = $this->generateUniqueQrToken();

        $user->update(['qr_token' => $newQrToken]);

        return response()->json([
            'message' => 'QR token regenerated successfully',
            'data' => [
                'qr_token' => $newQrToken
            ]
        ]);
    }

    /**
     * Check device authorization
     */
    public function checkDevice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'device_uuid' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $isAuthorized = !$user->device_uuid || $user->device_uuid === $request->device_uuid;

        return response()->json([
            'data' => [
                'is_authorized' => $isAuthorized,
                'registered_device' => $user->device_uuid,
                'current_device' => $request->device_uuid,
            ]
        ]);
    }

    /**
     * Send password reset email
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate reset token
        $token = Str::random(64);
        
        // Store token in password_resets table (Laravel default)
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($token),
                'created_at' => now()
            ]
        );

        // Send email with reset link (you'll need to configure mail)
        $user = User::where('email', $request->email)->first();
        
        // For now, return the token (in production, send via email)
        return response()->json([
            'message' => 'Un lien de réinitialisation a été envoyé à votre email',
            'reset_token' => $token, // Remove this in production
            'email' => $request->email
        ]);
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if token exists and is not expired (1 hour)
        $passwordReset = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('created_at', '>', now()->subHour())
            ->first();

        if (!$passwordReset || !Hash::check($request->token, $passwordReset->token)) {
            return response()->json([
                'message' => 'Token invalide ou expiré'
            ], 422);
        }

        // Update user password
        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Delete the reset token
        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès'
        ]);
    }

    /**
     * Generate unique QR token
     */
    private function generateUniqueQrToken(): string
    {
        do {
            $token = Str::uuid()->toString();
        } while (User::where('qr_token', $token)->exists());

        return $token;
    }

    /**
     * Enforce single device login
     */
    private function enforceSingleDevice(User $user, string $deviceUuid): void
    {
        if ($user->device_uuid && $user->device_uuid !== $deviceUuid) {
            // Invalider tous les tokens existants
            $user->tokens()->delete();

            // Mettre à jour le device UUID
            $user->update(['device_uuid' => $deviceUuid]);
        }
    }
}
