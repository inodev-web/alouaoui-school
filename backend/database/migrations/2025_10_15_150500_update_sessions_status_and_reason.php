<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sessions')) {
            return;
        }

        if (!Schema::hasColumn('sessions', 'cancel_reason')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->text('cancel_reason')->nullable()->after('status');
            });
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=off;');
            Schema::dropIfExists('sessions_temp');

            Schema::create('sessions_temp', function (Blueprint $table) {
                $table->id();
                $table->uuid('teacher_uuid')->nullable();
                $table->string('year_target')->nullable();
                $table->dateTime('start_time')->nullable();
                $table->dateTime('end_time')->nullable();
                $table->string('status')->nullable();
                $table->text('cancel_reason')->nullable();
                $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
                $table->timestamps();

                $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
                $table->index(['teacher_uuid', 'start_time']);
                $table->index(['branch_id']);
                $table->index(['status', 'start_time']);
                $table->index(['start_time', 'end_time']);
                $table->index(['created_at']);
            });

            DB::statement('INSERT INTO sessions_temp (id, teacher_uuid, year_target, start_time, end_time, status, cancel_reason, branch_id, created_at, updated_at)
                SELECT id, teacher_uuid, year_target, start_time, end_time, status, cancel_reason, branch_id, created_at, updated_at FROM sessions');

            DB::statement('DROP TABLE sessions');
            DB::statement('ALTER TABLE sessions_temp RENAME TO sessions');
            DB::statement("UPDATE sqlite_sequence SET name = 'sessions' WHERE name = 'sessions_temp'");
            DB::statement('PRAGMA foreign_keys=on;');
        } else {
            DB::statement("ALTER TABLE sessions MODIFY status VARCHAR(255) NULL DEFAULT NULL");
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('sessions')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=off;');
            Schema::dropIfExists('sessions_temp');

            Schema::create('sessions_temp', function (Blueprint $table) {
                $table->id();
                $table->uuid('teacher_uuid')->nullable();
                $table->string('year_target')->nullable();
                $table->dateTime('start_time')->nullable();
                $table->dateTime('end_time')->nullable();
                $table->string('status')->default('completed');
                $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
                $table->timestamps();

                $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
                $table->index(['teacher_uuid', 'start_time']);
                $table->index(['branch_id']);
                $table->index(['status', 'start_time']);
                $table->index(['start_time', 'end_time']);
                $table->index(['created_at']);
            });

            DB::statement("INSERT INTO sessions_temp (id, teacher_uuid, year_target, start_time, end_time, status, branch_id, created_at, updated_at)
                SELECT id, teacher_uuid, year_target, start_time, end_time, COALESCE(status, 'completed'), branch_id, created_at, updated_at FROM sessions");

            DB::statement('DROP TABLE sessions');
            DB::statement('ALTER TABLE sessions_temp RENAME TO sessions');
            DB::statement("UPDATE sqlite_sequence SET name = 'sessions' WHERE name = 'sessions_temp'");
            DB::statement('PRAGMA foreign_keys=on;');
        } else {
            DB::statement("ALTER TABLE sessions MODIFY status VARCHAR(255) NOT NULL DEFAULT 'completed'");
        }

        if (Schema::hasColumn('sessions', 'cancel_reason')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->dropColumn('cancel_reason');
            });
        }
    }
};
