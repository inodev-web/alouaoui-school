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
     * Determine if user has video access (online content).
     * Rule: ONLY Alouaoui provides online content (videos, lives).
     * Access requires: free_subscriber OR active subscription with Alouaoui.
     */
    public function hasVideoAccess(User $user, string $teacherUuid = null): bool
    {
        if ($user->isFree()) {
            return true;
        }

        // Online content is ONLY available from Alouaoui
        $alouaouiTeacher = Teacher::getAlouaoui();
        if (!$alouaouiTeacher) {
            return false; // No Alouaoui found
        }

        return Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $alouaouiTeacher->uuid)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();
    }

    /**
     * Determine if user can access a specific session (présentiel).
     * Rule: free_subscriber OR active subscription with the specific teacher of the session.
     * Each teacher (including Alouaoui) can have présentiel sessions.
     */
    public function hasSessionAccess(User $user, Session $session): bool
    {
        if ($user->isFree()) {
            return true;
        }

        $teacherUuid = $session->teacher_uuid;
        if (!$teacherUuid) {
            return false; // No teacher assigned to session
        }

        $sessionTime = $session->start_time ?? now();

        return Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $teacherUuid)
            ->where('starts_at', '<=', $sessionTime)
            ->where('ends_at', '>=', $sessionTime)
            ->exists();
    }

    /**
     * Return chapters the user can access.
     * Rule: All chapters are Alouaoui's online content.
     * Access requires: free_subscriber OR active subscription with Alouaoui.
     */
    public function getAccessibleChapters(User $user)
    {
        if ($user->isFree()) {
            return Chapter::all();
        }

        // All chapters belong to Alouaoui (online content)
        $alouaouiTeacher = Teacher::getAlouaoui();
        if (!$alouaouiTeacher) {
            return collect(); // No Alouaoui found
        }

        $hasAlouaouiSubscription = Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $alouaouiTeacher->uuid)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();

        return $hasAlouaouiSubscription ? Chapter::all() : collect();
    }

    /**
     * Check if user has any active subscription with Alouaoui (online content access).
     */
    public function hasAlouaouiAccess(User $user): bool
    {
        if ($user->isFree()) {
            return true;
        }

        $alouaouiTeacher = Teacher::getAlouaoui();
        if (!$alouaouiTeacher) {
            return false;
        }

        return Subscription::where('user_uuid', $user->uuid)
            ->where('teacher_uuid', $alouaouiTeacher->uuid)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();
    }

    /**
     * Check if user has access to a specific teacher's présentiel content.
     */
    public function hasTeacherAccess(User $user, string $teacherUuid): bool
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
}
