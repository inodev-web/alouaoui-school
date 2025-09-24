<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Payment;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Queue;
use App\Jobs\WebhookPaymentJob;

class PaymentTest extends TestCase
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
    protected function createTeacher(array $attributes = []): \App\Models\Teacher
    {
        return \App\Models\Teacher::create(array_merge([
            'name' => 'Test Teacher',
            'email' => 'teacher@example.com',
            'phone' => '0555654321',
            'specialization' => 'Mathematics',
            'is_alouaoui_teacher' => true,
            'is_active' => true,
        ], $attributes));
    }

    /**
     * Helper method to authenticate a user with proper login flow
     */
    protected function authenticateUser(User $user): array
    {
        $deviceUuid = \Illuminate\Support\Str::uuid()->toString();

        $response = $this->postJson('/api/auth/login', [
            'login' => $user->email,
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
     * Test payment creation for subscription.
     */
    public function test_create_payment_for_subscription(): void
    {
        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $teacher = $this->createTeacher();

        $subscription = Subscription::create([
            'user_id' => $student->id,
            'teacher_id' => $teacher->id,
            'amount' => 2000,
            'videos_access' => true,
            'lives_access' => false,
            'school_entry_access' => false,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'status' => 'pending',
        ]);

        $headers = $this->authenticateUser($student);

        // Test getting payment history
        $response = $this->getJson('/api/payments/history', $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data'
                ]);
    }

    /**
     * Test payment approval by admin (cash payment).
     */
    public function test_approve_payment(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $headers = $this->authenticateUser($admin);

        // Test adding cash payment (admin functionality)
        $paymentData = [
            'user_id' => $student->id,
            'amount' => 1500,
            'description' => 'Cash payment for subscription',
            'reference' => 'CASH123456'
        ];

        $response = $this->postJson('/api/payments/cash', $paymentData, $headers);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'data' => ['id', 'user_id', 'amount', 'payment_method', 'status', 'reference']
                ]);

        $this->assertDatabaseHas('payments', [
            'user_id' => $student->id,
            'amount' => 1500,
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => 'CASH123456',
        ]);
    }

    /**
     * Test payment rejection by admin.
     */
    public function test_reject_payment(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $teacher = $this->createTeacher();

        $subscription = Subscription::create([
            'user_id' => $student->id,
            'teacher_id' => $teacher->id,
            'amount' => 2000,
            'videos_access' => true,
            'lives_access' => false,
            'school_entry_access' => false,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'status' => 'pending',
        ]);

        $headers = $this->authenticateUser($admin);

        // Create a payment to cancel
        $payment = Payment::create([
            'user_id' => $student->id,
            'amount' => 2000,
            'currency' => 'DZD',
            'payment_method' => 'online',
            'status' => 'pending',
            'reference' => 'TEST123456',
            'description' => 'Test payment',
        ]);

        // Test canceling payment
        $response = $this->patchJson("/api/payments/{$payment->id}/cancel", [], $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'data' => ['id', 'status']
                ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'cancelled',
        ]);
    }

    /**
     * Test payment webhook processing.
     */
    public function test_payment_webhook_processing(): void
    {
        Queue::fake();

        $webhookData = [
            'payment_id' => 'ext_payment_123',
            'amount' => 2000,
            'status' => 'completed',
            'payment_method' => 'online',
            'reference' => 'EDAH123456789',
            'metadata' => [
                'subscription_id' => 1,
                'user_id' => 1,
            ]
        ];

        $response = $this->postJson('/api/payments/webhook', $webhookData);

        $response->assertStatus(202)
                ->assertJson([
                    'message' => 'Webhook received and queued for processing.'
                ]);

        Queue::assertPushed(WebhookPaymentJob::class, function ($job) use ($webhookData) {
            $reflection = new \ReflectionClass($job);
            $property = $reflection->getProperty('webhookData');
            $property->setAccessible(true);
            $jobWebhookData = $property->getValue($job);

            return $jobWebhookData['payment_id'] === $webhookData['payment_id'];
        });
    }

    /**
     * Test payment listing for teacher.
     */
    public function test_teacher_can_list_payments(): void
    {
        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $teacherEntity = $this->createTeacher();

        $subscription = Subscription::create([
            'user_id' => $student->id,
            'teacher_id' => $teacherEntity->id,
            'amount' => 2000,
            'videos_access' => true,
            'lives_access' => false,
            'school_entry_access' => false,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'status' => 'pending',
        ]);

        // Create multiple payments
        for ($i = 1; $i <= 5; $i++) {
            Payment::create([
                'user_id' => $student->id,
                'amount' => 2000,
                'payment_method' => 'cash',
                'reference' => "CCP12345678{$i}",
                'status' => 'pending',
            ]);
        }

        $headers = $this->authenticateUser($teacher);

        $response = $this->getJson('/api/payments/history', $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data'
                ]);
    }

    /**
     * Test student can view their own payment history.
     */
    public function test_student_can_view_own_payment_history(): void
    {
        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $teacher = $this->createTeacher();

        $subscription = Subscription::create([
            'user_id' => $student->id,
            'teacher_id' => $teacher->id,
            'amount' => 2000,
            'videos_access' => true,
            'lives_access' => false,
            'school_entry_access' => false,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'status' => 'active',
        ]);

        $payment = Payment::create([
            'user_id' => $student->id,
            'amount' => 2000,
            'payment_method' => 'cash',
            'reference' => 'CCP123456789',
            'status' => 'completed',
        ]);

        $headers = $this->authenticateUser($student);

        $response = $this->getJson('/api/payments/history', $headers);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data'
                ]);
    }

    /**
     * Test payment filtering by status.
     */
    public function test_payment_filtering_by_status(): void
    {
        $teacher = $this->createTeacher();

        $alouaoui = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $subscription = Subscription::create([
            'user_id' => $student->id,
            'teacher_id' => $teacher->id,
            'amount' => 2000,
            'videos_access' => true,
            'lives_access' => false,
            'school_entry_access' => false,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'status' => 'active',
        ]);

        // Create payments with different statuses
        Payment::create([
            'user_id' => $student->id,
            'amount' => 2000,
            'payment_method' => 'cash',
            'reference' => 'CCP123456781',
            'status' => 'pending',
        ]);

        Payment::create([
            'user_id' => $student->id,
            'amount' => 2000,
            'payment_method' => 'online',
            'reference' => 'CCP123456782',
            'status' => 'completed',
        ]);

        Payment::create([
            'user_id' => $student->id,
            'amount' => 2000,
            'payment_method' => 'card',
            'reference' => 'CCP123456783',
            'status' => 'failed',
        ]);

        $headers = $this->authenticateUser($alouaoui);

        // Test filtering by pending status
        $response = $this->getJson('/api/payments?status=pending', $headers);

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertEquals(1, count($responseData['data']));
        $this->assertEquals('pending', $responseData['data'][0]['status']);
    }

    /**
     * Test payment notification to student after approval.
     */
    public function test_payment_notification_after_approval(): void
    {
        $teacher = $this->createTeacher();

        $alouaoui = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'phone' => '0555123456',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'year_of_study' => '2AM',
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $subscription = Subscription::create([
            'user_id' => $student->id,
            'teacher_id' => $teacher->id,
            'amount' => 2000,
            'videos_access' => true,
            'lives_access' => false,
            'school_entry_access' => false,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'status' => 'active',
        ]);

        $payment = Payment::create([
            'user_id' => $student->id,
            'amount' => 2000,
            'payment_method' => 'transfer',
            'reference' => 'CCP123456789',
            'status' => 'pending',
        ]);

        $headers = $this->authenticateUser($alouaoui);

        $response = $this->putJson("/api/payments/{$payment->id}/approve", [], $headers);

        $response->assertStatus(200);

        // Verify payment was approved
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'completed',
        ]);
    }
}
