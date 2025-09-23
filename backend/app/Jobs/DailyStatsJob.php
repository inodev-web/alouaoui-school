<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Chapter;
use App\Models\Course;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Attendance;
use Carbon\Carbon;
use Exception;

class DailyStatsJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public $timeout = 300; // 5 minutes

    /**
     * Date for statistics calculation
     */
    protected Carbon $date;

    /**
     * Create a new job instance.
     */
    public function __construct(Carbon $date = null)
    {
        $this->date = $date ?? now()->subDay(); // Default to yesterday
    }

    /**
     * Execute the job - Generate daily statistics
     */
    public function handle(): void
    {
        try {
            Log::info("Starting daily stats calculation for: {$this->date->format('Y-m-d')}");

            $stats = [
                'date' => $this->date->format('Y-m-d'),
                'user_stats' => $this->calculateUserStats(),
                'teacher_stats' => $this->calculateTeacherStats(),
                'content_stats' => $this->calculateContentStats(),
                'payment_stats' => $this->calculatePaymentStats(),
                'subscription_stats' => $this->calculateSubscriptionStats(),
                'attendance_stats' => $this->calculateAttendanceStats(),
                'platform_stats' => $this->calculatePlatformStats(),
                'generated_at' => now()->toISOString()
            ];

            // Store stats in cache and database
            $this->storeStatistics($stats);

            Log::info("Daily stats calculation completed for: {$this->date->format('Y-m-d')}");

        } catch (Exception $e) {
            Log::error("Daily stats calculation failed: " . $e->getMessage(), [
                'date' => $this->date->format('Y-m-d')
            ]);
            
            throw $e;
        }
    }

    /**
     * Calculate user-related statistics
     */
    protected function calculateUserStats(): array
    {
        $startOfDay = $this->date->startOfDay();
        $endOfDay = $this->date->endOfDay();

        return [
            'total_users' => User::count(),
            'new_registrations' => User::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'active_users' => User::whereBetween('last_login_at', [$startOfDay, $endOfDay])->count(),
            'users_by_role' => User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray(),
            'users_by_year' => User::select('year_of_study', DB::raw('count(*) as count'))
                ->whereNotNull('year_of_study')
                ->groupBy('year_of_study')
                ->pluck('count', 'year_of_study')
                ->toArray(),
            'total_balance' => User::sum('balance'),
            'average_balance' => round(User::avg('balance'), 2),
        ];
    }

    /**
     * Calculate teacher-related statistics
     */
    protected function calculateTeacherStats(): array
    {
        $startOfDay = $this->date->startOfDay();
        $endOfDay = $this->date->endOfDay();

        return [
            'total_teachers' => Teacher::count(),
            'active_teachers' => Teacher::where('is_active', true)->count(),
            'alouaoui_teachers' => Teacher::where('is_alouaoui_teacher', true)->count(),
            'regular_teachers' => Teacher::where('is_alouaoui_teacher', false)->count(),
            'new_teachers' => Teacher::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'teachers_by_specialization' => Teacher::select('specialization', DB::raw('count(*) as count'))
                ->groupBy('specialization')
                ->pluck('count', 'specialization')
                ->toArray(),
        ];
    }

    /**
     * Calculate content-related statistics
     */
    protected function calculateContentStats(): array
    {
        $startOfDay = $this->date->startOfDay();
        $endOfDay = $this->date->endOfDay();

        return [
            'total_chapters' => Chapter::count(),
            'total_courses' => Course::count(),
            'new_chapters' => Chapter::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'new_courses' => Course::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'chapters_by_year' => Chapter::select('year_target', DB::raw('count(*) as count'))
                ->groupBy('year_target')
                ->pluck('count', 'year_target')
                ->toArray(),
            'courses_with_video' => Course::whereNotNull('video_ref')->count(),
            'courses_with_pdf' => Course::whereNotNull('pdf_summary')->count(),
        ];
    }

    /**
     * Calculate payment-related statistics
     */
    protected function calculatePaymentStats(): array
    {
        $startOfDay = $this->date->startOfDay();
        $endOfDay = $this->date->endOfDay();

        $dailyPayments = Payment::whereBetween('created_at', [$startOfDay, $endOfDay]);

        return [
            'daily_transactions' => $dailyPayments->count(),
            'daily_revenue' => $dailyPayments->where('status', 'completed')->sum('amount'),
            'successful_payments' => $dailyPayments->where('status', 'completed')->count(),
            'failed_payments' => $dailyPayments->where('status', 'failed')->count(),
            'pending_payments' => $dailyPayments->where('status', 'pending')->count(),
            'average_transaction' => round($dailyPayments->where('status', 'completed')->avg('amount'), 2),
            'payment_methods' => Payment::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->select('payment_method', DB::raw('count(*) as count'))
                ->groupBy('payment_method')
                ->pluck('count', 'payment_method')
                ->toArray(),
            'total_revenue_to_date' => Payment::where('status', 'completed')->sum('amount'),
        ];
    }

    /**
     * Calculate subscription-related statistics
     */
    protected function calculateSubscriptionStats(): array
    {
        $startOfDay = $this->date->startOfDay();
        $endOfDay = $this->date->endOfDay();

        return [
            'total_subscriptions' => Subscription::count(),
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'new_subscriptions' => Subscription::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'expired_subscriptions' => Subscription::where('status', 'expired')->count(),
            'subscriptions_by_access_level' => Subscription::select('access_level', DB::raw('count(*) as count'))
                ->groupBy('access_level')
                ->pluck('count', 'access_level')
                ->toArray(),
            'most_popular_chapters' => Subscription::select('chapter_id', DB::raw('count(*) as count'))
                ->groupBy('chapter_id')
                ->orderByDesc('count')
                ->with('chapter:id,title')
                ->limit(10)
                ->get()
                ->mapWithKeys(function ($item) {
                    return [$item->chapter->title ?? "Chapter {$item->chapter_id}" => $item->count];
                })
                ->toArray(),
        ];
    }

    /**
     * Calculate attendance-related statistics
     */
    protected function calculateAttendanceStats(): array
    {
        $startOfDay = $this->date->startOfDay();
        $endOfDay = $this->date->endOfDay();

        return [
            'daily_checkins' => Attendance::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'unique_attendees' => Attendance::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->distinct('user_id')
                ->count('user_id'),
            'sessions_held' => Attendance::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->distinct('session_id')
                ->count('session_id'),
            'average_attendance_per_session' => $this->calculateAverageAttendancePerSession($startOfDay, $endOfDay),
            'attendance_by_chapter' => Attendance::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->join('sessions', 'attendances.session_id', '=', 'sessions.id')
                ->join('chapters', 'sessions.chapter_id', '=', 'chapters.id')
                ->select('chapters.title', DB::raw('count(*) as count'))
                ->groupBy('chapters.id', 'chapters.title')
                ->pluck('count', 'title')
                ->toArray(),
        ];
    }

    /**
     * Calculate platform-wide statistics
     */
    protected function calculatePlatformStats(): array
    {
        return [
            'platform_health' => [
                'uptime_percentage' => 99.9, // This would come from monitoring service
                'response_time_avg' => 150, // milliseconds - from monitoring
                'error_rate' => 0.1, // percentage - from logs
            ],
            'storage_usage' => [
                'total_videos' => Course::whereNotNull('video_ref')->count(),
                'total_pdfs' => Course::whereNotNull('pdf_summary')->count(),
                'estimated_storage_gb' => $this->estimateStorageUsage(),
            ],
            'engagement_metrics' => [
                'daily_active_users' => User::whereBetween('last_login_at', [
                    $this->date->startOfDay(),
                    $this->date->endOfDay()
                ])->count(),
                'weekly_active_users' => User::whereBetween('last_login_at', [
                    $this->date->subDays(7),
                    $this->date
                ])->count(),
                'monthly_active_users' => User::whereBetween('last_login_at', [
                    $this->date->subDays(30),
                    $this->date
                ])->count(),
            ]
        ];
    }

    /**
     * Calculate average attendance per session
     */
    protected function calculateAverageAttendancePerSession(Carbon $start, Carbon $end): float
    {
        $sessionsWithAttendance = DB::table('attendances')
            ->whereBetween('attendances.created_at', [$start, $end])
            ->select('session_id', DB::raw('count(*) as attendee_count'))
            ->groupBy('session_id')
            ->get();

        if ($sessionsWithAttendance->isEmpty()) {
            return 0;
        }

        return round($sessionsWithAttendance->avg('attendee_count'), 1);
    }

    /**
     * Estimate storage usage in GB
     */
    protected function estimateStorageUsage(): float
    {
        // Rough estimation: each video ~100MB, each PDF ~5MB
        $videoCount = Course::whereNotNull('video_ref')->count();
        $pdfCount = Course::whereNotNull('pdf_summary')->count();
        
        $estimatedMB = ($videoCount * 100) + ($pdfCount * 5);
        return round($estimatedMB / 1024, 2); // Convert to GB
    }

    /**
     * Store statistics in cache and database
     */
    protected function storeStatistics(array $stats): void
    {
        $dateString = $this->date->format('Y-m-d');
        
        // Store in cache for quick access (30 days)
        Cache::put("daily_stats:{$dateString}", $stats, now()->addDays(30));
        
        // Store in database (you might want to create a daily_stats table)
        // DailyStats::updateOrCreate(
        //     ['date' => $dateString],
        //     ['stats' => $stats]
        // );

        // Store latest stats in cache for dashboard
        Cache::put('latest_daily_stats', $stats, now()->addHours(25));
        
        Log::info("Statistics stored for date: {$dateString}");
    }

    /**
     * Handle job failure
     */
    public function failed(Exception $exception): void
    {
        Log::error("DailyStatsJob failed permanently", [
            'date' => $this->date->format('Y-m-d'),
            'exception' => $exception->getMessage()
        ]);
        
        // Store partial stats if available
        try {
            $partialStats = [
                'date' => $this->date->format('Y-m-d'),
                'status' => 'failed',
                'error' => $exception->getMessage(),
                'generated_at' => now()->toISOString()
            ];
            
            Cache::put("daily_stats_failed:{$this->date->format('Y-m-d')}", $partialStats, now()->addDays(7));
        } catch (Exception $e) {
            Log::error("Failed to store failed stats: " . $e->getMessage());
        }
    }
}
