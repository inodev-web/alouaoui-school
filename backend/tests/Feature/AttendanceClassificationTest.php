<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Attendance;
use App\Models\Subscription;
use App\Services\SubscriptionService;

class AttendanceClassificationTest extends TestCase
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
     * Test classification for guest user (no subscription).
     */
    public function test_guest_classification(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        // User with no subscription should be classified as 'none'
        $classification = $service->classify($user, now(), $teacher);
        $this->assertEquals('none', $classification);

        // Test with past timestamp
        $classification = $service->classify($user, now()->subDay(), $teacher);
        $this->assertEquals('none', $classification);

        // Test with future timestamp
        $classification = $service->classify($user, now()->addDay(), $teacher);
        $this->assertEquals('none', $classification);
    }

    /**
     * Test classification for free subscriber.
     */
    public function test_free_subscriber_classification(): void
    {
        $freeUser = $this->createUser([
            'free_subscriber' => true,
            'free_subscriber_reason' => 'Staff member exemption'
        ]);
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        // Free subscriber should always be classified as 'free'
        $classification = $service->classify($freeUser, now(), $teacher);
        $this->assertEquals('free', $classification);

        // Test with different timestamps
        $classification = $service->classify($freeUser, now()->subYear(), $teacher);
        $this->assertEquals('free', $classification);

        $classification = $service->classify($freeUser, now()->addYear(), $teacher);
        $this->assertEquals('free', $classification);

        // Test with different teacher
        $teacher2 = $this->createTeacher(['name' => 'Physics Teacher']);
        $classification = $service->classify($freeUser, now(), $teacher2);
        $this->assertEquals('free', $classification);
    }

    /**
     * Test classification for monthly subscriber.
     */
    public function test_monthly_classification(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        // Create monthly subscription
        $subscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->subWeek(),
            'ends_at' => now()->addWeeks(3), // Monthly subscription (4 weeks total)
        ]);

        // User with active monthly subscription should be classified as 'subscriber'
        $classification = $service->classify($user, now(), $teacher);
        $this->assertEquals('subscriber', $classification);

        // Test within subscription period
        $classification = $service->classify($user, now()->addWeek(), $teacher);
        $this->assertEquals('subscriber', $classification);

        // Test at start of subscription
        $classification = $service->classify($user, $subscription->starts_at, $teacher);
        $this->assertEquals('subscriber', $classification);

        // Test at end of subscription
        $classification = $service->classify($user, $subscription->ends_at, $teacher);
        $this->assertEquals('subscriber', $classification);
    }

    /**
     * Test classification for session pass.
     */
    public function test_session_pass_classification(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        $today = now();

        // Create session pass (same day subscription)
        $subscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => $today->copy()->startOfDay(),
            'ends_at' => $today->copy()->endOfDay(),
        ]);

        // User with session pass should be classified as 'session_pass'
        $classification = $service->classify($user, $today, $teacher);
        $this->assertEquals('session_pass', $classification);

        // Test at different times during the day
        $classification = $service->classify($user, $today->copy()->setHour(12), $teacher);
        $this->assertEquals('session_pass', $classification);

        $classification = $service->classify($user, $today->copy()->endOfDay(), $teacher);
        $this->assertEquals('session_pass', $classification);
    }

    /**
     * Test classification with expired subscription.
     */
    public function test_expired_subscription_classification(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        // Create expired subscription
        $subscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->subMonths(2),
            'ends_at' => now()->subMonth(), // Expired 1 month ago
        ]);

        // User with expired subscription should be classified as 'none'
        $classification = $service->classify($user, now(), $teacher);
        $this->assertEquals('none', $classification);

        // But within the subscription period, should work correctly
        $classification = $service->classify($user, now()->subMonths(1)->subWeek(), $teacher);
        $this->assertEquals('subscriber', $classification);
    }

    /**
     * Test classification with future subscription.
     */
    public function test_future_subscription_classification(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        // Create future subscription
        $subscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->addWeek(),
            'ends_at' => now()->addWeeks(5), // Starts next week
        ]);

        // User with future subscription should be classified as 'none' for now
        $classification = $service->classify($user, now(), $teacher);
        $this->assertEquals('none', $classification);

        // But during the subscription period, should work
        $classification = $service->classify($user, now()->addWeeks(2), $teacher);
        $this->assertEquals('subscriber', $classification);
    }

    /**
     * Test classification with multiple subscriptions (should prefer session pass).
     */
    public function test_multiple_subscriptions_classification(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $service = new SubscriptionService();

        $today = now();

        // Create monthly subscription
        $monthlySubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => $today->copy()->subWeek(),
            'ends_at' => $today->copy()->addWeeks(3),
        ]);

        // Create session pass within the monthly subscription period
        $sessionPassSubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => $today->copy()->startOfDay(),
            'ends_at' => $today->copy()->endOfDay(),
        ]);

        // Should prefer session pass classification
        $classification = $service->classify($user, $today, $teacher);
        $this->assertEquals('session_pass', $classification);

        // On other days, should be subscriber
        $classification = $service->classify($user, $today->copy()->addDay(), $teacher);
        $this->assertEquals('subscriber', $classification);
    }

    /**
     * Test classification for different teachers.
     */
    public function test_classification_different_teachers(): void
    {
        $user = $this->createUser();
        $teacher1 = $this->createTeacher(['name' => 'Math Teacher']);
        $teacher2 = $this->createTeacher(['name' => 'Physics Teacher']);
        $service = new SubscriptionService();

        // Create subscription only for teacher1
        $subscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher1->uuid,
            'starts_at' => now()->subWeek(),
            'ends_at' => now()->addWeeks(3),
        ]);

        // Should be subscriber for teacher1
        $classification = $service->classify($user, now(), $teacher1);
        $this->assertEquals('subscriber', $classification);

        // Should be none for teacher2
        $classification = $service->classify($user, now(), $teacher2);
        $this->assertEquals('none', $classification);
    }

    /**
     * Test attendance model classification functionality.
     */
    public function test_attendance_classification_storage(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = Session::create([
            'teacher_uuid' => $teacher->uuid,
            'start_time' => now()->addHour(),
            'end_time' => now()->addHours(2),
            'price' => $teacher->price_session,
            'status' => 'scheduled',
        ]);

        // Create attendance with validated_at timestamp
        $attendance = Attendance::create([
            'student_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'validated_at' => now(),
        ]);

        $this->assertNotNull($attendance->validated_at);
    }

    /**
     * Test attendance validation functionality.
     */
    public function test_attendance_validation(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = Session::create([
            'teacher_uuid' => $teacher->uuid,
            'start_time' => now()->addHour(),
            'end_time' => now()->addHours(2),
            'price' => $teacher->price_session,
            'status' => 'scheduled',
        ]);

        // Create attendance without validation
        $attendance = Attendance::create([
            'student_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'session_id' => $session->id,
            'date' => now()->toDateString(),
            'status' => 'present',
            'check_in_time' => now(),
        ]);

        $this->assertFalse($attendance->isValidated());

        // Add validation
        $attendance->update(['validated_at' => now()]);
        $this->assertTrue($attendance->isValidated());
    }
}