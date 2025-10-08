<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MultipleLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        $this->artisan('db:seed', ['--class' => 'AdminSeeder']);
    }

    /**
     * Test admin can login multiple times without issues
     */
    public function test_admin_multiple_login_attempts(): void
    {
        $loginData = [
            'login' => '0555123456',
            'password' => '123456789',
            'device_uuid' => 'test-admin-device'
        ];

        // First login
        $response1 = $this->postJson('/api/auth/login', $loginData);
        $response1->assertStatus(200);
        $data1 = $response1->json();
        $this->assertEquals('admin', $data1['data']['user']['role']);

        // Second login with same credentials (should work for admin)
        $response2 = $this->postJson('/api/auth/login', $loginData);
        $response2->assertStatus(200);
        $data2 = $response2->json();
        $this->assertEquals('admin', $data2['data']['user']['role']);

        // Both tokens should be different (new token each time)
        $this->assertNotEquals($data1['data']['token'], $data2['data']['token']);

        // Both tokens should work for API access
        $coursesResponse1 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $data1['data']['token'],
            'Accept' => 'application/json'
        ])->getJson('/api/courses');
        $coursesResponse1->assertStatus(200);

        $coursesResponse2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $data2['data']['token'],
            'Accept' => 'application/json'
        ])->getJson('/api/courses');
        $coursesResponse2->assertStatus(200);
    }

    /**
     * Test login with existing token in header is ignored
     */
    public function test_login_with_existing_token_header(): void
    {
        // First create a token
        $firstLogin = $this->postJson('/api/auth/login', [
            'login' => '0555123456',
            'password' => '123456789',
            'device_uuid' => 'test-device-1'
        ]);
        $firstLogin->assertStatus(200);
        $firstToken = $firstLogin->json('data.token');

        // Try to login again while providing the old token in Authorization header
        // This should still work (backend should ignore existing token for login)
        $secondLogin = $this->withHeaders([
            'Authorization' => 'Bearer ' . $firstToken,
            'Accept' => 'application/json'
        ])->postJson('/api/auth/login', [
            'login' => '0555123456',
            'password' => '123456789',
            'device_uuid' => 'test-device-2'
        ]);

        $secondLogin->assertStatus(200);
        $secondToken = $secondLogin->json('data.token');
        
        // Should get a new token
        $this->assertNotEquals($firstToken, $secondToken);
    }
}