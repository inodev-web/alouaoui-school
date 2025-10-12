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
            $table->uuid('student_uuid');
            $table->uuid('teacher_uuid');
            $table->decimal('amount', 10, 2);
            $table->string('method'); // 'online', 'cash'
            $table->string('status')->default('pending'); // 'pending', 'confirmed', 'failed'
            $table->string('payment_context'); // 'subscription', 'session', 'school_entry'
            $table->boolean('grants_school_entry')->default(false);
            $table->string('processor_reference')->nullable();
            $table->timestamps();

            $table->foreign('student_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
            
            $table->index(['student_uuid', 'teacher_uuid']);
            $table->index(['status', 'payment_context']);
            $table->index(['created_at']);
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
