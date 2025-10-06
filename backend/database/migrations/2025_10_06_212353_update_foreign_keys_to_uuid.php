<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update subscriptions table
        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('subscriptions', 'teacher_id')) {
                $table->dropColumn('teacher_id');
            }
            if (!Schema::hasColumn('subscriptions', 'user_uuid')) {
                $table->uuid('user_uuid')->nullable()->after('id');
            }
            if (!Schema::hasColumn('subscriptions', 'teacher_uuid')) {
                $table->uuid('teacher_uuid')->nullable()->after('user_uuid');
            }
        });

        // Update payments table
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('payments', 'processed_by')) {
                $table->dropColumn('processed_by');
            }
            if (!Schema::hasColumn('payments', 'user_uuid')) {
                $table->uuid('user_uuid')->nullable()->after('id');
            }
            if (!Schema::hasColumn('payments', 'processed_by_uuid')) {
                $table->uuid('processed_by_uuid')->nullable()->after('user_uuid');
            }
        });

        // Update attendances table
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'student_id')) {
                $table->dropColumn('student_id');
            }
            if (Schema::hasColumn('attendances', 'teacher_id')) {
                $table->dropColumn('teacher_id');
            }
            if (!Schema::hasColumn('attendances', 'student_uuid')) {
                $table->uuid('student_uuid')->nullable()->after('id');
            }
            if (!Schema::hasColumn('attendances', 'teacher_uuid')) {
                $table->uuid('teacher_uuid')->nullable()->after('student_uuid');
            }
        });

        // Update stream_tokens table
        Schema::table('stream_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('stream_tokens', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (!Schema::hasColumn('stream_tokens', 'user_uuid')) {
                $table->uuid('user_uuid')->nullable()->after('id');
            }
        });

        // Update chapters table
        Schema::table('chapters', function (Blueprint $table) {
            if (Schema::hasColumn('chapters', 'teacher_id')) {
                $table->dropColumn('teacher_id');
            }
            if (!Schema::hasColumn('chapters', 'teacher_uuid')) {
                $table->uuid('teacher_uuid')->nullable()->after('description');
            }
        });

        // Update sessions table
        Schema::table('sessions', function (Blueprint $table) {
            if (Schema::hasColumn('sessions', 'teacher_id')) {
                $table->dropColumn('teacher_id');
            }
            if (!Schema::hasColumn('sessions', 'teacher_uuid')) {
                $table->uuid('teacher_uuid')->nullable()->after('id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore subscriptions table
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['user_uuid', 'teacher_uuid']);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable();
        });

        // Restore payments table
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['user_uuid', 'processed_by_uuid']);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
        });

        // Restore attendances table
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['student_uuid', 'teacher_uuid']);
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable();
        });

        // Restore stream_tokens table
        Schema::table('stream_tokens', function (Blueprint $table) {
            $table->dropColumn('user_uuid');
            $table->unsignedBigInteger('user_id')->nullable();
        });

        // Restore chapters table
        Schema::table('chapters', function (Blueprint $table) {
            $table->dropColumn('teacher_uuid');
            $table->unsignedBigInteger('teacher_id')->nullable();
        });

        // Restore sessions table
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('teacher_uuid');
            $table->unsignedBigInteger('teacher_id')->nullable();
        });
    }
};
