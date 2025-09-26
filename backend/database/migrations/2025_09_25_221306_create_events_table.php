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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description'); // Description brève pour le slider
            $table->string('slider_image'); // Photo du slider
            $table->string('alt_text')->nullable(); // Texte alternatif si l'image ne charge pas
            $table->enum('event_type', ['live', 'session', 'course', 'formation']); // Type pour la redirection
            $table->foreignId('teacher_id')->constrained('teachers')->onDelete('cascade'); // Seul Alouaoui peut créer
            $table->foreignId('target_id')->nullable(); // ID du contenu cible (course, session, etc.)
            $table->string('redirect_url')->nullable(); // URL de redirection personnalisée
            $table->boolean('requires_subscription')->default(true); // Nécessite un abonnement
            $table->datetime('start_date'); // Date de début de l'event
            $table->datetime('end_date')->nullable(); // Date de fin (optionnelle)
            $table->boolean('is_active')->default(true); // Affichage actif sur le slider
            $table->integer('order_index')->default(0); // Ordre d'affichage dans le slider
            $table->text('access_message')->nullable(); // Message personnalisé pour l'accès
            $table->timestamps();

            $table->index(['is_active', 'order_index']);
            $table->index(['event_type', 'is_active']);
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
