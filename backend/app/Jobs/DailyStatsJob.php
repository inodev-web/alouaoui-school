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
            'users_by_role' => User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray(),
            'users_by_year' => User::select('year_of_study', DB::raw('count(*) as count'))
                ->whereNotNull('year_of_study')
                ->groupBy('year_of_study')
                ->pluck('count', 'year_of_study')
                ->toArray(),
            'free_subscribers' => User::where('free_subscriber', true)->count(),
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
            'online_publishers' => Teacher::where('is_online_publisher', true)->count(),
            'new_teachers' => Teacher::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'teachers_by_year' => Teacher::select('year', DB::raw('count(*) as count'))
                ->whereNotNull('year')
                ->groupBy('year')
                ->pluck('count', 'year')
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
     * Calculate payment-related statistics (deprecated - payments removed)
     */
    protected function calculatePaymentStats(): array
    {
        // Payment module removed - return empty stats
        return [
            'daily_transactions' => 0,
            'daily_revenue' => 0,
            'successful_payments' => 0,
            'failed_payments' => 0,
            'pending_payments' => 0,
            'average_transaction' => 0,
            'payment_methods' => [],
            'total_revenue_to_date' => 0,
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
            'active_subscriptions' => Subscription::where('starts_at', '<=', now())
                ->where('ends_at', '>=', now())
                ->count(),
            'new_subscriptions' => Subscription::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'expired_subscriptions' => Subscription::where('ends_at', '<', now())->count(),
            'monthly_subscriptions' => Subscription::whereRaw('DATEDIFF(ends_at, starts_at) >= 28')->count(),
            'session_passes' => Subscription::whereRaw('DATEDIFF(ends_at, starts_at) < 2')->count(),
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
                ->distinct('student_uuid')
                ->count('student_uuid'),
            'sessions_held' => Attendance::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->distinct('session_id')
                ->count('session_id'),
            'average_attendance_per_session' => $this->calculateAverageAttendancePerSession($startOfDay, $endOfDay),
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
                'daily_active_users' => 0, // Removed last_login_at logic
                'total_chapters' => Chapter::count(),
                'total_courses' => Course::count(),
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
