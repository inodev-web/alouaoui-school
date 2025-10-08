<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Models\Session;
use App\Services\AccessControlService;

class AccessControlTest extends TestCase
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
     * Test that free subscribers have access to everything.
     */
    public function test_free_subscriber_access_everything(): void
    {
        $freeUser = $this->createUser([
            'free_subscriber' => true,
            'free_subscriber_reason' => 'Staff member exemption'
        ]);
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);
        $service = new AccessControlService();

        // Free subscriber should have video access to any teacher
        $this->assertTrue($service->hasVideoAccess($freeUser, $teacher->uuid));

        // Free subscriber should have session access to any session
        $this->assertTrue($service->hasSessionAccess($freeUser, $session));

        // Test with another teacher as well
        $teacher2 = $this->createTeacher(['name' => 'Physics Teacher']);
        $session2 = $this->createSession($teacher2);
        
        $this->assertTrue($service->hasVideoAccess($freeUser, $teacher2->uuid));
        $this->assertTrue($service->hasSessionAccess($freeUser, $session2));
    }

    /**
     * Test that users without subscriptions have no access.
     */
    public function test_no_access_without_subscription(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);
        $service = new AccessControlService();

        // User without subscription should not have video access
        $this->assertFalse($service->hasVideoAccess($user, $teacher->uuid));

        // User without subscription should not have session access
        $this->assertFalse($service->hasSessionAccess($user, $session));
    }

    /**
     * Test that users with active subscriptions have access.
     */
    public function test_access_with_active_subscription(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);
        $service = new AccessControlService();

        // Seed Alouaoui teacher first
        $this->artisan('db:seed', ['--class' => 'TeacherSeeder']);

        // Create active subscription with Alouaoui (for video access)
        $alouaouiTeacher = Teacher::getAlouaoui();
        $this->assertNotNull($alouaouiTeacher, 'Alouaoui teacher should exist after seeding');

        $alouaouiSubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $alouaouiTeacher->uuid,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ]);

        // User with Alouaoui subscription should have video access (online content)
        $this->assertTrue($service->hasVideoAccess($user, $teacher->uuid));

        // For session access, create subscription with the actual session teacher
        $teacherSubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ]);

        // User with teacher subscription should have session access (présentiel)
        $this->assertTrue($service->hasSessionAccess($user, $session));
    }

    /**
     * Test that users with expired subscriptions have no access.
     */
    public function test_no_access_with_expired_subscription(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $session = $this->createSession($teacher);
        $service = new AccessControlService();

        // Create expired subscription
        $subscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => now()->subMonths(2),
            'ends_at' => now()->subDay(), // Expired yesterday
        ]);

        // User with expired subscription should not have video access
        $this->assertFalse($service->hasVideoAccess($user, $teacher->uuid));

        // User with expired subscription should not have session access
        $this->assertFalse($service->hasSessionAccess($user, $session));
    }

    /**
     * Test session pass access (same day only).
     */
    public function test_session_pass_access(): void
    {
        $user = $this->createUser();
        $teacher = $this->createTeacher();
        $today = now();
        $session = $this->createSession($teacher, [
            'start_time' => $today->copy()->addHour(),
            'end_time' => $today->copy()->addHours(2),
        ]);
        $service = new AccessControlService();

        // Seed Alouaoui teacher for video access tests
        $this->artisan('db:seed', ['--class' => 'TeacherSeeder']);
        $alouaouiTeacher = Teacher::getAlouaoui();
        $this->assertNotNull($alouaouiTeacher, 'Alouaoui teacher should exist after seeding');

        // Create session pass with Alouaoui (for video access)
        $alouaouiSubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $alouaouiTeacher->uuid,
            'starts_at' => $today->copy()->startOfDay(),
            'ends_at' => $today->copy()->endOfDay(),
        ]);

        // User should have video access (because they have Alouaoui subscription)
        $this->assertTrue($service->hasVideoAccess($user, $teacher->uuid));

        // Create session pass with the actual session teacher (for session access)
        $teacherSubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => $today->copy()->startOfDay(),
            'ends_at' => $today->copy()->endOfDay(),
        ]);

        // User should have session access for today's session
        $this->assertTrue($service->hasSessionAccess($user, $session));

        // Test session on different day - should not have access
        $tomorrowSession = $this->createSession($teacher, [
            'start_time' => $today->copy()->addDay()->addHour(),
            'end_time' => $today->copy()->addDay()->addHours(2),
        ]);

        $this->assertFalse($service->hasSessionAccess($user, $tomorrowSession));
    }

    /**
     * Test access for different teachers with specific subscription.
     * New business logic: Video access is ONLY through Alouaoui subscription.
     * Session access is teacher-specific.
     */
    public function test_access_limited_to_specific_teacher(): void
    {
        $user = $this->createUser();
        $teacher1 = $this->createTeacher(['name' => 'Math Teacher']);
        $teacher2 = $this->createTeacher(['name' => 'Physics Teacher']);
        $service = new AccessControlService();

        // Seed Alouaoui teacher
        $this->artisan('db:seed', ['--class' => 'TeacherSeeder']);
        $alouaouiTeacher = Teacher::getAlouaoui();
        $this->assertNotNull($alouaouiTeacher, 'Alouaoui teacher should exist after seeding');

        // Create subscription with Alouaoui (for video access)
        $alouaouiSubscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $alouaouiTeacher->uuid,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ]);

        // User should have video access for ANY teacher (because online content is Alouaoui-only)
        $this->assertTrue($service->hasVideoAccess($user, $teacher1->uuid));
        $this->assertTrue($service->hasVideoAccess($user, $teacher2->uuid));

        // For session access, create subscription only for teacher1
        $teacher1Subscription = Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher1->uuid,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ]);

        // Test session access - should be teacher-specific
        $session1 = $this->createSession($teacher1);
        $session2 = $this->createSession($teacher2);

        $this->assertTrue($service->hasSessionAccess($user, $session1));
        $this->assertFalse($service->hasSessionAccess($user, $session2));
    }
}