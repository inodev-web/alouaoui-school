<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add performance indexes to improve query speed
     */
    public function up(): void
    {
        // Sessions table indexes
        Schema::table('sessions', function (Blueprint $table) {
            // Single column indexes
            $table->index('teacher_uuid', 'idx_sessions_teacher');
            $table->index('year_target', 'idx_sessions_year');
            $table->index('branch_id', 'idx_sessions_branch');
            $table->index('start_time', 'idx_sessions_start_time');
            $table->index('status', 'idx_sessions_status');

            // Composite indexes for common queries
            $table->index(['start_time', 'status'], 'idx_sessions_time_status');
            $table->index(['year_target', 'branch_id'], 'idx_sessions_year_branch');
        });

        // Users table indexes
        Schema::table('users', function (Blueprint $table) {
            $table->index('year_of_study', 'idx_users_year');
            $table->index('branch_id', 'idx_users_branch');
            $table->index('role', 'idx_users_role');

            // Composite indexes
            $table->index(['role', 'year_of_study'], 'idx_users_role_year');
            $table->index(['year_of_study', 'branch_id'], 'idx_users_year_branch');
        });

        // Attendances table indexes
        Schema::table('attendances', function (Blueprint $table) {
            $table->index('session_id', 'idx_attendances_session');
            $table->index('student_uuid', 'idx_attendances_student');
            $table->index('check_in_time', 'idx_attendances_checkin_time');

            // Composite index for common queries
            $table->index(['session_id', 'student_uuid'], 'idx_attendances_session_student');
        });

        // Subscriptions table indexes
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index('student_uuid', 'idx_subscriptions_student');
            $table->index('teacher_uuid', 'idx_subscriptions_teacher');
            $table->index('status', 'idx_subscriptions_status');

            // Composite indexes
            $table->index(['student_uuid', 'status'], 'idx_subscriptions_student_status');
            $table->index(['teacher_uuid', 'status'], 'idx_subscriptions_teacher_status');
        });

        // Teachers table indexes (if not already present)
        Schema::table('teachers', function (Blueprint $table) {
            $table->index('status', 'idx_teachers_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop sessions indexes
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropIndex('idx_sessions_teacher');
            $table->dropIndex('idx_sessions_year');
            $table->dropIndex('idx_sessions_branch');
            $table->dropIndex('idx_sessions_start_time');
            $table->dropIndex('idx_sessions_status');
            $table->dropIndex('idx_sessions_time_status');
            $table->dropIndex('idx_sessions_year_branch');
        });

        // Drop users indexes
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_year');
            $table->dropIndex('idx_users_branch');
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_role_year');
            $table->dropIndex('idx_users_year_branch');
        });

        // Drop attendances indexes
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('idx_attendances_session');
            $table->dropIndex('idx_attendances_student');
            $table->dropIndex('idx_attendances_checkin_time');
            $table->dropIndex('idx_attendances_session_student');
        });

        // Drop subscriptions indexes
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('idx_subscriptions_student');
            $table->dropIndex('idx_subscriptions_teacher');
            $table->dropIndex('idx_subscriptions_status');
            $table->dropIndex('idx_subscriptions_student_status');
            $table->dropIndex('idx_subscriptions_teacher_status');
        });

        // Drop teachers indexes
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropIndex('idx_teachers_status');
        });
    }
};
