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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('session_id')->constrained('sessions')->onDelete('cascade');
            $table->enum('status', ['present', 'absent'])->default('present');
            $table->text('notes')->nullable(); // Notes additionnelles
            $table->foreignId('checked_in_by')->nullable()->constrained('users');
            $table->timestamps();

            // Contrainte unique pour éviter les doublons
            $table->unique(['user_id', 'session_id']);

            // Index pour améliorer les performances
            $table->index(['user_id', 'created_at']);
            $table->index(['session_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
