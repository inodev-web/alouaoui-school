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
     * Create a monthly subscription (now -> now + 1 month no overflow) ensuring no overlap.
     * @throws RuntimeException
     */
    public function createMonthly(User $user, Teacher $teacher): Subscription
    {
        if ($user->isFree()) {
            throw new RuntimeException('Free subscriber does not need monthly subscription.');
        }

        $startsAt = now();
        $endsAt = now()->addMonthNoOverflow();

        // Overlap check
        $overlap = Subscription::overlapping($user->uuid, $teacher->uuid, $startsAt, $endsAt)->exists();
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
     * Create a session pass subscription (single-day) referencing session start day or today if missing.
     */
    public function createSessionPass(User $user, Teacher $teacher, Session $session): Subscription
    {
        if ($user->isFree()) {
            throw new RuntimeException('Free subscriber does not need session pass.');
        }

        $day = $session->start_time ? $session->start_time->copy()->startOfDay() : now()->startOfDay();

        return Subscription::create([
            'user_uuid' => $user->uuid,
            'teacher_uuid' => $teacher->uuid,
            'starts_at' => $day,
            'ends_at' => $day->copy()->endOfDay(),
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
