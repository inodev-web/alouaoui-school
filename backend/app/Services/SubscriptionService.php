<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use Illuminate\Support\Carbon;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SubscriptionService
{
    /**
     * Create a monthly subscription with 30-day duration from end date.
     * If user has existing subscription, extend from the end date.
     * @throws RuntimeException
     */
    public function createMonthly(User $user, Teacher $teacher): Subscription
    {
        // Allow free subscribers to create subscriptions for testing purposes
        // if ($user->isFree()) {
        //     throw new RuntimeException('Free subscriber does not need monthly subscription.');
        // }

        // Check for existing subscription with this teacher
        $existingSubscription = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacher->uuid)
            ->orderBy('ends_at', 'desc')
            ->first();

        if ($existingSubscription) {
            // If there's an existing subscription, start from its end date
            $startsAt = $existingSubscription->ends_at;
            $endsAt = $startsAt->copy()->addDays(30);
        } else {
            // If no existing subscription, start from now
            $startsAt = now();
            $endsAt = $startsAt->copy()->addDays(30);
        }

        // Check for existing subscriptions that would overlap
        $existingSubscriptions = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacher->uuid)
            ->get();

        // For monthly subscriptions, we allow extending from the end date of existing subscriptions
        // Only check for overlaps if the new subscription starts before the end of an existing one
        $overlap = $existingSubscriptions->filter(function($existing) use ($startsAt, $endsAt) {
            // Check if the new subscription starts before the existing one ends
            // This would create a real overlap (not just touching)
            return $startsAt->lt($existing->ends_at) && $startsAt->ne($existing->ends_at);
        })->isNotEmpty();
            
        if ($overlap) {
            throw new RuntimeException('Overlapping monthly subscription detected.');
        }

        return Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
        ]);
    }

    /**
     * Create a session pass subscription with start_date = end_date.
     * This creates a single-day subscription for the session date.
     */
    public function createSessionPass(User $user, Teacher $teacher, Session $session): Subscription
    {
        // Allow free subscribers to create subscriptions for testing purposes
        // if ($user->isFree()) {
        //     throw new RuntimeException('Free subscriber does not need session pass.');
        // }

        // Use session start time or current time, and set start_date = end_date
        $sessionDate = $session->start_time ? $session->start_time->copy()->startOfDay() : now()->startOfDay();
        
        // For session pass, start_date = end_date (same day)
        $startsAt = $sessionDate;
        $endsAt = $sessionDate; // Same date as start

        return Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
        ]);
    }

    /**
     * Classify access context for a user at a timestamp relative to a teacher.
     * Returns one of: free | subscriber | session_pass | none
     */
    public function classify(User $user, Carbon $timestamp, Teacher $teacher): string
    {
        if ($user->isFree()) {
            return 'free';
        }

        $subs = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacher->uuid)
            ->where('starts_at', '<=', $timestamp)
            ->where('ends_at', '>=', $timestamp)
            ->orderBy('starts_at')
            ->get();

        if ($subs->isEmpty()) {
            return 'none';
        }

        // Session pass heuristic: duration < 2 days
        foreach ($subs as $sub) {
            if ($sub->starts_at->isSameDay($sub->ends_at)) {
                return 'session_pass';
            }
        }

        return 'subscriber';
    }
}
