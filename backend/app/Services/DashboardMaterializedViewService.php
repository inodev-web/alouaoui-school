<?php

namespace App\Services;

use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Subscription;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DashboardMaterializedViewService
{
    /**
     * Refresh all materialized views
     */
    public function refreshAll(): void
    {
        $this->refreshDashboardSummary();
        $this->refreshTeacherPerformance();
        $this->refreshRevenueTimeSeries();
    }

    /**
     * Refresh dashboard summary for a specific date and period
     */
    public function refreshDashboardSummary(?Carbon $date = null, string $periodType = 'daily'): void
    {
        $date = $date ?? Carbon::now();
        $this->logRefreshStart('dashboard_summary', $periodType, $date);

        try {
            $dateRange = $this->getDateRange($date, $periodType);
            
            // Calculate metrics
            $metrics = $this->calculateDashboardMetrics($dateRange['start'], $dateRange['end']);
            
            // Insert or update record
            DB::table('dashboard_summary')->updateOrInsert(
                [
                    'date' => $date->format('Y-m-d'),
                    'period_type' => $periodType
                ],
                [
                    'total_students' => $metrics['total_students'],
                    'total_teachers' => $metrics['total_teachers'],
                    'active_students' => $metrics['active_students'],
                    'total_sessions' => $metrics['total_sessions'],
                    'completed_sessions' => $metrics['completed_sessions'],
                    'total_revenue' => $metrics['total_revenue'],
                    'total_profit' => $metrics['total_profit'],
                    'school_cut' => $metrics['school_cut'],
                    'teacher_cut' => $metrics['teacher_cut'],
                    'monthly_subscriptions' => $metrics['monthly_subscriptions'],
                    'session_subscriptions' => $metrics['session_subscriptions'],
                    'last_updated' => now(),
                    'updated_at' => now(),
                    'created_at' => now()
                ]
            );

            $this->logRefreshComplete('dashboard_summary', $periodType, $date, $metrics['total_students']);

        } catch (\Exception $e) {
            $this->logRefreshError('dashboard_summary', $periodType, $date, $e->getMessage());
            throw $e;
        }
    }

    /**
     * Refresh teacher performance for a specific date and period
     */
    public function refreshTeacherPerformance(?Carbon $date = null, string $periodType = 'daily'): void
    {
        $date = $date ?? Carbon::now();
        $this->logRefreshStart('teacher_performance', $periodType, $date);

        try {
            $dateRange = $this->getDateRange($date, $periodType);
            
            // Get all teachers
            $teachers = Teacher::all();
            
            foreach ($teachers as $teacher) {
                $metrics = $this->calculateTeacherMetrics($teacher, $dateRange['start'], $dateRange['end']);
                
                DB::table('teacher_performance')->updateOrInsert(
                    [
                        'teacher_uuid' => $teacher->uuid,
                        'date' => $date->format('Y-m-d'),
                        'period_type' => $periodType
                    ],
                    [
                        'teacher_name' => $teacher->name,
                        'total_sessions' => $metrics['total_sessions'],
                        'completed_sessions' => $metrics['completed_sessions'],
                        'active_students' => $metrics['active_students'],
                        'monthly_subscriptions' => $metrics['monthly_subscriptions'],
                        'session_subscriptions' => $metrics['session_subscriptions'],
                        'total_revenue' => $metrics['total_revenue'],
                        'total_profit' => $metrics['total_profit'],
                        'school_cut' => $metrics['school_cut'],
                        'teacher_cut' => $metrics['teacher_cut'],
                        'avg_revenue_per_session' => $metrics['avg_revenue_per_session'],
                        'last_updated' => now(),
                        'updated_at' => now(),
                        'created_at' => now()
                    ]
                );
            }

            $this->logRefreshComplete('teacher_performance', $periodType, $date, $teachers->count());

        } catch (\Exception $e) {
            $this->logRefreshError('teacher_performance', $periodType, $date, $e->getMessage());
            throw $e;
        }
    }

    /**
     * Refresh revenue time series for charts
     */
    public function refreshRevenueTimeSeries(?Carbon $date = null, string $periodType = 'daily'): void
    {
        $date = $date ?? Carbon::now();
        $this->logRefreshStart('revenue_time_series', $periodType, $date);

        try {
            $dateRange = $this->getDateRange($date, $periodType);
            
            $metrics = $this->calculateRevenueTimeSeriesMetrics($dateRange['start'], $dateRange['end']);
            
            DB::table('revenue_time_series')->updateOrInsert(
                [
                    'date' => $date->format('Y-m-d'),
                    'period_type' => $periodType
                ],
                [
                    'revenue' => $metrics['revenue'],
                    'profit' => $metrics['profit'],
                    'school_cut' => $metrics['school_cut'],
                    'teacher_cut' => $metrics['teacher_cut'],
                    'sessions_count' => $metrics['sessions_count'],
                    'subscriptions_count' => $metrics['subscriptions_count'],
                    'last_updated' => now(),
                    'updated_at' => now(),
                    'created_at' => now()
                ]
            );

            $this->logRefreshComplete('revenue_time_series', $periodType, $date, 1);

        } catch (\Exception $e) {
            $this->logRefreshError('revenue_time_series', $periodType, $date, $e->getMessage());
            throw $e;
        }
    }

    /**
     * Calculate dashboard metrics for a date range
     */
    private function calculateDashboardMetrics(Carbon $start, Carbon $end): array
    {
        // Total students (all time)
        $totalStudents = User::where('role', 'student')->count();
        
        // Total teachers (all time)
        $totalTeachers = Teacher::count();
        
        // Active students (with active subscriptions)
        $activeStudents = User::where('role', 'student')
            ->whereHas('subscriptions', function($q) use ($start, $end) {
                $q->where('starts_at', '<=', $end)
                  ->where('ends_at', '>=', $start);
            })->count();
        
        // Sessions in period
        $totalSessions = Session::whereBetween('start_time', [$start, $end])->count();
        $completedSessions = Session::whereBetween('start_time', [$start, $end])
            ->where('status', 'completed')->count();
        
        // Revenue calculations
        $revenueData = $this->calculateRevenueForPeriod($start, $end);
        
        return [
            'total_students' => $totalStudents,
            'total_teachers' => $totalTeachers,
            'active_students' => $activeStudents,
            'total_sessions' => $totalSessions,
            'completed_sessions' => $completedSessions,
            'total_revenue' => $revenueData['total_revenue'],
            'total_profit' => $revenueData['total_profit'],
            'school_cut' => $revenueData['school_cut'],
            'teacher_cut' => $revenueData['teacher_cut'],
            'monthly_subscriptions' => $revenueData['monthly_subscriptions'],
            'session_subscriptions' => $revenueData['session_subscriptions'],
        ];
    }

    /**
     * Calculate teacher-specific metrics
     */
    private function calculateTeacherMetrics(Teacher $teacher, Carbon $start, Carbon $end): array
    {
        // Sessions for this teacher
        $totalSessions = Session::where('teacher_uuid', $teacher->uuid)
            ->whereBetween('start_time', [$start, $end])->count();
        
        $completedSessions = Session::where('teacher_uuid', $teacher->uuid)
            ->whereBetween('start_time', [$start, $end])
            ->where('status', 'completed')->count();
        
        // Active students for this teacher
        $activeStudents = User::where('role', 'student')
            ->whereHas('subscriptions', function($q) use ($teacher, $start, $end) {
                $q->where('teacher_uuid', $teacher->uuid)
                  ->where('starts_at', '<=', $end)
                  ->where('ends_at', '>=', $start);
            })->count();
        
        // Revenue for this teacher
        $revenueData = $this->calculateTeacherRevenue($teacher, $start, $end);
        
        $avgRevenuePerSession = $completedSessions > 0 
            ? $revenueData['total_revenue'] / $completedSessions 
            : 0;
        
        return [
            'total_sessions' => $totalSessions,
            'completed_sessions' => $completedSessions,
            'active_students' => $activeStudents,
            'monthly_subscriptions' => $revenueData['monthly_subscriptions'],
            'session_subscriptions' => $revenueData['session_subscriptions'],
            'total_revenue' => $revenueData['total_revenue'],
            'total_profit' => $revenueData['total_profit'],
            'school_cut' => $revenueData['school_cut'],
            'teacher_cut' => $revenueData['teacher_cut'],
            'avg_revenue_per_session' => $avgRevenuePerSession,
        ];
    }

    /**
     * Calculate revenue for a specific period
     */
    private function calculateRevenueForPeriod(Carbon $start, Carbon $end): array
    {
        $subscriptions = Subscription::where('starts_at', '<=', $end)
            ->where('ends_at', '>=', $start)
            ->with('teacher')
            ->get();
        
        $totalRevenue = 0;
        $monthlySubscriptions = 0;
        $sessionSubscriptions = 0;
        $schoolCut = 0;
        $teacherCut = 0;
        
        foreach ($subscriptions as $subscription) {
            $teacher = $subscription->teacher;
            if (!$teacher) continue;
            
            if ($subscription->isMonthly()) {
                $revenue = $teacher->price_subscription ?? 0;
                $monthlySubscriptions++;
            } else {
                $revenue = $teacher->price_session ?? 0;
                $sessionSubscriptions++;
            }
            
            $totalRevenue += $revenue;
            
            // Calculate cuts based on teacher's percent_school
            if ($teacher->percent_school && $revenue > 0) {
                $schoolCut += ($revenue * $teacher->percent_school) / 100;
                $teacherCut += $revenue - (($revenue * $teacher->percent_school) / 100);
            } else {
                $teacherCut += $revenue;
            }
        }
        
        return [
            'total_revenue' => $totalRevenue,
            'total_profit' => $totalRevenue, // Total revenue is total profit
            'school_cut' => $schoolCut,
            'teacher_cut' => $teacherCut,
            'monthly_subscriptions' => $monthlySubscriptions,
            'session_subscriptions' => $sessionSubscriptions,
        ];
    }

    /**
     * Calculate revenue for a specific teacher
     */
    private function calculateTeacherRevenue(Teacher $teacher, Carbon $start, Carbon $end): array
    {
        $subscriptions = Subscription::where('teacher_uuid', $teacher->uuid)
            ->where('starts_at', '<=', $end)
            ->where('ends_at', '>=', $start)
            ->get();
        
        $totalRevenue = 0;
        $monthlySubscriptions = 0;
        $sessionSubscriptions = 0;
        $schoolCut = 0;
        $teacherCut = 0;
        
        foreach ($subscriptions as $subscription) {
            if ($subscription->isMonthly()) {
                $revenue = $teacher->price_subscription ?? 0;
                $monthlySubscriptions++;
            } else {
                $revenue = $teacher->price_session ?? 0;
                $sessionSubscriptions++;
            }
            
            $totalRevenue += $revenue;
            
            // Calculate cuts based on teacher's percent_school
            if ($teacher->percent_school && $revenue > 0) {
                $schoolCut += ($revenue * $teacher->percent_school) / 100;
                $teacherCut += $revenue - (($revenue * $teacher->percent_school) / 100);
            } else {
                $teacherCut += $revenue;
            }
        }
        
        return [
            'total_revenue' => $totalRevenue,
            'total_profit' => $totalRevenue,
            'school_cut' => $schoolCut,
            'teacher_cut' => $teacherCut,
            'monthly_subscriptions' => $monthlySubscriptions,
            'session_subscriptions' => $sessionSubscriptions,
        ];
    }

    /**
     * Calculate revenue time series metrics
     */
    private function calculateRevenueTimeSeriesMetrics(Carbon $start, Carbon $end): array
    {
        $revenueData = $this->calculateRevenueForPeriod($start, $end);
        
        $sessionsCount = Session::whereBetween('start_time', [$start, $end])->count();
        $subscriptionsCount = Subscription::where('starts_at', '<=', $end)
            ->where('ends_at', '>=', $start)->count();
        
        return [
            'revenue' => $revenueData['total_revenue'],
            'profit' => $revenueData['total_profit'],
            'school_cut' => $revenueData['school_cut'],
            'teacher_cut' => $revenueData['teacher_cut'],
            'sessions_count' => $sessionsCount,
            'subscriptions_count' => $subscriptionsCount,
        ];
    }

    /**
     * Get date range based on period type
     */
    private function getDateRange(Carbon $date, string $periodType): array
    {
        switch ($periodType) {
            case 'daily':
                return [
                    'start' => $date->copy()->startOfDay(),
                    'end' => $date->copy()->endOfDay()
                ];
            case 'weekly':
                return [
                    'start' => $date->copy()->startOfWeek(),
                    'end' => $date->copy()->endOfWeek()
                ];
            case 'monthly':
                return [
                    'start' => $date->copy()->startOfMonth(),
                    'end' => $date->copy()->endOfMonth()
                ];
            default:
                return [
                    'start' => $date->copy()->startOfDay(),
                    'end' => $date->copy()->endOfDay()
                ];
        }
    }

    /**
     * Log refresh start
     */
    private function logRefreshStart(string $tableName, string $periodType, Carbon $date): void
    {
        DB::table('dashboard_refresh_log')->insert([
            'table_name' => $tableName,
            'period_type' => $periodType,
            'date' => $date->format('Y-m-d'),
            'status' => 'started',
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Log refresh completion
     */
    private function logRefreshComplete(string $tableName, string $periodType, Carbon $date, int $recordsProcessed): void
    {
        DB::table('dashboard_refresh_log')
            ->where('table_name', $tableName)
            ->where('period_type', $periodType)
            ->where('date', $date->format('Y-m-d'))
            ->where('status', 'started')
            ->update([
                'status' => 'completed',
                'records_processed' => $recordsProcessed,
                'completed_at' => now(),
                'updated_at' => now()
            ]);
    }

    /**
     * Log refresh error
     */
    private function logRefreshError(string $tableName, string $periodType, Carbon $date, string $errorMessage): void
    {
        DB::table('dashboard_refresh_log')
            ->where('table_name', $tableName)
            ->where('period_type', $periodType)
            ->where('date', $date->format('Y-m-d'))
            ->where('status', 'started')
            ->update([
                'status' => 'failed',
                'error_message' => $errorMessage,
                'completed_at' => now(),
                'updated_at' => now()
            ]);
    }
}
