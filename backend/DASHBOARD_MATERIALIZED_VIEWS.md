# 📊 Dashboard Materialized Views Documentation

## Overview

This document describes the optimized materialized views system for the Alouaoui School dashboard, designed to provide fast, efficient access to aggregated metrics and analytics data.

## 🏗️ Database Schema

### Materialized Views Tables

#### 1. `dashboard_summary`
Stores aggregated dashboard metrics for different time periods.

```sql
CREATE TABLE dashboard_summary (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    total_students INTEGER NOT NULL,
    total_teachers INTEGER NOT NULL,
    active_students INTEGER NOT NULL,
    total_sessions INTEGER NOT NULL,
    completed_sessions INTEGER NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_profit DECIMAL(12,2) DEFAULT 0,
    school_cut DECIMAL(12,2) DEFAULT 0,
    teacher_cut DECIMAL(12,2) DEFAULT 0,
    monthly_subscriptions INTEGER DEFAULT 0,
    session_subscriptions INTEGER DEFAULT 0,
    last_updated TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_date_period (date, period_type),
    INDEX idx_last_updated (last_updated)
);
```

#### 2. `teacher_performance`
Stores teacher-specific performance metrics.

```sql
CREATE TABLE teacher_performance (
    id BIGINT PRIMARY KEY,
    teacher_uuid VARCHAR(36) NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    total_sessions INTEGER NOT NULL,
    completed_sessions INTEGER NOT NULL,
    active_students INTEGER NOT NULL,
    monthly_subscriptions INTEGER DEFAULT 0,
    session_subscriptions INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_profit DECIMAL(12,2) DEFAULT 0,
    school_cut DECIMAL(12,2) DEFAULT 0,
    teacher_cut DECIMAL(12,2) DEFAULT 0,
    avg_revenue_per_session DECIMAL(8,2) DEFAULT 0,
    last_updated TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (teacher_uuid) REFERENCES teachers(uuid) ON DELETE CASCADE,
    INDEX idx_teacher_date_period (teacher_uuid, date, period_type),
    INDEX idx_date_period (date, period_type),
    INDEX idx_total_revenue (total_revenue),
    INDEX idx_last_updated (last_updated)
);
```

#### 3. `revenue_time_series`
Stores time-series data for revenue charts.

```sql
CREATE TABLE revenue_time_series (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    revenue DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(12,2) DEFAULT 0,
    school_cut DECIMAL(12,2) DEFAULT 0,
    teacher_cut DECIMAL(12,2) DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    subscriptions_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_date_period (date, period_type),
    INDEX idx_last_updated (last_updated)
);
```

## 📈 Metric Calculations

### Revenue Calculation Logic

Since the payment system has been removed, revenue is calculated based on subscription prices:

1. **Monthly Subscriptions**: Uses `teachers.price_subscription`
2. **Session Subscriptions**: Uses `teachers.price_session`
3. **Profit Distribution**: Based on `teachers.percent_school`
   - School Cut = `(revenue * percent_school) / 100`
   - Teacher Cut = `revenue - school_cut`

### Key Metrics

#### Dashboard Cards
- **Total Students**: Count of all users with `role = 'student'`
- **Total Teachers**: Count of all teachers
- **Total Revenue**: Sum of subscription prices for active subscriptions
- **Total Profit**: Same as total revenue (no external costs)
- **Total Sessions**: Count of sessions in the period

#### Teacher Performance
- **Revenue per Teacher**: Sum of subscription prices for teacher's active subscriptions
- **Average Revenue per Session**: `total_revenue / completed_sessions`
- **Active Students**: Students with active subscriptions to the teacher
- **Completion Rate**: `(completed_sessions / total_sessions) * 100`

## 🔄 Refresh Strategy

### Automatic Refresh Schedule
- **Daily**: 2:00 AM - Refreshes daily metrics
- **Weekly**: Sunday 3:00 AM - Refreshes weekly aggregations
- **Monthly**: 1st of month 4:00 AM - Refreshes monthly aggregations

### Manual Refresh
```bash
# Refresh all views
php artisan dashboard:refresh --all

# Refresh specific view
php artisan dashboard:refresh --summary --period=daily
php artisan dashboard:refresh --teachers --period=weekly
php artisan dashboard:refresh --revenue --period=monthly

# Refresh for specific date
php artisan dashboard:refresh --all --date=2025-01-15
```

