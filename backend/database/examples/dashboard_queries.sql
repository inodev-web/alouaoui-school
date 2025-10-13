-- =====================================================
-- Dashboard Materialized Views - Example SQL Queries
-- =====================================================
-- This file contains example SQL queries for the dashboard system
-- All queries are optimized for SQLite and use the materialized views

-- =====================================================
-- 1. DASHBOARD CARDS QUERIES
-- =====================================================

-- Get current dashboard summary (today)
SELECT 
    total_students,
    total_teachers,
    active_students,
    total_sessions,
    completed_sessions,
    total_revenue,
    total_profit,
    school_cut,
    teacher_cut,
    monthly_subscriptions,
    session_subscriptions,
    last_updated
FROM dashboard_summary 
WHERE date = date('now') 
AND period_type = 'daily';

-- Get dashboard summary for specific date
SELECT 
    total_students,
    total_teachers,
    active_students,
    total_sessions,
    completed_sessions,
    total_revenue,
    total_profit,
    school_cut,
    teacher_cut,
    monthly_subscriptions,
    session_subscriptions,
    last_updated
FROM dashboard_summary 
WHERE date = '2025-01-15' 
AND period_type = 'daily';

-- Get weekly summary
SELECT 
    total_students,
    total_teachers,
    active_students,
    total_sessions,
    completed_sessions,
    total_revenue,
    total_profit,
    school_cut,
    teacher_cut,
    monthly_subscriptions,
    session_subscriptions,
    last_updated
FROM dashboard_summary 
WHERE date >= date('now', 'weekday 0', '-6 days')
AND date <= date('now')
AND period_type = 'weekly';

-- =====================================================
-- 2. TOP TEACHERS QUERIES
-- =====================================================

-- Get top 10 teachers by revenue (today)
SELECT 
    teacher_uuid,
    teacher_name,
    total_revenue,
    total_profit,
    school_cut,
    teacher_cut,
    active_students,
    completed_sessions,
    avg_revenue_per_session,
    monthly_subscriptions,
    session_subscriptions
FROM teacher_performance 
WHERE date = date('now') 
AND period_type = 'daily'
ORDER BY total_revenue DESC 
LIMIT 10;

-- Get top teachers by revenue (this month)
SELECT 
    teacher_uuid,
    teacher_name,
    total_revenue,
    total_profit,
    school_cut,
    teacher_cut,
    active_students,
    completed_sessions,
    avg_revenue_per_session,
    monthly_subscriptions,
    session_subscriptions
FROM teacher_performance 
WHERE date >= date('now', 'start of month')
AND period_type = 'monthly'
ORDER BY total_revenue DESC 
LIMIT 10;

-- Get teachers with highest completion rate
SELECT 
    teacher_uuid,
    teacher_name,
    total_sessions,
    completed_sessions,
    ROUND((completed_sessions * 100.0 / total_sessions), 2) as completion_rate,
    total_revenue,
    active_students
FROM teacher_performance 
WHERE date = date('now') 
AND period_type = 'daily'
AND total_sessions > 0
ORDER BY completion_rate DESC 
LIMIT 10;

-- =====================================================
-- 3. REVENUE TIME SERIES QUERIES
-- =====================================================

-- Get revenue trend for last 30 days
SELECT 
    date,
    revenue,
    profit,
    school_cut,
    teacher_cut,
    sessions_count,
    subscriptions_count
FROM revenue_time_series 
WHERE period_type = 'daily'
AND date >= date('now', '-30 days')
ORDER BY date ASC;

-- Get weekly revenue trend for last 12 weeks
SELECT 
    date,
    revenue,
    profit,
    school_cut,
    teacher_cut,
    sessions_count,
    subscriptions_count
FROM revenue_time_series 
WHERE period_type = 'weekly'
AND date >= date('now', '-84 days')
ORDER BY date ASC;

-- Get monthly revenue trend for last 12 months
SELECT 
    date,
    revenue,
    profit,
    school_cut,
    teacher_cut,
    sessions_count,
    subscriptions_count
FROM revenue_time_series 
WHERE period_type = 'monthly'
AND date >= date('now', '-365 days')
ORDER BY date ASC;

-- =====================================================
-- 4. TEACHER PERFORMANCE QUERIES
-- =====================================================

-- Get performance for specific teacher (today)
SELECT 
    teacher_uuid,
    teacher_name,
    total_sessions,
    completed_sessions,
    ROUND((completed_sessions * 100.0 / total_sessions), 2) as completion_rate,
    active_students,
    total_revenue,
    total_profit,
    avg_revenue_per_session,
    monthly_subscriptions,
    session_subscriptions
FROM teacher_performance 
WHERE teacher_uuid = 'teacher-uuid-here'
AND date = date('now') 
AND period_type = 'daily';

-- Get performance comparison for all teachers (this week)
SELECT 
    teacher_uuid,
    teacher_name,
    total_sessions,
    completed_sessions,
    ROUND((completed_sessions * 100.0 / total_sessions), 2) as completion_rate,
    active_students,
    total_revenue,
    total_profit,
    avg_revenue_per_session,
    monthly_subscriptions,
    session_subscriptions
FROM teacher_performance 
WHERE date >= date('now', 'weekday 0', '-6 days')
AND period_type = 'weekly'
ORDER BY total_revenue DESC;

-- Get teachers with most active students
SELECT 
    teacher_uuid,
    teacher_name,
    active_students,
    total_revenue,
    total_sessions,
    completed_sessions
