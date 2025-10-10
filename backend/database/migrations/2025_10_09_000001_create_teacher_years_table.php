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
        // Créer la table pivot teacher_years
        Schema::create('teacher_years', function (Blueprint $table) {
            $table->id();
            $table->uuid('teacher_uuid');
            $table->string('year_code'); // 1AM, 2AM, 3AM, 4AM, 1AS, 2AS, 3AS
            $table->timestamps();

            // Foreign key vers teachers
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');

            // Index pour optimiser les requêtes
            $table->index(['teacher_uuid', 'year_code']);
            $table->index(['year_code']);

            // Contrainte unique pour éviter les doublons
            $table->unique(['teacher_uuid', 'year_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_years');
    }
};