### Trigger-Based Refresh
The system can be configured to refresh views when data changes by adding triggers to source tables.

## 🚀 API Endpoints

### Dashboard Cards
```http
GET /api/dashboard/data/cards?period=daily&date=2025-01-15
```

Response:
```json
{
  "period": "daily",
  "date": "2025-01-15",
  "cards": {
    "total_students": {
      "value": 150,
      "label": "Total Students",
      "icon": "users"
    },
    "total_teachers": {
      "value": 8,
      "label": "Total Teachers",
      "icon": "chalkboard-teacher"
    },
    "total_revenue": {
      "value": 25000.00,
      "label": "Total Revenue",
      "icon": "dollar-sign",
      "format": "currency"
    },
    "total_profit": {
      "value": 25000.00,
      "label": "Total Profit",
      "icon": "chart-line",
      "format": "currency"
    },
    "total_sessions": {
      "value": 45,
      "label": "Total Sessions",
      "icon": "play-circle"
    }
  }
}
```

### Top Teachers by Revenue
```http
GET /api/dashboard/data/top-teachers?limit=10&period=daily
```

### Revenue Time Series
```http
GET /api/dashboard/data/revenue-time-series?period=daily&days=30
```

### Teacher Performance
```http
GET /api/dashboard/data/teacher-performance?teacher_uuid=xxx&period=daily
```

## 📊 Example SQL Queries

### Get Dashboard Summary for Today
```sql
SELECT 
    total_students,
    total_teachers,
    active_students,
    total_sessions,
    completed_sessions,
    total_revenue,
    total_profit,
    school_cut,
    teacher_cut
FROM dashboard_summary 
WHERE date = CURDATE() 
AND period_type = 'daily';
```

### Get Top 10 Teachers by Revenue (This Month)
```sql
SELECT 
    teacher_name,
    total_revenue,
    total_profit,
    school_cut,
    teacher_cut,
    active_students,
    completed_sessions,
    avg_revenue_per_session
FROM teacher_performance 
WHERE date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
AND period_type = 'monthly'
ORDER BY total_revenue DESC 
LIMIT 10;
```

### Get Revenue Trend (Last 30 Days)
```sql
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
AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY date ASC;
```

### Get Teacher Performance Comparison
```sql
SELECT 
    teacher_name,
    total_revenue,
    total_sessions,
    completed_sessions,
    ROUND((completed_sessions / total_sessions) * 100, 2) as completion_rate,
    active_students,
    avg_revenue_per_session
FROM teacher_performance 
WHERE date = CURDATE() 
AND period_type = 'daily'
ORDER BY total_revenue DESC;
```

## 🔧 Performance Optimizations

### Indexes Added
1. **Composite indexes** on frequently queried columns
2. **Date-based indexes** for time-series queries
3. **Foreign key indexes** for join performance
4. **Revenue-based indexes** for sorting operations

### Query Optimizations
1. **Materialized views** eliminate complex joins at query time
2. **Pre-aggregated data** reduces calculation overhead
3. **Indexed lookups** instead of full table scans
4. **Batch processing** for refresh operations

## 📝 Maintenance

### Log Cleanup
Old refresh logs are automatically cleaned up after 30 days to prevent database bloat.

### Monitoring
Check refresh status:
```http
GET /api/dashboard/data/refresh-status
```

### Troubleshooting
1. **Stale Data**: Run manual refresh command
2. **Performance Issues**: Check index usage and query plans
3. **Memory Issues**: Consider reducing batch sizes in refresh jobs

## 🎯 Benefits

1. **Fast Dashboard Loading**: Pre-calculated metrics load instantly
2. **Reduced Database Load**: Complex aggregations done offline
3. **Scalable**: Handles large datasets efficiently
4. **Flexible**: Supports multiple time periods and filters
5. **Maintainable**: Clear separation of concerns and logging

## 🔮 Future Enhancements

1. **Real-time Updates**: WebSocket-based live updates
2. **Caching Layer**: Redis integration for even faster access
3. **Advanced Analytics**: Machine learning predictions
4. **Custom Time Ranges**: Support for arbitrary date ranges
5. **Export Functionality**: CSV/PDF export of dashboard data
