<?php

namespace App\Services;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Models\Session;
use App\Models\Chapter;

class AccessControlService
{
    /**
     * Determine if user has video access to a teacher's content.
     * Rule: free_subscriber OR active subscription time-window with that teacher.
     */
    public function hasVideoAccess(User $user, string $teacherUuid): bool
    {
        if ($user->isFree()) {
            return true;
        }

        return Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacherUuid)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();
    }

    /**
     * Determine if user can access (attend) a specific session.
     * Rule: free_subscriber OR active subscription covering session start_time day OR same-day session pass.
     */
    public function hasSessionAccess(User $user, Session $session): bool
    {
        if ($user->isFree()) {
            return true;
        }

        $teacherUuid = $session->teacher_uuid;
        $ts = $session->start_time ?? now();

        return Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacherUuid)
            ->where('starts_at', '<=', $ts)
            ->where('ends_at', '>=', $ts)
            ->exists();
    }

    /**
     * Return IDs (or models) of chapters the user can access.
     * Simplified rule: free user => all chapters; otherwise chapters where user has active subscription for the chapter's teacher.
     * Returns collection of Chapter models for convenience.
     */
    public function getAccessibleChapters(User $user)
    {
        if ($user->isFree()) {
            return Chapter::query()->get();
        }

        $now = now();
        $teacherUuids = Subscription::where('user_uuid', $user->uuid)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->pluck('teacher_uuid');

        if ($teacherUuids->isEmpty()) {
            return collect();
        }

        return Chapter::whereIn('teacher_uuid', $teacherUuids)->get();
    }
}
