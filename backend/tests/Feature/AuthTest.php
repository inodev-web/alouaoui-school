<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    /**
     * Test user registration functionality.
     */
    public function test_user_can_register()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+213123456789',
            'password' => 'password123',
            'password_confirmation' => 'password123', // Add confirmation
            'year_of_study' => '1AM',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'phone', 'role', 'year_of_study', 'qr_token'],
                    'token',
                    'device_uuid',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+213123456789',
            'role' => 'student',
            'year_of_study' => '1AM',
        ]);
    }

    /**
     * Test user login functionality.
     */
    public function test_user_can_login(): void
    {
        // Create a user
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        // Test login with email using 'login' field
        $response = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com', // Change from 'email' to 'login'
            'password' => 'password123',
            'device_uuid' => 'test-device-123'
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'user' => ['id', 'name', 'email', 'role', 'year_of_study', 'qr_token'],
                        'token',
                        'device_uuid',
                    ]
                ]);
    }

    /**
     * Test invalid login credentials.
     */
    public function test_login_with_invalid_credentials(): void
    {
        // Create a user
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        // Test login with incorrect password
        $response = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com', // Change from 'email' to 'login'
            'password' => 'wrongpassword',
            'device_uuid' => 'test-device-123'
        ]);

        $response->assertStatus(422) // Change from 401 to 422 for validation exception
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test user logout functionality.
     */
    public function test_user_can_logout(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Logout successful' // Match actual response message
                ]);
    }

    /**
     * Test user profile retrieval.
     */
    public function test_get_user_profile(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
            'device_uuid' => 'test-device-profile',
        ]);

        $token = $user->createToken('test-device-profile', ['student'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
            'X-Device-UUID' => 'test-device-profile'
        ])->getJson('/api/auth/profile');

        $response->assertStatus(200)
                ->assertJson([
                    'data' => [
                        'id' => $user->id,
                        'name' => 'Test User',
                        'email' => 'test@example.com',
                        'role' => 'student',
                    ]
                ]);
    }

    /**
     * Test user profile update.
     */
    public function test_user_can_update_profile(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
            'device_uuid' => 'test-device-update',
        ]);

        $token = $user->createToken('test-device-update', ['student'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
            'X-Device-UUID' => 'test-device-update'
        ])->putJson('/api/auth/profile', [
            'name' => 'Updated User',
            'phone' => '0555123457',
            'year_of_study' => '3AM',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated User',
            'phone' => '0555123457',
            'year_of_study' => '3AM',
        ]);
    }

    /**
     * Test QR token generation.
     */
    public function test_qr_token_generation(): void
    {
        $user = User::create([
            'name' => 'QR Test User',
            'email' => 'qrtest@example.com',
            'phone' => '0555777888',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '3AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $originalQrToken = $user->qr_token; // Store original QR token

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/auth/regenerate-qr');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'qr_token'
                    ]
                ]);

        // Get updated user from database
        $user->refresh(); // Refresh the model to get updated data

        // Check that QR token has changed
        $this->assertNotEquals($originalQrToken, $user->qr_token);
    }

    /**
     * Test device session management.
     */
    public function test_device_session_management(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        // Login with device 1
        $response1 = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
            'device_uuid' => 'device-1',
            'single_device' => true
        ]);

        $token1 = $response1->json('data.token');

        // Login with device 2 (should invalidate device 1)
        $response2 = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
            'device_uuid' => 'device-2',
            'single_device' => true
        ]);

        $token2 = $response2->json('data.token');

        // Try to access with token from device 1 (should fail because device 2 login invalidated it)
        $profileResponse = $this->withHeaders([
            'Authorization' => "Bearer $token1",
            'X-Device-UUID' => 'device-1'
        ])->getJson('/api/auth/profile');

        $profileResponse->assertStatus(401); // Token should be invalid after device 2 login
        
        // Try to access with token from device 2 (should work)
        $profileResponse2 = $this->withHeaders([
            'Authorization' => "Bearer $token2",
            'X-Device-UUID' => 'device-2'
        ])->getJson('/api/auth/profile');

        $profileResponse2->assertStatus(200);

        // Clear authentication cache to ensure fresh token validation
        $this->app->forgetInstance('auth');
        $this->app['auth']->forgetGuards();
        
        // Try to access with old token from device 1 again (should still fail)
        $profileResponse1 = $this->withHeaders([
            'Authorization' => "Bearer $token1",
            'X-Device-UUID' => 'device-1'
        ])->getJson('/api/auth/profile');

        // Should get 401 (unauthorized) because token was deleted when user logged in from device 2
        $profileResponse1->assertStatus(401);
    }

    /**
     * Test forgot password functionality
     */
    public function test_forgot_password_with_valid_email(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'reset_token', // En production, ceci ne serait pas exposé
                    'email'
                ]);

        // Vérifier qu'un token a été créé dans la base
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'test@example.com',
        ]);
    }

    /**
     * Test forgot password with invalid email
     */
    public function test_forgot_password_with_invalid_email(): void
    {
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test reset password with valid token
     */
    public function test_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('old_password'),
        ]);

        // Créer un token de reset
        $token = \Illuminate\Support\Str::random(64);
        \DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'new_password123',
            'password_confirmation' => 'new_password123',
        ]);

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Mot de passe réinitialisé avec succès'
                ]);

        // Vérifier que le mot de passe a été changé
        $user->refresh();
        $this->assertTrue(Hash::check('new_password123', $user->password));

        // Vérifier que le token a été supprimé
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'test@example.com',
        ]);

        // Vérifier que tous les tokens d'auth ont été révoqués
        $this->assertEquals(0, $user->tokens()->count());
    }

    /**
     * Test reset password with invalid token
     */
    public function test_reset_password_with_invalid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => 'invalid_token',
            'password' => 'new_password123',
            'password_confirmation' => 'new_password123',
        ]);

        $response->assertStatus(422)
                ->assertJson([
                    'message' => 'Token invalide ou expiré'
                ]);
    }

    /**
     * Test reset password with expired token
     */
    public function test_reset_password_with_expired_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        // Créer un token expiré (plus d'une heure)
        $token = \Illuminate\Support\Str::random(64);
        \DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => Hash::make($token),
            'created_at' => now()->subHours(2), // Expiré
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'new_password123',
            'password_confirmation' => 'new_password123',
        ]);

        $response->assertStatus(422)
                ->assertJson([
                    'message' => 'Token invalide ou expiré'
                ]);
    }
}
