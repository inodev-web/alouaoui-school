<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_branch', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['session_id', 'branch_id']);
        });

        // Seed existing session -> branch relationships into the pivot table
        DB::table('sessions')
            ->whereNotNull('branch_id')
            ->orderBy('id')
            ->chunkById(200, function ($sessions) {
                $rows = [];

                foreach ($sessions as $session) {
                    $rows[] = [
                        'session_id' => $session->id,
                        'branch_id' => $session->branch_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                if (!empty($rows)) {
                    DB::table('session_branch')->insertOrIgnore($rows);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_branch');
    }
};
