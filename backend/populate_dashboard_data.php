<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Subscription;
use Carbon\Carbon;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Populating dashboard data...\n";

try {
    // Get current data
    $totalStudents = User::where('role', 'student')->count();
    $totalTeachers = Teacher::count();
    $totalSessions = Session::count();
    $completedSessions = Session::where('status', 'completed')->count();
    
    // Calculate active students
    $activeStudents = User::where('role', 'student')
        ->whereHas('subscriptions', function($q) {
            $q->where('starts_at', '<=', now())
              ->where('ends_at', '>=', now());
        })->count();
    
    // Calculate revenue
    $subscriptions = Subscription::where('starts_at', '<=', now())
        ->where('ends_at', '>=', now())
        ->with('teacher')
        ->get();
    
    $totalRevenue = 0;
    $monthlySubscriptions = 0;
    $sessionSubscriptions = 0;
    
    foreach ($subscriptions as $subscription) {
        $teacher = $subscription->teacher;
        if ($teacher) {
            if ($subscription->isMonthly()) {
                $totalRevenue += $teacher->price_subscription ?? 0;
                $monthlySubscriptions++;
            } else {
                $totalRevenue += $teacher->price_session ?? 0;
                $sessionSubscriptions++;
            }
        }
    }
    
    // Insert dashboard summary
    DB::table('dashboard_summary')->insert([
        'date' => now()->format('Y-m-d'),
        'period_type' => 'daily',
        'total_students' => $totalStudents,
        'total_teachers' => $totalTeachers,
        'active_students' => $activeStudents,
        'total_sessions' => $totalSessions,
        'completed_sessions' => $completedSessions,
        'total_revenue' => $totalRevenue,
        'total_profit' => $totalRevenue,
        'school_cut' => 0,
        'teacher_cut' => $totalRevenue,
        'monthly_subscriptions' => $monthlySubscriptions,
        'session_subscriptions' => $sessionSubscriptions,
        'last_updated' => now(),
        'created_at' => now(),
        'updated_at' => now()
    ]);
    
    echo "Dashboard summary populated successfully!\n";
    echo "Total students: $totalStudents\n";
    echo "Total teachers: $totalTeachers\n";
    echo "Active students: $activeStudents\n";
    echo "Total sessions: $totalSessions\n";
    echo "Completed sessions: $completedSessions\n";
    echo "Total revenue: $totalRevenue\n";
    
    // Populate teacher performance
    $teachers = Teacher::all();
    foreach ($teachers as $teacher) {
        $teacherSessions = Session::where('teacher_uuid', $teacher->uuid)->count();
        $teacherCompletedSessions = Session::where('teacher_uuid', $teacher->uuid)
            ->where('status', 'completed')->count();
        
        $teacherActiveStudents = User::where('role', 'student')
            ->whereHas('subscriptions', function($q) use ($teacher) {
                $q->where('teacher_uuid', $teacher->uuid)
                  ->where('starts_at', '<=', now())
                  ->where('ends_at', '>=', now());
            })->count();
        
        $teacherRevenue = 0;
        $teacherMonthlySubscriptions = 0;
        $teacherSessionSubscriptions = 0;
        
        $teacherSubscriptions = Subscription::where('teacher_uuid', $teacher->uuid)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->get();
        
        foreach ($teacherSubscriptions as $subscription) {
            if ($subscription->isMonthly()) {
                $teacherRevenue += $teacher->price_subscription ?? 0;
                $teacherMonthlySubscriptions++;
            } else {
                $teacherRevenue += $teacher->price_session ?? 0;
                $teacherSessionSubscriptions++;
            }
        }
        
        $avgRevenuePerSession = $teacherCompletedSessions > 0 ? $teacherRevenue / $teacherCompletedSessions : 0;
        
        DB::table('teacher_performance')->insert([
            'teacher_uuid' => $teacher->uuid,
            'teacher_name' => $teacher->name,
            'date' => now()->format('Y-m-d'),
            'period_type' => 'daily',
            'total_sessions' => $teacherSessions,
            'completed_sessions' => $teacherCompletedSessions,
            'active_students' => $teacherActiveStudents,
            'monthly_subscriptions' => $teacherMonthlySubscriptions,
            'session_subscriptions' => $teacherSessionSubscriptions,
            'total_revenue' => $teacherRevenue,
            'total_profit' => $teacherRevenue,
            'school_cut' => 0,
            'teacher_cut' => $teacherRevenue,
            'avg_revenue_per_session' => $avgRevenuePerSession,
            'last_updated' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
    
    echo "Teacher performance populated successfully!\n";
    
    // Populate revenue time series
    DB::table('revenue_time_series')->insert([
        'date' => now()->format('Y-m-d'),
        'period_type' => 'daily',
        'revenue' => $totalRevenue,
        'profit' => $totalRevenue,
        'school_cut' => 0,
        'teacher_cut' => $totalRevenue,
        'sessions_count' => $totalSessions,
        'subscriptions_count' => $subscriptions->count(),
        'last_updated' => now(),
        'created_at' => now(),
        'updated_at' => now()
    ]);
    
    echo "Revenue time series populated successfully!\n";
    echo "Dashboard data population completed!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

