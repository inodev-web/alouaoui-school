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
        Schema::create('users_new', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->string('firstname')->nullable();
            $table->string('lastname')->nullable();
            $table->date('birth_date')->nullable();
            $table->text('address')->nullable();
            $table->string('school_name')->nullable();
            $table->string('phone')->unique();
            $table->timestamp('phone_verified_at')->nullable();
            $table->string('password');
            $table->string('year_of_study')->nullable();
            $table->enum('role', ['admin', 'student'])->default('student');
            $table->string('device_uuid')->nullable();
            $table->string('qr_token')->unique();
            $table->rememberToken();
            $table->timestamps();
        });

        // Copy data from old table to new table, generating UUIDs
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            DB::table('users_new')->insert([
                'uuid' => \Illuminate\Support\Str::uuid(),
                'firstname' => $user->name ?? null, // Use name as firstname temporarily
                'lastname' => null,
                'birth_date' => $user->birth_date ?? null,
                'address' => $user->address ?? null,
                'school_name' => $user->school_name ?? null,
                'phone' => $user->phone,
                'phone_verified_at' => $user->phone_verified_at ?? null,
                'password' => $user->password,
                'year_of_study' => $user->year_of_study ?? null,
                'role' => $user->role ?? 'student',
                'device_uuid' => $user->device_uuid ?? null,
                'qr_token' => $user->qr_token,
                'remember_token' => $user->remember_token ?? null,
                'created_at' => $user->created_at ?? now(),
                'updated_at' => $user->updated_at ?? now(),
            ]);
        }

        // Drop the old table
        Schema::dropIfExists('users');

        // Rename the new table to the original name
        Schema::rename('users_new', 'users');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Create the old table structure
        Schema::create('users_old', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('phone')->unique();
            $table->timestamp('phone_verified_at')->nullable();
            $table->string('password');
            $table->string('year_of_study')->nullable();
            $table->enum('role', ['admin', 'student'])->default('student');
            $table->string('device_uuid')->nullable();
            $table->string('qr_token')->unique();
            $table->rememberToken();
            $table->timestamps();
        });

        // Copy data back (this will be lossy since we can't restore the old id values)
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            DB::table('users_old')->insert([
                'name' => $user->firstname ?? 'Unknown',
                'email' => $user->phone . '@temp.com', // Generate temp email from phone
                'phone' => $user->phone,
                'phone_verified_at' => $user->phone_verified_at,
                'password' => $user->password,
                'year_of_study' => $user->year_of_study,
                'role' => $user->role,
                'device_uuid' => $user->device_uuid,
                'qr_token' => $user->qr_token,
                'remember_token' => $user->remember_token,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);
        }

        // Drop current table and rename old one back
        Schema::dropIfExists('users');
        Schema::rename('users_old', 'users');
    }
};
