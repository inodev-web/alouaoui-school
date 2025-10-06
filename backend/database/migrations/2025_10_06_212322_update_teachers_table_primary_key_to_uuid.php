<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create a new table with UUID primary key
        Schema::create('teachers_new', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->string('firstname')->nullable();
            $table->string('lastname')->nullable();
            $table->string('phone')->unique();
            $table->string('specialization');
            $table->text('bio')->nullable();
            $table->string('profile_picture')->nullable();
            $table->boolean('is_alouaoui_teacher')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Copy data from old table to new table, generating UUIDs
        $teachers = DB::table('teachers')->get();
        foreach ($teachers as $teacher) {
            DB::table('teachers_new')->insert([
                'uuid' => \Illuminate\Support\Str::uuid(),
                'firstname' => $teacher->name ?? null, // Use name as firstname temporarily
                'lastname' => null,
                'phone' => $teacher->phone,
                'specialization' => $teacher->specialization,
                'bio' => $teacher->bio ?? null,
                'profile_picture' => $teacher->profile_picture ?? null,
                'is_alouaoui_teacher' => $teacher->is_alouaoui_teacher ?? false,
                'is_active' => $teacher->is_active ?? true,
                'created_at' => $teacher->created_at ?? now(),
                'updated_at' => $teacher->updated_at ?? now(),
            ]);
        }

        // Drop the old table
        Schema::dropIfExists('teachers');

        // Rename the new table to the original name
        Schema::rename('teachers_new', 'teachers');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Create the old table structure
        Schema::create('teachers_old', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->unique();
            $table->string('specialization');
            $table->text('bio')->nullable();
            $table->string('profile_picture')->nullable();
            $table->boolean('is_alouaoui_teacher')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Copy data back (this will be lossy since we can't restore the old id values)
        $teachers = DB::table('teachers')->get();
        foreach ($teachers as $teacher) {
            DB::table('teachers_old')->insert([
                'name' => $teacher->firstname ?? 'Unknown',
                'email' => $teacher->phone . '@temp.com', // Generate temp email from phone
                'phone' => $teacher->phone,
                'specialization' => $teacher->specialization,
                'bio' => $teacher->bio,
                'profile_picture' => $teacher->profile_picture,
                'is_alouaoui_teacher' => $teacher->is_alouaoui_teacher,
                'is_active' => $teacher->is_active,
                'created_at' => $teacher->created_at,
                'updated_at' => $teacher->updated_at,
            ]);
        }

        // Drop current table and rename old one back
        Schema::dropIfExists('teachers');
        Schema::rename('teachers_old', 'teachers');
    }
};
