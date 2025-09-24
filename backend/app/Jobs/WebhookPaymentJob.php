<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;
use App\Models\User;
use App\Models\Subscription;
use Exception;

class WebhookPaymentJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 5;

    /**
     * The maximum number of seconds the job can run.
     */
    public $timeout = 120;

    /**
     * Payment webhook data
     */
    protected array $webhookData;

    /**
     * PSP provider name
     */
    protected string $provider;

    /**
     * Create a new job instance.
     */
    public function __construct(array $webhookData, string $provider = 'default')
    {
        $this->webhookData = $webhookData;
        $this->provider = $provider;
    }

    /**
     * Execute the job - Process PSP payment webhook
     */
    public function handle(): void
    {
        try {
            Log::info("Processing payment webhook", [
                'provider' => $this->provider,
                'webhook_data' => $this->webhookData
            ]);

            // Validate webhook signature if needed
            $this->validateWebhookSignature();

            // Extract payment details based on provider
            $paymentDetails = $this->extractPaymentDetails();

            // Process the payment based on status
            $this->processPayment($paymentDetails);

            Log::info("Payment webhook processed successfully", [
                'transaction_id' => $paymentDetails['transaction_id'] ?? 'unknown'
            ]);

        } catch (Exception $e) {
            Log::error("Payment webhook processing failed: " . $e->getMessage(), [
                'webhook_data' => $this->webhookData,
                'provider' => $this->provider
            ]);

            throw $e;
        }
    }

    /**
     * Validate webhook signature based on provider
     */
    protected function validateWebhookSignature(): void
    {
        switch ($this->provider) {
            case 'cib':
                $this->validateCIBSignature();
                break;
            case 'satim':
                $this->validateSatimSignature();
                break;
            case 'chargily':
                $this->validateChargilySignature();
                break;
            default:
                // For generic webhook, skip signature validation
                break;
        }
    }

    /**
     * Validate CIB payment gateway signature
     */
    protected function validateCIBSignature(): void
    {
        $expectedSignature = $this->webhookData['signature'] ?? '';
        $calculatedSignature = hash_hmac(
            'sha256',
            json_encode($this->webhookData),
            config('payment.cib.webhook_secret')
        );

        if (!hash_equals($expectedSignature, $calculatedSignature)) {
            throw new Exception('Invalid CIB webhook signature');
        }
    }

    /**
     * Validate Satim payment gateway signature
     */
    protected function validateSatimSignature(): void
    {
        // Implement Satim-specific signature validation
        $signature = $this->webhookData['signature'] ?? '';
        $secret = config('payment.satim.webhook_secret');

        // Satim signature validation logic here
        if (empty($signature)) {
            throw new Exception('Missing Satim webhook signature');
        }
    }

    /**
     * Validate Chargily payment gateway signature
     */
    protected function validateChargilySignature(): void
    {
        $signature = $this->webhookData['signature'] ?? '';
        $secret = config('payment.chargily.webhook_secret');

        // Chargily signature validation logic here
        if (empty($signature)) {
            throw new Exception('Missing Chargily webhook signature');
        }
    }

    /**
     * Extract payment details from webhook data
     */
    protected function extractPaymentDetails(): array
    {
        switch ($this->provider) {
            case 'cib':
                return $this->extractCIBPaymentDetails();
            case 'satim':
                return $this->extractSatimPaymentDetails();
            case 'chargily':
                return $this->extractChargilyPaymentDetails();
            default:
                return $this->extractGenericPaymentDetails();
        }
    }

    /**
     * Extract CIB payment details
     */
    protected function extractCIBPaymentDetails(): array
    {
        return [
            'transaction_id' => $this->webhookData['transaction_id'] ?? null,
            'order_id' => $this->webhookData['order_id'] ?? null,
            'amount' => (float) ($this->webhookData['amount'] ?? 0),
            'currency' => $this->webhookData['currency'] ?? 'DZD',
            'status' => $this->webhookData['status'] ?? 'unknown',
            'user_id' => $this->webhookData['user_id'] ?? null,
            'payment_method' => 'CIB_CARD',
        ];
    }

    /**
     * Extract Satim payment details
     */
    protected function extractSatimPaymentDetails(): array
    {
        return [
            'transaction_id' => $this->webhookData['trans_id'] ?? null,
            'order_id' => $this->webhookData['order_ref'] ?? null,
            'amount' => (float) ($this->webhookData['amount'] ?? 0),
            'currency' => 'DZD',
            'status' => $this->webhookData['payment_status'] ?? 'unknown',
            'user_id' => $this->webhookData['custom_user_id'] ?? null,
            'payment_method' => 'SATIM_CARD',
        ];
    }

    /**
     * Extract Chargily payment details
     */
    protected function extractChargilyPaymentDetails(): array
    {
        return [
            'transaction_id' => $this->webhookData['id'] ?? null,
            'order_id' => $this->webhookData['metadata']['order_id'] ?? null,
            'amount' => (float) ($this->webhookData['amount'] ?? 0),
            'currency' => $this->webhookData['currency'] ?? 'DZD',
            'status' => $this->webhookData['status'] ?? 'unknown',
            'user_id' => $this->webhookData['metadata']['user_id'] ?? null,
            'payment_method' => 'CHARGILY',
        ];
    }

    /**
     * Extract generic payment details
     */
    protected function extractGenericPaymentDetails(): array
    {
        return [
            'transaction_id' => $this->webhookData['transaction_id'] ?? null,
            'order_id' => $this->webhookData['order_id'] ?? null,
            'amount' => (float) ($this->webhookData['amount'] ?? 0),
            'currency' => $this->webhookData['currency'] ?? 'DZD',
            'status' => $this->webhookData['status'] ?? 'unknown',
            'user_id' => $this->webhookData['user_id'] ?? null,
            'payment_method' => strtoupper($this->provider),
        ];
    }

    /**
     * Process payment based on status
     */
    protected function processPayment(array $paymentDetails): void
    {
        DB::transaction(function () use ($paymentDetails) {
            // Find or create payment record
            $payment = Payment::updateOrCreate(
                ['transaction_id' => $paymentDetails['transaction_id']],
                [
                    'user_id' => $paymentDetails['user_id'],
                    'amount' => $paymentDetails['amount'],
                    'currency' => $paymentDetails['currency'],
                    'payment_method' => $paymentDetails['payment_method'],
                    'status' => $paymentDetails['status'],
                    'provider_data' => $this->webhookData,
                    'processed_at' => now(),
                ]
            );

            // Process based on payment status
            switch (strtolower($paymentDetails['status'])) {
                case 'success':
                case 'completed':
                case 'paid':
                    $this->handleSuccessfulPayment($payment, $paymentDetails);
                    break;

                case 'failed':
                case 'declined':
                case 'cancelled':
                    $this->handleFailedPayment($payment, $paymentDetails);
                    break;

                case 'pending':
                case 'processing':
                    $this->handlePendingPayment($payment, $paymentDetails);
                    break;

                default:
                    Log::warning("Unknown payment status: {$paymentDetails['status']}", [
                        'payment_id' => $payment->id
                    ]);
                    break;
            }
        });
    }

    /**
     * Handle successful payment
     */
    protected function handleSuccessfulPayment(Payment $payment, array $details): void
    {
        // Update user balance
        $user = User::find($details['user_id']);
        if ($user) {
            $user->increment('balance', $details['amount']);

            Log::info("User balance updated", [
                'user_id' => $user->id,
                'amount_added' => $details['amount'],
                'new_balance' => $user->balance
            ]);

            // Auto-subscribe to pending subscriptions if applicable
            $this->processPendingSubscriptions($user);
        }

        // Update payment status
        $payment->update(['status' => 'completed']);
    }

    /**
     * Handle failed payment
     */
    protected function handleFailedPayment(Payment $payment, array $details): void
    {
        $payment->update(['status' => 'failed']);

        Log::warning("Payment failed", [
            'payment_id' => $payment->id,
            'user_id' => $details['user_id'],
            'amount' => $details['amount']
        ]);
    }

    /**
     * Handle pending payment
     */
    protected function handlePendingPayment(Payment $payment, array $details): void
    {
        $payment->update(['status' => 'pending']);

        Log::info("Payment pending", [
            'payment_id' => $payment->id,
            'user_id' => $details['user_id']
        ]);
    }

    /**
     * Process any pending subscriptions for the user
     */
    protected function processPendingSubscriptions(User $user): void
    {
        $pendingSubscriptions = Subscription::where('user_id', $user->id)
            ->where('status', 'pending_payment')
            ->get();

        foreach ($pendingSubscriptions as $subscription) {
            // Check if user has enough balance for this subscription
            $chapterPrice = $subscription->chapter->price ?? 0;

            if ($user->balance >= $chapterPrice) {
                $user->decrement('balance', $chapterPrice);
                $subscription->update([
                    'status' => 'active',
                    'activated_at' => now()
                ]);

                Log::info("Auto-activated subscription", [
                    'subscription_id' => $subscription->id,
                    'user_id' => $user->id,
                    'chapter_id' => $subscription->chapter_id
                ]);
            }
        }
    }

    /**
     * Handle job failure
     */
    public function failed(Exception $exception): void
    {
        Log::error("WebhookPaymentJob failed permanently", [
            'exception' => $exception->getMessage(),
            'webhook_data' => $this->webhookData,
            'provider' => $this->provider
        ]);

        // Optionally, store failed webhook for manual review
        // FailedWebhook::create([
        //     'provider' => $this->provider,
        //     'webhook_data' => $this->webhookData,
        //     'error_message' => $exception->getMessage(),
        //     'failed_at' => now()
        // ]);
    }
}
