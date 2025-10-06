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
        Schema::create('teachers', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->unique();
            $table->string('specialization');
            $table->text('bio')->nullable();
            $table->boolean('is_alouaoui_teacher')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('module')->nullable();
            $table->enum('year', ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'])->nullable();
            $table->boolean('is_online_publisher')->default(false);
            $table->boolean('allows_online_payment')->default(false);
            $table->decimal('price_subscription', 8, 2)->nullable();
            $table->integer('percent_school')->default(0);
            $table->string('payment_processor_id')->nullable();
            $table->timestamps();

            // Index pour améliorer les performances
            $table->index('is_alouaoui_teacher');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
