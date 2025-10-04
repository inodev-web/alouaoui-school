<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // add nullable uuid column first to avoid locking issues
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        // Backfill existing users with UUIDs
        DB::table('users')->orderBy('id')->chunk(100, function ($users) {
            foreach ($users as $u) {
                DB::table('users')->where('id', $u->id)->update([
                    'uuid' => (string) Str::uuid(),
                ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
