<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('users')) return;
        if (!Schema::hasColumn('users', 'qr_token')) return; // déjà supprimé

        // SQLite: recréer la table sans la colonne qr_token
        if (config('database.default') === 'sqlite') {
            Schema::create('users_temp_without_qr', function (Blueprint $table) {
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
                $table->string('role')->default('student');
                $table->string('device_uuid')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });

            // Copier les données sans la colonne qr_token
            \DB::statement('INSERT INTO users_temp_without_qr (uuid, firstname, lastname, birth_date, address, school_name, phone, phone_verified_at, password, year_of_study, role, device_uuid, remember_token, created_at, updated_at)
                SELECT uuid, firstname, lastname, birth_date, address, school_name, phone, phone_verified_at, password, year_of_study, role, device_uuid, remember_token, created_at, updated_at FROM users');

            Schema::drop('users');
            Schema::rename('users_temp_without_qr', 'users');
        } else {
            // Autres SGBD: simple dropColumn
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('qr_token');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('users')) return;
        if (Schema::hasColumn('users', 'qr_token')) return;

        Schema::table('users', function (Blueprint $table) {
            $table->uuid('qr_token')->nullable()->after('device_uuid');
        });
    }
};
