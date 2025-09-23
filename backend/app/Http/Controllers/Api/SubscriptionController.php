<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Payment;
use App\Services\AccessControlService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    protected AccessControlService $accessControl;

    public function __construct(AccessControlService $accessControl)
    {
        // Middleware is now applied in routes/api.php
        $this->accessControl = $accessControl;
    }

    /**
     * Create a new subscription
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|exists:teachers,id',
            'duration_months' => 'required|integer|min:1|max:12',
            'videos_access' => 'sometimes|boolean',
            'lives_access' => 'sometimes|boolean',
            'school_entry_access' => 'sometimes|boolean',
            'payment_method' => 'required|in:cash,online',
            'amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $teacher = Teacher::findOrFail($request->teacher_id);

        // Vérifier que l'étudiant n'a pas déjà un abonnement actif avec ce professeur
        $existingSubscription = $user->subscriptions()
            ->where('teacher_id', $teacher->id)
            ->where('ends_at', '>', now())
            ->first();

        if ($existingSubscription) {
            return response()->json([
                'message' => 'You already have an active subscription with this teacher',
                'existing_subscription' => $existingSubscription
            ], 422);
        }

        // Déterminer les accès basés sur le type d'enseignant
        $videosAccess = false;
        $livesAccess = false;
        $schoolEntryAccess = false;

        if ($teacher->is_alouaoui_teacher) {
            // Pour les enseignants Alouaoui, utiliser les valeurs de la demande
            $videosAccess = $request->boolean('videos_access', false);
            $livesAccess = $request->boolean('lives_access', false);
        } else {
            // Pour les autres enseignants, toujours autoriser l'accès à l'école
            $schoolEntryAccess = true;
        }

        $schoolEntryAccess = $request->boolean('school_entry_access', $schoolEntryAccess);

        DB::beginTransaction();
        try {
            // Créer l'abonnement
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'teacher_id' => $teacher->id,
                'amount' => $request->amount,
                'videos_access' => $videosAccess,
                'lives_access' => $livesAccess,
                'school_entry_access' => $schoolEntryAccess,
                'starts_at' => now(),
                'ends_at' => now()->addMonths($request->duration_months),
                'status' => $request->payment_method === 'cash' ? 'active' : 'pending',
            ]);

            // Créer le paiement correspondant
            $payment = Payment::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'currency' => 'DZD',
                'payment_method' => $request->payment_method,
                'status' => $request->payment_method === 'cash' ? 'completed' : 'pending',
                'reference' => 'SUB_' . $subscription->id . '_' . strtoupper(uniqid()),
                'description' => "Subscription for teacher: {$teacher->name}",
                'metadata' => ['subscription_id' => $subscription->id],
                'processed_at' => $request->payment_method === 'cash' ? now() : null,
            ]);

            DB::commit();

            $subscription->load(['teacher:id,name,specialization,is_alouaoui_teacher']);

            return response()->json([
                'message' => 'Subscription created successfully',
                'data' => [
                    'subscription' => $subscription,
                    'payment' => $payment,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create subscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check active subscriptions for current user
     */
    public function checkActive(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeSubscriptions = $user->subscriptions()
            ->where('status', 'active')
            ->where('ends_at', '>', now())
            ->with(['teacher:id,name,specialization,is_alouaoui_teacher'])
            ->orderBy('ends_at', 'desc')
            ->get();

        $subscriptionSummary = $this->accessControl->getAccessSummary($user);

        return response()->json([
            'data' => [
                'subscriptions' => $activeSubscriptions,
                'summary' => $subscriptionSummary,
                'total_active' => $activeSubscriptions->count(),
            ]
        ]);
    }

    /**
     * Get subscription details
     */
    public function show(Request $request, Subscription $subscription): JsonResponse
    {
        $user = $request->user();

        // Check authorization
        if ($user->role !== 'admin' && $subscription->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $subscription->load([
            'teacher:id,name,specialization,is_alouaoui_teacher',
            'user:id,name,email,phone'
        ]);

        // Ajouter les statistiques d'utilisation si c'est l'utilisateur propriétaire
        if ($subscription->user_id === $user->id) {
            $subscription->usage_stats = [
                'days_remaining' => max(0, now()->diffInDays($subscription->ends_at, false)),
                'days_used' => now()->diffInDays($subscription->starts_at),
                'is_expiring_soon' => $subscription->ends_at->diffInDays(now()) <= 7,
            ];
        }

        return response()->json([
            'data' => $subscription
        ]);
    }

    /**
     * Extend subscription (Admin only)
     */
    public function extend(Request $request, Subscription $subscription): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'duration_months' => 'required|integer|min:1|max:12',
            'reason' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldEndDate = $subscription->ends_at;
        $newEndDate = $subscription->ends_at->addMonths($request->duration_months);

        $subscription->update([
            'ends_at' => $newEndDate,
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Subscription extended successfully',
            'data' => [
                'subscription_id' => $subscription->id,
                'old_end_date' => $oldEndDate,
                'new_end_date' => $newEndDate,
                'extended_by' => $request->duration_months . ' months',
                'reason' => $request->reason,
            ]
        ]);
    }

    /**
     * Cancel subscription (Admin only)
     */
    public function cancel(Request $request, Subscription $subscription): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
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

        if ($subscription->status === 'cancelled') {
            return response()->json([
                'message' => 'Subscription is already cancelled'
            ], 422);
        }

        $subscription->update([
            'status' => 'cancelled',
            'ends_at' => now(), // End immediately
        ]);

        return response()->json([
            'message' => 'Subscription cancelled successfully',
            'data' => [
                'subscription_id' => $subscription->id,
                'cancelled_at' => now(),
                'reason' => $request->reason,
            ]
        ]);
    }

    /**
     * List all subscriptions (Admin only)
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $perPage = $request->get('per_page', 15);
        $status = $request->get('status');
        $teacherId = $request->get('teacher_id');
        $userId = $request->get('user_id');

        $query = Subscription::with([
            'user:id,name,email,phone',
            'teacher:id,name,specialization,is_alouaoui_teacher'
        ]);

        if ($status) {
            $query->where('status', $status);
        }

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $subscriptions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'data' => $subscriptions->items(),
            'meta' => [
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
            ]
        ]);
    }

    /**
     * Get subscription statistics (Admin only)
     */
    public function statistics(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $fromDate = $request->get('from_date', now()->startOfMonth());
        $toDate = $request->get('to_date', now()->endOfMonth());

        $stats = [
            'total_subscriptions' => Subscription::whereBetween('created_at', [$fromDate, $toDate])->count(),
            'active_subscriptions' => Subscription::where('status', 'active')
                ->where('ends_at', '>', now())
                ->count(),
            'expiring_soon' => Subscription::where('status', 'active')
                ->whereBetween('ends_at', [now(), now()->addDays(7)])
                ->count(),
            'total_revenue' => Subscription::whereBetween('created_at', [$fromDate, $toDate])
                ->sum('amount'),
            'by_teacher' => Subscription::whereBetween('created_at', [$fromDate, $toDate])
                ->join('teachers', 'subscriptions.teacher_id', '=', 'teachers.id')
                ->groupBy('teacher_id', 'teachers.name')
                ->selectRaw('teacher_id, teachers.name, count(*) as count, sum(amount) as revenue')
                ->get(),
            'access_types' => [
                'videos_access' => Subscription::where('videos_access', true)
                    ->where('status', 'active')
                    ->where('ends_at', '>', now())
                    ->count(),
                'lives_access' => Subscription::where('lives_access', true)
                    ->where('status', 'active')
                    ->where('ends_at', '>', now())
                    ->count(),
                'school_entry_access' => Subscription::where('school_entry_access', true)
                    ->where('status', 'active')
                    ->where('ends_at', '>', now())
                    ->count(),
            ]
        ];

        return response()->json([
            'data' => $stats,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ]
        ]);
    }
}
