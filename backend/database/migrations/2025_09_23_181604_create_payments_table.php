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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_uuid');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('DZD');
            $table->enum('payment_method', ['cash', 'online', 'card', 'transfer'])->default('cash');
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->string('reference')->unique();
            $table->string('transaction_id')->nullable();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->uuid('processed_by_uuid')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('processed_by_uuid')->references('uuid')->on('users')->onDelete('set null');

            // Index pour améliorer les performances
            $table->index(['user_uuid', 'status']);
            $table->index(['status', 'created_at']);
            $table->index(['transaction_id']);
            $table->index(['reference']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
