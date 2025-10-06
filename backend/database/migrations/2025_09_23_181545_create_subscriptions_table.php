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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_uuid');
            $table->uuid('teacher_uuid');
            $table->decimal('amount', 10, 2);
            $table->boolean('videos_access')->default(false);
            $table->boolean('lives_access')->default(false);
            $table->boolean('school_entry_access')->default(false);
            $table->datetime('starts_at');
            $table->datetime('ends_at');
            $table->enum('status', ['pending', 'active', 'expired', 'cancelled'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');

            // Index pour améliorer les performances
            $table->index(['user_uuid', 'status']);
            $table->index(['teacher_uuid', 'status']);
            $table->index(['starts_at', 'ends_at']);
            $table->index(['status', 'ends_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
