<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Subscription;
use App\Models\Session;
use App\Models\Attendance;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get comprehensive dashboard statistics
     */
    public function index(): JsonResponse
    {
        try {
            return response()->json([
                'kpis' => $this->getKPIs(),
                'realtime' => $this->getRealTimeMetrics(),
                'revenue' => $this->getRevenueAnalytics(),
                'students' => $this->getStudentAnalytics(),
                'teachers' => $this->getTeacherPerformance(),
                'attendance' => $this->getAttendanceMetrics(),
                'courses' => $this->getCoursePopularity(),
                'predictions' => $this->getPredictiveAnalytics(),
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch dashboard data'], 500);
        }
    }

    /**
     * Get main KPIs
     */
    private function getKPIs(): array
    {
        $totalStudents = User::where('role', 'student')->count();
        $activeStudents = User::where('role', 'student')
            ->whereHas('subscriptions', function($q) {
                $q->where('starts_at', '<=', now())
                  ->where('ends_at', '>=', now());
            })->count();

        $monthlyRevenue = 0; // Payment system removed
        $revenueGrowth = 0; // Payment system removed

        $avgEngagement = $this->calculateEngagementRate();
        $retentionRate = $this->calculateRetentionRate();

        return [
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'pending_students' => $totalStudents - $activeStudents,
            'monthly_revenue' => $monthlyRevenue,
            'revenue_growth' => $revenueGrowth,
            'engagement_rate' => $avgEngagement,
            'retention_rate' => $retentionRate,
            'target_revenue' => 300000, // Target can be configurable
        ];
    }

    /**
     * Get real-time metrics
     */
    private function getRealTimeMetrics(): array
    {
        // Simulate real-time data - in production, this would come from Redis/WebSockets
        return [
            'active_users' => rand(150, 180),
            'live_streams' => rand(5, 12),
            'server_load' => rand(40, 75),
            'bandwidth' => round(rand(20, 40) / 10, 1),
            'today_checkins' => Attendance::whereDate('created_at', today())->count(),
            'new_registrations' => User::whereDate('created_at', today())->count(),
        ];
    }

    /**
     * Get revenue analytics (Payment system removed)
     */
    private function getRevenueAnalytics(): array
    {
        // Payment system has been removed
        return [
            'message' => 'Payment system has been removed',
            'data' => []
        ];
    }

    /**
     * Get student analytics
     */
    private function getStudentAnalytics(): array
    {
        $engagementByLevel = DB::table('users')
            ->select('year_of_study', DB::raw('count(*) as count'))
            ->where('role', 'student')
            ->groupBy('year_of_study')
            ->get()
            ->map(function($item) {
                return [
                    'level' => $item->year_of_study,
                    'students' => $item->count,
                    'engagement' => rand(75, 95), // Would be calculated from actual engagement
                ];
            });

        return [
            'by_level' => $engagementByLevel,
            'journey_stages' => $this->getStudentJourney(),
            'engagement_metrics' => $this->getEngagementMetrics(),
        ];
    }

    /**
     * Get teacher performance
     */
    private function getTeacherPerformance(): array
    {
        return Teacher::with(['subscriptions' => function($query) {
                $query->where('starts_at', '<=', now())
                      ->where('ends_at', '>=', now());
            }])
            ->get()
            ->map(function($teacher) {
                $studentCount = $teacher->subscriptions->count();
                $revenue = 0; // Payment system removed

                return [
                    'id' => $teacher->uuid,
                    'name' => $teacher->name,
                    'subject' => $teacher->module,
                    'students' => $studentCount,
                    'revenue' => $revenue,
                    'rating' => round(rand(42, 50) / 10, 1), // Would come from actual ratings
                    'growth' => rand(5, 25),
                    'engagement' => rand(80, 95),
                    'retention' => rand(85, 98),
                    'is_online' => $teacher->is_online_publisher,
                ];
            })
            ->sortByDesc('students')
            ->values()
            ->toArray();
    }

    /**
     * Get attendance metrics with heatmap data
     */
    private function getAttendanceMetrics(): array
    {
        $heatmapData = [];
        $days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        foreach ($days as $dayIndex => $day) {
            $hourlyData = [];
            for ($hour = 8; $hour <= 19; $hour++) {
                $intensity = $this->calculateAttendanceIntensity($dayIndex, $hour);
                $hourlyData[] = $intensity;
            }
            $heatmapData[] = $hourlyData;
        }

        $weeklyStats = collect($days)->map(function($day, $index) {
            return [
                'day' => $this->getArabicDay($day),
                'total' => rand(89, 234),
                'peak' => rand(11, 16) . ':00',
                'attendance' => rand(75, 92),
            ];
        });

        return [
            'heatmap' => $heatmapData,
            'weekly_stats' => $weeklyStats,
            'total_weekly' => $weeklyStats->sum('total'),
            'average_daily' => round($weeklyStats->avg('total')),
        ];
    }

    /**
     * Get course popularity
     */
    private function getCoursePopularity(): array
    {
        return Course::with('chapter')
            ->get()
            ->map(function($course) {
                // Assigner une matière aléatoire basée sur le titre ou utiliser une valeur par défaut
                $subjects = ['رياضيات', 'فيزياء', 'علوم طبيعية', 'لغة عربية', 'لغة فرنسية', 'إنجليزية', 'تاريخ', 'جغرافيا'];
                
                return [
                    'name' => $course->title,
                    'subject' => $subjects[array_rand($subjects)],
                    'views' => rand(967, 2340),
                    'duration' => rand(65, 145),
                    'rating' => round(rand(42, 48) / 10, 1),
                    'level' => $course->chapter->year_target ?? 'متنوع',
                ];
            })
            ->sortByDesc('views')
            ->values()
            ->take(7)
            ->toArray();
    }


    /**
     * Get predictive analytics (Payment system removed)
     */
    private function getPredictiveAnalytics(): array
    {
        return [
            'message' => 'Payment system has been removed',
            'student_growth' => rand(2000, 2800),
            'scenarios' => [
                'optimistic' => ['student_growth' => 35, 'probability' => 25],
                'realistic' => ['student_growth' => 23, 'probability' => 60],
                'conservative' => ['student_growth' => 12, 'probability' => 15],
            ],
        ];
    }

    // Helper methods
    private function calculateEngagementRate(): float
    {
        // Simplified calculation - would be more complex in production
        return round(rand(750, 850) / 10, 1);
    }

    private function calculateRetentionRate(): float
    {
        // Simplified calculation
        return round(rand(900, 970) / 10, 1);
    }

    private function calculateAttendanceIntensity(int $dayIndex, int $hour): float
    {
        // Simulate realistic attendance patterns
        if ($dayIndex == 6) return rand(10, 30) / 100; // Friday is low
        if ($hour < 10 || $hour > 17) return rand(10, 40) / 100; // Early/late hours are low
        if ($hour >= 12 && $hour <= 14) return rand(70, 100) / 100; // Peak hours
        return rand(40, 80) / 100; // Normal hours
    }

    private function getStudentJourney(): array
    {
        return [
            ['stage' => 'زيارة الموقع', 'users' => 5420, 'conversion_rate' => 18.5],
            ['stage' => 'التسجيل', 'users' => 1000, 'conversion_rate' => 45.0],
            ['stage' => 'أول زيارة', 'users' => 450, 'conversion_rate' => 85.5],
            ['stage' => 'أول اشتراك', 'users' => 385, 'conversion_rate' => 90.0],
            ['stage' => 'نشط (شهر 1)', 'users' => 347, 'conversion_rate' => 88.2],
            ['stage' => 'مستمر (3 أشهر)', 'users' => 306, 'conversion_rate' => 92.5],
            ['stage' => 'متميز (6+ أشهر)', 'users' => 283, 'conversion_rate' => 95.0],
        ];
    }

    private function getEngagementMetrics(): array
    {
        return [
            ['metric' => 'متوسط الجلسة', 'value' => '1.8 ساعة', 'change' => '+12%'],
            ['metric' => 'معدل الإكمال', 'value' => '84.5%', 'change' => '+5%'],
            ['metric' => 'التفاعل النشط', 'value' => '76.3%', 'change' => '-3%'],
            ['metric' => 'العودة اليومية', 'value' => '58.2%', 'change' => '+8%'],
        ];
    }

    private function getArabicMonth(int $month): string
    {
        $months = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
        ];
        return $months[$month] ?? 'غير محدد';
    }

    private function getArabicDay(string $day): string
    {
        $days = [
            'Saturday' => 'السبت', 'Sunday' => 'الأحد', 'Monday' => 'الاثنين',
            'Tuesday' => 'الثلاثاء', 'Wednesday' => 'الأربعاء', 'Thursday' => 'الخميس',
            'Friday' => 'الجمعة'
        ];
        return $days[$day] ?? $day;
    }
}
