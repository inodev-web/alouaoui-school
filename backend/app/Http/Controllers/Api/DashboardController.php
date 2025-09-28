<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\Subscription;
use App\Models\Payment;
use App\Models\Teacher;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function adminDashboard(): JsonResponse
    {
        // Vérifier que l'utilisateur est admin
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $stats = [
            // Statistiques générales
            'total_students' => User::where('role', 'student')->count(),
            'total_teachers' => Teacher::where('is_active', true)->count(),
            'total_courses' => Course::count(),
            'total_chapters' => Chapter::count(),

            // Statistiques d'abonnements
            'active_subscriptions' => Subscription::where('status', 'active')
                                                  ->where('starts_at', '<=', now())
                                                  ->where('ends_at', '>=', now())
                                                  ->count(),
            'pending_subscriptions' => Subscription::where('status', 'pending')->count(),
            'expired_subscriptions' => Subscription::where('status', 'expired')->count(),
            
            // Statistiques de revenus
            'total_revenue' => Payment::where('status', 'completed')->sum('amount'),
            'monthly_revenue' => Payment::where('status', 'completed')
                                       ->whereMonth('created_at', now()->month)
                                       ->whereYear('created_at', now()->year)
                                       ->sum('amount'),
            'pending_payments' => Payment::where('status', 'pending')->count(),
            'pending_payments_amount' => Payment::where('status', 'pending')->sum('amount'),

            // Nouvelles inscriptions ce mois
            'new_students_this_month' => User::where('role', 'student')
                                            ->whereMonth('created_at', now()->month)
                                            ->whereYear('created_at', now()->year)
                                            ->count(),

            // Statistiques de croissance
            'growth_metrics' => $this->getGrowthMetrics(),
            
            // Activité récente
            'recent_activity' => $this->getRecentActivity(),
            
            // Top enseignants par revenus
            'top_teachers_by_revenue' => $this->getTopTeachersByRevenue(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get student dashboard statistics
     */
    public function studentDashboard(): JsonResponse
    {
        $user = Auth::user();
        
        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux étudiants'
            ], 403);
        }

        // Abonnement actuel
        $activeSubscription = $user->subscriptions()
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->with('teacher')
            ->first();

        // Statistiques de progression
        $totalCourses = 0;
        $accessibleCourses = 0;
        
        if ($activeSubscription) {
            $totalCourses = Course::whereHas('chapter', function($q) use ($activeSubscription) {
                $q->where('teacher_id', $activeSubscription->teacher_id);
            })->count();
            
            $accessibleCourses = $totalCourses; // Si abonné, accès à tous les cours du prof
        }

        // Cours gratuits accessibles
        $freeCourses = Course::count();

        // Derniers paiements
        $recentPayments = $user->payments()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'amount', 'status', 'created_at', 'description']);

        // Présences récentes (si système de présence activé)
        $recentAttendances = Attendance::where('user_id', $user->id)
            ->with('session')
            ->orderBy('checked_in_at', 'desc')
            ->limit(5)
            ->get();

        $stats = [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'year_of_study' => $user->year_of_study,
                'phone' => $user->phone,
            ],
            
            'subscription' => $activeSubscription ? [
                'is_active' => true,
                'teacher_name' => $activeSubscription->teacher->name,
                'expires_at' => $activeSubscription->ends_at->format('Y-m-d'),
                'days_remaining' => $activeSubscription->ends_at->diffInDays(now()),
                'access_types' => [
                    'videos' => $activeSubscription->videos_access,
                    'lives' => $activeSubscription->lives_access,
                    'school_entry' => $activeSubscription->school_entry_access,
                ]
            ] : [
                'is_active' => false,
                'message' => 'Aucun abonnement actif',
            ],

            'learning_progress' => [
                'total_courses_available' => $totalCourses,
                'accessible_courses' => $accessibleCourses,
                'free_courses_available' => $freeCourses,
                'completion_rate' => $totalCourses > 0 ? 0 : 0, // À implémenter avec un système de tracking
            ],

            'recent_payments' => $recentPayments,
            'recent_attendances' => $recentAttendances,
            
            'statistics' => [
                'total_payments' => $user->payments()->count(),
                'total_spent' => $user->payments()->where('status', 'completed')->sum('amount'),
                'total_attendances' => Attendance::where('user_id', $user->id)->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get system-wide statistics (for public display)
     */
    public function publicStats(): JsonResponse
    {
        $stats = [
            'total_students' => User::where('role', 'student')->count(),
            'total_courses' => Course::count(),
            'active_teachers' => Teacher::count(),
            'success_stories' => 150, // Static for now
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get growth metrics for admin dashboard
     */
    private function getGrowthMetrics(): array
    {
        $currentMonth = now();
        $lastMonth = now()->subMonth();

        $currentMonthStudents = User::where('role', 'student')
            ->whereMonth('created_at', $currentMonth->month)
            ->whereYear('created_at', $currentMonth->year)
            ->count();

        $lastMonthStudents = User::where('role', 'student')
            ->whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->count();

        $studentGrowth = $lastMonthStudents > 0 
            ? (($currentMonthStudents - $lastMonthStudents) / $lastMonthStudents) * 100 
            : 100;

        $currentMonthRevenue = Payment::where('status', 'completed')
            ->whereMonth('created_at', $currentMonth->month)
            ->whereYear('created_at', $currentMonth->year)
            ->sum('amount');

        $lastMonthRevenue = Payment::where('status', 'completed')
            ->whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->sum('amount');

        $revenueGrowth = $lastMonthRevenue > 0 
            ? (($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : 100;

        return [
            'student_growth_rate' => round($studentGrowth, 2),
            'revenue_growth_rate' => round($revenueGrowth, 2),
            'current_month_students' => $currentMonthStudents,
            'current_month_revenue' => $currentMonthRevenue,
        ];
    }

    /**
     * Get recent activity for admin dashboard
     */
    private function getRecentActivity(): array
    {
        return [
            'recent_registrations' => User::where('role', 'student')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'email', 'created_at']),
                
            'recent_payments' => Payment::with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'user_id', 'amount', 'status', 'created_at']),
                
            'recent_subscriptions' => Subscription::with(['user:id,name,email', 'teacher:id,name'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'user_id', 'teacher_id', 'status', 'created_at', 'ends_at']),
        ];
    }

    /**
     * Get top teachers by revenue
     */
    private function getTopTeachersByRevenue(): array
    {
        return Teacher::withSum(['subscriptions' => function($query) {
                $query->where('status', 'active');
            }], 'amount')
            ->orderBy('subscriptions_sum_amount', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'specialization'])
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'specialization' => $teacher->specialization,
                    'total_revenue' => $teacher->subscriptions_sum_amount ?? 0,
                ];
            })
            ->toArray();
    }
}
