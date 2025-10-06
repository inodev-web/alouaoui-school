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
        Schema::table('chapters', function (Blueprint $table) {
            // Drop the index first
            $table->dropIndex(['teacher_uuid', 'year_target']);

            // Drop foreign key constraint
            $table->dropForeign(['teacher_uuid']);

            // Drop the teacher_uuid column since all chapters belong to Alouaoui
            $table->dropColumn('teacher_uuid');

            // Add a simple teacher_name field with default value
            $table->string('teacher_name')->default('Alouaoui');

            // Add is_free column for free content identification
            $table->boolean('is_free')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            // Remove the teacher_name column
            $table->dropColumn('teacher_name');

            // Add back teacher_uuid column
            $table->uuid('teacher_uuid');

            // Add back foreign key constraint
            $table->foreign('teacher_uuid')->references('uuid')->on('teachers')->onDelete('cascade');
        });
    }
};
