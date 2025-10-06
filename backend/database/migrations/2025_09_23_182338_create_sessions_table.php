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
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('teacher_uuid');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['subscription', 'free', 'paid'])->default('subscription');
            $table->decimal('price', 8, 2)->nullable();
            $table->enum('year_target', ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS']);
            $table->datetime('start_time');
            $table->datetime('end_time');
            $table->enum('status', ['scheduled', 'live', 'completed', 'cancelled'])->default('scheduled');
            $table->string('meeting_link')->nullable();
            $table->integer('max_participants')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');

            // Index pour améliorer les performances
            $table->index(['teacher_uuid', 'start_time']);
            $table->index(['status', 'start_time']);
            $table->index('year_target');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
