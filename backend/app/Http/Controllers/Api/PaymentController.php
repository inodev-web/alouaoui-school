<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Jobs\WebhookPaymentJob;
use Illuminate\Support\Facades\Schema;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Middleware is now applied in routes/api.php
    }

    /**
     * Add cash payment (Admin only)
     */
    public function addCash(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            // accept either legacy numeric user_id or new user_uuid
            'user_id' => 'sometimes|exists:users,id',
            'user_uuid' => 'sometimes|exists:users,uuid',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'sometimes|string|max:500',
            'reference' => 'sometimes|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $paymentData = [
            'amount' => $request->amount,
            'currency' => 'DZD',
            'payment_method' => 'cash',
            'status' => 'completed',
            'reference' => $request->reference ?? 'CASH_' . strtoupper(Str::random(8)),
            'description' => $request->description ?? 'Cash payment',
            'processed_by' => $request->user()->id,
            'processed_at' => now()
        ];

        // Use user_uuid if payments table has the column and a user_uuid is provided or can be resolved
        if (Schema::hasColumn('payments', 'user_uuid') && $request->filled('user_uuid')) {
            $paymentData['user_uuid'] = $request->user_uuid;
        } elseif (Schema::hasColumn('payments', 'user_uuid') && $request->filled('user_id')) {
            // attempt to resolve user_uuid from users table
            $user = User::find($request->user_id);
            if ($user && $user->uuid) {
                $paymentData['user_uuid'] = $user->uuid;
            } else {
                $paymentData['user_id'] = $request->user_id;
            }
        } else {
            $paymentData['user_id'] = $request->user_id;
        }

        $payment = Payment::create($paymentData);

        // Load user relation for response
        $payment->load('user:id,name,email,phone');

        return response()->json([
            'message' => 'Cash payment added successfully',
            'data' => $payment
        ], 201);
    }

    /**
     * PSP Webhook handler (for payment service providers)
     */
    public function webhook(Request $request): JsonResponse
    {
        // Basic validation for provider
        $provider = $request->header('X-PSP-Provider', 'default');

        // Dispatch the job for background processing
        WebhookPaymentJob::dispatch($request->all(), $provider);

        return response()->json([
            'message' => 'Webhook received and queued for processing.'
        ], 202);
    }

    /**
     * Get user payments history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);

        // Admin can view all payments, users only their own
        $query = Payment::query();

        if ($user->role !== 'admin') {
            if (Schema::hasColumn('payments', 'user_uuid') && $user->uuid) {
                $query->where('user_uuid', $user->uuid);
            } else {
                $query->where('user_id', $user->id);
            }
        }

        if ($request->has('user_id') && $user->role === 'admin') {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('user_uuid') && $user->role === 'admin' && Schema::hasColumn('payments', 'user_uuid')) {
            $query->where('user_uuid', $request->user_uuid);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $payments = $query->with(['user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        ]);
    }

    /**
     * Get payment details
     */
    public function show(Request $request, Payment $payment): JsonResponse
    {
        $user = $request->user();

        // Check authorization
        if ($user->role !== 'admin' && $payment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment->load(['user:id,name,email,phone']);

        return response()->json([
            'data' => $payment
        ]);
    }

    /**
     * Cancel payment (Admin only, for pending payments)
     */
    public function cancel(Request $request, Payment $payment): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending payments can be cancelled'
            ], 422);
        }

        $payment->update([
            'status' => 'cancelled',
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment cancelled successfully',
            'data' => $payment
        ]);
    }

    /**
     * Get all payments with optional filtering (Admin only)
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $perPage = $request->get('per_page', 15);
        $query = Payment::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $payments = $query->with(['user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        ]);
    }

    /**
     * Approve payment (Admin only)
     */
    public function approve(Request $request, Payment $payment): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending payments can be approved'
            ], 422);
        }

        $payment->update([
            'status' => 'completed',
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        // Send notification to user (optional)
        // $payment->user->notify(new PaymentApprovedNotification($payment));

        return response()->json([
            'message' => 'Payment approved successfully',
            'data' => $payment
        ]);
    }

    /**
     * Reject payment (Admin only)
     */
    public function reject(Request $request, Payment $payment): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending payments can be rejected'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $payment->update([
            'status' => 'failed',
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
            'rejection_reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Payment rejected successfully',
            'data' => $payment
        ]);
    }

    /**
     * Get payment statistics (Admin only)
     */
    public function statistics(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $fromDate = $request->get('from_date', now()->startOfMonth());
        $toDate = $request->get('to_date', now()->endOfMonth());

        $stats = [
            'total_payments' => Payment::whereBetween('created_at', [$fromDate, $toDate])->count(),
            'completed_payments' => Payment::where('status', 'completed')
                ->whereBetween('created_at', [$fromDate, $toDate])
                ->count(),
            'total_amount' => Payment::where('status', 'completed')
                ->whereBetween('created_at', [$fromDate, $toDate])
                ->sum('amount'),
            'pending_payments' => Payment::where('status', 'pending')
                ->whereBetween('created_at', [$fromDate, $toDate])
                ->count(),
            'failed_payments' => Payment::where('status', 'failed')
                ->whereBetween('created_at', [$fromDate, $toDate])
                ->count(),
            'payment_methods' => Payment::where('status', 'completed')
                ->whereBetween('created_at', [$fromDate, $toDate])
                ->groupBy('payment_method')
                ->selectRaw('payment_method, count(*) as count, sum(amount) as total')
                ->get(),
        ];

        return response()->json([
            'data' => $stats,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ]
        ]);
    }

    /**
     * Validate webhook signature
     */
    private function validateWebhookSignature(string $payload, ?string $signature): bool
    {
        if (!$signature) {
            return false;
        }

        // Implement your PSP's signature validation logic here
        // This is a placeholder - replace with actual validation
        $expectedSignature = hash_hmac('sha256', $payload, config('app.webhook_secret', 'your-webhook-secret'));

        return hash_equals($expectedSignature, $signature);
    }
}
