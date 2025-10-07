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
        // Only add the column if it doesn't already exist (SQLite can't add duplicate columns)
        if (!Schema::hasColumn('chapters', 'is_free')) {
            Schema::table('chapters', function (Blueprint $table) {
                $table->boolean('is_free')->default(false);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only drop the column if it exists
        if (Schema::hasColumn('chapters', 'is_free')) {
            Schema::table('chapters', function (Blueprint $table) {
                $table->dropColumn('is_free');
            });
        }
    }
};
