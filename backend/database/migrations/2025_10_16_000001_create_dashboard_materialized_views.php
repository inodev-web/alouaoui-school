<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Create dashboard_summary table (materialized view equivalent)
        Schema::create('dashboard_summary', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('period_type'); // 'daily', 'weekly', 'monthly'
            $table->integer('total_students');
            $table->integer('total_teachers');
            $table->integer('active_students');
            $table->integer('total_sessions');
            $table->integer('completed_sessions');
            $table->decimal('total_revenue', 12, 2)->default(0);
            $table->decimal('total_profit', 12, 2)->default(0);
            $table->decimal('school_cut', 12, 2)->default(0);
            $table->decimal('teacher_cut', 12, 2)->default(0);
            $table->integer('monthly_subscriptions')->default(0);
            $table->integer('session_subscriptions')->default(0);
            $table->timestamp('last_updated');
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['date', 'period_type']);
            $table->index(['last_updated']);
        });

        // Create teacher_performance table (materialized view equivalent)
        Schema::create('teacher_performance', function (Blueprint $table) {
            $table->id();
            $table->uuid('teacher_uuid');
            $table->string('teacher_name');
            $table->date('date');
            $table->string('period_type'); // 'daily', 'weekly', 'monthly'
            $table->integer('total_sessions');
            $table->integer('completed_sessions');
            $table->integer('active_students');
            $table->integer('monthly_subscriptions')->default(0);
            $table->integer('session_subscriptions')->default(0);
            $table->decimal('total_revenue', 12, 2)->default(0);
            $table->decimal('total_profit', 12, 2)->default(0);
            $table->decimal('school_cut', 12, 2)->default(0);
            $table->decimal('teacher_cut', 12, 2)->default(0);
            $table->decimal('avg_revenue_per_session', 8, 2)->default(0);
            $table->timestamp('last_updated');
            $table->timestamps();
            
            // Foreign key
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
            
            // Indexes for performance
            $table->index(['teacher_uuid', 'date', 'period_type']);
            $table->index(['date', 'period_type']);
            $table->index(['total_revenue']);
            $table->index(['last_updated']);
        });

        // Create revenue_time_series table for charts
        Schema::create('revenue_time_series', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('period_type'); // 'daily', 'weekly', 'monthly'
            $table->decimal('revenue', 12, 2)->default(0);
            $table->decimal('profit', 12, 2)->default(0);
            $table->decimal('school_cut', 12, 2)->default(0);
            $table->decimal('teacher_cut', 12, 2)->default(0);
            $table->integer('sessions_count')->default(0);
            $table->integer('subscriptions_count')->default(0);
            $table->timestamp('last_updated');
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['date', 'period_type']);
            $table->index(['last_updated']);
        });

        // Create refresh tracking table
        Schema::create('dashboard_refresh_log', function (Blueprint $table) {
            $table->id();
            $table->string('table_name');
            $table->string('period_type');
            $table->date('date');
            $table->enum('status', ['started', 'completed', 'failed']);
            $table->text('error_message')->nullable();
            $table->integer('records_processed')->default(0);
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['table_name', 'date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_refresh_log');
        Schema::dropIfExists('revenue_time_series');
        Schema::dropIfExists('teacher_performance');
        Schema::dropIfExists('dashboard_summary');
    }
};
