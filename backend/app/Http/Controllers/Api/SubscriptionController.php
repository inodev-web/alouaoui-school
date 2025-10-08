<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Models\Session;
use App\Services\SubscriptionService;
use App\Services\AccessControlService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptions,
        protected AccessControlService $access
    ) {}

    /**
     * Store subscription (mode = monthly | session_pass)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'teacher_uuid' => 'required|exists:teachers,uuid',
            'mode' => 'required|in:monthly,session_pass',
            'session_id' => 'sometimes|integer|exists:sessions,id',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        if ($user->isFree()) {
            return response()->json([
                'message' => 'Free subscriber does not need subscriptions'
            ], 422);
        }

        $teacher = Teacher::where('uuid', $request->teacher_uuid)->firstOrFail();
        $mode = $request->mode;

        try {
            if ($mode === 'monthly') {
                $subscription = $this->subscriptions->createMonthly($user, $teacher);
            } else { // session_pass
                $session = null;
                if ($request->filled('session_id')) {
                    $session = Session::findOrFail($request->session_id);
                } else {
                    // fallback simple session-like object for today if none provided
                    $session = new Session(['teacher_uuid' => $teacher->uuid, 'start_time' => now()]);
                }
                $subscription = $this->subscriptions->createSessionPass($user, $teacher, $session);
            }
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create subscription',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Subscription created',
            'data' => [
                'subscription' => $subscription,
                'mode' => $mode,
            ]
        ], 201);
    }

    /**
     * Active subscriptions for user (optionally filtered by teacher_uuid)
     */
    public function active(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->subscriptions()
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now());
        if ($request->filled('teacher_uuid')) {
            $query->where('teacher_uuid', $request->teacher_uuid);
        }
        $subs = $query->orderBy('ends_at')->get();
        return response()->json([
            'data' => [
                'subscriptions' => $subs,
                'count' => $subs->count(),
            ]
        ]);
    }

    /**
     * Show subscription (must belong to user unless admin)
     */
    public function show(Request $request, Subscription $subscription): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin() && $subscription->user_uuid !== $user->uuid) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json([
            'data' => $subscription
        ]);
    }
}
