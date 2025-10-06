<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '+213123456789',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'year_of_study' => '1AM',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => ['uuid', 'firstname', 'lastname', 'phone', 'role', 'year_of_study', 'qr_token'],
                    'token',
                    'device_uuid',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'firstname' => 'Test',
            'lastname' => 'User',
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
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
        ]);

        // Test login with phone using 'login' field
        $response = $this->postJson('/api/auth/login', [
            'login' => '0555123456', // Use phone number for login
            'password' => 'password123',
            'device_uuid' => 'test-device-123'
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'user' => ['uuid', 'firstname', 'lastname', 'phone', 'role', 'year_of_study', 'qr_token'],
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
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
        ]);

        // Test login with incorrect password
        $response = $this->postJson('/api/auth/login', [
            'login' => '0555123456', // Use phone number for login
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
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
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
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
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
                        'uuid' => $user->uuid,
                        'firstname' => 'Test',
                        'lastname' => 'User',
                        'phone' => '0555123456',
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
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'device_uuid' => 'test-device-update',
        ]);

        $token = $user->createToken('test-device-update', ['student'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer $token",
            'X-Device-UUID' => 'test-device-update'
        ])->putJson('/api/auth/profile', [
            'firstname' => 'Updated',
            'lastname' => 'User',
            'phone' => '0555123457',
            'address' => '456 Updated Street, Algiers',
            'year_of_study' => '3AM',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'uuid' => $user->uuid,
            'firstname' => 'Updated',
            'lastname' => 'User',
            'phone' => '0555123457',
            'address' => '456 Updated Street, Algiers',
            'year_of_study' => '3AM',
        ]);
    }

    /**
     * Test QR token (now uuid) retrieval remains stable.
     */
    public function test_qr_token_generation(): void
    {
        $user = User::create([
            'firstname' => 'QR',
            'lastname' => 'Test User',
            'birth_date' => '2000-01-01',
            'address' => '789 QR Street, Algiers',
            'school_name' => 'QR Test School',
            'phone' => '0555777888',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '3AM',
        ]);

        $originalUuid = $user->uuid;

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/auth/regenerate-qr');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'qr_token'
                    ]
                ])
                ->assertJson([
                    'data' => [
                        'qr_token' => $originalUuid
                    ]
                ]);

        $user->refresh();
        $this->assertEquals($originalUuid, $user->uuid);
    }

    /**
     * Test device session management.
     */
    public function test_device_session_management(): void
    {
        $user = User::create([
            'firstname' => 'Device',
            'lastname' => 'Test User',
            'birth_date' => '2000-01-01',
            'address' => '999 Device Street, Algiers',
            'school_name' => 'Device Test School',
            'phone' => '0555123456',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
        ]);

        // Login with device 1
        $response1 = $this->postJson('/api/auth/login', [
            'login' => '0555123456',
            'password' => 'password123',
            'device_uuid' => 'device-1',
            'single_device' => true
        ]);

        $token1 = $response1->json('data.token');

        // Login with device 2 (should invalidate device 1)
        $response2 = $this->postJson('/api/auth/login', [
            'login' => '0555123456',
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

        $profileResponse->assertStatus(401); // Token should be invalid after device 2 login        // Try to access with token from device 2 (should work)
        $profileResponse2 = $this->withHeaders([
            'Authorization' => "Bearer $token2",
            'X-Device-UUID' => 'device-2'
        ])->getJson('/api/auth/profile');

        $profileResponse2->assertStatus(200);

        // Try to access with old token from device 1 again (should still fail)
        $profileResponse1 = $this->withHeaders([
            'Authorization' => "Bearer $token1",
            'X-Device-UUID' => 'device-1'
        ])->getJson('/api/auth/profile');

        // Should get 409 (device conflict) because middleware detects device mismatch
        $profileResponse1->assertStatus(409)
                         ->assertJsonPath('error_code', 'DEVICE_CONFLICT');
    }
}
