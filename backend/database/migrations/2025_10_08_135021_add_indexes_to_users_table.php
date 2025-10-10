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
        Schema::table('users', function (Blueprint $table) {
            // Un seul index composite pour optimiser les recherches les plus fréquentes
            // Cet index couvre: role + recherche dans nom/prénom + tri par création
            $table->index(['role', 'firstname', 'lastname', 'phone'], 'users_search_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Supprimer l'index composite
            $table->dropIndex('users_search_index');
        });
    }
};
