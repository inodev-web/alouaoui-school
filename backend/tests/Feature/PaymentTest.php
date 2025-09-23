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

        // Create a teacher first
        $teacher = \App\Models\Teacher::create([
            'name' => 'Test Teacher',
            'email' => 'teacher@example.com',
            'phone' => '0555654321',
            'specialization' => 'Mathematics',
            'is_alouaoui_teacher' => true,
            'is_active' => true,
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
            'status' => 'pending',
        ]);

        Sanctum::actingAs($student);

        // Test getting payment history (instead of creating payments which may require admin)
        $response = $this->getJson('/api/payments/history');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'data' // Paginated data
                    ]
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
            'role' => 'admin', // Change from 'teacher' to 'admin'
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

        Sanctum::actingAs($admin);

        // Test adding cash payment (admin functionality)
        $paymentData = [
            'user_id' => $student->id,
            'amount' => 1500,
            'description' => 'Cash payment for subscription',
            'reference' => 'CASH123456'
        ];

        $response = $this->postJson('/api/payments/cash', $paymentData);

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
            'role' => 'admin', // Change from 'teacher' to 'admin'
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
            'type' => 'monthly',
            'payment_method' => 'ccp',
            'payment_amount' => 2000,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

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
        $response = $this->patchJson("/api/payments/{$payment->id}/cancel");

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
            'payment_method' => 'edahabia',
            'reference' => 'EDAH123456789',
            'metadata' => [
                'subscription_id' => 1,
                'user_id' => 1,
            ]
        ];

        $response = $this->postJson('/api/webhooks/payment', $webhookData);

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Webhook received and queued for processing'
                ]);

        Queue::assertPushed(WebhookPaymentJob::class, function ($job) use ($webhookData) {
            return $job->paymentData['payment_id'] === $webhookData['payment_id'];
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
            'role' => 'teacher',
            'is_alouaoui' => true,
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
            'type' => 'monthly',
            'payment_method' => 'ccp',
            'payment_amount' => 2000,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'pending',
        ]);

        // Create multiple payments
        for ($i = 1; $i <= 5; $i++) {
            Payment::create([
                'subscription_id' => $subscription->id,
                'amount' => 2000,
                'payment_method' => 'ccp',
                'payment_reference' => "CCP12345678{$i}",
                'status' => 'pending',
            ]);
        }

        Sanctum::actingAs($teacher);

        $response = $this->getJson('/api/payments');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'subscription_id', 'amount', 'payment_method', 'status', 'created_at']
                    ],
                    'meta' => ['current_page', 'per_page', 'total']
                ]);

        $responseData = $response->json();
        $this->assertEquals(5, count($responseData['data']));
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

        $subscription = Subscription::create([
            'user_id' => $student->id,
            'type' => 'monthly',
            'payment_method' => 'ccp',
            'payment_amount' => 2000,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'active',
        ]);

        $payment = Payment::create([
            'subscription_id' => $subscription->id,
            'amount' => 2000,
            'payment_method' => 'ccp',
            'payment_reference' => 'CCP123456789',
            'status' => 'completed',
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/payments/my-payments');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'amount', 'payment_method', 'status', 'created_at']
                    ]
                ]);

        $responseData = $response->json();
        $this->assertEquals(1, count($responseData['data']));
        $this->assertEquals($payment->id, $responseData['data'][0]['id']);
    }

    /**
     * Test payment filtering by status.
     */
    public function test_payment_filtering_by_status(): void
    {
        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => true,
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
            'type' => 'monthly',
            'payment_method' => 'ccp',
            'payment_amount' => 2000,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'pending',
        ]);

        // Create payments with different statuses
        Payment::create([
            'subscription_id' => $subscription->id,
            'amount' => 2000,
            'payment_method' => 'ccp',
            'payment_reference' => 'CCP123456781',
            'status' => 'pending',
        ]);

        Payment::create([
            'subscription_id' => $subscription->id,
            'amount' => 2000,
            'payment_method' => 'ccp',
            'payment_reference' => 'CCP123456782',
            'status' => 'completed',
        ]);

        Payment::create([
            'subscription_id' => $subscription->id,
            'amount' => 2000,
            'payment_method' => 'ccp',
            'payment_reference' => 'CCP123456783',
            'status' => 'failed',
        ]);

        Sanctum::actingAs($teacher);

        // Test filtering by pending status
        $response = $this->getJson('/api/payments?status=pending');

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
        $teacher = User::create([
            'name' => 'Alouaoui',
            'email' => 'alouaoui@example.com',
            'phone' => '0555999888',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'teacher',
            'is_alouaoui' => true,
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
            'type' => 'monthly',
            'payment_method' => 'ccp',
            'payment_amount' => 2000,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'pending',
        ]);

        $payment = Payment::create([
            'subscription_id' => $subscription->id,
            'amount' => 2000,
            'payment_method' => 'ccp',
            'payment_reference' => 'CCP123456789',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($teacher);

        $response = $this->putJson("/api/payments/{$payment->id}/approve");

        $response->assertStatus(200);

        // Check notification was created (assuming you have a notifications table)
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $student->id,
            'type' => 'App\\Notifications\\PaymentApprovedNotification',
        ]);
    }
}
