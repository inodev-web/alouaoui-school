<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Set status to NULL for all existing sessions that have status = 'completed'
     * but don't have a cancel_reason (meaning they weren't explicitly confirmed)
     */
    public function up(): void
    {
        // Update all sessions with status 'completed' to NULL
        // This allows admins to confirm or cancel them manually
        DB::table('sessions')
            ->where('status', 'completed')
            ->whereNull('cancel_reason')
            ->update(['status' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore default 'completed' status for sessions with null status
        DB::table('sessions')
            ->whereNull('status')
            ->update(['status' => 'completed']);
    }
};
