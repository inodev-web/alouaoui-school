<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
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
            'address' => 'required|string|max:500',
            'school_name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'sometimes|string|in:student,admin',
            'year_of_study' => 'sometimes|string|max:10',
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
        ]);

        // Token avec device UUID comme nom
        $token = $user->createToken($deviceUuid, ['student'])->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'data' => [
                'user' => [
                    'uuid' => $user->uuid,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'year_of_study' => $user->year_of_study,
                    'qr_token' => $user->uuid,
                    'free_subscriber' => $user->isFree(),
                    'free_subscriber_reason' => $user->free_subscriber_reason,
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
            'login' => 'required|string', // phone seulement
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

        // Connexion par téléphone uniquement
        $user = User::where('phone', $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Récupérer ou générer device UUID
        $deviceUuid = $request->device_uuid ?? Str::uuid()->toString();

        // Pour les étudiants uniquement : vérifier la restriction d'appareil unique
        // Les admins peuvent se connecter depuis plusieurs appareils
        if ($user->role === 'student') {
            if ($request->boolean('single_device')) {
                $this->enforceSingleDeviceWithTokenInvalidation($user, $deviceUuid);
            } else {
                $this->enforceSingleDeviceForStudent($user, $deviceUuid);
            }
        } elseif ($user->role === 'admin') {
            // Pour les admins : permettre plusieurs tokens par device mais nettoyer les anciens du même device
            // Garder seulement les 3 derniers tokens par device pour éviter l'accumulation
            $existingTokens = $user->tokens()->where('name', $deviceUuid)->get();
            if ($existingTokens->count() > 2) {
                // Supprimer les plus anciens, garder les 2 plus récents
                $tokensToDelete = $existingTokens->sortBy('created_at')->take($existingTokens->count() - 2);
                foreach ($tokensToDelete as $token) {
                    $token->delete();
                }
            }
        }

        // Mettre à jour le device_uuid si fourni (pour les étudiants seulement)
        if ($request->has('device_uuid') && $user->role === 'student') {
            $user->update(['device_uuid' => $deviceUuid]);
        }

        // Créer le token d'authentification avec device UUID comme nom
        $token = $user->createToken($deviceUuid, [$user->role])->plainTextToken;

        \Log::info("Login token created", [
            'user_id' => $user->id,
            'device_uuid' => $deviceUuid,
            'token_prefix' => substr($token, 0, 10) . '...',
            'tokens_after_creation' => $user->tokens()->count()
        ]);

        // Retourner les informations utilisateur sans token Sanctum
        return response()->json([
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'uuid' => $user->uuid,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'year_of_study' => $user->year_of_study,
                    'qr_token' => $user->uuid,
                    'free_subscriber' => $user->isFree(),
                    'free_subscriber_reason' => $user->free_subscriber_reason,
                ],
                'token' => $token, // Token Sanctum
                'device_uuid' => $deviceUuid,
            ]
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Supprimer le token actuel
        $user->currentAccessToken()->delete();

        // Pour les étudiants, supprimer le device_uuid pour permettre une nouvelle connexion
        if ($user && $user->role === 'student') {
            $user->update(['device_uuid' => null]);
        }

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }

    /**
     * Logout from all devices
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();

        // Supprimer tous les tokens
        $user->tokens()->delete();

        // Pour les étudiants, supprimer le device_uuid pour permettre une nouvelle connexion
        if ($user && $user->role === 'student') {
            $user->update(['device_uuid' => null]);
        }

        return response()->json([
            'message' => 'Logged out from all devices'
        ]);
    }

    /**
     * Get user profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'message' => 'Profile retrieved successfully',
            'data' => [
                'uuid' => $user->uuid,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'phone' => $user->phone,
                'birth_date' => $user->birth_date,
                'address' => $user->address,
                'school_name' => $user->school_name,
                'role' => $user->role,
                'year_of_study' => $user->year_of_study,
                'qr_token' => $user->uuid,
                'device_uuid' => $user->device_uuid,
                'free_subscriber' => $user->isFree(),
                'free_subscriber_reason' => $user->free_subscriber_reason,
                // return full picture URL if available
                'picture' => $user->picture ? asset('storage/' . $user->picture) : null,
                'last_profile_update_at' => $user->last_profile_update_at,
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        // Daily modification limit: only one successful modification per 24h
        if ($user->last_profile_update_at && now()->diffInHours($user->last_profile_update_at) < 24) {
            return response()->json([
                'message' => 'لقد قمت بتعديل معلوماتك اليوم، الرجاء المحاولة غداً'
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'firstname' => 'sometimes|string|max:255',
            'lastname' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|unique:users,phone,' . $user->uuid . ',uuid',
            'birth_date' => 'sometimes|date',
            'address' => 'sometimes|string|max:500',
            'school_name' => 'sometimes|string|max:255',
            'year_of_study' => 'sometimes|string|max:10',
            'password' => 'sometimes|string|min:6|confirmed',
            'current_password' => 'sometimes|string',
            'picture' => 'sometimes|file|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // If user is trying to update any sensitive fields (not just picture), require current_password verification
        $sensitiveKeys = collect(['firstname','lastname','phone','birth_date','address','school_name','year_of_study','password']);
        $isSensitiveUpdate = $sensitiveKeys->some(function ($key) use ($data) {
            return array_key_exists($key, $data);
        });

        if ($isSensitiveUpdate) {
            if (empty($data['current_password']) || !Hash::check($data['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'كلمة المرور الحالية غير صحيحة'
                ], 422);
            }
        }

        // Handle picture upload if provided (does not require current_password by itself)
        if ($request->hasFile('picture')) {
            $path = $request->file('picture')->store('students', 'public');
            $user->picture = $path;
        }

        // Update other fields
        $dataToUpdate = $data;
        unset($dataToUpdate['current_password'], $dataToUpdate['picture']);

        if (isset($dataToUpdate['password'])) {
            $dataToUpdate['password'] = Hash::make($dataToUpdate['password']);
        }

        if (!empty($dataToUpdate)) {
            $user->fill($dataToUpdate);
        }

        // Mark daily modification timestamp
        $user->last_profile_update_at = now();
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => [
                'uuid' => $user->uuid,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'phone' => $user->phone,
                'birth_date' => $user->birth_date,
                'address' => $user->address,
                'school_name' => $user->school_name,
                'role' => $user->role,
                'year_of_study' => $user->year_of_study,
                'qr_token' => $user->uuid,
                'free_subscriber' => $user->isFree(),
                'free_subscriber_reason' => $user->free_subscriber_reason,
                'picture' => $user->picture ? asset('storage/' . $user->picture) : null,
                'last_profile_update_at' => $user->last_profile_update_at,
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
            'password' => Hash::make($request->password),
            'last_profile_update_at' => now(),
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
        // Compatibilité : renvoie simplement le uuid (nouveau QR code)
        $user = $request->user();
        return response()->json([
            'message' => 'QR token (uuid) returned successfully',
            'data' => [
                'qr_token' => $user->uuid
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
     * Force device change (for students who need to change device)
     */
    public function forceDeviceChange(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'new_device_uuid' => 'required|string|max:255',
            'password' => 'required|string', // Verification pour sécurité
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Vérifier le mot de passe pour sécurité
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Password incorrect'
            ], 422);
        }

        // Autoriser seulement pour les étudiants
        if ($user->role !== 'student') {
            return response()->json([
                'message' => 'Device change is only available for students'
            ], 403);
        }

        // Mettre à jour le device UUID
        $user->update(['device_uuid' => $request->new_device_uuid]);

        return response()->json([
            'message' => 'Device changed successfully',
            'data' => [
                'new_device_uuid' => $request->new_device_uuid,
                'token' => $user->createToken($request->new_device_uuid, [$user->role])->plainTextToken,
            ]
        ]);
    }

    // Méthode generateUniqueQrToken supprimée: le uuid suffit comme identifiant unique

    /**
     * Enforce single device login for students
     */
    private function enforceSingleDeviceForStudent(User $user, string $deviceUuid): void
    {
        // Si l'utilisateur a déjà un device_uuid et que ce n'est pas le même
        if ($user->device_uuid && $user->device_uuid !== $deviceUuid) {
            throw ValidationException::withMessages([
                'device_uuid' => ['Ce compte est déjà connecté sur un autre appareil. Un étudiant ne peut être connecté que sur un seul appareil à la fois.'],
            ]);
        }

        // Si aucun device_uuid n'est enregistré, on l'accepte
        if (!$user->device_uuid) {
            $user->update(['device_uuid' => $deviceUuid]);
        }
    }

    /**
     * Enforce single device login with token invalidation (for single_device=true)
     */
    private function enforceSingleDeviceWithTokenInvalidation(User $user, string $deviceUuid): void
    {
        \Log::info("Enforcing single device with token invalidation", [
            'user_id' => $user->id,
            'current_device_uuid' => $user->device_uuid,
            'new_device_uuid' => $deviceUuid,
            'tokens_before' => $user->tokens()->count()
        ]);

        // Si l'utilisateur a déjà un device_uuid différent, invalider tous les tokens existants
        if ($user->device_uuid && $user->device_uuid !== $deviceUuid) {
            // Supprimer tous les tokens existants
            $deletedCount = $user->tokens()->count();
            $user->tokens()->delete();
            \Log::info("Deleted existing tokens due to device change", [
                'user_id' => $user->id,
                'deleted_tokens' => $deletedCount,
                'old_device' => $user->device_uuid,
                'new_device' => $deviceUuid
            ]);
        }
        
        // Mettre à jour le device_uuid
        $user->update(['device_uuid' => $deviceUuid]);
        \Log::info("Updated user device_uuid", [
            'user_id' => $user->id,
            'device_uuid' => $deviceUuid
        ]);
    }    /**
     * Enforce single device login (deprecated - kept for compatibility)
     */
    private function enforceSingleDevice(User $user, string $deviceUuid): void
    {
        if ($user->device_uuid && $user->device_uuid !== $deviceUuid) {
            // Mettre à jour le device UUID
            $user->update(['device_uuid' => $deviceUuid]);
        }
    }
}