FROM teacher_performance 
WHERE date = date('now') 
AND period_type = 'daily'
ORDER BY active_students DESC 
LIMIT 10;

-- =====================================================
-- 5. ANALYTICS QUERIES
-- =====================================================

-- Get revenue growth rate (comparing this month to last month)
WITH current_month AS (
    SELECT 
        total_revenue,
        total_profit,
        school_cut,
        teacher_cut
    FROM dashboard_summary 
    WHERE date >= date('now', 'start of month')
    AND period_type = 'monthly'
),
last_month AS (
    SELECT 
        total_revenue,
        total_profit,
        school_cut,
        teacher_cut
    FROM dashboard_summary 
    WHERE date >= date('now', 'start of month', '-1 month')
    AND date < date('now', 'start of month')
    AND period_type = 'monthly'
)
SELECT 
    c.total_revenue as current_revenue,
    l.total_revenue as last_revenue,
    ROUND(((c.total_revenue - l.total_revenue) * 100.0 / l.total_revenue), 2) as revenue_growth_rate,
    c.total_profit as current_profit,
    l.total_profit as last_profit,
    ROUND(((c.total_profit - l.total_profit) * 100.0 / l.total_profit), 2) as profit_growth_rate
FROM current_month c, last_month l;

-- Get average revenue per teacher
SELECT 
    COUNT(*) as teacher_count,
    ROUND(AVG(total_revenue), 2) as avg_revenue_per_teacher,
    ROUND(SUM(total_revenue), 2) as total_revenue,
    ROUND(SUM(total_profit), 2) as total_profit,
    ROUND(SUM(school_cut), 2) as total_school_cut,
    ROUND(SUM(teacher_cut), 2) as total_teacher_cut
FROM teacher_performance 
WHERE date = date('now') 
AND period_type = 'daily';

-- Get subscription distribution
SELECT 
    SUM(monthly_subscriptions) as total_monthly_subscriptions,
    SUM(session_subscriptions) as total_session_subscriptions,
    SUM(monthly_subscriptions + session_subscriptions) as total_subscriptions,
    ROUND((SUM(monthly_subscriptions) * 100.0 / (SUM(monthly_subscriptions) + SUM(session_subscriptions))), 2) as monthly_percentage,
    ROUND((SUM(session_subscriptions) * 100.0 / (SUM(monthly_subscriptions) + SUM(session_subscriptions))), 2) as session_percentage
FROM dashboard_summary 
WHERE date = date('now') 
AND period_type = 'daily';

-- =====================================================
-- 6. MAINTENANCE QUERIES
-- =====================================================

-- Check refresh status
SELECT 
    table_name,
    period_type,
    date,
    status,
    started_at,
    completed_at,
    records_processed,
    error_message
FROM dashboard_refresh_log 
ORDER BY started_at DESC 
LIMIT 20;

-- Get last refresh times for each table
SELECT 
    table_name,
    period_type,
    MAX(completed_at) as last_refresh,
    COUNT(*) as total_refreshes,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_refreshes,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_refreshes
FROM dashboard_refresh_log 
GROUP BY table_name, period_type
ORDER BY last_refresh DESC;

-- Clean up old refresh logs (older than 30 days)
DELETE FROM dashboard_refresh_log 
WHERE created_at < date('now', '-30 days');

-- =====================================================
-- 7. PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Check materialized view sizes
SELECT 
    'dashboard_summary' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM dashboard_summary
UNION ALL
SELECT 
    'teacher_performance' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM teacher_performance
UNION ALL
SELECT 
    'revenue_time_series' as table_name,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM revenue_time_series;

-- Check for stale data (older than 24 hours)
SELECT 
    table_name,
    period_type,
    date,
    last_updated,
    ROUND((julianday('now') - julianday(last_updated)) * 24, 2) as hours_since_update
FROM (
    SELECT 'dashboard_summary' as table_name, period_type, date, last_updated FROM dashboard_summary
    UNION ALL
    SELECT 'teacher_performance' as table_name, period_type, date, last_updated FROM teacher_performance
    UNION ALL
    SELECT 'revenue_time_series' as table_name, period_type, date, last_updated FROM revenue_time_series
)
WHERE last_updated < datetime('now', '-24 hours')
ORDER BY hours_since_update DESC;

-- =====================================================
-- 8. CUSTOM DASHBOARD QUERIES
-- =====================================================

-- Get daily metrics for the last 7 days
SELECT 
    date,
    total_students,
    active_students,
    total_sessions,
    completed_sessions,
    total_revenue,
    total_profit,
    ROUND((completed_sessions * 100.0 / total_sessions), 2) as session_completion_rate
FROM dashboard_summary 
WHERE period_type = 'daily'
AND date >= date('now', '-7 days')
ORDER BY date ASC;

-- Get teacher performance trends (last 30 days)
SELECT 
    teacher_name,
    date,
    total_revenue,
    total_sessions,
    completed_sessions,
    active_students
FROM teacher_performance 
WHERE period_type = 'daily'
AND date >= date('now', '-30 days')
ORDER BY teacher_name, date ASC;

-- Get revenue by day of week
SELECT 
    CASE strftime('%w', date)
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday'
    END as day_of_week,
    ROUND(AVG(revenue), 2) as avg_revenue,
    ROUND(SUM(revenue), 2) as total_revenue,
    COUNT(*) as days_count
FROM revenue_time_series 
WHERE period_type = 'daily'
AND date >= date('now', '-90 days')
GROUP BY strftime('%w', date)
ORDER BY strftime('%w', date);
