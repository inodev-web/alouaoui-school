<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardDataController extends Controller
{
    /**
     * Get dashboard summary data
     */
    public function getSummary(Request $request): JsonResponse
    {
        $period = $request->get('period', 'daily');
        try {
            $date = $request->get('date') ? Carbon::createFromFormat('Y-m-d', $request->get('date')) : Carbon::now();
        } catch (\Exception $e) {
            // Fallback to parsing if format is wrong
            $date = $request->get('date') ? Carbon::parse($request->get('date')) : Carbon::now();
        }
        
        $summary = DB::table('dashboard_summary')
            ->where('date', $date->format('Y-m-d'))
            ->where('period_type', $period)
            ->first();
        
        if (!$summary) {
            return response()->json([
                'message' => 'No data available for the specified period',
                'data' => null
            ], 404);
        }
        
        return response()->json([
            'period' => $period,
            'date' => $date->format('Y-m-d'),
            'data' => [
                'total_students' => $summary->total_students,
                'total_teachers' => $summary->total_teachers,
                'active_students' => $summary->active_students,
                'total_sessions' => $summary->total_sessions,
                'completed_sessions' => $summary->completed_sessions,
                'total_revenue' => (float) $summary->total_revenue,
                'total_profit' => (float) $summary->total_profit,
                'school_cut' => (float) $summary->school_cut,
                'teacher_cut' => (float) $summary->teacher_cut,
                'monthly_subscriptions' => $summary->monthly_subscriptions,
                'session_subscriptions' => $summary->session_subscriptions,
                'last_updated' => $summary->last_updated
            ]
        ]);
    }

    /**
     * Get top teachers by revenue
     */
    public function getTopTeachers(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);
        $period = $request->get('period', 'daily');
        try {
            $date = $request->get('date') ? Carbon::createFromFormat('Y-m-d', $request->get('date')) : Carbon::now();
        } catch (\Exception $e) {
            // Fallback to parsing if format is wrong
            $date = $request->get('date') ? Carbon::parse($request->get('date')) : Carbon::now();
        }
        
        $teachers = DB::table('teacher_performance')
            ->where('date', $date->format('Y-m-d'))
            ->where('period_type', $period)
            ->orderBy('total_revenue', 'desc')
            ->limit($limit)
            ->get();
        
        // If no data for the requested period, try to get daily data as fallback
        if ($teachers->isEmpty()) {
            $teachers = DB::table('teacher_performance')
                ->where('date', $date->format('Y-m-d'))
                ->where('period_type', 'daily')
                ->orderBy('total_revenue', 'desc')
                ->limit($limit)
                ->get();
        }
        
        return response()->json([
            'period' => $period,
            'date' => $date->format('Y-m-d'),
            'data' => $teachers->map(function ($teacher) {
                return [
                    'teacher_uuid' => $teacher->teacher_uuid,
                    'teacher_name' => $teacher->teacher_name,
                    'total_revenue' => (float) $teacher->total_revenue,
                    'total_profit' => (float) $teacher->total_profit,
                    'school_cut' => (float) $teacher->school_cut,
                    'teacher_cut' => (float) $teacher->teacher_cut,
                    'total_sessions' => $teacher->total_sessions,
                    'completed_sessions' => $teacher->completed_sessions,
                    'active_students' => $teacher->active_students,
                    'avg_revenue_per_session' => (float) $teacher->avg_revenue_per_session,
                    'monthly_subscriptions' => $teacher->monthly_subscriptions,
                    'session_subscriptions' => $teacher->session_subscriptions
                ];
            })
        ]);
    }

    /**
     * Get revenue vs profit time series data for charts
     */
    public function getRevenueTimeSeries(Request $request): JsonResponse
    {
        $period = $request->get('period', 'daily');
        $days = $request->get('days', 30);
        $startDate = $request->get('start_date') 
            ? Carbon::parse($request->get('start_date'))
            : Carbon::now()->subDays($days);
        $endDate = $request->get('end_date')
            ? Carbon::parse($request->get('end_date'))
            : Carbon::now();
        
        $data = DB::table('revenue_time_series')
            ->where('period_type', $period)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->orderBy('date')
            ->get();
        
        // If no data for the requested period, try to get daily data as fallback
        if ($data->isEmpty()) {
            $data = DB::table('revenue_time_series')
                ->where('period_type', 'daily')
                ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                ->orderBy('date')
                ->get();
        }
        
        return response()->json([
            'period' => $period,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'data' => $data->map(function ($item) {
                return [
                    'date' => $item->date,
                    'revenue' => (float) $item->revenue,
                    'profit' => (float) $item->profit,
                    'school_cut' => (float) $item->school_cut,
                    'teacher_cut' => (float) $item->teacher_cut,
                    'sessions_count' => $item->sessions_count,
                    'subscriptions_count' => $item->subscriptions_count
                ];
            })
        ]);
    }

    /**
     * Get dashboard cards data (optimized single query)
     */
    public function getDashboardCards(Request $request): JsonResponse
    {
        $period = $request->get('period', 'daily');
        try {
            $date = $request->get('date') ? Carbon::createFromFormat('Y-m-d', $request->get('date')) : Carbon::now();
        } catch (\Exception $e) {
            // Fallback to parsing if format is wrong
            $date = $request->get('date') ? Carbon::parse($request->get('date')) : Carbon::now();
        }
        
        // Get the most recent data for the period
        $summary = DB::table('dashboard_summary')
            ->where('date', '<=', $date->format('Y-m-d'))
            ->where('period_type', $period)
            ->orderBy('date', 'desc')
            ->first();
        
        // If no data for the requested period, try to get daily data as fallback
        if (!$summary) {
            $summary = DB::table('dashboard_summary')
                ->where('date', '<=', $date->format('Y-m-d'))
                ->where('period_type', 'daily')
                ->orderBy('date', 'desc')
                ->first();
        }
        
        // If still no data, return zero values instead of error
        if (!$summary) {
            return response()->json([
                'period' => $period,
                'date' => $date->format('Y-m-d'),
                'cards' => [
                    'total_students' => [
                        'value' => 0,
                        'label' => 'Total Students',
                        'icon' => 'users'
                    ],
                    'total_teachers' => [
                        'value' => 0,
                        'label' => 'Total Teachers',
                        'icon' => 'chalkboard-teacher'
                    ],
                    'total_revenue' => [
                        'value' => 0.0,
                        'label' => 'Total Revenue',
                        'icon' => 'dollar-sign',
                        'format' => 'currency'
                    ],
                    'total_profit' => [
                        'value' => 0.0,
                        'label' => 'Total Profit',
                        'icon' => 'chart-line',
                        'format' => 'currency'
                    ],
                    'total_sessions' => [
                        'value' => 0,
                        'label' => 'Total Sessions',
                        'icon' => 'play-circle'
                    ]
                ],
                'last_updated' => now()->toISOString()
            ]);
        }
        
        return response()->json([
            'period' => $period,
            'date' => $summary->date,
            'cards' => [
                'total_students' => [
                    'value' => $summary->total_students,
                    'label' => 'Total Students',
                    'icon' => 'users'
                ],
                'total_teachers' => [
                    'value' => $summary->total_teachers,
                    'label' => 'Total Teachers',
                    'icon' => 'chalkboard-teacher'
                ],
                'total_revenue' => [
                    'value' => (float) $summary->total_revenue,
                    'label' => 'Total Revenue',
                    'icon' => 'dollar-sign',
                    'format' => 'currency'
                ],
                'total_profit' => [
                    'value' => (float) $summary->total_profit,
                    'label' => 'Total Profit',
                    'icon' => 'chart-line',
                    'format' => 'currency'
                ],
                'total_sessions' => [
                    'value' => $summary->total_sessions,
                    'label' => 'Total Sessions',
                    'icon' => 'play-circle'
                ]
            ],
            'last_updated' => $summary->last_updated
        ]);
    }

    /**
     * Get teacher performance metrics
     */
    public function getTeacherPerformance(Request $request): JsonResponse
    {
        $teacherUuid = $request->get('teacher_uuid');
        $period = $request->get('period', 'daily');
        try {
            $date = $request->get('date') ? Carbon::createFromFormat('Y-m-d', $request->get('date')) : Carbon::now();
        } catch (\Exception $e) {
            // Fallback to parsing if format is wrong
            $date = $request->get('date') ? Carbon::parse($request->get('date')) : Carbon::now();
        }
        
        $query = DB::table('teacher_performance')
            ->where('date', $date->format('Y-m-d'))
            ->where('period_type', $period);
        
        if ($teacherUuid) {
            $query->where('teacher_uuid', $teacherUuid);
        }
        
        $performance = $query->get();
        
        return response()->json([
            'period' => $period,
            'date' => $date->format('Y-m-d'),
            'teacher_uuid' => $teacherUuid,
            'data' => $performance->map(function ($item) {
                return [
                    'teacher_uuid' => $item->teacher_uuid,
                    'teacher_name' => $item->teacher_name,
                    'total_sessions' => $item->total_sessions,
                    'completed_sessions' => $item->completed_sessions,
                    'completion_rate' => $item->total_sessions > 0 
                        ? round(($item->completed_sessions / $item->total_sessions) * 100, 2)
                        : 0,
                    'active_students' => $item->active_students,
                    'total_revenue' => (float) $item->total_revenue,
                    'total_profit' => (float) $item->total_profit,
                    'avg_revenue_per_session' => (float) $item->avg_revenue_per_session,
                    'monthly_subscriptions' => $item->monthly_subscriptions,
                    'session_subscriptions' => $item->session_subscriptions
                ];
            })
        ]);
    }

    /**
     * Get refresh status and last update times
     */
    public function getRefreshStatus(): JsonResponse
    {
        $status = DB::table('dashboard_refresh_log')
            ->select('table_name', 'period_type', 'date', 'status', 'last_updated')
            ->whereIn('id', function($query) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('dashboard_refresh_log')
                    ->groupBy('table_name', 'period_type', 'date');
            })
            ->orderBy('last_updated', 'desc')
            ->get();
        
        return response()->json([
            'refresh_status' => $status->groupBy('table_name')
        ]);
    }
}
