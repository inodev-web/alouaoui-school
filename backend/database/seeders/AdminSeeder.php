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
        // Delete any existing admin users first
        User::where('role', 'admin')->delete();
        
        // Create single admin user with hard-coded credentials
        User::create([
            'uuid' => \Illuminate\Support\Str::uuid(),
            'phone' => 'admin',
            'firstname' => 'Admin',
            'lastname' => 'User',
            'birth_date' => '1990-01-01',
            'address' => 'École Alouaoui, Algiers',
            'school_name' => 'École Alouaoui',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'year_of_study' => '3AS',
            'free_subscriber' => false,
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $this->command->info('Single admin user created successfully:');
        $this->command->info('Phone: admin');
        $this->command->info('Password: admin123');
        $this->command->info('Role: admin');
    }
}