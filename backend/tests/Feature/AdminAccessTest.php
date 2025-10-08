<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        $this->artisan('db:seed', ['--class' => 'AdminSeeder']);
    }

    /**
     * Test admin login and access without device UUID
     */
    public function test_admin_can_access_routes_without_device_uuid(): void
    {
        // Login admin
        $response = $this->postJson('/api/auth/login', [
            'login' => '0555123456',
            'password' => '123456789',
            'device_uuid' => 'test-admin-device'
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('admin', $data['data']['user']['role']);
        
        $token = $data['data']['token'];

        // Test courses access WITHOUT X-Device-UUID header
        $coursesResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json'
        ])->getJson('/api/courses');

        $coursesResponse->assertStatus(200);

        // Test profile access WITHOUT X-Device-UUID header
        $profileResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json'
        ])->getJson('/api/auth/profile');

        $profileResponse->assertStatus(200);
        $profileData = $profileResponse->json();
        $this->assertEquals('admin', $profileData['data']['role']);

        // Test videos access WITHOUT X-Device-UUID header
        $videosResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json'
        ])->getJson('/api/videos');

        $videosResponse->assertStatus(200);
    }

    /**
     * Test student still needs device UUID
     */
    public function test_student_still_needs_device_uuid(): void
    {
        // Create student
        $student = User::create([
            'firstname' => 'Test',
            'lastname' => 'Student',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street',
            'school_name' => 'Test School',
            'phone' => '0555999888',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
        ]);

        // Login student
        $response = $this->postJson('/api/auth/login', [
            'login' => '0555999888',
            'password' => 'password123',
            'device_uuid' => 'test-student-device'
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('student', $data['data']['user']['role']);
        
        $token = $data['data']['token'];

        // Test courses access WITHOUT X-Device-UUID header (should fail for student)
        $coursesResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json'
        ])->getJson('/api/courses');

        $coursesResponse->assertStatus(400); // Should require device UUID
        $coursesResponse->assertJsonFragment(['error_code' => 'DEVICE_UUID_REQUIRED']);

        // Test courses access WITH X-Device-UUID header (should work for student)
        $coursesResponseWithDevice = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'X-Device-UUID' => 'test-student-device',
            'Accept' => 'application/json'
        ])->getJson('/api/courses');

        $coursesResponseWithDevice->assertStatus(200);
    }
}