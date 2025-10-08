<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Models\Session;
use App\Services\SubscriptionService;
use Laravel\Sanctum\Sanctum;

class SubscriptionTest extends TestCase
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
            'email' => 'teacher' . random_int(1000, 9999) . '@example.com',
            'phone' => '0555' . random_int(100000, 999999),
            'specialization' => 'Mathematics',
            'is_alouaoui_teacher' => true,
            'is_active' => true,
            'price_subscription' => 2000.00,
            'price_session' => 500.00,
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
            'price' => $teacher->price_session,
            'status' => 'scheduled',
        ], $attributes));
    }

    /**
     * Helper method to authenticate a user with proper login flow
     */
    protected function authenticateUser(User $user): array
    {
        $deviceUuid = \Illuminate\Support\Str::uuid()->toString();

        $response = $this->postJson('/api/auth/login', [
            'login' => $user->phone,
            'password' => 'password123',
            'device_uuid' => $deviceUuid
        ]);

        $token = $response->json('data.token');

        return [
            'Authorization' => 'Bearer ' . $token,
            'X-Device-UUID' => $deviceUuid,
        ];
    }

    /**
     * Test that monthly subscriptions cannot overlap for the same (user, teacher) pair.
     */
    public function test_cannot_overlap_monthly(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        // Create first monthly subscription
        $subscription1 = $service->createMonthly($user, $teacher);
        $this->assertNotNull($subscription1);
        $this->assertTrue($subscription1->isMonthly());

        // Try to create overlapping monthly subscription - should throw exception
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Overlapping monthly subscription detected.');

        $service->createMonthly($user, $teacher);
    }

    /**
     * Test that users can have monthly subscriptions for different teachers.
     */
    public function test_can_have_monthly_for_different_teachers(): void
    {
        $user = $this->createUser();
        $teacher1 = $this->createTeacher(['name' => 'Math Teacher']);
        $teacher2 = $this->createTeacher(['name' => 'Physics Teacher']);
        $service = new SubscriptionService();

        // Create monthly subscription for teacher1
        $subscription1 = $service->createMonthly($user, $teacher1);
        $this->assertNotNull($subscription1);
        $this->assertEquals($teacher1->uuid, $subscription1->teacher_uuid);

        // Create monthly subscription for teacher2 - should work fine
        $subscription2 = $service->createMonthly($user, $teacher2);
        $this->assertNotNull($subscription2);
        $this->assertEquals($teacher2->uuid, $subscription2->teacher_uuid);

        // Verify both subscriptions exist in database
        $this->assertDatabaseHas('subscriptions', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher1->uuid,
        ]);
        $this->assertDatabaseHas('subscriptions', [
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher2->uuid,
        ]);
    }

    /**
     * Test session pass creation functionality.
     */
    public function test_session_pass_creation(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);
        $service = new SubscriptionService();

        // Create session pass subscription
        $subscription = $service->createSessionPass($user, $teacher, $session);

        $this->assertNotNull($subscription);
        $this->assertEquals($user->uuid, $subscription->user_uuid);
        $this->assertEquals($teacher->uuid, $subscription->teacher_uuid);

        // Session pass should be same day (starts at beginning, ends at end of day)
        $expectedDay = $session->start_time->copy()->startOfDay();
        $this->assertTrue($subscription->starts_at->isSameDay($expectedDay));
        $this->assertTrue($subscription->ends_at->isSameDay($expectedDay));
        $this->assertTrue($subscription->starts_at->isStartOfDay());
        $this->assertTrue($subscription->ends_at->isEndOfDay());

        // Should NOT be classified as monthly
        $this->assertFalse($subscription->isMonthly());
    }

    /**
     * Test free subscriber does not need subscriptions.
     */
    public function test_free_subscriber_cannot_create_subscription(): void
    {
        $freeUser = $this->createUser([
            'free_subscriber' => true,
            'free_subscriber_reason' => 'Staff member exemption'
        ]);
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        // Try to create monthly subscription for free user - should throw exception
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Free subscriber does not need monthly subscription.');

        $service->createMonthly($freeUser, $teacher);
    }

    /**
     * Test free subscriber cannot create session pass.
     */
    public function test_free_subscriber_cannot_create_session_pass(): void
    {
        $freeUser = $this->createUser([
            'free_subscriber' => true,
            'free_subscriber_reason' => 'Staff member exemption'
        ]);
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);
        $service = new SubscriptionService();

        // Try to create session pass for free user - should throw exception
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Free subscriber does not need session pass.');

        $service->createSessionPass($freeUser, $teacher, $session);
    }
}
