<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Note: SQLite doesn't support triggers in the same way as MySQL/PostgreSQL
        // This migration creates a table to track changes and a job to process them
        
        // Create change tracking table
        Schema::create('dashboard_change_tracking', function (Blueprint $table) {
            $table->id();
            $table->string('table_name');
            $table->string('operation'); // 'insert', 'update', 'delete'
            $table->string('record_id');
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->boolean('processed')->default(false);
            $table->timestamp('created_at');
            $table->index(['table_name', 'processed', 'created_at']);
        });

        // For SQLite, we'll use model events instead of database triggers
        // This is handled in the model observers
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_change_tracking');
    }
};
