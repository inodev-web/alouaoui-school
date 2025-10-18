<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Add additional indexes for better performance
        // Check if indexes exist before creating them to avoid conflicts

        // Users table indexes for dashboard queries
        Schema::table('users', function (Blueprint $table) {
            if (!$this->indexExists('users', 'users_role_created_at_index')) {
                $table->index(['role', 'created_at']);
            }
            if (!$this->indexExists('users', 'users_created_at_index')) {
                $table->index(['created_at']);
            }
        });

        // Teachers table indexes
        Schema::table('teachers', function (Blueprint $table) {
            if (!$this->indexExists('teachers', 'teachers_is_online_publisher_created_at_index')) {
                $table->index(['is_online_publisher', 'created_at']);
            }
            if (!$this->indexExists('teachers', 'teachers_created_at_index')) {
                $table->index(['created_at']);
            }
        });

        // Sessions table indexes
        Schema::table('sessions', function (Blueprint $table) {
            if (!$this->indexExists('sessions', 'sessions_status_start_time_index')) {
                $table->index(['status', 'start_time']);
            }
            if (!$this->indexExists('sessions', 'sessions_start_time_end_time_index')) {
                $table->index(['start_time', 'end_time']);
            }
            if (!$this->indexExists('sessions', 'sessions_created_at_index')) {
                $table->index(['created_at']);
            }
        });

        // Subscriptions table indexes
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!$this->indexExists('subscriptions', 'subscriptions_starts_at_ends_at_index')) {
                $table->index(['starts_at', 'ends_at']);
            }
            if (!$this->indexExists('subscriptions', 'subscriptions_teacher_uuid_starts_at_index')) {
                $table->index(['teacher_uuid', 'starts_at']);
            }
            if (!$this->indexExists('subscriptions', 'subscriptions_created_at_index')) {
                $table->index(['created_at']);
            }
        });

        // Attendances table indexes
        Schema::table('attendances', function (Blueprint $table) {
            if (!$this->indexExists('attendances', 'attendances_validated_at_index')) {
                $table->index(['validated_at']);
            }
            if (!$this->indexExists('attendances', 'attendances_created_at_index')) {
                $table->index(['created_at']);
            }
        });
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $index): bool
    {
        $indexes = DB::select("PRAGMA index_list({$table})");
        foreach ($indexes as $idx) {
            if ($idx->name === $index) {
                return true;
            }
        }
        return false;
    }

    public function down(): void
    {
        // Remove the indexes
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'created_at']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropIndex(['is_online_publisher', 'created_at']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('sessions', function (Blueprint $table) {
            $table->dropIndex(['status', 'start_time']);
            $table->dropIndex(['start_time', 'end_time']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex(['starts_at', 'ends_at']);
            $table->dropIndex(['teacher_uuid', 'starts_at']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['validated_at']);
            $table->dropIndex(['created_at']);
        });
    }
};
