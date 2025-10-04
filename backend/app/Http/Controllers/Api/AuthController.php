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
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'address' => 'required|string|max:255',
            'school_name' => 'required|string|max:255',
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

        // Récupérer ou générer device UUID
        $deviceUuid = $request->device_uuid ?? Str::uuid()->toString();

        $user = User::create([
            'firstname' => $request->firstname,
            'lastname' => $request->lastname,
            'birth_date' => $request->birth_date,
            'address' => $request->address,
            'school_name' => $request->school_name,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'student',
            'year_of_study' => $request->year_of_study,
            'device_uuid' => $deviceUuid,
            // Ensure qr_token exists and is a UUID stored in DB
            'qr_token' => (string) Str::uuid(),
        ]);

        // Créer le token d'authentification avec device UUID comme nom
        $token = $user->createToken($deviceUuid, ['student'])->plainTextToken;

        return response()->json([
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => [
                'user' => $this->formatUserData($user),
                'token' => $token,
                'device_uuid' => $deviceUuid,
                'qr_token' => $user->qr_token,
            ]
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string', // Uniquement téléphone maintenant
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

        $user = User::where('phone', $request->phone)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['رقم الهاتف أو كلمة المرور غير صحيحة.'],
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
                    'uuid' => $user->uuid ?? null,
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
            'data' => array_merge(
                $this->formatUserData($user),
                [
                    'device_uuid' => $user->device_uuid,
                    'created_at' => $user->created_at,
                ]
            )
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'firstname' => 'sometimes|string|max:255',
            'lastname' => 'sometimes|string|max:255',
            'birth_date' => 'sometimes|date',
            'address' => 'sometimes|string|max:255',
            'school_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20|unique:users,phone,' . $user->id,
            'year_of_study' => 'sometimes|in:1AM,2AM,3AM,4AM,1AS,2AS,3AS',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only([
            'firstname', 'lastname', 'birth_date', 'address',
            'school_name', 'phone', 'year_of_study'
        ]));

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $this->formatUserData($user)
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
        // Generate a new UUID-based qr_token, persist it and return
        $new = (string) Str::uuid();
        $user->update(['qr_token' => $new]);

        return response()->json([
            'message' => 'QR token regenerated successfully',
            'data' => [
                'qr_token' => $new
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
            'phone' => 'required|string|exists:users,phone',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'فشل التحقق',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate reset token
        $token = Str::random(6); // Code plus court pour SMS
        
        // Store token in password_resets table
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['phone' => $request->phone],
            [
                'token' => Hash::make($token),
                'created_at' => now()
            ]
        );

        // Get user
        $user = User::where('phone', $request->phone)->first();
        
        // TODO: Send SMS with reset code
        // Pour le développement, on retourne le token
        return response()->json([
            'message' => 'تم إرسال رمز إعادة التعيين إلى هاتفك',
            'reset_token' => $token, // Remove this in production
            'phone' => $request->phone
        ]);
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|exists:users,phone',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'فشل التحقق',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if token exists and is not expired (15 minutes for SMS code)
        $passwordReset = \DB::table('password_reset_tokens')
            ->where('phone', $request->phone)
            ->where('created_at', '>', now()->subMinutes(15))
            ->first();

        if (!$passwordReset || !Hash::check($request->token, $passwordReset->token)) {
            return response()->json([
                'message' => 'الرمز غير صالح أو منتهي الصلاحية'
            ], 422);
        }

        // Update user password
        $user = User::where('phone', $request->phone)->first();
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Delete the reset token
        \DB::table('password_reset_tokens')->where('phone', $request->phone)->delete();

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return response()->json([
            'message' => 'تم إعادة تعيين كلمة المرور بنجاح'
        ]);
    }


    /**
     * Compute a deterministic, compact QR token from user id.
     * This avoids storing an additional UUID per user and is reversible by the same algorithm.
     */
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

    /**
     * Format user data for response
     */
    private function formatUserData(User $user): array
    {
        return [
            'id' => $user->id,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'birth_date' => $user->birth_date,
            'address' => $user->address,
            'school_name' => $user->school_name,
            'phone' => $user->phone,
            'role' => $user->role,
            'year_of_study' => $user->year_of_study,
            // Use stored QR token UUID from DB
            'qr_token' => $user->qr_token,
            // Public UUID identifier (new)
            'uuid' => $user->uuid ?? null,
        ];
    }
}
