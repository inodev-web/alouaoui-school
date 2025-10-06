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
        // Ne rien faire - garder teacher_uuid dans subscriptions
        // car la table subscriptions est pour tous les professeurs
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Ne rien faire
    }
};
