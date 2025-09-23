<?php

namespace App\Services;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Models\Payment;
use App\Models\Course;
use App\Models\Session;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class AccessControlService
{
    /**
     * Vérifier si un étudiant a accès aux vidéos d'un enseignant
     */
    public function canAccessVideos(User $student, Teacher $teacher): bool
    {
        // Vérifier l'abonnement actif
        $subscription = $this->getActiveSubscription($student, $teacher);

        if (!$subscription) {
            return false;
        }

        // Pour les enseignants Alouaoui : vérifier l'accès vidéos
        if ($teacher->is_alouaoui_teacher) {
            return $subscription->videos_access;
        }

        // Pour les autres enseignants : pas d'accès en ligne
        return false;
    }

    /**
     * Vérifier si un étudiant a accès aux lives d'un enseignant
     */
    public function canAccessLives(User $student, Teacher $teacher): bool
    {
        // Vérifier l'abonnement actif
        $subscription = $this->getActiveSubscription($student, $teacher);

        if (!$subscription) {
            return false;
        }

        // Pour les enseignants Alouaoui : vérifier l'accès lives
        if ($teacher->is_alouaoui_teacher) {
            return $subscription->lives_access;
        }

        // Pour les autres enseignants : pas d'accès en ligne
        return false;
    }

    /**
     * Vérifier si un étudiant a accès à l'entrée de l'école
     */
    public function canAccessSchool(User $student, Teacher $teacher = null): bool
    {
        if ($teacher) {
            // Vérifier l'abonnement spécifique à un enseignant
            $subscription = $this->getActiveSubscription($student, $teacher);
            return $subscription && $subscription->school_entry_access;
        }

        // Vérifier si l'étudiant a au moins un abonnement avec accès école
        return Subscription::where('student_id', $student->id)
            ->where('active', true)
            ->where('school_entry_access', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->exists();
    }

    /**
     * Générer une URL signée pour une vidéo
     */
    public function getSignedVideoUrl(Course $course, User $student): ?string
    {
        $teacher = $course->chapter->teacher;

        if (!$this->canAccessVideos($student, $teacher)) {
            return null;
        }

        if (!$course->video_ref) {
            return null;
        }

        // Si c'est un chemin local, générer une URL signée
        if (Storage::exists($course->video_ref)) {
            return URL::temporarySignedRoute(
                'videos.stream',
                now()->addHours(2), // Expire après 2 heures
                [
                    'course' => $course->id,
                    'user' => $student->id
                ]
            );
        }

        // Si c'est une URL externe, la retourner directement
        return $course->video_ref;
    }

    /**
     * Générer une URL signée pour un live
     */
    public function getSignedLiveUrl(Session $session, User $student): ?string
    {
        if (!$this->canAccessLives($student, $session->teacher)) {
            return null;
        }

        if (!$session->meeting_link) {
            return null;
        }

        return $session->meeting_link;
    }

    /**
     * Traiter un paiement et mettre à jour les accès
     */
    public function processPayment(Payment $payment): void
    {
        $student = $payment->student;
        $teacher = $payment->teacher;

        if ($payment->status !== 'confirmed') {
            return;
        }

        // Créer ou mettre à jour l'abonnement
        $subscription = Subscription::updateOrCreate(
            [
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'start_date' => now()->startOfMonth(),
            ],
            [
                'end_date' => now()->endOfMonth(),
                'active' => true,
            ]
        );

        // Appliquer les règles d'accès selon le type d'enseignant et de paiement
        $this->applyAccessRules($subscription, $payment);
    }

    /**
     * Appliquer les règles d'accès selon le contexte
     */
    private function applyAccessRules(Subscription $subscription, Payment $payment): void
    {
        $teacher = $subscription->teacher;

        if ($teacher->is_alouaoui_teacher) {
            // Règles pour les enseignants Alouaoui
            if ($payment->method === 'cash') {
                // Paiement cash en présentiel
                $subscription->update([
                    'videos_access' => true,
                    'lives_access' => true,
                    'school_entry_access' => true,
                    'payment_type' => 'cash_presentiel'
                ]);
            } elseif ($payment->method === 'online') {
                // Paiement en ligne
                $subscription->update([
                    'videos_access' => true,
                    'lives_access' => true,
                    'school_entry_access' => true, // Accès gratuit en présentiel
                    'payment_type' => 'online'
                ]);
            }
        } else {
            // Règles pour les autres enseignants
            if ($payment->method === 'cash') {
                // Paiement cash main-à-main uniquement
                $subscription->update([
                    'videos_access' => false,
                    'lives_access' => false,
                    'school_entry_access' => false,
                    'payment_type' => 'cash_direct'
                ]);
            }
            // Pas de paiement en ligne pour les autres enseignants
        }
    }

    /**
     * Obtenir l'abonnement actif d'un étudiant pour un enseignant
     */
    private function getActiveSubscription(User $student, Teacher $teacher): ?Subscription
    {
        return Subscription::where('student_id', $student->id)
            ->where('teacher_id', $teacher->id)
            ->where('active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();
    }

    /**
     * Vérifier les abonnements expirés et les désactiver
     */
    public function checkExpiredSubscriptions(): int
    {
        return Subscription::where('active', true)
            ->where('end_date', '<', now())
            ->update(['active' => false]);
    }

    /**
     * Obtenir le résumé des accès d'un étudiant
     */
    public function getStudentAccessSummary(User $student): array
    {
        $subscriptions = Subscription::with('teacher')
            ->where('student_id', $student->id)
            ->where('active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->get();

        $summary = [
            'videos_access' => [],
            'lives_access' => [],
            'school_entry' => false,
            'subscriptions' => []
        ];

        foreach ($subscriptions as $subscription) {
            $teacherData = [
                'teacher_id' => $subscription->teacher_id,
                'teacher_name' => $subscription->teacher->name,
                'module' => $subscription->teacher->module,
                'videos_access' => $subscription->videos_access,
                'lives_access' => $subscription->lives_access,
                'school_entry_access' => $subscription->school_entry_access,
                'payment_type' => $subscription->payment_type,
                'expires_at' => $subscription->end_date,
            ];

            $summary['subscriptions'][] = $teacherData;

            if ($subscription->videos_access) {
                $summary['videos_access'][] = $subscription->teacher_id;
            }

            if ($subscription->lives_access) {
                $summary['lives_access'][] = $subscription->teacher_id;
            }

            if ($subscription->school_entry_access) {
                $summary['school_entry'] = true;
            }
        }

        return $summary;
    }

    /**
     * Get list of chapter IDs accessible to a student
     */
    public function getAccessibleChapters(User $student): array
    {
        if ($student->role === 'admin') {
            return \App\Models\Chapter::pluck('id')->toArray();
        }

        $accessibleChapters = [];

        // Get subscriptions for Alouaoui teachers (video access)
        $alouaouiSubscriptions = $student->subscriptions()
            ->whereHas('teacher', function($query) {
                $query->where('is_alouaoui_teacher', true);
            })
            ->where('ends_at', '>', now())
            ->where('videos_access', true)
            ->with('teacher.chapters')
            ->get();

        foreach ($alouaouiSubscriptions as $subscription) {
            $chapterIds = $subscription->teacher->chapters()
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
            $accessibleChapters = array_merge($accessibleChapters, $chapterIds);
        }

        return array_unique($accessibleChapters);
    }

    /**
     * Check if student can access a specific chapter
     */
    public function canAccessChapter(User $student, \App\Models\Chapter $chapter): bool
    {
        if ($student->role === 'admin') {
            return true;
        }

        $accessibleChapters = $this->getAccessibleChapters($student);
        return in_array($chapter->id, $accessibleChapters);
    }

    /**
     * Get access type for a chapter
     */
    public function getAccessType(User $student, \App\Models\Chapter $chapter): string
    {
        if ($student->role === 'admin') {
            return 'admin';
        }

        $subscription = $this->getActiveSubscription($student, $chapter->teacher);

        if (!$subscription) {
            return 'none';
        }

        if ($chapter->teacher->is_alouaoui_teacher) {
            if ($subscription->videos_access) {
                return 'subscription_video';
            }
            if ($subscription->lives_access) {
                return 'subscription_live_only';
            }
        } else {
            return 'physical_only';
        }

        return 'none';
    }

    /**
     * Get subscription status for a student
     */
    public function getSubscriptionStatus(User $student): array
    {
        $subscriptions = $student->subscriptions()
            ->where('ends_at', '>', now())
            ->with('teacher:id,name,is_alouaoui_teacher')
            ->get();

        $status = [
            'total_active' => $subscriptions->count(),
            'alouaoui_teachers' => 0,
            'other_teachers' => 0,
            'video_access_count' => 0,
            'live_access_count' => 0,
        ];

        foreach ($subscriptions as $subscription) {
            if ($subscription->teacher->is_alouaoui_teacher) {
                $status['alouaoui_teachers']++;
                if ($subscription->videos_access) {
                    $status['video_access_count']++;
                }
                if ($subscription->lives_access) {
                    $status['live_access_count']++;
                }
            } else {
                $status['other_teachers']++;
            }
        }

        return $status;
    }

    /**
     * Get access summary for a student
     */
    public function getAccessSummary(User $student): array
    {
        $subscriptions = $student->subscriptions()
            ->where('ends_at', '>', now())
            ->where('status', 'active')
            ->with('teacher:id,name,is_alouaoui_teacher')
            ->get();

        $summary = [
            'total_active_subscriptions' => $subscriptions->count(),
            'alouaoui_teachers' => 0,
            'other_teachers' => 0,
            'videos_access' => false,
            'lives_access' => false,
            'school_entry_access' => false,
            'expiring_soon' => 0,
        ];

        foreach ($subscriptions as $subscription) {
            if ($subscription->teacher->is_alouaoui_teacher) {
                $summary['alouaoui_teachers']++;
                if ($subscription->videos_access) {
                    $summary['videos_access'] = true;
                }
                if ($subscription->lives_access) {
                    $summary['lives_access'] = true;
                }
            } else {
                $summary['other_teachers']++;
            }

            if ($subscription->school_entry_access) {
                $summary['school_entry_access'] = true;
            }

            // Check if expiring in next 7 days
            if ($subscription->ends_at->diffInDays(now()) <= 7) {
                $summary['expiring_soon']++;
            }
        }

        return $summary;
    }

    /**
     * Check if student can attend physical classes with a teacher
     */
    public function canAttendPhysicalClass(User $student, Teacher $teacher): bool
    {
        if ($student->role === 'admin') {
            return true;
        }

        // Check for active subscription that includes school entry access
        $subscription = $this->getActiveSubscription($student, $teacher);

        if (!$subscription) {
            return false;
        }

        return $subscription->school_entry_access;
    }
}
