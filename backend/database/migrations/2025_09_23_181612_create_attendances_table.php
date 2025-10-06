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
            $table->uuid('student_uuid');
            $table->uuid('teacher_uuid');
            $table->foreignId('session_id')->constrained('sessions')->onDelete('cascade');
            $table->date('date');
            $table->enum('status', ['present', 'absent'])->default('present');
            $table->datetime('check_in_time')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('student_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');

            // Contrainte unique pour éviter les doublons
            $table->unique(['student_uuid', 'session_id']);

            // Index pour améliorer les performances
            $table->index(['student_uuid', 'created_at']);
            $table->index(['session_id', 'status']);
            $table->index(['teacher_uuid', 'date']);
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
