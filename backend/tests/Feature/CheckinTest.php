<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Attendance;
use App\Models\Subscription;
use Laravel\Sanctum\Sanctum;

class CheckinTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    /**
     * Helper method to create a teacher entity
     */
    protected function createTeacher(array $attributes = []): Teacher
    {
        return Teacher::create(array_merge([
            'name' => 'Test Teacher',
            'phone' => '0555' . random_int(100000, 999999),
            'module' => 'Mathematics',
            'year' => '2AM',
            'is_online_publisher' => false,
            'price_subscription' => 2000.00,
            'price_session' => 500.00,
            'percent_school' => 30,
        ], $attributes));
    }

    /**
     * Helper method to create a user entity
     */
    protected function createUser(array $attributes = []): User
    {
        $defaults = [
            'firstname' => 'Test',
            'lastname' => 'User',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Algiers',
            'school_name' => 'Test School',
            'phone' => '0555' . random_int(100000, 999999),
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'free_subscriber' => false,
            'free_subscriber_reason' => null,
        ];

        return User::create(array_merge($defaults, $attributes));
    }

    /**
     * Helper method to create a session entity
     */
    protected function createSession(Teacher $teacher, array $attributes = []): Session
    {
        return Session::create(array_merge([
            'teacher_uuid' => $teacher->uuid,
            'start_time' => now()->addHour(),
            'end_time' => now()->addHours(2),
            'status' => 'completed',
        ], $attributes));
    }

    /**
     * Helper method to create an admin user and authenticate
     */
    protected function createAndAuthenticateAdmin(): array
    {
        $admin = $this->createUser([
            'role' => 'admin',
            'firstname' => 'Admin',
            'lastname' => 'User',
        ]);

        $deviceUuid = \Illuminate\Support\Str::uuid()->toString();

        $response = $this->postJson('/api/auth/login', [
            'login' => $admin->phone,
            'password' => 'password123',
            'device_uuid' => $deviceUuid
        ]);

        $token = $response->json('data.token');

        return [
            'admin' => $admin,
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'X-Device-UUID' => $deviceUuid,
            ]
        ];
    }

    /**
     * Test that scanning a free user creates attendance only (no subscription).
     */
    public function test_scan_free_user_creates_attendance_only(): void
    {
        $freeUser = $this->createUser([
            'free_subscriber' => true,
            'free_subscriber_reason' => 'Staff member exemption'
        ]);
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);

        $auth = $this->createAndAuthenticateAdmin();

        // Scan QR for free user
        $response = $this->withHeaders($auth['headers'])->postJson('/api/admin/checkin/scan-qr', [
            'user_uuid' => $freeUser->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'mode' => 'monthly', // Should be ignored for free users
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'attendance',
                        'classification'
                    ]
                ]);

        // Should create attendance
        $this->assertDatabaseHas('attendances', [
            'student_uuid' => $freeUser->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
        ]);

        // Should NOT create subscription
        $this->assertDatabaseMissing('subscriptions', [
            'user_uuid' => $freeUser->uuid,
            'teacher_uuid' => $teacher->uuid,
        ]);

        // Classification should be 'free'
        $responseData = $response->json('data');
        $this->assertEquals('free', $responseData['classification']);
    }

    /**
     * Test that scanning creates session pass and attendance.
     */
    public function test_scan_creates_session_pass_and_attendance(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);

        $auth = $this->createAndAuthenticateAdmin();

        // Scan QR with session_pass mode
        $response = $this->withHeaders($auth['headers'])->postJson('/api/admin/checkin/scan-qr', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'mode' => 'session_pass',
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'attendance',
                        'subscription_created',
                        'classification'
                    ]
                ]);

        // Should create attendance
        $this->assertDatabaseHas('attendances', [
            'student_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
        ]);

        // Should create session pass subscription
        $this->assertDatabaseHas('subscriptions', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
        ]);

        // Check that subscription is session pass (same day)
        $subscription = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacher->uuid)
            ->first();
        
        $this->assertNotNull($subscription);
        $this->assertTrue($subscription->starts_at->isSameDay($subscription->ends_at));
        $this->assertFalse($subscription->isMonthly());

        // Classification should be 'session_pass'
        $responseData = $response->json('data');
        $this->assertEquals('session_pass', $responseData['classification']);
    }

    /**
     * Test that scanning with monthly mode creates monthly subscription and attendance.
     */
    public function test_scan_creates_monthly_and_attendance(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);

        $auth = $this->createAndAuthenticateAdmin();

        // Scan QR with monthly mode
        $response = $this->withHeaders($auth['headers'])->postJson('/api/admin/checkin/scan-qr', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'mode' => 'monthly',
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'attendance',
                        'subscription_created',
                        'classification'
                    ]
                ]);

        // Should create attendance
        $this->assertDatabaseHas('attendances', [
            'student_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
        ]);

        // Should create monthly subscription
        $this->assertDatabaseHas('subscriptions', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
        ]);

        // Check that subscription is monthly (approximately 1 month duration)
        $subscription = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacher->uuid)
            ->first();
        
        $this->assertNotNull($subscription);
        $this->assertTrue($subscription->isMonthly());

        // Classification should be 'subscriber'
        $responseData = $response->json('data');
        $this->assertEquals('subscriber', $responseData['classification']);
    }

    /**
     * Test that scanning with monthly mode does not create duplicate subscription.
     */
    public function test_scan_monthly_no_duplicate_subscription(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);

        // Create existing monthly subscription
        $existingSubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->subWeek(),
            'ends_at' => now()->addWeeks(3), // Active for 1 month total
        ]);

        $auth = $this->createAndAuthenticateAdmin();

        // Try to scan QR with monthly mode - should not create new subscription
        $response = $this->withHeaders($auth['headers'])->postJson('/api/admin/checkin/scan-qr', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'mode' => 'monthly',
        ]);

        $response->assertStatus(201);

        // Should create attendance
        $this->assertDatabaseHas('attendances', [
            'student_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
        ]);

        // Should still have only one subscription
        $subscriptionCount = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacher->uuid)
            ->count();
        
        $this->assertEquals(1, $subscriptionCount);

        // Classification should be 'subscriber' (using existing subscription)
        $responseData = $response->json('data');
        $this->assertEquals('subscriber', $responseData['classification']);
    }

    /**
     * Test that scanning a user with no subscription and no mode creates attendance only.
     */
    public function test_scan_no_mode_creates_attendance_only(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);

        $auth = $this->createAndAuthenticateAdmin();

        // Scan QR without mode
        $response = $this->withHeaders($auth['headers'])->postJson('/api/admin/checkin/scan-qr', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            // No mode specified
        ]);

        $response->assertStatus(201);

        // Should create attendance
        $this->assertDatabaseHas('attendances', [
            'student_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
        ]);

        // Should NOT create subscription
        $this->assertDatabaseMissing('subscriptions', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
        ]);

        // Classification should be 'none'
        $responseData = $response->json('data');
        $this->assertEquals('none', $responseData['classification']);
    }

    /**
     * Test error handling for invalid user UUID.
     */
    public function test_scan_invalid_user_uuid(): void
    {
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);

        $auth = $this->createAndAuthenticateAdmin();

        // Scan QR with invalid user UUID
        $response = $this->withHeaders($auth['headers'])->postJson('/api/admin/checkin/scan-qr', [
            'user_uuid' => 'invalid-uuid',
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'mode' => 'monthly',
        ]);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors' => ['user_uuid']
                ]);
    }

    /**
     * Test error handling for overlapping monthly subscription attempt.
     */
    public function test_scan_overlapping_monthly_error(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);

        // Create existing monthly subscription that would overlap
        Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->addDays(10), // Future subscription
            'ends_at' => now()->addDays(40),
        ]);

        $auth = $this->createAndAuthenticateAdmin();

        // Try to scan QR with monthly mode - should fail due to overlap
        $response = $this->withHeaders($auth['headers'])->postJson('/api/admin/checkin/scan-qr', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'mode' => 'monthly',
        ]);

        $response->assertStatus(422)
                ->assertJsonFragment([
                    'message' => 'Overlapping monthly subscription detected.'
                ]);
    }
}