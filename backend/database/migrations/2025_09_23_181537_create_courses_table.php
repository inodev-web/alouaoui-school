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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained('chapters')->onDelete('cascade');
            $table->string('title');
            $table->string('video_ref')->nullable(); // Référence vidéo (URL, chemin, ID externe)
            $table->string('pdf_summary')->nullable(); // Chemin vers le PDF de résumé
            $table->string('exercises_pdf')->nullable(); // Chemin vers le PDF d'exercices
            $table->enum('year_target', ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS']);
            $table->timestamps();

            // Index pour améliorer les performances
            $table->index(['chapter_id', 'year_target']);
            $table->index('year_target');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
