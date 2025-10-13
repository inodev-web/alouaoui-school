<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Teacher;
use App\Models\Session;
use App\Models\Subscription;

echo "Testing Dashboard Data Calculation...\n";

try {
    // Test basic counts
    $totalStudents = User::where('role', 'student')->count();
    echo "Total students: $totalStudents\n";
    
    $totalTeachers = Teacher::count();
    echo "Total teachers: $totalTeachers\n";
    
    $totalSessions = Session::count();
    echo "Total sessions: $totalSessions\n";
    
    $totalSubscriptions = Subscription::count();
    echo "Total subscriptions: $totalSubscriptions\n";
    
    // Test active students
    $activeStudents = User::where('role', 'student')
        ->whereHas('subscriptions', function($q) {
            $q->where('starts_at', '<=', now())
              ->where('ends_at', '>=', now());
        })->count();
    echo "Active students: $activeStudents\n";
    
    // Test revenue calculation
    $subscriptions = Subscription::where('starts_at', '<=', now())
        ->where('ends_at', '>=', now())
        ->with('teacher')
        ->get();
    
    $totalRevenue = 0;
    foreach ($subscriptions as $subscription) {
        $teacher = $subscription->teacher;
        if ($teacher) {
            if ($subscription->isMonthly()) {
                $totalRevenue += $teacher->price_subscription ?? 0;
            } else {
                $totalRevenue += $teacher->price_session ?? 0;
            }
        }
    }
    echo "Total revenue: $totalRevenue\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
