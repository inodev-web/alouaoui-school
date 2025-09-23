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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['admin', 'student'])->default('student');
            $table->enum('year_of_study', ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'])->nullable();
            $table->string('device_uuid')->nullable();
            $table->uuid('qr_token')->unique();
            $table->rememberToken();
            $table->timestamps();

            // Index pour améliorer les performances
            $table->index(['role', 'year_of_study']);
            $table->index('qr_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
