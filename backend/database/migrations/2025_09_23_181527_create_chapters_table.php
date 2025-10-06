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
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->uuid('teacher_uuid');
            $table->enum('year_target', ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS']);
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');

            // Index pour améliorer les performances
            $table->index(['teacher_uuid', 'year_target']);
            $table->index('year_target');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};
