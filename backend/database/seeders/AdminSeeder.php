<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::firstOrCreate([
            'phone' => '0555123456'
        ], [
            'firstname' => 'Admin',
            'lastname' => 'Alouaoui',
            'birth_date' => '1990-01-01',
            'address' => 'École Alouaoui, Algiers',
            'school_name' => 'École Alouaoui',
            'password' => Hash::make('123456789'),
            'role' => 'admin',
            'year_of_study' => '3AS',
            'free_subscriber' => false,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $this->command->info('Admin user created successfully:');
        $this->command->info('Phone: 0555123456');
        $this->command->info('Password: 123456789');
        $this->command->info('Role: admin');
    }
}