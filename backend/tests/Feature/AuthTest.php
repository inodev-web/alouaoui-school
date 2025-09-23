<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
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
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/auth/profile');

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
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/auth/profile', [
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
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/auth/regenerate-qr');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'qr_token'
                ]);

        // Get updated user from database
        $updatedUser = User::find($user->id);
        
        // Check that QR token has changed
        $this->assertNotEquals($user->qr_token, $updatedUser->qr_token);
    }

    /**
     * Test single device enforcement - login from new device invalidates old sessions.
     */
    public function test_single_device_enforcement(): void
    {
        // Create user
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
            'email' => 'test@example.com',
            'password' => 'password123',
            'device_uuid' => 'device-1'
        ]);

        $token1 = $response1->json('token');
        
        // Login with device 2
        $response2 = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'device_uuid' => 'device-2'
        ]);
        
        $token2 = $response2->json('token');

        // Try to access with token from device 1 (should fail)
        $profileResponse = $this->withHeader('Authorization', "Bearer $token1")
            ->getJson('/api/auth/profile');
            
        $profileResponse->assertStatus(401);

        // Try to access with token from device 2 (should work)
        $profileResponse2 = $this->withHeader('Authorization', "Bearer $token2")
            ->getJson('/api/auth/profile');
            
        $profileResponse2->assertStatus(200);
    }
}
